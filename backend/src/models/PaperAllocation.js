const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
    },
    assignedSetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaperSet",
      required: true,
    },
    assignedAt: { type: Date, default: Date.now },
    orderSeed: { type: String, required: true },
    attemptNumber: { type: Number, required: true },
  },
  { collection: "paper_allocations", timestamps: true },
);

schema.index({ studentId: 1, examId: 1, attemptNumber: 1 }, { unique: true });
module.exports = mongoose.model("PaperAllocation", schema);
