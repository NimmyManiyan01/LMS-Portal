const mongoose = require("mongoose");

const paperSetSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
      index: true,
    },
    code: { type: String, required: true },
    name: String,
    description: String,
    durationMinutes: Number,
    totalMarks: Number,
    passingMarks: Number,
    instructions: [String],
    status: { type: String, enum: ["DRAFT", "PUBLISHED"], default: "DRAFT" },
    publishedAt: Date,
    publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser" },
    questionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
    allocationCount: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    blueprint: {
      totalQuestions: Number,
      maximumMarks: Number,
      topicDistribution: mongoose.Schema.Types.Mixed,
      difficultyDistribution: mongoose.Schema.Types.Mixed,
      markingScheme: mongoose.Schema.Types.Mixed,
    },
  },
  { collection: "paper_sets", timestamps: true },
);

paperSetSchema.index({ examId: 1, code: 1 }, { unique: true });
module.exports = mongoose.model("PaperSet", paperSetSchema);
