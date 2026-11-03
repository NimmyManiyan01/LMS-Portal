const express = require("express");
const cors = require("cors");
const { clientOrigins, isProduction } = require("./config/env");
const { isDatabaseReady } = require("./config/database");
const authRoutes = require("./routes/authRoutes");
const examRoutes = require("./routes/examRoutes");
const studentRoutes = require("./routes/studentRoutes");
const attemptRoutes = require("./routes/attemptRoutes");
const integrityRoutes = require("./routes/integrityRoutes");
const resultRoutes = require("./routes/resultRoutes");
const profileRoutes = require("./routes/profileRoutes");
const reportRoutes = require("./routes/reportRoutes");
const adminRoutes = require("./routes/adminRoutes");
const { recordSecurityEvent } = require("./services/securityLogger");
const { createRateLimiter } = require("./middleware/rateLimit");
const { csrfProtection } = require("./middleware/csrf");
const app = express();
app.set("trust proxy", 1);

app.use((req, res, next) => {
  res.on("finish", () => {
    if ([401, 403, 429].includes(res.statusCode) || res.statusCode >= 500)
      recordSecurityEvent(req, res.statusCode);
  });
  next();
});

app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-DNS-Prefetch-Control", "off");
  res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
  res.setHeader("Origin-Agent-Cluster", "?1");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");
  res.setHeader("Permissions-Policy", "camera=(self), microphone=(), geolocation=()");
  res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
  next();
});

app.use(
  createRateLimiter({
    windowMs: 60 * 1000,
    max: 300,
    message: "Too many requests. Please try again shortly.",
  }),
);
app.use(csrfProtection);

if (isProduction) {
  app.use((req, res, next) => {
    const forwardedProto = String(req.headers["x-forwarded-proto"] || "")
      .split(",")[0]
      .trim()
      .toLowerCase();

    if (forwardedProto !== "https" && !req.secure) {
      return res.redirect(308, `https://${req.get("host")}${req.originalUrl}`);
    }

    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );
    next();
  });
}

const allowedClientOrigins = new Set(
  clientOrigins
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean),
);

function isAllowedOrigin(origin) {
  if (!origin) return true;
  const normalized = origin.trim().replace(/\/$/, "");
  return allowedClientOrigins.has(normalized);
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        return callback(null, origin || true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
  }),
);
app.options(
  "*",
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        return callback(null, origin || true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
  }),
);
app.use(express.json({ limit: "1mb" }));
const health = (_req, res) => {
  const database = isDatabaseReady();
  res.status(database ? 200 : 503).json({
    ok: database,
    service: "kgs-exam-portal-api",
    checks: { database: database ? "up" : "down" },
  });
};
app.get("/api/health", health);
app.get("/health", health);
app.use(
  "/api/auth",
  createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 60,
    message: "Too many authentication requests. Please try again later.",
  }),
  authRoutes,
);
app.use("/api/exams", examRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/attempts", attemptRoutes);
app.use("/api/attempts", integrityRoutes);
app.use("/api/student/results", resultRoutes);
app.use("/api/student/profile", profileRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/reports", reportRoutes);

app.use((err, req, res, next) => {
  if (isProduction) console.error("Unhandled API Error");
  else console.error("Unhandled API Error:", err);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({
    error:
      isProduction
        ? "An unexpected server error occurred"
        : err.message || "An unexpected server error occurred",
  });
});

module.exports = app;
