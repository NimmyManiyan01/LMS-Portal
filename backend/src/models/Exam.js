const mongoose = require("mongoose");

const examSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true },
    title: String,
    name: String,
    description: String,
    examinationType: String,
    durationMinutes: Number,
    status: {
      type: String,
      enum: ["DRAFT", "SCHEDULED", "ACTIVE", "COMPLETED", "PUBLISHED", "LIVE", "CLOSED"],
      default: "DRAFT",
    },
    totalQuestions: Number,
    totalMarks: Number,
    scheduledAt: Date,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    resultsPublishedAt: Date,
    readinessRequirements: {
      camera: { type: Boolean, default: false },
      microphone: { type: Boolean, default: false },
      fullscreen: { type: Boolean, default: false },
    },
    integrityProfile: {
      type: String,
      enum: ["BASIC", "STANDARD", "STRICT"],
      default: "BASIC",
    },
    integrityRules: {
      tabSwitchThreshold: { type: Number, default: 2 },
      fullscreenExitThreshold: { type: Number, default: 2 },
      copyPasteThreshold: { type: Number, default: 3 },
      gracePeriodSeconds: { type: Number, default: 3 },
    },
    markingScheme: {
      correctMarks: { type: Number, default: 1 },
      incorrectMarks: { type: Number, default: 0 },
      unansweredMarks: { type: Number, default: 0 },
      floorNegativeScoreAtZero: { type: Boolean, default: false },
      scoringVersion: { type: Number, default: 1 },
    },
    resultReleasePolicy: {
      type: String,
      enum: ["IMMEDIATE", "ADMIN_CONTROLLED"],
      default: "ADMIN_CONTROLLED",
    },
    maxAttempts: { type: Number, default: 1 },
    registrationOpensAt: Date,
    registrationClosesAt: Date,
    closesAt: Date,
    eligibility: {
      colleges: [String],
      branches: [String],
      passOutYears: [Number],
      studentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }],
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Exam", examSchema);
