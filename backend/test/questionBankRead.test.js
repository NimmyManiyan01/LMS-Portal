const { test } = require("node:test");
const assert = require("node:assert/strict");
const Question = require("../src/models/Question");
const router = require("../src/routes/adminRoutes");

test("listing an empty question bank does not create sample records", async (t) => {
  const query = {
    sort() { return this; },
    skip() { return this; },
    limit() { return this; },
    async lean() { return []; },
  };
  t.mock.method(Question, "find", () => query);
  t.mock.method(Question, "countDocuments", async () => 0);
  t.mock.method(Question, "aggregate", async () => []);
  t.mock.method(Question, "distinct", async () => []);
  const create = t.mock.method(Question, "create", async () => {
    throw new Error("Listing must never write");
  });
  const route = router.stack.find(({ route }) =>
    route?.path === "/questions" && route.methods.get,
  ).route;
  const handler = route.stack.at(-1).handle;
  let response;
  await handler({ query: {} }, { json(data) { response = data; } });
  assert.deepEqual(response.questions, []);
  assert.equal(response.pagination.total, 0);
  assert.equal(create.mock.callCount(), 0);
});

test("question bank search combines exact ObjectId, text and the status filter", async (t) => {
  const id = "6ae77862a86517814dbe5a70";
  let filter;
  t.mock.method(Question, "find", (query) => {
    filter = query;
    return { sort() { return this; }, skip() { return this; }, limit() { return this; }, async lean() { return []; } };
  });
  t.mock.method(Question, "countDocuments", async () => 0);
  t.mock.method(Question, "aggregate", async () => []);
  t.mock.method(Question, "distinct", async () => []);
  const route = router.stack.find(({ route }) => route?.path === "/questions" && route.methods.get).route;
  await route.stack.at(-1).handle({ query: { search: id, status: "active" } }, { json() {} });
  assert.equal(filter.$or[3]._id.toHexString(), id);
  assert.deepEqual(filter.$or[0].questionText, { $regex: id, $options: "i" });
  assert.equal(filter.status, "ACTIVE");
});
