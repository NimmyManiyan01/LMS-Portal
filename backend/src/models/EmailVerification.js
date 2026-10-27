const mongoose = require("mongoose");

const emailVerificationSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    email: { type: String, required: true, lowercase: true, index: true },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    consumedAt: Date,
    attemptCount: { type: Number, default: 0 },
    resendAvailableAt: { type: Date, required: true },
    providerMessageId: String,
    deliveryStatus: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "DELIVERED", "FAILED"],
      default: "PENDING",
    },
    deliveryError: String,
  },
  {
    collection: "email_verifications",
    timestamps: { createdAt: true, updatedAt: false },
  },
);

module.exports = mongoose.model("EmailVerification", emailVerificationSchema);
