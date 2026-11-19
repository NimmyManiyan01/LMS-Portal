const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    actorId: mongoose.Schema.Types.ObjectId,
    actorRole: String,
    action: String,
    entityType: String,
    entityId: mongoose.Schema.Types.ObjectId,
    metadata: mongoose.Schema.Types.Mixed,
  },
  { collection: "audit_logs", timestamps: true },
);
module.exports = mongoose.model("AuditLog", schema);
