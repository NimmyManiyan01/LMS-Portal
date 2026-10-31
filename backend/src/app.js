const express = require("express");
const cors = require("cors");
const { clientOrigins } = require("./config/env");
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
const app = express();
app.set("trust proxy", 1);
const allowedClientOrigins = new Set(
  [
    ...clientOrigins,
    "http://localhost:8443",
    "http://localhost:5173",
    "https://white-island-06c11b900.5.azurestaticapps.net",
  ]
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean),
);

function isAllowedOrigin(origin) {
  if (!origin) return true;
  const normalized = origin.trim().replace(/\/$/, "");
  if (allowedClientOrigins.has(normalized)) return true;
  if (clientOrigins.includes("*")) return true;
  try {
    const url = new URL(normalized);
    const host = url.hostname;
    if (
      host === "localhost" ||
      host === "127.0.0.1"
    ) {
      return true;
    }
  } catch {
    /* Ignore invalid origin URL */
  }
  return false;
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
app.use("/api/auth", authRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/attempts", attemptRoutes);
app.use("/api/attempts", integrityRoutes);
app.use("/api/student/results", resultRoutes);
app.use("/api/student/profile", profileRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/reports", reportRoutes);

app.use((err, req, res, next) => {
  console.error("Unhandled API Error:", err);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({
    error: err.message || "An unexpected server error occurred",
  });
});

module.exports = app;
