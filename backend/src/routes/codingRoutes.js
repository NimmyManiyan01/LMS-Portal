const router = require("express").Router();
const mongoose = require("mongoose");
const Question = require("../models/Question");
const Exam = require("../models/Exam");
const PaperSet = require("../models/PaperSet");
const Attempt = require("../models/Attempt");
const Answer = require("../models/Answer");
const FinalResult = require("../models/FinalResult");
const { authenticate } = require("../middleware/auth");
const { evaluateCode } = require("../services/codeCompilerService");
const { studentEvaluation } = require("../services/studentEvaluation");
const { finalizeAttempt } = require("../services/finalizeAttempt");

const adminOnly = (req, res, next) => {
  if (!req.admin || req.auth?.role !== "ADMIN") {
    return res.status(403).json({ error: "Administrator access required" });
  }
  next();
};

function studentMatch(student) {
  if (!student) return null;
  const ids = [student._id, student.id, student.studentId]
    .filter(Boolean)
    .filter((id) => mongoose.isValidObjectId(id));
  if (!ids.length) return null;
  return ids.length === 1 ? ids[0] : { $in: ids };
}

// 1. POST /api/coding/questions — Create coding question
router.post("/questions", authenticate, adminOnly, async (req, res) => {
  const { questionText, questionTitle, difficulty, marks, testCases, starterCode, allowedLanguages, timeLimitSeconds } = req.body || {};
  if (!questionText) return res.status(400).json({ error: "questionText is required" });
  const question = await Question.create({
    questionText,
    questionTitle: questionTitle || questionText,
    questionType: "CODING",
    difficulty: difficulty || "MEDIUM",
    marks: Number(marks || 10),
    testCases: testCases || [],
    starterCode: starterCode || {},
    allowedLanguages: allowedLanguages || ["python", "javascript", "cpp", "java", "c"],
    timeLimitSeconds: Number(timeLimitSeconds || 2),
  });
  res.status(201).json({ created: true, questionId: String(question._id), question });
});

// 2. GET /api/coding/questions — List questions
router.get("/questions", authenticate, adminOnly, async (req, res) => {
  const questions = await Question.find({ questionType: "CODING" }).sort({ createdAt: -1 }).lean();
  res.json({ questions: questions.map(q => ({ ...q, id: String(q._id) })) });
});

// 3. PATCH /api/coding/questions/:id — Update question
router.patch("/questions/:id", authenticate, adminOnly, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: "Invalid question ID" });
  const updated = await Question.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true }).lean();
  if (!updated) return res.status(404).json({ error: "Question not found" });
  res.json({ updated: true, question: { ...updated, id: String(updated._id) } });
});

// 4. POST /api/coding/papers — Create coding paper
router.post("/papers", authenticate, adminOnly, async (req, res) => {
  const { examId, name, questionIds, totalMarks } = req.body || {};
  if (!examId || !questionIds) return res.status(400).json({ error: "examId and questionIds are required" });
  const paper = await PaperSet.create({
    examId,
    name: name || "Coding Assessment Paper Set",
    questionIds,
    totalMarks: Number(totalMarks || 100),
    status: "PUBLISHED",
    active: true,
  });
  res.status(201).json({ created: true, paperSetId: String(paper._id), paper });
});

// 5. POST /api/coding/assessments — Create coding assessment
router.post("/assessments", authenticate, adminOnly, async (req, res) => {
  const { title, description, durationMinutes, totalMarks, allowedLanguages, readinessRequirements } = req.body || {};
  if (!title) return res.status(400).json({ error: "title is required" });
  const exam = await Exam.create({
    title,
    code: `CODING_${Date.now().toString().slice(-6)}`,
    description: description || "Technical Coding Assessment",
    durationMinutes: Number(durationMinutes || 90),
    totalMarks: Number(totalMarks || 100),
    examinationType: "CODING",
    roundNumber: 2,
    allowedLanguages: allowedLanguages || ["python", "javascript", "cpp", "java", "c"],
    readinessRequirements: readinessRequirements || { camera: true, fullscreen: true, microphone: false },
    status: "PUBLISHED",
  });
  res.status(201).json({ created: true, examId: String(exam._id), exam });
});

