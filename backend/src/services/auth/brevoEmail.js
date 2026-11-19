const {
  brevoApiKey,
  brevoSenderEmail,
  brevoSenderName,
} = require("../../config/env");

async function sendOtpEmail({ to, name, otp, expiresAt }) {
  if (!brevoApiKey || !brevoSenderEmail)
    throw new Error("Brevo email configuration is missing");
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": brevoApiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: { email: brevoSenderEmail, name: brevoSenderName },
      to: [{ email: to, name: name || "Student" }],
      subject: "Your KGS Exam Portal verification code",
      htmlContent: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#1f2937"><div style="background:#0d2442;padding:24px;color:#fff"><strong>KGS EXAM PORTAL</strong></div><div style="padding:28px;border:1px solid #e2e8f0"><h2>Verify your email</h2><p>Use this one-time verification code to sign in:</p><p style="font-size:32px;letter-spacing:8px;font-weight:700;color:#1f4f8f">${otp}</p><p>This code expires at <strong>${expiresAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</strong> and can be used only once.</p><p style="color:#64748b">Never share this code with anyone. If you did not request it, you can safely ignore this email.</p></div></div>`,
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.messageId) {
    const error = new Error("Brevo rejected the email request");
    error.providerResponse = body;
    throw error;
  }
  return { messageId: body.messageId, status: "ACCEPTED" };
}

module.exports = { sendOtpEmail };
