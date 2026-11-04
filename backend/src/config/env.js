const path = require("node:path");

// Always load backend/.env, even when the API is launched from the repository root.
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const required = (name) => {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
};

const port = Number(required("PORT"));
if (!Number.isInteger(port) || port <= 0) {
  throw new Error("PORT must be a positive integer");
}

const clientOrigins = required("CLIENT_ORIGIN")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);
if (!clientOrigins.length || clientOrigins.includes("*")) {
  throw new Error("CLIENT_ORIGIN must contain explicit allowed origins");
}
for (const origin of clientOrigins) {
  try {
    const parsed = new URL(origin);
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.pathname !== "/")
      throw new Error();
  } catch {
    throw new Error(`CLIENT_ORIGIN contains an invalid origin: ${origin}`);
  }
}

module.exports = {
  port,
  mongoUri: required("MONGODB_URI"),
  jwtSecret: required("JWT_SECRET"),
  otpSecret: required("OTP_SECRET"),
  sessionSecret: required("SESSION_SECRET"),
  brevoApiKey: required("BREVO_API_KEY"),
  brevoSenderEmail: required("BREVO_SENDER_EMAIL"),
  brevoSenderName: required("BREVO_SENDER_NAME"),
  clientOrigins,
  isProduction: required("NODE_ENV") === "production",
};
