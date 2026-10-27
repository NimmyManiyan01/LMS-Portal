const crypto = require("node:crypto");
const Session = require("../models/Session");
const { roles } = require("../config/permissions");
const { sessionSecret } = require("../config/env");

async function authenticate(req, res, next) {
  try {
    const token = (req.headers.authorization || "").replace("Bearer ", "");
    const cookies = Object.fromEntries(
      (req.headers.cookie || "")
        .split(";")
        .filter(Boolean)
        .map((part) => part.trim().split("=")),
    );
    const adminToken = cookies.kgs_admin_session;
    const sessionToken = cookies.kgs_session || adminToken || token;
    const tokenHash = crypto
      .createHmac("sha256", sessionSecret)
      .update(sessionToken)
      .digest("hex");
    const session = await Session.findOne({
      tokenHash,
      expiresAt: { $gt: new Date() },
    })
      .populate("studentId")
      .populate("adminId");
    if (!session) throw new Error("Invalid session");
    req.session = session;
    if (session.adminId && adminToken) {
      req.admin = session.adminId;
      req.auth = { sub: session.adminId.id, role: "ADMIN" };
    } else {
      req.student = session.studentId;
      req.auth = { sub: session.studentId.id, role: "STUDENT" };
    }
    next();
  } catch {
    res.status(401).json({ error: "Authentication required" });
  }
}

function requirePermission(permission) {
  return [
    authenticate,
    (req, res, next) => {
      if (
        req.auth.role === "STUDENT" ||
        !roles[req.auth.role]?.includes(permission)
      ) {
        return res.status(403).json({ error: "Insufficient permission" });
      }
      next();
    },
  ];
}

module.exports = { authenticate, requirePermission };
