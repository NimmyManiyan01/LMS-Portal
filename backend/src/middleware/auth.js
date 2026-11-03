const crypto = require("node:crypto");
const Session = require("../models/Session");
const { roles } = require("../config/permissions");
const { sessionSecret } = require("../config/env");

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const eqIdx = part.indexOf("=");
    if (eqIdx < 0) continue;
    const key = part.slice(0, eqIdx).trim();
    const val = part.slice(eqIdx + 1).trim();
    if (key) cookies[key] = val;
  }
  return cookies;
}

async function authenticate(req, res, next) {
  try {
    const authHeader = (req.headers.authorization || "").trim();
    const bearerToken = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : authHeader;
    const cookies = parseCookies(req.headers.cookie);
    const sessionToken =
      bearerToken || cookies.kgs_session || cookies.kgs_admin_session;

    if (!sessionToken) {
      return res.status(401).json({ error: "Authentication required" });
    }

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

    if (!session) {
      return res.status(401).json({ error: "Authentication required" });
    }

    req.session = session;

    if (session.adminId) {
      if (session.adminId.active !== true) {
        return res.status(401).json({ error: "Authentication required" });
      }
      req.admin = session.adminId;
      req.auth = {
        sub: String(session.adminId._id || session.adminId.id),
        role: "ADMIN",
      };
    } else if (session.studentId) {
      req.student = session.studentId;
      req.auth = {
        sub: String(session.studentId._id || session.studentId.id),
        role: "STUDENT",
      };
    } else {
      return res.status(401).json({ error: "Authentication required" });
    }

    next();
  } catch (error) {
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
