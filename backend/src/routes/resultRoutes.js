const router = require("express").Router();
const FinalResult = require("../models/FinalResult");
const Exam = require("../models/Exam");
const { authenticate } = require("../middleware/auth");

function publicResult(result, exam) {
  return {
    attemptId: result.attemptId,
    examName: exam?.title || "Examination",
    examCode: exam?.code || null,
    marksScored: result.releaseStatus === "RELEASED" ? result.marksScored : null,
    maximumMarks: result.releaseStatus === "RELEASED" ? (result.maximumMarks ?? exam?.totalMarks ?? null) : null,
    submittedAt: result.submittedAt,
    finalizedAt: result.finalizedAt,
    releaseStatus: result.releaseStatus || "PENDING",
    released: result.releaseStatus === "RELEASED",
  };
}

router.get("/", authenticate, async (req, res) => {
  const results = await FinalResult.find({ studentId: req.student.id }).lean();
  const exams = await Exam.find({ _id: { $in: results.map((r) => r.examId) } })
    .select("title code totalMarks")
    .lean();
  const examMap = new Map(exams.map((exam) => [String(exam._id), exam]));
  res.json(
    results
      .map((result) =>
        publicResult(result, examMap.get(String(result.examId))),
      ),
  );
});

router.get("/:attemptId", authenticate, async (req, res) => {
  const result = await FinalResult.findOne({
    attemptId: req.params.attemptId,
    studentId: req.student.id,
  }).lean();
  if (!result) return res.status(404).json({ error: "Result not found" });
  if (result.releaseStatus !== "RELEASED")
    return res
      .status(200)
      .json({
        released: false,
        message:
          "Your marks will be available once the examination results are released.",
      });
  const exam = await Exam.findById(result.examId).select("title code totalMarks").lean();
  res.json(publicResult(result, exam));
});

module.exports = router;
