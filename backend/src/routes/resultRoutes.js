const router = require("express").Router();
const FinalResult = require("../models/FinalResult");
const Exam = require("../models/Exam");
const { authenticate } = require("../middleware/auth");

function publicResult(result, exam) {
  return {
    attemptId: result.attemptId,
    examName: exam.title,
    marksScored: result.marksScored,
    maximumMarks: result.maximumMarks,
    submittedAt: result.submittedAt,
    finalizedAt: result.finalizedAt,
    released: true,
  };
}

router.get("/", authenticate, async (req, res) => {
  const results = await FinalResult.find({ studentId: req.student.id }).lean();
  const exams = await Exam.find({ _id: { $in: results.map((r) => r.examId) } })
    .select("title")
    .lean();
  const examMap = new Map(exams.map((exam) => [String(exam._id), exam]));
  res.json(
    results
      .filter((result) => result.releaseStatus === "RELEASED")
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
  const exam = await Exam.findById(result.examId).select("title").lean();
  res.json(publicResult(result, exam));
});

module.exports = router;
