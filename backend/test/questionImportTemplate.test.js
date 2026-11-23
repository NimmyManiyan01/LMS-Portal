const test = require("node:test");
const assert = require("node:assert/strict");
const ExcelJS = require("exceljs");
const router = require("../src/routes/adminRoutes");

const templateHandler = router.stack
  .find((layer) => layer.route?.path === "/questions/import-template")
  .route.stack.at(-1).handle;

function responseStub() {
  return {
    headers: {},
    statusCode: 200,
    type(value) {
      this.contentType = value;
      return this;
    },
    set(name, value) {
      this.headers[name] = value;
      return this;
    },
    status(value) {
      this.statusCode = value;
      return this;
    },
    send(value) {
      this.payload = value;
      return this;
    },
    json(value) {
      this.payload = value;
      return this;
    },
  };
}

test("question CSV template includes an importable coding example", async () => {
  const response = responseStub();
  await templateHandler({ query: { format: "csv" } }, response);

  assert.equal(response.statusCode, 200);
  assert.match(response.contentType, /csv/);
  assert.match(response.payload, /Starter Code JSON/);
  assert.match(response.payload, /Test Cases JSON/);
  assert.match(response.payload, /CODING/);
  assert.match(response.payload, /Sum of Numbers/);
});

test("question XLSX template includes Questions and Instructions sheets", async () => {
  const response = responseStub();
  await templateHandler({ query: { format: "xlsx" } }, response);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(response.payload);
  const questions = workbook.getWorksheet("Questions");
  const instructions = workbook.getWorksheet("Instructions");

  assert.ok(questions);
  assert.ok(instructions);
  assert.equal(questions.getCell("A2").value, "Read N integers and print their sum.");
  assert.equal(questions.getCell("B2").value, "CODING");
  assert.equal(questions.getCell("M2").value, "Sum of Numbers");
  assert.doesNotThrow(() => JSON.parse(questions.getCell("T2").value));
  assert.doesNotThrow(() => JSON.parse(questions.getCell("V2").value));
  assert.match(instructions.getCell("A1").value, /question import template/i);
});
