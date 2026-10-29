const crypto = require("node:crypto");
const AdminUser = require("../models/AdminUser");
const Session = require("../models/Session");
const EmailVerification = require("../models/EmailVerification");
const { sessionSecret, otpSecret } = require("../config/env");
const { sendOtpEmail } = require("../services/auth/brevoEmail");
const SESSION_TTL = 8 * 60 * 60 * 1000;
const hash = (value) =>
  crypto.createHmac("sha256", sessionSecret).update(value).digest("hex");
const hashOtp = (value) => crypto.createHmac("sha256", otpSecret).update(value).digest("hex");
const passwordHash = (value) =>
  crypto
    .scryptSync(value, process.env.JWT_SECRET || "local-salt", 64)
    .toString("hex");
const cookie = (token) =>
  `kgs_admin_session=${token}; HttpOnly; Path=/; Max-Age=${SESSION_TTL / 1000}; SameSite=${process.env.NODE_ENV === "production" ? "None; Secure; Partitioned" : "Lax"}`;
async function login(req, res) {
  const email = String(req.body.email || "")
    .toLowerCase()
    .trim();
  const password = String(req.body.password || "");
  const admin = await AdminUser.findOne({ email, active: true });
  const expected = Buffer.from(passwordHash(password));
  const actual = Buffer.from(admin?.passwordHash || "");
  const valid =
    actual.length === expected.length &&
    crypto.timingSafeEqual(actual, expected);
  if (!valid)
    return res.status(401).json({ error: "Invalid administrator credentials" });
  const raw = crypto.randomBytes(32).toString("hex");
  await Session.create({
    tokenHash: hash(raw),
    adminId: admin.id,
    expiresAt: new Date(Date.now() + SESSION_TTL),
  });
  res.setHeader("Set-Cookie", cookie(raw));
  res.json({
    token: raw,
    user: { id: admin.id, email: admin.email, role: "ADMIN" },
  });
}
async function logout(req, res) {
  res.setHeader(
    "Set-Cookie",
    `kgs_admin_session=; HttpOnly; Path=/; Max-Age=0; SameSite=${process.env.NODE_ENV === "production" ? "None; Secure; Partitioned" : "Lax"}`,
  );
  res.json({ ok: true });
}
async function requestOtp(req, res) {
  const email = String(req.body.email || "").toLowerCase().trim();
  const admin = await AdminUser.findOne({ email, active: true });
  if (!admin) return res.json({ ok: true, message: "If this email is authorized, an OTP has been sent." });
  const verification = await EmailVerification.create({ adminId: admin.id, email, otpHash: hashOtp(String(crypto.randomInt(100000, 1000000))), expiresAt: new Date(Date.now() + 300000), resendAvailableAt: new Date(Date.now() + 60000) });
  const otp = String(crypto.randomInt(100000, 1000000)); verification.otpHash = hashOtp(otp);
  try { const delivery = await sendOtpEmail({ to: email, name: "KGS Administrator", otp, expiresAt: verification.expiresAt }); verification.providerMessageId = delivery.messageId; verification.deliveryStatus = delivery.status; await verification.save(); } catch (error) { verification.deliveryStatus = "FAILED"; verification.deliveryError = error.message; await verification.save(); return res.status(503).json({ error: "Unable to deliver administrator OTP." }); }
  res.json({ ok: true, expiresAt: verification.expiresAt, resendAvailableAt: verification.resendAvailableAt });
}
async function verifyOtp(req, res) {
  const email = String(req.body.email || "").toLowerCase().trim();
  const verification = await EmailVerification.findOne({ email, adminId: { $exists: true }, consumedAt: null }).sort({ createdAt: -1 });
  if (!verification || verification.expiresAt < new Date()) return res.status(401).json({ error: "Your verification code has expired. Request a new code." });
  if (verification.otpHash !== hashOtp(String(req.body.otp || ""))) return res.status(401).json({ error: "Invalid verification code." });
  const admin = await AdminUser.findOne({ _id: verification.adminId, active: true }); if (!admin) return res.status(403).json({ error: "Administrator account unavailable." });
  verification.consumedAt = new Date(); await verification.save(); const raw = crypto.randomBytes(32).toString("hex"); await Session.create({ tokenHash: hash(raw), adminId: admin.id, expiresAt: new Date(Date.now() + SESSION_TTL) }); res.setHeader("Set-Cookie", cookie(raw)); res.json({ token: raw, user: { id: admin.id, email: admin.email, role: "ADMIN" } });
}
module.exports = { login, requestOtp, verifyOtp, logout };
