const test = require("node:test");
const assert = require("node:assert/strict");

// Helper mirroring exam deadline and closesAt enforcement logic
function checkExamStartEligibility(exam, now = new Date()) {
  if (
    exam.status === "CLOSED" ||
    (exam.closesAt && new Date(exam.closesAt) <= now)
  ) {
    return { canStart: false, status: 409, error: "This examination is closed" };
  }
  if (
    exam.status === "SCHEDULED" &&
    exam.scheduledAt &&
    new Date(exam.scheduledAt) > now
  ) {
    return { canStart: false, status: 409, error: "This examination is not available yet." };
  }
  return { canStart: true, status: 200 };
}

function checkAttemptAnswerSave(attempt, now = new Date()) {
  if (attempt.status !== "IN_PROGRESS") {
    return { allowed: false, status: 404, error: "Active attempt not found" };
  }
  if (new Date(attempt.expiresAt) <= now) {
    return { allowed: false, status: 409, error: "The examination deadline has passed", newStatus: "AUTO_SUBMITTED" };
  }
  return { allowed: true, status: 200 };
}

function simulateExpirationWorker(attempts, now = new Date()) {
  const expired = attempts.filter(
    (a) => a.status === "IN_PROGRESS" && new Date(a.expiresAt) <= now,
  );
  for (const attempt of expired) {
    attempt.status = "AUTO_SUBMITTED";
    attempt.reason = "TIMER_EXPIRY";
  }
  return expired;
}

test("Backend Expiration Enforcement 1: Exam closesAt window prevents start/resume", () => {
  const now = new Date("2026-03-30T12:00:00Z");

  const closedExam = {
    code: "EXAM-2026-0001",
    status: "SCHEDULED",
    closesAt: new Date("2026-03-30T11:59:00Z"),
  };

  const activeExam = {
    code: "EXAM-2026-0002",
    status: "SCHEDULED",
    scheduledAt: new Date("2026-03-30T10:00:00Z"),
    closesAt: new Date("2026-03-30T13:00:00Z"),
  };

  const checkClosed = checkExamStartEligibility(closedExam, now);
  assert.equal(checkClosed.canStart, false);
  assert.equal(checkClosed.status, 409);
  assert.equal(checkClosed.error, "This examination is closed");

  const checkActive = checkExamStartEligibility(activeExam, now);
  assert.equal(checkActive.canStart, true);
  assert.equal(checkActive.status, 200);
});

test("Backend Expiration Enforcement 2: Attempt answer saving blocked after expiresAt deadline", () => {
  const now = new Date("2026-03-30T12:00:00Z");

  const expiredAttempt = {
    id: "att_1",
    status: "IN_PROGRESS",
    expiresAt: new Date("2026-03-30T11:59:59Z"),
  };

  const validAttempt = {
    id: "att_2",
    status: "IN_PROGRESS",
    expiresAt: new Date("2026-03-30T12:30:00Z"),
  };

  const resultExpired = checkAttemptAnswerSave(expiredAttempt, now);
  assert.equal(resultExpired.allowed, false);
  assert.equal(resultExpired.status, 409);
  assert.equal(resultExpired.error, "The examination deadline has passed");
  assert.equal(resultExpired.newStatus, "AUTO_SUBMITTED");

  const resultValid = checkAttemptAnswerSave(validAttempt, now);
  assert.equal(resultValid.allowed, true);
  assert.equal(resultValid.status, 200);
});

test("Backend Expiration Enforcement 3: Expiration worker finalizes in-progress expired attempts", () => {
  const now = new Date("2026-03-30T12:00:00Z");

  const attempts = [
    { id: "att_1", status: "IN_PROGRESS", expiresAt: new Date("2026-03-30T11:50:00Z") },
    { id: "att_2", status: "IN_PROGRESS", expiresAt: new Date("2026-03-30T12:15:00Z") },
    { id: "att_3", status: "SUBMITTED", expiresAt: new Date("2026-03-30T11:30:00Z") },
  ];

  const processed = simulateExpirationWorker(attempts, now);
  assert.equal(processed.length, 1);
  assert.equal(processed[0].id, "att_1");
  assert.equal(processed[0].status, "AUTO_SUBMITTED");
  assert.equal(processed[0].reason, "TIMER_EXPIRY");

  assert.equal(attempts[1].status, "IN_PROGRESS");
  assert.equal(attempts[2].status, "SUBMITTED");
});
