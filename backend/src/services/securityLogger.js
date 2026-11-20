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

function recordCodeExecutionEvent(req, { attemptId, language, testResults, score }) {
  void AuditLog.create({
    actorId: req.auth?.sub || req.student?._id,
    actorRole: req.auth?.role || "STUDENT",
    action: "CODE_EXECUTION",
    entityType: "ATTEMPT",
    entityId: String(attemptId),
    metadata: {
      severity: "INFO",
      language,
      passCount: testResults?.filter((t) => t.passed).length || 0,
      totalTestCases: testResults?.length || 0,
      score,
      ip: clientIp(req),
    },
  }).catch(() => undefined);
}

module.exports = { recordSecurityEvent, recordCodeExecutionEvent };
