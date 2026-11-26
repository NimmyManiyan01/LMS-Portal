const router = require("express").Router();
const ExamFeedback = require("../models/ExamFeedback");
const mongoose = require("mongoose");
const Attempt = require("../models/Attempt");
const Answer = require("../models/Answer");
const Question = require("../models/Question");
const Exam = require("../models/Exam");
const PaperSet = require("../models/PaperSet");
const { authenticate } = require("../middleware/auth");
const { finalizeAttempt } = require("../services/finalizeAttempt");
const cacheService = require("../services/cacheService");

function studentMatch(student) {
  if (!student) return null;
  const ids = [student._id, student.id, student.studentId]
    .filter(Boolean)
    .filter((id) => mongoose.isValidObjectId(id));
  if (!ids.length) return null;
  return ids.length === 1 ? ids[0] : { $in: ids };
}

async function findOwnedAttempt(req, res) {
  if (!mongoose.isValidObjectId(req.params.attemptId)) {
    res.status(400).json({ error: "Invalid attempt ID" });
    return null;
  }
  const attempt = await Attempt.findOne({
    _id: req.params.attemptId,
    studentId: studentMatch(req.student),
  })
    .select("-__v")
    .lean();
  if (!attempt) {
    res.status(404).json({ error: "Attempt not found" });
    return null;
  }
  return attempt;
}

function isAttemptOpen(attempt) {
  return attempt.status === "IN_PROGRESS" && new Date(attempt.expiresAt).getTime() > Date.now();
}

router.get("/:attemptId", authenticate, async (req, res) => {
  const attempt = await findOwnedAttempt(req, res);
  if (!attempt) return;
  const answers = await Answer.find({ attemptId: attempt._id })
    .select("-_id -attemptId -__v -testResults")
    .lean();
  res.json({
    attemptId: String(attempt.id || attempt._id),
    status: attempt.status,
    startedAt: attempt.startedAt,
    deadline: attempt.expiresAt,
    serverTime: new Date(),
    questionIds: attempt.assignedQuestionIds || [],
    answers,
  });
});

router.get("/:attemptId/questions", authenticate, async (req, res) => {
  const attempt = await findOwnedAttempt(req, res);
  if (!attempt) return;
  const exam = await Exam.findById(attempt.examId).lean();
  const isCodingExam = exam?.examinationType === "CODING" || exam?.roundNumber === 2;
  const codingFilter = isCodingExam
    ? { questionType: "CODING", "testCases.0": { $exists: true } }
    : {};
  const loadQuestions = (ids) => Question.collection.find(
    { _id: { $in: ids }, ...codingFilter },
    { projection: { correctOptionId: 0, explanation: 0, referenceSolution: 0, __v: 0 } },
  ).toArray();

  let assignedIds = attempt.assignedQuestionIds || [];
  let questions = await loadQuestions(assignedIds);
  if (isCodingExam && (!questions.length || questions.length !== assignedIds.length) &&
      attempt.status === "IN_PROGRESS") {
    const paperSet = await PaperSet.findOne({
      _id: attempt.paperSetId, examId: attempt.examId,
    }).lean();
    const paperIds = paperSet?.questionIds || [];
    const paperQuestions = await loadQuestions(paperIds);
    if (paperQuestions.length && paperQuestions.length === paperIds.length) {
      const updated = await Attempt.updateOne(
        { _id: attempt._id, status: "IN_PROGRESS", assignedQuestionIds: assignedIds },
        { $set: { assignedQuestionIds: paperIds } },
      );
      if (!updated.matchedCount) {
        return res.status(409).json({ error: "The attempt changed. Reopen the examination to reload its questions." });
      }
      assignedIds = paperIds;
      questions = paperQuestions;
    }
  }

  if (!questions.length || (isCodingExam && questions.length !== assignedIds.length)) {
    return res.status(409).json({ error: "The assigned paper has no valid question set. Please contact the examination administrator." });
  }

  const order = new Map(assignedIds.map((id, index) => [String(id), index]));
  questions.sort((a, b) => (order.get(String(a._id)) || 0) - (order.get(String(b._id)) || 0));

  res.json({
    attemptId: String(attempt._id),
    questions: questions.map((question, index) => ({
      id: String(question._id),
      questionText:
        question.questionText || question.text || question.question || "",
      questionTitle: question.questionTitle || question.questionText || "",
      questionType: question.questionType || "MCQ",
      inputFormat: question.inputFormat,
      outputFormat: question.outputFormat,
      constraints: question.constraints,
      sampleInput: question.sampleInput,
      sampleOutput: question.sampleOutput,
      starterCode: question.starterCode || {},
      allowedLanguages: question.allowedLanguages || ["javascript", "python", "java", "cpp", "c"],
      testCases: (question.testCases && question.testCases.length > 0)
        ? question.testCases.filter((tc) => !tc.isHidden).map((tc) => ({
            id: tc.id || String(tc._id),
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            isHidden: false,
            explanation: tc.explanation,
          }))
        : [],
      options: (isCodingExam || question.questionType === "CODING" ? [] : (question.options || [])).map(
        (option, optionIndex) =>
          typeof option === "string"
            ? { id: String.fromCharCode(65 + optionIndex), text: option }
            : {
                id: String(
                  option.id ||
                    option.value ||
                    String.fromCharCode(65 + optionIndex),
                ),
                text: option.text || option.label || option.value || "",
              },
      ),
      sectionId: question.sectionId || question.section || "general",
      sectionName:
        question.sectionName ||
        question.sectionTitle ||
        question.section ||
        "General",
      questionNumber: question.questionNumber || index + 1,
      marks: Number(question.marks || 0),
      negativeMarks: Number(question.negativeMarks || 0),
      codeSnippet: question.codeSnippet || undefined,
    })),
    serverTime: new Date(),
  });
});

