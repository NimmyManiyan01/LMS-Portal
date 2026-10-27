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
    questionType: { type: String, enum: ["MCQ", "MSQ", "TRUE_FALSE", "SHORT_ANSWER"], default: "MCQ" },
    difficulty: { type: String, enum: ["EASY", "MEDIUM", "HARD", "NOT_CONFIGURED"], default: "NOT_CONFIGURED" },
    status: { type: String, enum: ["DRAFT", "ACTIVE", "INACTIVE", "PUBLISHED"], default: "ACTIVE" },
    correctOptionIds: [{ type: String }],
    acceptedAnswers: [{ type: String, trim: true }],
  },
  { collection: "questions", timestamps: true },
);
module.exports = mongoose.model("Question", schema);
