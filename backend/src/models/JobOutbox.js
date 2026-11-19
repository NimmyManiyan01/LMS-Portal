const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    key: { type: String, required: true, unique: true },
    payload: mongoose.Schema.Types.Mixed,
    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "COMPLETED", "FAILED"],
      default: "PENDING",
    },
    attempts: { type: Number, default: 0 },
    availableAt: { type: Date, default: Date.now },
    lastError: String,
    completedAt: Date,
  },
  { collection: "job_outbox", timestamps: true },
);

module.exports = mongoose.model("JobOutbox", schema);