router.get("/:attemptId/answers", authenticate, async (req, res) => {
  const attempt = await findOwnedAttempt(req, res);
  if (!attempt) return;
  res.json({
    attemptId: String(attempt.id || attempt._id),
    answers: await Answer.find({ attemptId: attempt._id })
      .select("-_id -attemptId -__v -testResults")
      .lean(),
    serverTime: new Date(),
  });
});

router.put(
  "/:attemptId/answers/:questionId",
  authenticate,
  async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.attemptId)) {
      return res.status(400).json({ error: "Invalid attempt ID" });
    }
    const attempt = await Attempt.findOne({
      _id: req.params.attemptId,
      studentId: studentMatch(req.student),
      status: "IN_PROGRESS",
    }).lean();
    if (!attempt)
      return res.status(404).json({ error: "Active attempt not found" });
    if (new Date(attempt.expiresAt) <= new Date())
      return res
        .status(409)
        .json({ error: "The examination deadline has passed" });
    const version = Number(req.body.version);
    if (!Number.isInteger(version) || version < 1)
      return res
        .status(400)
        .json({ error: "A valid answer version is required" });

    const existing = await Answer.findOne({
      attemptId: attempt._id,
      questionId: req.params.questionId,
    }).lean();

    if (existing && Number(existing.version || 0) > version) {
      return res.status(409).json({
        saved: false,
        error: "A newer answer version already exists",
        version: existing.version,
      });
    }

    const nextVersion = existing
      ? Math.max(Number(existing.version || 0) + 1, version)
      : Math.max(1, version);

    const saved = await Answer.findOneAndUpdate(
      { attemptId: attempt._id, questionId: req.params.questionId },
      {
        $set: {
          selectedOptionId: req.body.selectedOptionId,
          isMarkedForReview: Boolean(req.body.isMarkedForReview),
          visited: Boolean(req.body.visited),
          timeSpentSeconds: Math.max(0, Number(req.body.timeSpentSeconds || 0)),
          version: nextVersion,
          savedAt: new Date(),
        },
      },
      { upsert: true, new: true },
    );

    const doc = saved?.value || saved;

    // Recalculate aggregate live score on every saved answer using cached question metadata
    const examCacheKey = `exam:scheme:${attempt.examId}`;
    const questionsCacheKey = `attempt:questions:${attempt._id}`;

    let [allAnswers, questions, scheme] = await Promise.all([
      Answer.find({ attemptId: attempt._id }).select("questionId selectedOptionId").lean(),
      cacheService.get(questionsCacheKey),
      cacheService.get(examCacheKey),
    ]);

    if (!questions) {
      questions = await Question.find({ _id: { $in: attempt.assignedQuestionIds } })
        .select("_id correctOptionId marks negativeMarks")
        .lean();
      await cacheService.set(questionsCacheKey, questions, 600);
    }

    if (!scheme) {
      const examDoc = await Exam.findById(attempt.examId).select("markingScheme").lean();
      scheme = examDoc?.markingScheme || {};
      await cacheService.set(examCacheKey, scheme, 600);
    }

    const answerByQuestion = new Map(
      allAnswers.map((answer) => [String(answer.questionId), answer]),
    );
    const questionById = new Map(
      questions.map((question) => [String(question._id), question]),
    );
    let liveScore = 0;
    for (const questionId of attempt.assignedQuestionIds) {
      const question = questionById.get(String(questionId));
      const answer = answerByQuestion.get(String(questionId));
      if (!question || !answer?.selectedOptionId) {
        liveScore += Number(scheme.unansweredMarks || 0);
      } else if (answer.selectedOptionId === question.correctOptionId) {
        liveScore += Number(scheme.correctMarks ?? question.marks ?? 0);
      } else {
        const questionPenalty = Number(question.negativeMarks || 0);
        const schemePenalty = Number(scheme.incorrectMarks || 0);
        liveScore += questionPenalty
          ? -Math.abs(questionPenalty)
          : schemePenalty > 0
            ? -schemePenalty
            : schemePenalty;
      }
    }
    if (scheme.floorNegativeScoreAtZero) liveScore = Math.max(0, liveScore);
    await Attempt.updateOne(
      { _id: attempt._id, status: "IN_PROGRESS" },
      { $set: { score: liveScore } },
    );

    res.json({
      saved: true,
      version: doc.version,
      savedAt: doc.savedAt,
      scoreCalculated: true,
    });
  },
);

