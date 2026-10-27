const router = require("express").Router();
const mongoose = require("mongoose");
const Attempt = require("../models/Attempt");
const Answer = require("../models/Answer");
const { authenticate } = require("../middleware/auth");
const { finalizeAttempt } = require("../services/finalizeAttempt");

async function findOwnedAttempt(req, res) {
  if (!mongoose.isValidObjectId(req.params.attemptId)) {
    res.status(400).json({ error: "Invalid attempt ID" });
    return null;
  }
  const attempt = await Attempt.findOne({
    _id: req.params.attemptId,
    studentId: req.student.id,
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
      studentId: req.student.id,
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
    const saved = await Answer.findOneAndUpdate(
      {
        attemptId: attempt._id,
        questionId: req.params.questionId,
        $or: [{ version: { $lt: version } }, { version: { $exists: false } }],
      },
      {
        $set: {
          selectedOptionId: req.body.selectedOptionId,
          isMarkedForReview: Boolean(req.body.isMarkedForReview),
          visited: Boolean(req.body.visited),
          timeSpentSeconds: Number(req.body.timeSpentSeconds || 0),
          version,
          savedAt: new Date(),
        },
        $setOnInsert: {
          attemptId: attempt._id,
          questionId: req.params.questionId,
        },
      },
      { upsert: true, new: true, rawResult: true },
    );
    if (!saved.value)
      return res
        .status(409)
        .json({ saved: false, error: "A newer answer version already exists" });
    res.json({
      saved: true,
      version: saved.value.version,
      savedAt: saved.value.savedAt,
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
