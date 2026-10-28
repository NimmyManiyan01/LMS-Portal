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
    process.env.CLIENT_ORIGIN ||
    "http://localhost:8443,https://assesspro-1-d865.onrender.com,https://assesspro-1-i07n.onrender.com,https://assesspro-2j7q.onrender.com"
  )
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  isProduction: process.env.NODE_ENV === "production",
};
