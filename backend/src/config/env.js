require("dotenv").config();

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
  brevoSenderEmail: process.env.BREVO_SENDER_EMAIL || "",
  brevoSenderName: process.env.BREVO_SENDER_NAME || "KGS Exam Portal",
  sessionSecret:
    process.env.SESSION_SECRET ||
    process.env.JWT_SECRET ||
    "dev-only-change-me",
  brevoApiKey: process.env.BREVO_API_KEY || "",
  brevoSenderEmail: process.env.BREVO_SENDER_EMAIL || "",
  brevoSenderName: process.env.BREVO_SENDER_NAME || "KGS Exam Portal",
  clientOrigins: (process.env.CLIENT_ORIGIN || "http://localhost:8443")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  isProduction: process.env.NODE_ENV === "production",
};
