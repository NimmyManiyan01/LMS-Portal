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
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || clientOrigins.includes(origin))
        return callback(null, true);
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
