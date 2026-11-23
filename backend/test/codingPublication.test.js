const { test } = require("node:test");
const assert = require("node:assert/strict");
const Exam = require("../src/models/Exam");
const PaperSet = require("../src/models/PaperSet");
const Question = require("../src/models/Question");
const Counter = require("../src/models/Counter");
const router = require("../src/routes/adminRoutes");

function handler(method, path) {
  return router.stack.find(({ route }) => route?.path === path && route.methods[method]).route.stack.at(-1).handle;
}

function response() {
  return { code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; } };
}

test("coding examination creation persists Round 2", async (t) => {
  t.mock.method(Counter, "findOneAndUpdate", async () => ({ sequence: 8 }));
  t.mock.method(Exam, "exists", async () => null);
  t.mock.method(Exam, "create", async exam => exam);
  const startAt = new Date(Date.now() + 3600000);
  const endAt = new Date(startAt.getTime() + 1800000);
  const res = response();
  await handler("post", "/exams")({ body: { name: "Round test", examinationType: "CODING", startAt, endAt, durationMinutes: 30 } }, res);
  assert.equal(res.code, 201);
  assert.equal(res.body.exam.examinationType, "CODING");
  assert.equal(res.body.exam.roundNumber, 2);
});

test("coding paper publication rejects wrong round and invalid test cases before save", async (t) => {
  const save = t.mock.fn(async () => {});
  const paper = { examId: "exam", questionIds: ["question"], durationMinutes: 30, status: "DRAFT", save };
  const exam = { examinationType: "CODING", roundNumber: 1, durationMinutes: 30 };
  const question = { status: "ACTIVE", questionType: "CODING", testCases: [] };
  t.mock.method(PaperSet, "findById", async () => paper);
  t.mock.method(Exam, "findById", () => ({ select() { return this; }, async lean() { return exam; } }));
  t.mock.method(Question, "find", () => ({ async lean() { return [question]; } }));
  const publish = handler("post", "/paper-sets/:id/publish");
  const res = response();
  await publish({ params: { id: "paper" } }, res);
  assert.equal(res.code, 409);
  assert.match(res.body.error, /Round 2/);
  assert.match(res.body.error, /valid test cases/);
  assert.equal(save.mock.callCount(), 0);
  exam.roundNumber = 2;
  question.testCases = [{ input: "", expectedOutput: "", isHidden: true }];
  const valid = response();
  await publish({ params: { id: "paper" } }, valid);
  assert.equal(valid.code, 200);
  assert.equal(save.mock.callCount(), 1);
});

test("scheduling rejects an elapsed start date before any database writes", async (t) => {
  const save = t.mock.fn(async () => {});
  t.mock.method(Exam, "findById", async () => ({
    status: "DRAFT", examinationType: "CODING", roundNumber: 2,
    scheduledAt: new Date(Date.now() - 60000), closesAt: new Date(Date.now() + 1800000),
    durationMinutes: 30, save,
  }));
  const res = response();
  await handler("patch", "/exams/:id")({ params: { id: "exam" }, body: { status: "SCHEDULED" } }, res);
  assert.equal(res.code, 400);
  assert.match(res.body.error, /future/);
  assert.equal(save.mock.callCount(), 0);
});
