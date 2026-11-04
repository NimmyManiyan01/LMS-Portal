const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, unique: true, index: true },
    fullName: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 100,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, default: "", match: /^$|^[6-9]\d{9}$/ },
    college: {
      type: String,
      required: false,
      default: "Admin-created",
      minlength: 2,
      maxlength: 150,
      trim: true,
    },
    branch: {
      type: String,
      required: false,
      default: "Unspecified",
      trim: true,
    },
    passOutYear: {
      type: Number,
      required: false,
      default: () => new Date().getFullYear(),
      min: 2000,
      max: 2100,
    },
    emailVerified: { type: Boolean, default: false },
    accountStatus: {
      type: String,
      enum: ["ACTIVE", "SUSPENDED"],
      default: "ACTIVE",
    },
    privacyAcceptedAt: { type: Date, default: Date.now },
    monitoringAcceptedAt: { type: Date, default: Date.now },
    acknowledgementVersion: { type: String, required: true, default: "1.0" },
    otpHash: String,
    otpExpiresAt: Date,
  },
  { collection: "students", timestamps: true },
);

module.exports = mongoose.model("Student", studentSchema);
