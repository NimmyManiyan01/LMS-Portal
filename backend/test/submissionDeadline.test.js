const { test } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const Attempt = require("../src/models/Attempt");
const Answer = require("../src/models/Answer");
const Exam = require("../src/models/Exam");
const PaperSet = require("../src/models/PaperSet");
const Question = require("../src/models/Question");
const FinalResult = require("../src/models/FinalResult");
const AuditLog = require("../src/models/AuditLog");
const { finalizeAttempt } = require("../src/services/finalizeAttempt");
const { processExpiredAttempts } = require("../src/jobs/expirationWorker");
const attemptRouter = require("../src/routes/attemptRoutes");

const id = () => new mongoose.Types.ObjectId();
function chain(value) {
  return {
    session() { return this; },
    select() { return this; },
    limit() { return this; },
    async lean() { return value; },
    then(resolve, reject) { return Promise.resolve(value).then(resolve, reject); },
  };
}
function fixture(t, { expired = false, legacy = false, examMarks } = {}) {
  const attempt = {
    _id: id(), examId: id(), studentId: id(), paperSetId: id(), assignedQuestionIds: [id()],
    status: legacy ? "AUTO_SUBMITTED" : "IN_PROGRESS",
    expiresAt: new Date(Date.now() + (expired ? -60000 : 60000)),
    save: t.mock.fn(async () => {}),
  };
  const session = { withTransaction: async fn => fn(), endSession: async () => {} };
  t.mock.method(mongoose, "startSession", async () => session);
  t.mock.method(Attempt, "findOne", () => chain(attempt));
  t.mock.method(FinalResult, "findOne", () => chain(null));
  const persistAnswers = t.mock.method(Answer, "bulkWrite", async () => {});
  t.mock.method(Answer, "updateOne", async () => {});
  t.mock.method(Answer, "find", () => chain([{ questionId: attempt.assignedQuestionIds[0], score: 10, totalTestCases: 2 }]));
  t.mock.method(Question, "find", () => chain([{ _id: attempt.assignedQuestionIds[0], questionType: "CODING", marks: 10 }]));
  t.mock.method(Exam, "findById", () => chain({ totalMarks: examMarks }));
  const paper = t.mock.method(PaperSet, "findOne", filter => {
    assert.deepEqual(filter, { _id: attempt.paperSetId, examId: attempt.examId });
    return chain({ totalMarks: 10 });
  });
  const createResult = t.mock.method(FinalResult, "create", async docs => docs);
  return { attempt, persistAnswers, paper, createResult };
}

test("valid manual finish uses the linked paper maximum when exam marks are unset", async t => {
  const { attempt, paper, createResult } = fixture(t);
  const result = await finalizeAttempt({ attemptId: attempt._id, studentId: attempt.studentId });
  assert.equal(result.maximumMarks, 10);
  assert.equal(result.marksScored, 10);
  assert.equal(attempt.status, "SUBMITTED");
  assert.equal(paper.mock.callCount(), 1);
  assert.equal(createResult.mock.calls[0].arguments[0][0].releaseStatus, "PENDING");
});

test("configured exam marks take precedence over paper marks", async t => {
  const { attempt, paper } = fixture(t, { examMarks: 12 });
  const result = await finalizeAttempt({ attemptId: attempt._id, studentId: attempt.studentId });
  assert.equal(result.maximumMarks, 12);
  assert.equal(paper.mock.callCount(), 0);
});

test("expired manual finish rejects without saving answers, attempt, or result", async t => {
  const { attempt, persistAnswers, createResult } = fixture(t, { expired: true });
  await assert.rejects(finalizeAttempt({
    attemptId: attempt._id, studentId: attempt.studentId,
    answers: { [attempt.assignedQuestionIds[0]]: "late" },
  }), { status: 409, message: /deadline/ });
  assert.equal(attempt.save.mock.callCount(), 0);
  assert.equal(persistAnswers.mock.callCount(), 0);
  assert.equal(createResult.mock.callCount(), 0);
});

test("timeout finalizes an expired attempt from saved answers, including legacy expiry records", async t => {
  const { attempt, persistAnswers, createResult } = fixture(t, { expired: true, legacy: true });
  t.mock.method(Attempt, "find", filter => {
    assert.ok(filter.expiresAt.$lte instanceof Date);
    assert.deepEqual(filter.$or[1], { status: "AUTO_SUBMITTED", submissionReason: { $exists: false } });
    return chain([attempt]);
  });
  assert.equal(await processExpiredAttempts(), 1);
  assert.equal(attempt.status, "AUTO_SUBMITTED");
  assert.equal(attempt.submissionReason, "TIMER_EXPIRY");
  assert.equal(attempt.save.mock.callCount(), 1);
  assert.equal(persistAnswers.mock.callCount(), 0);
  const result = createResult.mock.calls[0].arguments[0][0];
  assert.equal(result.reason, "TIMER_EXPIRY");
  assert.equal(result.marksScored, 10);
  assert.equal(result.releaseStatus, "PENDING");
});

