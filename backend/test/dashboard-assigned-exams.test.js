const test = require("node:test");
const assert = require("node:assert/strict");

// Helper mirroring studentRoutes.js isEligible logic
function isEligible(exam, student) {
  const rules = exam.eligibility || {};
  const explicit =
    !rules.studentIds?.length ||
    rules.studentIds.some((id) => {
      const sId = String(id);
      return (
        sId === String(student._id) ||
        sId === String(student.id) ||
        sId === String(student.studentId)
      );
    });
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

// Helper mirroring studentRoutes.js dashboard PaperSet validation logic
function validatePaperSet(exam, sets) {
  const valid =
    sets.length > 0 &&
    sets.every((set) => {
      const qCount = set.questionIds?.length || set.blueprint?.totalQuestions || 0;
      const marks = set.totalMarks ?? set.blueprint?.maximumMarks ?? 0;
      if (qCount <= 0) return false;
      if (exam.totalQuestions && qCount !== exam.totalQuestions) return false;
      if (exam.totalMarks && marks !== exam.totalMarks) return false;
      return true;
    });
  return valid;
}

// Helper mirroring studentRoutes.js status computation logic
function computeExamStatus(exam, attempts = [], now = new Date()) {
  const mine = attempts.filter((a) => String(a.examId) === String(exam._id));
  const active = mine.find((a) => a.status === "IN_PROGRESS");
  const submitted = mine.find((a) =>
    ["SUBMITTED", "AUTO_SUBMITTED"].includes(a.status),
  );
  const attemptsExhausted = mine.length >= (exam.maxAttempts || 1);

  if (active) return "IN_PROGRESS";
  if (submitted && exam.resultsPublishedAt) return "RESULTS_RELEASED";
  if (submitted) return "RESULTS_PENDING";
  if (attemptsExhausted) return "SUBMITTED";
  if (exam.closesAt && new Date(exam.closesAt) <= now) return "EXPIRED";
  if (exam.status === "CLOSED" || exam.status === "COMPLETED") return "CLOSED";
  if (
    exam.status === "ACTIVE" ||
    exam.status === "LIVE" ||
    (exam.scheduledAt && new Date(exam.scheduledAt) <= now)
  ) {
    return "AVAILABLE";
  }
  return "UPCOMING";
}

test("Requirement 1 & 5: Assigned Student ID matching for KGS-STU-000002", () => {
  const student = {
    _id: "60c72b2f9b1d8b0015f8e123",
    id: "60c72b2f9b1d8b0015f8e123",
    studentId: "KGS-STU-000002",
    college: "KGS Engineering",
    branch: "Computer Science",
    passOutYear: 2026,
    accountStatus: "ACTIVE",
  };

  const examAssignedByHumanId = {
    code: "EXAM-2026-0001",
    status: "SCHEDULED",
    eligibility: { studentIds: ["KGS-STU-000002"] },
  };

  const examAssignedByMongoId = {
    code: "EXAM-2026-0001",
    status: "SCHEDULED",
    eligibility: { studentIds: ["60c72b2f9b1d8b0015f8e123"] },
  };

  const unassignedStudent = {
    _id: "60c72b2f9b1d8b0015f8e999",
    id: "60c72b2f9b1d8b0015f8e999",
    studentId: "KGS-STU-000099",
    accountStatus: "ACTIVE",
  };

  assert.equal(isEligible(examAssignedByHumanId, student), true);
  assert.equal(isEligible(examAssignedByMongoId, student), true);
  assert.equal(isEligible(examAssignedByHumanId, unassignedStudent), false);
});

test("Requirement 2 & 3: Verification of Scheduled/Active exams with Published PaperSets", () => {
  const exam = {
    _id: "exam1",
    code: "EXAM-2026-0001",
    status: "ACTIVE",
    totalQuestions: 10,
    totalMarks: 10,
  };

  const publishedPaperSets = [{
    examId: "exam1",
    status: "PUBLISHED",
    active: true,
    questionIds: Array(10).fill("q_id"),
    totalMarks: 10,
  }];

  const noPublishedPaperSets = []; // PaperSet.find({ status: "PUBLISHED" }) returns empty array for draft sets

  assert.equal(validatePaperSet(exam, publishedPaperSets), true);
  assert.equal(validatePaperSet(exam, noPublishedPaperSets), false);
});

test("Requirement 6, 7 & 8: Categorization of Upcoming, Eligible/Available, In Progress, Expired, and Completed Exams", () => {
  const now = new Date("2026-03-30T10:00:00Z");

  const upcomingExam = {
    _id: "ex1",
    status: "SCHEDULED",
    scheduledAt: new Date("2026-04-01T10:00:00Z"),
  };

  const activeWindowExam = {
    _id: "ex2",
    status: "SCHEDULED",
    scheduledAt: new Date("2026-03-30T09:00:00Z"),
  };

  const expiredExam = {
    _id: "ex3",
    status: "SCHEDULED",
    closesAt: new Date("2026-03-29T10:00:00Z"),
  };

  const inProgressAttempt = [{ examId: "ex2", status: "IN_PROGRESS" }];
  const submittedAttempt = [{ examId: "ex2", status: "SUBMITTED" }];

  assert.equal(computeExamStatus(upcomingExam, [], now), "UPCOMING");
  assert.equal(computeExamStatus(activeWindowExam, [], now), "AVAILABLE");
  assert.equal(computeExamStatus(expiredExam, [], now), "EXPIRED");
  assert.equal(computeExamStatus(activeWindowExam, inProgressAttempt, now), "IN_PROGRESS");
  assert.equal(computeExamStatus(activeWindowExam, submittedAttempt, now), "RESULTS_PENDING");
});
