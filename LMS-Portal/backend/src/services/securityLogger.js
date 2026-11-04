const AuditLog = require("../models/AuditLog");

function clientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  return String(forwarded || req.ip || "unknown").split(",")[0].trim();
}

function recordSecurityEvent(req, statusCode) {
  const severity = statusCode >= 500 ? "ERROR" : "WARNING";
  const action =
    statusCode === 401
      ? "AUTHENTICATION_FAILURE"
      : statusCode === 403
        ? "AUTHORIZATION_FAILURE"
        : statusCode === 429
          ? "RATE_LIMIT_EXCEEDED"
          : "SERVER_ERROR";

  void AuditLog.create({
    actorId: req.auth?.sub,
    actorRole: req.auth?.role || "ANONYMOUS",
    action,
    entityType: "SECURITY_EVENT",
    metadata: {
      severity,
      method: req.method,
      path: req.path,
      statusCode,
      ip: clientIp(req),
      userAgent: String(req.get("user-agent") || "").slice(0, 300),
    },
  }).catch(() => {
    // Security monitoring must never break the request or expose internals.
  });
}

module.exports = { recordSecurityEvent };
