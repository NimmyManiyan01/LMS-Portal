const path = require("node:path");

// Always load backend/.env, even when the API is launched from the repository root.
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

module.exports = {
  port: Number(process.env.PORT || 4000),
  mongoUri:
    process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/kgs_exam_portal",
  jwtSecret: process.env.JWT_SECRET || "dev-only-change-me",
  otpSecret:
    process.env.OTP_SECRET || process.env.JWT_SECRET || "dev-only-change-me",
  sessionSecret:
    process.env.SESSION_SECRET ||
    process.env.JWT_SECRET ||
    "dev-only-change-me",
  brevoApiKey: process.env.BREVO_API_KEY || "",
  // Support both the current names and the legacy Brevo names already used
  // by deployed environments. Secrets remain server-side only.
  brevoSenderEmail:
    process.env.BREVO_SENDER_EMAIL ||
    process.env.BREVO_FROM_EMAIL ||
    process.env.BREVO_USER ||
    "",
  brevoSenderName:
    process.env.BREVO_SENDER_NAME ||
    process.env.EMAIL_FROM_NAME ||
    "KGS Exam Portal",
  clientOrigins: (
    process.env.CLIENT_ORIGIN || "http://localhost:8443,http://localhost:5173"
  )
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  isProduction: process.env.NODE_ENV === "production",
};