// 6. POST /api/coding/assessments/:id/assign — Assign students
router.post("/assessments/:id/assign", authenticate, adminOnly, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: "Invalid exam ID" });
  const { studentIds } = req.body || {};
  const PaperAllocation = require("../models/PaperAllocation");
  const defaultSet = await PaperSet.findOne({ examId: req.params.id }).lean();
  if (!defaultSet) return res.status(400).json({ error: "Create a paper set for this assessment before assigning students." });

  let assignedCount = 0;
  for (const studentId of studentIds || []) {
    await PaperAllocation.findOneAndUpdate(
      { examId: req.params.id, studentId },
      { $set: { paperSetId: defaultSet._id, assignedAt: new Date() } },
      { upsert: true }
    );
    assignedCount++;
  }
  res.json({ assigned: true, assignedCount });
});

// 7. GET /api/coding/assigned — Student's assigned rounds
router.get("/assigned", authenticate, async (req, res) => {
  if (!req.student) return res.status(403).json({ error: "Student account required" });
  const exams = await Exam.find({ examinationType: "CODING", status: "PUBLISHED" }).lean();
  res.json({ exams: exams.map(e => ({ ...e, id: String(e._id) })) });
});

// 8. POST /api/coding/attempts/start — Start authorized attempt
router.post("/attempts/start", authenticate, async (req, res) => {
  if (!req.student) return res.status(403).json({ error: "Student account required" });
  const { examId } = req.body || {};
  if (!examId || !mongoose.isValidObjectId(examId)) return res.status(400).json({ error: "Valid examId is required" });

  const exam = await Exam.findById(examId).lean();
  if (!exam) return res.status(404).json({ error: "Exam not found" });

  let attempt = await Attempt.findOne({ examId, studentId: studentMatch(req.student) }).lean();
  if (!attempt) {
    const expiresAt = new Date(Date.now() + (exam.durationMinutes || 90) * 60 * 1000);
    const paperSet = await PaperSet.findOne({ examId }).lean();
    const assignedQuestionIds = paperSet?.questionIds || [];
    const newAttempt = await Attempt.create({
      examId,
      studentId: req.student._id || req.student.id,
      paperSetId: paperSet?._id,
      assignedQuestionIds,
      status: "IN_PROGRESS",
      startedAt: new Date(),
      expiresAt,
    });
    attempt = newAttempt.toObject();
  }

  res.json({
    attemptId: String(attempt._id),
    status: attempt.status,
    startedAt: attempt.startedAt,
    deadline: attempt.expiresAt,
  });
});

// 9. GET /api/coding/attempts/:id — Retrieve attempt state
router.get("/attempts/:id", authenticate, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: "Invalid attempt ID" });
  const attempt = await Attempt.findOne({ _id: req.params.id, studentId: studentMatch(req.student) }).lean();
  if (!attempt) return res.status(404).json({ error: "Attempt not found" });
  const answers = await Answer.find({ attemptId: attempt._id }).select("-testResults").lean();
  res.json({
    attemptId: String(attempt._id),
    status: attempt.status,
    startedAt: attempt.startedAt,
    deadline: attempt.expiresAt,
    answers,
  });
});

// 10. PUT /api/coding/attempts/:id/draft — Autosave code
router.put("/attempts/:id/draft", authenticate, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: "Invalid attempt ID" });
  const { questionId, code, language } = req.body || {};
  if (!mongoose.isValidObjectId(questionId) || typeof code !== "string") {
    return res.status(400).json({ error: "A valid question ID and code are required." });
  }

  const attempt = await Attempt.findOne({
    _id: req.params.id,
    studentId: studentMatch(req.student),
    status: "IN_PROGRESS",
    expiresAt: { $gt: new Date() },
  }).lean();
  if (!attempt) return res.status(404).json({ error: "Active attempt not found" });
  if (!attempt.assignedQuestionIds?.some(id => String(id) === String(questionId))) {
    return res.status(404).json({ error: "Question is not assigned to this attempt." });
  }

  const updated = await Answer.findOneAndUpdate(
    { attemptId: attempt._id, questionId },
    { $set: { draftCode: code, draftLanguage: language || "javascript", savedAt: new Date() } },
    { upsert: true, new: true },
  );
  res.json({ saved: true, savedAt: updated.savedAt });
});

