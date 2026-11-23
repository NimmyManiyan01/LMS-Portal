const { test } = require("node:test");
const assert = require("node:assert/strict");
const Answer = require("../src/models/Answer");
const { gradeQuestion } = require("../src/services/finalizeAttempt");

test("saved MCQ answers are graded from the selected option despite the default score", () => {
  const question = { questionType: "MCQ", correctOptionId: "B", marks: 3, negativeMarks: 1 };
  const correct = new Answer({ selectedOptionId: "B" });
  const incorrect = new Answer({ selectedOptionId: "A" });
  assert.equal(correct.score, 0);
  assert.deepEqual(gradeQuestion(question, correct, {}), { status: "correct", score: 3 });
  assert.deepEqual(gradeQuestion(question, incorrect, {}), { status: "incorrect", score: -1 });
});

test("coding drafts are unanswered and evaluated zero-score code is incorrect", () => {
  const question = { questionType: "CODING" };
  assert.deepEqual(gradeQuestion(question, new Answer({ code: "draft" }), {}), {
    status: "unanswered", score: 0,
  });
  assert.deepEqual(gradeQuestion(question, new Answer({ totalTestCases: 2 }), {}), {
    status: "incorrect", score: 0,
  });
});
