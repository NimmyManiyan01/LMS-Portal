const mongoose = require("mongoose");
const { roles } = require("../config/permissions");

const userSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true, lowercase: true, trim: true },
    fullName: { type: String, required: true },
    phone: { type: String, trim: true },
    dateOfBirth: Date,
    institution: String,
    registrationId: { type: String, unique: true, sparse: true },
    role: {
      type: String,
      enum: ["STUDENT", ...Object.keys(roles)],
      default: "STUDENT",
    },
    otpHash: String,
    otpExpiresAt: Date,
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