// 11. POST /api/coding/executions — Run code or public tests (Async Job ID pattern)
router.post("/executions", authenticate, async (req, res) => {
  const { attemptId, questionId, language, sourceCode, mode, stdin } = req.body || {};
  if (!attemptId || !questionId || !sourceCode) {
    return res.status(400).json({ error: "attemptId, questionId, and sourceCode are required." });
  }

  const attempt = await Attempt.findOne({ _id: attemptId, studentId: studentMatch(req.student), status: "IN_PROGRESS", expiresAt: { $gt: new Date() } }).lean();
  if (!attempt) return res.status(404).json({ error: "Active attempt not found." });

  if (!attempt.assignedQuestionIds?.some((id) => String(id) === questionId)) {
    return res.status(404).json({ error: "Question is not assigned to this attempt." });
  }
  const question = await Question.findOne({ _id: questionId, questionType: "CODING" }).lean();
  if (!question) return res.status(409).json({ error: "This question is not configured for code evaluation." });

  const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const testCasesToRun = stdin
    ? [{ id: "custom", input: stdin, expectedOutput: "", isHidden: false }]
    : mode === "submit"
      ? (question.testCases || [])
      : (question.testCases || []).filter((tc) => !tc.isHidden);

  if (!testCasesToRun.length) {
    return res.status(409).json({ error: "This question has no test cases for the requested execution." });
  }

  const evaluation = await evaluateCode({
    code: sourceCode,
    language: language || "javascript",
    testCases: testCasesToRun,
    timeLimitSeconds: question.timeLimitSeconds || 2,
  });

  const evalResult = studentEvaluation(evaluation);
  const firstResult = evalResult.testResults[0] || {};

  res.json({
    jobId,
    status: "COMPLETED",
    attemptId: String(attempt._id),
    questionId,
    language: language || "javascript",
    stdout: firstResult.actualOutput || evalResult.output || "",
    stderr: firstResult.error || null,
    executionTimeMs: firstResult.executionTimeMs || 0,
    evalResult,
  });
});

// 12. GET /api/coding/executions/:id — Retrieve execution result
router.get("/executions/:id", authenticate, async (req, res) => {
  res.json({
    jobId: req.params.id,
    status: "COMPLETED",
    serverTime: new Date(),
  });
});

// 13. POST /api/coding/attempts/:id/submit — Final submission
router.post("/attempts/:id/submit", authenticate, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: "Invalid attempt ID" });
  const studentId = req.student._id || req.student.id;
  try {
    const result = await finalizeAttempt({
      attemptId: req.params.id,
      studentId,
      reason: "MANUAL",
      answers: req.body.answers,
    });
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

// 14. GET /api/admin/coding/monitoring — Monitor active attempts
router.get("/admin/coding/monitoring", authenticate, adminOnly, async (req, res) => {
  const attempts = await Attempt.find({ status: "IN_PROGRESS" })
    .populate("examId", "title code")
    .populate("studentId", "fullName studentId college registrationId")
    .lean();
  res.json({ attempts: attempts.map(a => ({ ...a, attemptId: String(a._id) })) });
});

// 15. GET /api/admin/coding/results — Retrieve coding results
router.get("/api/admin/coding/results", authenticate, adminOnly, async (req, res) => {
  const results = await FinalResult.find()
    .populate("examId", "title code")
    .populate("studentId", "fullName studentId college")
    .sort({ createdAt: -1 })
    .lean();
  res.json({ results: results.map(r => ({ ...r, resultId: String(r._id) })) });
});

// 16. POST /api/admin/coding/results/:id/finalize — Finalize evaluation
router.post("/admin/coding/results/:id/finalize", authenticate, adminOnly, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: "Invalid result ID" });
  const result = await FinalResult.findByIdAndUpdate(
    req.params.id,
    { $set: { evaluationStatus: "FINALIZED", releaseStatus: "RELEASED" } },
    { new: true }
  ).lean();
  if (!result) return res.status(404).json({ error: "Result not found" });
  res.json({ finalized: true, resultId: String(result._id), evaluationStatus: result.evaluationStatus });
});

module.exports = router;
