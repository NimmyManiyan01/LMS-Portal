const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true, unique: true, index: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser" },
    expiresAt: { type: Date, required: true, index: true },
  },
  { collection: "sessions", timestamps: true },
);

module.exports = mongoose.model("Session", sessionSchema);
