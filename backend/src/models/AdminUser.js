const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    email: { type: String, unique: true, lowercase: true },
    passwordHash: String,
    role: {
      type: String,
      enum: ["ADMIN"],
    },
    active: { type: Boolean, default: true },
  },
  { collection: "admin_users", timestamps: true },
);
module.exports = mongoose.model("AdminUser", schema);
