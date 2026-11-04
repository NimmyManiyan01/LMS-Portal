const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    requestedBy: { type: mongoose.Schema.Types.ObjectId, required: true },
    examId: { type: mongoose.Schema.Types.ObjectId, ref: "Exam" },
    filters: mongoose.Schema.Types.Mixed,
    status: {
      type: String,
      enum: ["GENERATING", "READY", "FAILED"],
      default: "GENERATING",
    },
    fileName: String,
    completedAt: Date,
    error: String,
  },
  { collection: "report_exports", timestamps: true },
);
module.exports = mongoose.model("ReportExport", schema);