router.post("/:attemptId/submit", authenticate, async (req, res) => {
  if (!req.student) {
    return res.status(403).json({ error: "Student account required" });
  }
  if (!mongoose.isValidObjectId(req.params.attemptId)) {
    return res.status(400).json({ error: "Invalid attempt ID" });
  }
  const studentId = req.student._id || req.student.id;
  try {
    const isAuto = Boolean(req.body.automatic || req.body.reason === "TIMER_EXPIRY" || req.body.reason === "INTEGRITY");
    const reason = req.body.reason || (isAuto ? "TIMER_EXPIRY" : "MANUAL");
    res.json(
      await finalizeAttempt({
        attemptId: req.params.attemptId,
        studentId,
        reason,
        reasonDetail: req.body.reasonDetail || (isAuto ? "TIMER_EXPIRY" : undefined),
        answers: req.body.answers,
      }),
    );
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

router.post("/:attemptId/feedback", authenticate, async (req, res) => {
  const attempt = await findOwnedAttempt(req, res);
  if (!attempt) return;
  if (attempt.status === "IN_PROGRESS")
    return res.status(409).json({
      error: "Feedback is available after the examination is submitted",
    });

  const rating = Number(req.body.rating);
  const comment = String(req.body.comment || "").trim();
  if (!Number.isInteger(rating) || rating < 1 || rating > 5)
    return res.status(400).json({ error: "Rating must be between 1 and 5" });
  if (comment.length > 1000)
    return res
      .status(400)
      .json({ error: "Feedback must be 1000 characters or fewer" });

  const feedback = await ExamFeedback.findOneAndUpdate(
    { attemptId: attempt._id },
    { examId: attempt.examId, studentId: attempt.studentId, rating, comment },
    { upsert: true, new: true, runValidators: true },
  );
  res.status(201).json({
    saved: true,
    feedback: { id: String(feedback._id), rating: feedback.rating },
  });
});

const { storeStudentSignal, getSessionState, clearSession } = require("../services/webrtcSignaling");
const { evaluateCode } = require("../services/codeCompilerService");
const { studentEvaluation } = require("../services/studentEvaluation");

router.post("/:attemptId/run-code", authenticate, async (req, res) => {
  const attempt = await findOwnedAttempt(req, res);
  if (!attempt) return;
  if (!isAttemptOpen(attempt)) {
    return res.status(409).json({ error: "Examination attempt is no longer active." });
  }

  const { questionId, code, language, input } = req.body || {};
  if (!questionId || !code) {
    return res.status(400).json({ error: "questionId and code are required." });
  }

  if (!attempt.assignedQuestionIds?.some((id) => String(id) === questionId)) {
    return res.status(404).json({ error: "Question is not assigned to this attempt." });
  }
  const question = await Question.findById(questionId).lean();
  if (!question || question.questionType !== "CODING") {
    return res.status(409).json({ error: "This question is not configured for code evaluation." });
  }

  const testCasesToRun = input
    ? [{ id: "custom", input, expectedOutput: "", isHidden: false }]
    : (question.testCases || []).filter((tc) => !tc.isHidden);
  if (!testCasesToRun.length) {
    return res.status(409).json({ error: "This question has no public test cases. Enter custom input to run your code." });
  }

  const evalResult = await evaluateCode({
    code,
    language: language || "javascript",
    testCases: testCasesToRun,
    timeLimitSeconds: question.timeLimitSeconds || 2,
  });

  const firstResult = evalResult.testResults[0] || {};

  res.json({
    jobId: `run_${attempt._id}_${Date.now()}`,
    attemptId: String(attempt._id),
    questionId,
    language: language || "javascript",
    stdout: firstResult.actualOutput || evalResult.output || "",
    stderr: firstResult.error || null,
    executionTimeMs: firstResult.executionTimeMs || 0,
    evalResult,
    isPractice: true,
  });
});

router.post("/:attemptId/submit-code", authenticate, async (req, res) => {
  const attempt = await findOwnedAttempt(req, res);
  if (!attempt) return;
  if (!isAttemptOpen(attempt)) {
    return res.status(409).json({ error: "Examination attempt is no longer active." });
  }
  const { questionId, code, language } = req.body || {};
  if (!questionId || !code) {
    return res.status(400).json({ error: "questionId and code are required." });
  }

  if (!attempt.assignedQuestionIds?.some((id) => String(id) === questionId)) {
    return res.status(404).json({ error: "Question is not assigned to this attempt." });
  }
  const question = await Question.findById(questionId).lean();
  if (!question || question.questionType !== "CODING") {
    return res.status(409).json({ error: "This question is not configured for code evaluation." });
  }

  if (!question.testCases?.length) {
    return res.status(409).json({ error: "This coding question has no grading test cases. Contact the examination administrator." });
  }

  const evalResult = await evaluateCode({
    code,
    language: language || "javascript",
    testCases: question.testCases,
    timeLimitSeconds: question.timeLimitSeconds || 2,
  });

  const stillOpen = isAttemptOpen(attempt) && await Attempt.exists({
    _id: attempt._id,
    status: "IN_PROGRESS",
    expiresAt: { $gt: new Date() },
  });
  if (!stillOpen || !isAttemptOpen(attempt)) {
    return res.status(409).json({ error: "The examination deadline passed during evaluation." });
  }

  const questionMarks = Number(question.marks || 10);
  const calculatedScore = Math.round(evalResult.scoreRatio * questionMarks);

  await Answer.findOneAndUpdate(
    { attemptId: attempt._id, questionId: question._id },
    {
      code,
      language: language || "javascript",
      testResults: evalResult.testResults,
      passCount: evalResult.passCount,
      totalTestCases: evalResult.totalTestCases,
      score: calculatedScore,
      savedAt: new Date(),
    },
    { upsert: true, new: true },
  );

  const { recordCodeExecutionEvent } = require("../services/securityLogger");
  recordCodeExecutionEvent(req, {
    attemptId: attempt._id,
    language: language || "javascript",
    testResults: evalResult.testResults,
    score: calculatedScore,
  });

  res.json({
    submitted: true,
    evalResult: studentEvaluation(evalResult),
    score: calculatedScore,
    questionMarks,
  });
});

router.post("/:attemptId/webrtc-signal", authenticate, async (req, res) => {
  const { offer, candidate, frame } = req.body || {};
  storeStudentSignal(req.params.attemptId, { offer, candidate, frame });
  const session = getSessionState(req.params.attemptId);
  res.json({
    answer: session?.answer || null,
    adminCandidates: session?.adminCandidates || [],
  });
});

router.post("/:attemptId/stream-frame", authenticate, async (req, res) => {
  const { frame } = req.body || {};
  if (frame) {
    storeStudentSignal(req.params.attemptId, { frame });
  }
  res.json({ ok: true });
});

module.exports = router;
