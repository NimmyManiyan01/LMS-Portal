const mongoose = require("mongoose");

const attemptSchema = new mongoose.Schema(
  {
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
    paperSetId: { type: mongoose.Schema.Types.ObjectId, ref: "PaperSet" },
    orderSeed: String,
    attemptNumber: Number,
    startedAt: Date,
    expiresAt: Date,
    submittedAt: Date,
    submissionReason: String,
    assignedQuestionIds: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
    ],
    integrityCounts: {
      tabSwitch: { type: Number, default: 0 },
      copyPaste: { type: Number, default: 0 },
      fullscreenExit: { type: Number, default: 0 },
      multiplePerson: { type: Number, default: 0 },
      cameraInterrupted: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: ["IN_PROGRESS", "SUBMITTED", "AUTO_SUBMITTED", "TERMINATED"],
      default: "IN_PROGRESS",
    },
    answers: { type: Map, of: String, default: {} },
    tabSwitchCount: { type: Number, default: 0 },
    score: Number,
  },
  { timestamps: true },
);

attemptSchema.index(
  { examId: 1, studentId: 1 },
  { unique: true, partialFilterExpression: { status: "IN_PROGRESS" } },
);

module.exports = mongoose.model("Attempt", attemptSchema);
