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
const allowedClientOrigins = new Set([
  ...clientOrigins,
  "http://localhost:8443",
  "http://localhost:5173",
  "https://assesspro-1-d865.onrender.com",
  "https://assesspro-1-i07n.onrender.com",
  "https://assesspro-2j7q.onrender.com",
].map((origin) => origin.trim().replace(/\/$/, "")).filter(Boolean));

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
      host === "127.0.0.1" ||
      host.endsWith(".onrender.com") ||
      host.endsWith(".vercel.app") ||
      host.endsWith(".netlify.app")
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
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
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
module.exports = app;
