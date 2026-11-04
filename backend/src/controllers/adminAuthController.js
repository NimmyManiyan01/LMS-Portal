const crypto = require("node:crypto");
const AdminUser = require("../models/AdminUser");
const Session = require("../models/Session");
const EmailVerification = require("../models/EmailVerification");
const { sessionSecret, otpSecret, jwtSecret, isProduction } = require("../config/env");
const { sendOtpEmail } = require("../services/auth/brevoEmail");
const OTP_TTL = 300000,
  RESEND_COOLDOWN = 30000,
  SESSION_TTL = 28800000;
const generic = {
  ok: true,
  message:
    "If this email is authorized, verification instructions have been sent.",
};
const buckets = new Map();
const hash = (v) =>
  crypto.createHmac("sha256", sessionSecret).update(v).digest("hex");
const hashOtp = (v) =>
  crypto.createHmac("sha256", otpSecret).update(v).digest("hex");
const passwordHash = (value) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(value, salt, 64).toString("hex");
  return `scrypt$${salt}$${derived}`;
};
const passwordMatches = (value, stored) => {
  if (typeof stored !== "string") return false;
  if (stored.startsWith("scrypt$")) {
    const [, salt, expectedHex] = stored.split("$");
    if (!salt || !/^[a-f0-9]{128}$/i.test(expectedHex || "")) return false;
    const actual = crypto.scryptSync(value, salt, 64);
    const expected = Buffer.from(expectedHex, "hex");
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  }
  const expected = Buffer.from(stored, "hex");
  const actual = Buffer.from(crypto.scryptSync(value, jwtSecret, 64).toString("hex"));
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
};
const hashesMatch = (left, right) => {
  const actual = Buffer.from(left, "hex");
  const expected = Buffer.from(right, "hex");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
};
const cookie = (token) =>
  `kgs_admin_session=${token}; HttpOnly; Path=/; Max-Age=${SESSION_TTL / 1000}; SameSite=${isProduction ? "None; Secure; Partitioned" : "Lax"}; Priority=High`;
