const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    eventId: { type: String, required: true },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    attemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attempt",
      required: true,
    },
    eventType: {
      type: String,
      enum: [
        "TAB_HIDDEN",
        "COPY",
        "PASTE",
        "SCREENSHOT",
        "FULLSCREEN_EXIT",
        "CAMERA_DENIED",
        "MICROPHONE_DENIED",
        "CAMERA_INTERRUPTED",
        "MULTIPLE_PERSON",
      ],
      required: true,
    },
    previousCount: Number,
    newCount: Number,
    threshold: Number,
    action: {
      type: String,
      enum: ["RECORDED", "WARNING", "AUTO_SUBMIT"],
      required: true,
    },
    clientTimestamp: Date,
    recordedAt: { type: Date, default: Date.now },
  },
  { collection: "integrity_events" },
);

schema.index({ attemptId: 1, eventId: 1 }, { unique: true });
module.exports = mongoose.model("IntegrityEvent", schema);
