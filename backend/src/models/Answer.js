const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema(
  {
    attemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attempt",
      required: true,
    },
    questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    selectedOptionId: String,
    code: String,
    language: String,
    testResults: [
      {
        testCaseId: String,
        passed: Boolean,
        input: String,
        expectedOutput: String,
        actualOutput: String,
        executionTimeMs: Number,
        error: String,
      },
    ],
    passCount: { type: Number, default: 0 },
    totalTestCases: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
    isMarkedForReview: { type: Boolean, default: false },
    visited: { type: Boolean, default: true },
    timeSpentSeconds: { type: Number, default: 0 },
    version: { type: Number, required: true, default: 1 },
    savedAt: { type: Date, default: Date.now },
  },
  { collection: "answers" },
);

answerSchema.index({ attemptId: 1, questionId: 1 }, { unique: true });
module.exports = mongoose.model("Answer", answerSchema);