test("timeout rejects a live attempt", async t => {
  const { attempt, createResult } = fixture(t);
  await assert.rejects(finalizeAttempt({ attemptId: attempt._id, reason: "TIMER_EXPIRY" }), { status: 409 });
  assert.equal(createResult.mock.callCount(), 0);
});

test("auto-submit on timer expiry with payload answers persists, calculates score, and stores FinalResult", async t => {
  const { attempt, createResult } = fixture(t, { expired: true });
  const qId = attempt.assignedQuestionIds[0];
  const result = await finalizeAttempt({
    attemptId: attempt._id,
    studentId: attempt.studentId,
    reason: "TIMER_EXPIRY",
    answers: { [qId]: "B" },
  });
  assert.equal(result.status, "FINALIZED");
  assert.equal(result.marksScored, 10);
  assert.equal(result.score, 10);
  assert.equal(attempt.status, "AUTO_SUBMITTED");
  assert.equal(attempt.score, 10);
  assert.equal(createResult.mock.callCount(), 1);
  const saved = createResult.mock.calls[0].arguments[0][0];
  assert.equal(saved.reason, "TIMER_EXPIRY");
  assert.equal(saved.marksScored, 10);
  assert.equal(saved.score, 10);
});

test("manual submit on active attempt persists answers, calculates score, and stores FinalResult", async t => {
  const { attempt, createResult } = fixture(t, { expired: false });
  const qId = attempt.assignedQuestionIds[0];
  const result = await finalizeAttempt({
    attemptId: attempt._id,
    studentId: attempt.studentId,
    reason: "MANUAL",
    answers: { [qId]: "B" },
  });
  assert.equal(result.status, "FINALIZED");
  assert.equal(result.marksScored, 10);
  assert.equal(result.score, 10);
  assert.equal(attempt.status, "SUBMITTED");
  assert.equal(attempt.score, 10);
  assert.equal(createResult.mock.callCount(), 1);
  const saved = createResult.mock.calls[0].arguments[0][0];
  assert.equal(saved.reason, "MANUAL");
  assert.equal(saved.marksScored, 10);
  assert.equal(saved.score, 10);
});

function codeHandler() {
  const route = attemptRouter.stack.find(({ route }) => route?.path === "/:attemptId/submit-code" && route.methods.post).route;
  return route.stack.at(-1).handle;
}
function response() {
  return { code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; } };
}
test("expired code cannot be submitted or mark the attempt partially finalized", async t => {
  const attempt = { _id: id(), studentId: id(), status: "IN_PROGRESS", expiresAt: new Date(Date.now() - 60000) };
  t.mock.method(Attempt, "findOne", () => chain(attempt));
  const mutate = t.mock.method(Attempt, "updateOne", async () => {});
  const save = t.mock.method(Answer, "findOneAndUpdate", async () => {});
  const res = response();
  await codeHandler()({params:{attemptId:String(attempt._id)},student:{_id:attempt.studentId},body:{}},res);
  assert.equal(res.code, 409);
  assert.equal(mutate.mock.callCount(), 0);
  assert.equal(save.mock.callCount(), 0);
});
test("live code submission evaluates hidden tests but returns only public details", async t => {
  const questionId = id();
  const attempt = { _id: id(), studentId: id(), status: "IN_PROGRESS", expiresAt: new Date(Date.now() + 60000), assignedQuestionIds: [questionId] };
  t.mock.method(Attempt, "findOne", () => chain(attempt));
  t.mock.method(Attempt, "exists", async () => ({ _id: attempt._id }));
  t.mock.method(Question, "findById", () => chain({ _id: questionId, questionType: "CODING", marks: 10, testCases: [
    { id: "public", input: "1", expectedOutput: "1", isHidden: false },
    { id: "hidden", input: "2", expectedOutput: "2", isHidden: true },
  ] }));
  const save = t.mock.method(Answer, "findOneAndUpdate", async () => {});
  t.mock.method(AuditLog, "create", async () => {});
  const res = response();
  await codeHandler()({
    params: { attemptId: String(attempt._id) }, student: { _id: attempt.studentId },
    body: { questionId: String(questionId), code: "function solve(input) { return input; }", language: "javascript" }, headers: {},
  }, res);
  assert.equal(res.code, 200);
  assert.equal(res.body.score, 10);
  assert.equal(res.body.evalResult.passCount, 2);
  assert.deepEqual(res.body.evalResult.testResults.map(row => row.testCaseId), ["public"]);
  assert.equal(save.mock.calls[0].arguments[1].testResults.length, 2);
});

test("manual finish after expiry does not return the automatic result as a manual success", async t => {
  const { attempt, createResult } = fixture(t, { expired: true, legacy: true });
  const find = t.mock.method(FinalResult, "findOne", () => chain({ reason: "TIMER_EXPIRY" }));
  await assert.rejects(finalizeAttempt({ attemptId: attempt._id, reason: "MANUAL" }), { status: 409, message: /deadline/ });
  assert.equal(find.mock.callCount(), 0);
  assert.equal(createResult.mock.callCount(), 0);
});
