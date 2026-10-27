const router = require("express").Router();
const Exam = require("../models/Exam");
const Attempt = require("../models/Attempt");
const PaperSet = require("../models/PaperSet");
const Question = require("../models/Question");
const { authenticate } = require("../middleware/auth");

function isEligible(exam, student) {
  const rules = exam.eligibility || {};
  const explicit =
    !rules.studentIds?.length ||
    rules.studentIds.some((id) => String(id) === String(student.id));
  const college =
    !rules.colleges?.length || rules.colleges.includes(student.college);
  const branch =
    !rules.branches?.length || rules.branches.includes(student.branch);
  const year =
    !rules.passOutYears?.length ||
    rules.passOutYears.includes(student.passOutYear);
  return (
    explicit && college && branch && year && student.accountStatus === "ACTIVE"
  );
}

async function dashboard(req, res) {
  const now = new Date();
  const exams = await Exam.find({
    status: { $in: ["SCHEDULED", "PUBLISHED", "LIVE", "CLOSED"] },
  }).lean();
  const attempts = await Attempt.find({ studentId: req.student.id })
    .sort({ createdAt: -1 })
    .lean();
  const visible = (
    await Promise.all(
      exams
        .filter((exam) => isEligible(exam, req.student))
        .map(async (exam) => {
          const sets = await PaperSet.find({
            examId: exam._id,
            active: true,
            status: "PUBLISHED",
          }).lean();
          const expected =
            exam.totalQuestions || sets[0]?.blueprint?.totalQuestions || 0;
          const maximumMarks =
            exam.totalMarks || sets[0]?.blueprint?.maximumMarks || sets[0]?.totalMarks || 0;
          const valid =
            sets.length > 0 &&
            sets.every(
              (set) =>
                set.questionIds?.length === expected &&
                set.blueprint?.totalQuestions === expected &&
                (!exam.totalMarks || set.blueprint?.maximumMarks === exam.totalMarks),
            );
          if (!valid) return null;
          const mine = attempts.filter(
            (attempt) => String(attempt.examId) === String(exam._id),
          );
          const active = mine.find(
            (attempt) => attempt.status === "IN_PROGRESS",
          );
          const submitted = mine.find((attempt) =>
            ["SUBMITTED", "AUTO_SUBMITTED"].includes(attempt.status),
          );
          const attemptsExhausted = mine.length >= exam.maxAttempts;
          let status = "UPCOMING";
          let nextAction = "VIEW_INSTRUCTIONS";
          if (active) {
            status = "IN_PROGRESS";
            nextAction = "RESUME_EXAM";
          } else if (submitted && exam.resultsPublishedAt) {
            status = "RESULTS_RELEASED";
            nextAction = "VIEW_MARKS";
          } else if (submitted) {
            status = "RESULTS_PENDING";
            nextAction = "WAIT_FOR_RESULTS";
          } else if (attemptsExhausted) {
            status = "SUBMITTED";
            nextAction = "VIEW_SUBMISSION";
          } else if (exam.closesAt && exam.closesAt <= now) {
            status = "EXPIRED";
            nextAction = "CLOSED";
          } else if (exam.status === "CLOSED") {
            status = "CLOSED";
            nextAction = "CLOSED";
          } else if (exam.scheduledAt && exam.scheduledAt <= now) {
            status = "AVAILABLE";
            nextAction = "VIEW_INSTRUCTIONS";
          }
          return {
            ...exam,
            id: exam._id,
            totalQuestions: expected,
            totalMarks: maximumMarks,
            status,
            nextAction,
            attemptsUsed: mine.length,
            maxAttempts: exam.maxAttempts,
            activeAttempt: active
              ? {
                  attemptId: String(active._id),
                  startedAt: active.startedAt,
                  deadline: active.expiresAt,
                }
              : null,
          };
        }),
    )
  ).filter(Boolean);
  const counts = {
    available: visible.filter((e) => e.status === "AVAILABLE").length,
    upcoming: visible.filter((e) => e.status === "UPCOMING").length,
    inProgress: visible.filter((e) => e.status === "IN_PROGRESS").length,
    completed: visible.filter((e) =>
      ["SUBMITTED", "RESULTS_PENDING", "RESULTS_RELEASED"].includes(e.status),
    ).length,
    resultsPending: visible.filter((e) => e.status === "RESULTS_PENDING")
      .length,
  };
  res.json({
    student: {
      fullName: req.student.fullName,
      studentId: req.student.studentId,
    },
    summary: counts,
    exams: visible,
  });
}

router.get("/dashboard", authenticate, dashboard);
router.get("/exams", authenticate, dashboard);
router.get("/exams/:examId", authenticate, async (req, res) => {
  const exam = await Exam.findById(req.params.examId).lean();
  if (!exam || !isEligible(exam, req.student))
    return res.status(404).json({ error: "Exam not found" });
  const attempts = await Attempt.find({
    examId: exam._id,
    studentId: req.student.id,
  })
    .sort({ createdAt: -1 })
    .lean();
  res.json({
    exam,
    attempts,
    canStart:
      attempts.length < exam.maxAttempts &&
      !attempts.some((a) => a.status === "IN_PROGRESS"),
  });
});

module.exports = router;
