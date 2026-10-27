const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    attemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attempt",
      required: true,
      unique: true,
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    assignedSetId: { type: mongoose.Schema.Types.ObjectId, ref: "PaperSet" },
    marksScored: { type: Number, required: true },
    maximumMarks: Number,
    correctCount: { type: Number, default: 0 },
    incorrectCount: { type: Number, default: 0 },
    unansweredCount: { type: Number, default: 0 },
    score: Number,
    maxMarks: Number,
    reason: {
      type: String,
      enum: ["MANUAL", "TIMER_EXPIRY", "INTEGRITY", "ADMINISTRATIVE"],
      required: true,
    },
    scoringVersion: { type: Number, required: true },
    releaseStatus: {
      type: String,
      enum: ["PENDING", "RELEASED"],
      default: "PENDING",
    },
    submittedAt: Date,
    finalizedAt: { type: Date, default: Date.now },
    receiptToken: { type: String, required: true, unique: true },
  },
  { collection: "results", timestamps: true },
);
module.exports = mongoose.model("FinalResult", schema);
