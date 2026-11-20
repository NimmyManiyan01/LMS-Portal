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

async function sendRound2NotificationEmail({ to, name, examTitle, scheduledAt }) {
  if (!brevoApiKey || !brevoSenderEmail) return null;
  const dateStr = scheduledAt ? new Date(scheduledAt).toLocaleString("en-IN") : "Scheduled Date";

  try {
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
        subject: `Qualified for Round 2: ${examTitle} — KGS Exam Portal`,
        htmlContent: `<div style="font-family:Arial,sans-serif;max-width:580px;margin:auto;color:#1E3A34">
          <div style="background:#1E3A34;padding:24px;color:#fff;border-radius:12px 12px 0 0">
            <strong style="font-size:18px">KGS EXAM PORTAL — FLUX SUITE</strong>
          </div>
          <div style="padding:28px;border:1px solid #E2DBD0;border-top:none;border-radius:0 0 12px 12px;background:#ffffff">
            <span style="background:#00D084;color:#057A55;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:bold">ROUND 2 QUALIFIED</span>
            <h2 style="color:#1E3A34;margin-top:16px">Congratulations, ${name || "Candidate"}!</h2>
            <p style="color:#057A55;font-weight:bold">You have qualified for Round 2 Technical Coding Assessment for <strong>${examTitle}</strong>.</p>
            <div style="background:#F6F2E6;padding:16px;border-radius:12px;border:1px solid #E2DBD0;margin:20px 0">
              <p style="margin:4px 0"><strong>Examination:</strong> ${examTitle}</p>
              <p style="margin:4px 0"><strong>Scheduled Date & Time:</strong> ${dateStr}</p>
              <p style="margin:4px 0"><strong>Assignment Status:</strong> ASSIGNED &amp; AVAILABLE</p>
            </div>
            <p>Please log in to your student portal to complete hardware readiness checks and enter your coding workspace when the session begins.</p>
          </div>
        </div>`,
      }),
    });
    const body = await response.json().catch(() => ({}));
    return body;
  } catch {
    return null;
  }
}

module.exports = { sendOtpEmail, sendRound2NotificationEmail };
