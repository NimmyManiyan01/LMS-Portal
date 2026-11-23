const { test } = require("node:test");
const assert = require("node:assert/strict");
const { evaluateCode } = require("../src/services/codeCompilerService");
const { studentEvaluation } = require("../src/services/studentEvaluation");

test("real compiler output retains the grading summary without hidden case details", async () => {
  const evaluation = await evaluateCode({
    code: "console.log(input)",
    language: "javascript",
    testCases: [
      { id: "public", input: "12", expectedOutput: "12", isHidden: false },
      { id: "hidden", input: "35", expectedOutput: "35", isHidden: true },
    ],
  });
  assert.equal(evaluation.testResults.length, 2);
  const result = studentEvaluation(evaluation);
  assert.equal(result.passed, true);
  assert.equal(result.passCount, 2);
  assert.equal(result.totalTestCases, 2);
  assert.deepEqual(result.testResults.map((item) => item.testCaseId), ["public"]);
  assert.equal(result.testResults[0].actualOutput, "12");
  assert.doesNotMatch(JSON.stringify(result), /hidden|35/);
});
