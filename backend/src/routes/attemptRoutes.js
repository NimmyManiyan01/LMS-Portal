const router = require("express").Router();
const mongoose = require("mongoose");
const Attempt = require("../models/Attempt");
const Answer = require("../models/Answer");
const { authenticate } = require("../middleware/auth");
const { finalizeAttempt } = require("../services/finalizeAttempt");

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
    .select("-paperSetId -__v")
    .lean();
  if (!attempt) {
    res.status(404).json({ error: "Attempt not found" });
    return null;
  }
  if (
    attempt.status === "IN_PROGRESS" &&
    new Date(attempt.expiresAt) <= new Date()
  ) {
    await Attempt.updateOne(
      { _id: attempt._id, status: "IN_PROGRESS" },
      { $set: { status: "AUTO_SUBMITTED", submittedAt: new Date() } },
    );
    attempt.status = "AUTO_SUBMITTED";
  }
  return attempt;
}

router.get("/:attemptId", authenticate, async (req, res) => {
  const attempt = await findOwnedAttempt(req, res);
  if (!attempt) return;
  const answers = await Answer.find({ attemptId: attempt._id })
    .select("-_id -attemptId -__v")
    .lean();
  res.json({
    attemptId: attempt.id,
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
  const Question = require("../models/Question");
  const questions = await Question.collection
    .find(
      { _id: { $in: attempt.assignedQuestionIds || [] } },
      { projection: { correctOptionId: 0, explanation: 0, __v: 0 } },
    )
    .toArray();
  const order = new Map(
    (attempt.assignedQuestionIds || []).map((id, index) => [String(id), index]),
  );
  questions.sort((a, b) => order.get(String(a._id)) - order.get(String(b._id)));
  res.json({
    attemptId: String(attempt._id),
    questions: questions.map((question, index) => ({
      id: String(question._id),
      questionText:
        question.questionText || question.text || question.question || "",
      options: (question.options || question.choices || []).map(
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
    attemptId: attempt.id,
    answers: await Answer.find({ attemptId: attempt._id })
      .select("-_id -attemptId -__v")
      .lean(),
    serverTime: new Date(),
  });
});

router.put(
  "/:attemptId/answers/:questionId",
  authenticate,
  async (req, res) => {
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
    res.json({
      saved: true,
      version: doc.version,
      savedAt: doc.savedAt,
    });
  },
);

router.post("/:attemptId/submit", authenticate, async (req, res) => {
  try {
    res.json(
      await finalizeAttempt({
        attemptId: req.params.attemptId,
        studentId: req.student.id,
        reason: "MANUAL",
        answers: req.body.answers,
      }),
    );
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

module.exports = router;
