const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    questionText: String,
    sectionId: String,
    sectionName: String,
    questionNumber: Number,
    options: [{ id: String, text: String }],
    correctOptionId: String,
    codeSnippet: String,
    explanation: String,
    marks: Number,
    negativeMarks: Number,
    questionType: {
      type: String,
      enum: ["MCQ", "MSQ", "TRUE_FALSE", "SHORT_ANSWER", "CODING"],
      default: "MCQ",
    },
    difficulty: {
      type: String,
      enum: ["EASY", "MEDIUM", "HARD", "NOT_CONFIGURED"],
      default: "NOT_CONFIGURED",
    },
    status: {
      type: String,
      enum: ["DRAFT", "ACTIVE", "INACTIVE", "PUBLISHED"],
      default: "ACTIVE",
    },
    correctOptionIds: [{ type: String }],
    acceptedAnswers: [{ type: String, trim: true }],
    questionTitle: String,
    inputFormat: String,
    outputFormat: String,
    constraints: String,
    sampleInput: String,
    sampleOutput: String,
    referenceSolution: {
      type: Map,
      of: String,
      default: {},
    },
    allowedLanguages: {
      type: [String],
      default: ["javascript", "python", "java", "cpp", "c"],
    },
    starterCode: {
      type: Map,
      of: String,
      default: {},
    },
    testCases: [
      {
        id: String,
        input: String,
        expectedOutput: String,
        isHidden: { type: Boolean, default: false },
        weightage: { type: Number, default: 1 },
        explanation: String,
      },
    ],
    timeLimitSeconds: { type: Number, default: 2 },
    memoryLimitMB: { type: Number, default: 256 },
  },
  { collection: "questions", timestamps: true },
);
module.exports = mongoose.model("Question", schema);
