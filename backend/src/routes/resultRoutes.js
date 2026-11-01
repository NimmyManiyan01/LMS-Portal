const router = require("express").Router();
const FinalResult = require("../models/FinalResult");
const Exam = require("../models/Exam");
const PaperSet = require("../models/PaperSet");
const { authenticate } = require("../middleware/auth");

function publicResult(result, exam) {
  return {
    attemptId: result.attemptId,
    examName: exam?.title || "Examination",
    examCode: exam?.code || null,
    marksScored:
      result.releaseStatus === "RELEASED" ? result.marksScored : null,
    maximumMarks:
      result.releaseStatus === "RELEASED"
        ? (result.maximumMarks ?? result.maxMarks ?? exam?.totalMarks ?? null)
        : null,
    submittedAt: result.submittedAt,
    finalizedAt: result.finalizedAt,
    releaseStatus: result.releaseStatus || "PENDING",
    released: result.releaseStatus === "RELEASED",
  };
}

router.get("/", authenticate, async (req, res) => {
  if (!req.student) {
    return res.status(403).json({ error: "Student account required" });
  }
  const studentId = req.student._id || req.student.id;
  const results = await FinalResult.find({ studentId }).lean();
  const examIds = [
    ...new Set(
      results
        .map((r) => r.examId)
        .filter((id) => id && mongoose.isValidObjectId(id)),
    ),
  ];
  const exams = examIds.length
    ? await Exam.find({ _id: { $in: examIds } }).select("title code totalMarks").lean()
    : [];
  const examMap = new Map(exams.map((exam) => [String(exam._id), exam]));
  const sets = examIds.length
    ? await PaperSet.find({
        examId: { $in: examIds },
        status: "PUBLISHED",
        active: true,
      })
        .select("examId totalMarks blueprint")
        .lean()
    : [];
  const setMarks = new Map(
    sets.map((set) => [
      String(set.examId),
      set.totalMarks ?? set.blueprint?.maximumMarks ?? null,
    ]),
  );
  res.json(
    results.map((result) =>
      publicResult(result, {
        ...examMap.get(String(result.examId)),
        totalMarks:
          examMap.get(String(result.examId))?.totalMarks ||
          setMarks.get(String(result.examId)),
      }),
    ),
  );
});

router.get("/:attemptId", authenticate, async (req, res) => {
  if (!req.student) {
    return res.status(403).json({ error: "Student account required" });
  }
  const studentId = req.student._id || req.student.id;
  const result = await FinalResult.findOne({
    attemptId: req.params.attemptId,
    studentId,
  }).lean();
  if (!result) return res.status(404).json({ error: "Result not found" });
  if (result.releaseStatus !== "RELEASED")
    return res.status(200).json({
      released: false,
      message:
        "Your marks will be available once the examination results are released.",
    });
  const exam = await Exam.findById(result.examId)
    .select("title code totalMarks")
    .lean();
  const paperSet = await PaperSet.findOne({
    examId: result.examId,
    status: "PUBLISHED",
    active: true,
  })
    .select("totalMarks blueprint")
    .lean();
  if (exam && !exam.totalMarks && paperSet)
    exam.totalMarks =
      paperSet.totalMarks ?? paperSet.blueprint?.maximumMarks ?? null;
  res.json(publicResult(result, exam));
});

module.exports = router;