function limited(key, max, windowMs) {
  const now = Date.now();
  const item = buckets.get(key) || { count: 0, reset: now + windowMs };
  if (item.reset <= now) {
    item.count = 0;
    item.reset = now + windowMs;
  }
  item.count += 1;
  buckets.set(key, item);
  return item.count > max;
}
function clientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  return forwarded
    ? String(forwarded).split(",")[0].trim()
    : req.ip || "127.0.0.1";
}
async function login(req, res) {
  const email = String(req.body.email || "")
      .toLowerCase()
      .trim(),
    password = String(req.body.password || "");
  const ip = clientIp(req);
  if (
    limited(`admin-login-ip:${ip}`, 10, 900000) ||
    limited(`admin-login-email:${email}`, 5, 900000)
  )
    return res
      .status(429)
      .json({ error: "Too many login attempts. Please try again later." });
  const admin = await AdminUser.findOne({ email, active: true });
  if (!passwordMatches(password, admin?.passwordHash))
    return res.status(401).json({ error: "Invalid administrator credentials" });
  const raw = crypto.randomBytes(32).toString("hex");
  await Session.create({
    tokenHash: hash(raw),
    adminId: admin.id,
    expiresAt: new Date(Date.now() + SESSION_TTL),
  });
  res.append("Set-Cookie", cookie(raw));
  res.json({
    token: raw,
    user: { id: admin.id, email: admin.email, role: "ADMIN" },
  });
}
async function logout(req, res) {
  if (req.session) await Session.deleteOne({ _id: req.session.id });
  res.setHeader(
    "Set-Cookie",
    `kgs_admin_session=; HttpOnly; Path=/; Max-Age=0; SameSite=${isProduction ? "None; Secure; Partitioned" : "Lax"}; Priority=High`,
  );
  res.json({ ok: true });
}
async function requestOtp(req, res) {
  const email = String(req.body.email || "")
      .toLowerCase()
      .trim(),
    ip = clientIp(req);
  if (!email || !email.includes("@"))
    return res.status(400).json({ error: "Valid email is required" });
  if (
    limited(`admin-ip:${ip}`, 30, 900000) ||
    limited(`admin-email:${email}`, 15, 900000)
  )
    return res
      .status(429)
      .json({ error: "Too many requests. Please try again later." });
  const admin = await AdminUser.findOne({ email, active: true });
  if (!admin)
    return res
      .status(202)
      .json({
        ...generic,
        expiresAt: new Date(Date.now() + OTP_TTL),
        resendAvailableAt: new Date(Date.now() + RESEND_COOLDOWN),
      });
  const latest = await EmailVerification.findOne({
    adminId: admin.id,
    consumedAt: null,
  }).sort({ createdAt: -1 });
  if (
    latest &&
    latest.deliveryStatus !== "FAILED" &&
    latest.resendAvailableAt > new Date()
  )
    return res
      .status(202)
      .json({
        ...generic,
        expiresAt: latest.expiresAt,
        resendAvailableAt: latest.resendAvailableAt,
      });
  const otp = String(crypto.randomInt(100000, 1000000));
  const verification = await EmailVerification.create({
    adminId: admin.id,
    email,
    otpHash: hashOtp(otp),
    expiresAt: new Date(Date.now() + OTP_TTL),
    resendAvailableAt: new Date(Date.now() + RESEND_COOLDOWN),
  });
  try {
    const delivery = await sendOtpEmail({
      to: email,
      name: "KGS Administrator",
      otp,
      expiresAt: verification.expiresAt,
    });
    verification.providerMessageId = delivery.messageId;
    verification.deliveryStatus = delivery.status;
    await verification.save();
  } catch (error) {
    verification.deliveryStatus = "FAILED";
    verification.deliveryError = error?.providerResponse?.message || error.message;
    await verification.save();
    return res.status(503).json({
      ...generic,
      delivery: "FAILED",
    });
  }
  res.json({
    ...generic,
    expiresAt: verification.expiresAt,
    resendAvailableAt: verification.resendAvailableAt,
    delivery: "ACCEPTED",
  });
}
async function verifyOtp(req, res) {
  const email = String(req.body.email || "")
      .toLowerCase()
      .trim(),
    otp = String(req.body.otp || "");
  const verification = await EmailVerification.findOne({
    email,
    adminId: { $exists: true },
    consumedAt: null,
  }).sort({ createdAt: -1 });
  if (!verification || verification.expiresAt < new Date())
    return res
      .status(401)
      .json({
        error: "Your verification code has expired. Request a new code.",
      });
  if (verification.attemptCount >= 5)
    return res
      .status(429)
      .json({ error: "Too many attempts. Request a new code." });
  if (!/^\d{6}$/.test(otp) || !hashesMatch(verification.otpHash, hashOtp(otp))) {
    await EmailVerification.updateOne(
      { _id: verification.id },
      { $inc: { attemptCount: 1 } },
    );
    return res
      .status(401)
      .json({ error: "Invalid verification code. Please try again." });
  }
  const admin = await AdminUser.findOne({
    _id: verification.adminId,
    active: true,
  });
  if (!admin)
    return res
      .status(403)
      .json({ error: "Administrator account unavailable." });
  verification.consumedAt = new Date();
  await verification.save();
  const raw = crypto.randomBytes(32).toString("hex");
  await Session.create({
    tokenHash: hash(raw),
    adminId: admin.id,
    expiresAt: new Date(Date.now() + SESSION_TTL),
  });
  res.append("Set-Cookie", cookie(raw));
  res.json({
    token: raw,
    user: { id: admin.id, email: admin.email, role: "ADMIN" },
  });
}
module.exports = { login, requestOtp, verifyOtp, logout };
