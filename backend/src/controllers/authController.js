const crypto = require("node:crypto");
const Student = require("../models/Student");
const AdminUser = require("../models/AdminUser");
const Counter = require("../models/Counter");
const EmailVerification = require("../models/EmailVerification");
const Session = require("../models/Session");
const { otpSecret, sessionSecret } = require("../config/env");
const { sendOtpEmail } = require("../services/auth/brevoEmail");
const OTP_TTL = 5 * 60 * 1000;
const RESEND_COOLDOWN = 30 * 1000;
const SESSION_TTL = 8 * 60 * 60 * 1000;
const hashOtp = (value) =>
  crypto.createHmac("sha256", otpSecret).update(value).digest("hex");
const hashSession = (value) =>
  crypto.createHmac("sha256", sessionSecret).update(value).digest("hex");
const buckets = new Map();
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
const generic = {
  ok: true,
  message:
    "If this email can be used, verification instructions have been sent.",
};
const cookie = (token) =>
  `kgs_session=${token}; HttpOnly; Path=/; Max-Age=${SESSION_TTL / 1000}; SameSite=${process.env.NODE_ENV === "production" ? "None; Secure; Partitioned" : "Lax"}`;

async function registerStudent(req, res) {
  const {
    fullName,
    email,
    phone,
    college,
    branch,
    passOutYear,
    privacyAccepted,
    monitoringAccepted,
  } = req.body;
  const normalizedEmail = String(email || "")
    .toLowerCase()
    .trim();
  const year = Number(passOutYear);
  const current = new Date().getFullYear();
  if (
    !/^[\w.!#$%&'*+/=?^`{|}~-]+@[\w-]+(?:\.[\w-]+)+$/.test(normalizedEmail) ||
    (phone && !/^[6-9]\d{9}$/.test(String(phone))) ||
    String(fullName || "").trim().length < 2 ||
    String(fullName).trim().length > 100 ||
    (college &&
      (String(college).trim().length < 2 ||
        String(college).trim().length > 150)) ||
    (passOutYear &&
      (!Number.isInteger(year) ||
        year < current - 10 ||
        year > current + 10)) ||
    privacyAccepted !== true ||
    monitoringAccepted !== true
  )
    return res.status(400).json({
      error:
        "Please provide valid registration details and accept both policies",
    });
  try {
    const counter = await Counter.findOneAndUpdate(
      { _id: "studentId" },
      { $inc: { sequence: 1 } },
      { upsert: true, new: true },
    ).lean();
    const student = await Student.create({
      studentId: `KGS-STU-${String(counter.sequence).padStart(6, "0")}`,
      fullName: String(fullName).trim(),
      email: normalizedEmail,
      phone: String(phone || ""),
      college: String(college || "Independent registration").trim(),
      branch: String(branch || "Unspecified").trim(),
      passOutYear: passOutYear ? year : current,
      privacyAcceptedAt: new Date(),
      monitoringAcceptedAt: new Date(),
      acknowledgementVersion: "1.0",
    });
    return res.status(201).json({
      studentId: student.studentId,
      email: student.email,
      message: generic.message,
    });
  } catch (error) {
    if (error?.code === 11000) return res.status(202).json(generic);
    throw error;
  }
}

async function issueOtp(req, res) {
  const email = String(req.body.email || "")
    .toLowerCase()
    .trim();
  if (!email || !email.includes("@"))
    return res.status(400).json({ error: "Valid email is required" });
  const [administrator, student] = await Promise.all([
    AdminUser.findOne({ email, active: true }),
    Student.findOne({ email, accountStatus: "ACTIVE" }),
  ]);
  const account = administrator || student;
  if (!account)
    return res.status(202).json({
      ...generic,
      expiresAt: new Date(Date.now() + OTP_TTL),
      resendAvailableAt: new Date(Date.now() + RESEND_COOLDOWN),
    });
  const latest = await EmailVerification.findOne({
    ...(administrator
      ? { adminId: administrator.id }
      : { studentId: student.id }),
    consumedAt: null,
  }).sort({ createdAt: -1 });
  if (
    latest &&
    latest.deliveryStatus !== "FAILED" &&
    latest.resendAvailableAt > new Date()
  )
    return res.status(202).json({
      ...generic,
      expiresAt: latest.expiresAt,
      resendAvailableAt: latest.resendAvailableAt,
    });
  const otp = String(crypto.randomInt(100000, 1000000));
  const expiresAt = new Date(Date.now() + OTP_TTL);
  const verification = await EmailVerification.create({
    ...(administrator
      ? { adminId: administrator.id }
      : { studentId: student.id }),
    email,
    otpHash: hashOtp(otp),
    expiresAt,
    resendAvailableAt: new Date(Date.now() + RESEND_COOLDOWN),
  });
  try {
    const delivery = await sendOtpEmail({
      to: email,
      name: administrator ? "KGS Administrator" : student.fullName,
      otp,
      expiresAt,
    });
    verification.providerMessageId = delivery.messageId;
    verification.deliveryStatus = delivery.status;
    await verification.save();
  } catch (error) {
    verification.deliveryStatus = "FAILED";
    verification.deliveryError = error.message;
    await verification.save();
    return res.status(503).json({ ...generic, delivery: "FAILED" });
  }
  return res.json({
    ...generic,
    expiresAt,
    resendAvailableAt: verification.resendAvailableAt,
    delivery: "ACCEPTED",
  });
}
function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return String(forwarded).split(",")[0].trim();
  return req.ip || "127.0.0.1";
}

async function requestOtp(req, res) {
  const ip = getClientIp(req);
  const email = String(req.body.email || "")
    .toLowerCase()
    .trim();
  if (limited(`ip:${ip}`, 50, 900000) || limited(`email:${email}`, 25, 900000))
    return res
      .status(429)
      .json({ error: "Too many requests. Please try again later." });
  return issueOtp(req, res);
}
async function resendOtp(req, res) {
  const ip = getClientIp(req);
  if (limited(`resend:${ip}`, 25, 900000))
    return res
      .status(429)
      .json({ error: "Too many requests. Please try again later." });
  return issueOtp(req, res);
}
async function verifyOtp(req, res) {
  const email = String(req.body.email || "")
    .toLowerCase()
    .trim();
  const submittedOtp = String(req.body.otp || "");
  const verification = await EmailVerification.findOne({
    email,
    consumedAt: null,
  }).sort({ createdAt: -1 });
  if (!verification || verification.expiresAt < new Date())
    return res.status(401).json({
      error: "Your verification code has expired. Request a new code.",
    });
  if (verification.attemptCount >= 5)
    return res
      .status(429)
      .json({ error: "Too many attempts. Please try again later." });
  if (
    !/^\d{6}$/.test(submittedOtp) ||
    verification.otpHash !== hashOtp(submittedOtp)
  ) {
    await EmailVerification.updateOne(
      { _id: verification.id },
      { $inc: { attemptCount: 1 } },
    );
    return res
      .status(401)
      .json({ error: "Invalid verification code. Please try again." });
  }
  if (verification.adminId) {
    const administrator = await AdminUser.findOne({
      _id: verification.adminId,
      active: true,
    });
    if (!administrator)
      return res.status(403).json({ error: "Administrator account unavailable" });
    verification.consumedAt = new Date();
    await verification.save();
    const raw = crypto.randomBytes(32).toString("hex");
    await Session.create({
      tokenHash: hashSession(raw),
      adminId: administrator.id,
      expiresAt: new Date(Date.now() + SESSION_TTL),
    });
    res.setHeader("Set-Cookie", cookie(raw));
    return res.json({
      token: raw,
      user: {
        id: administrator.id,
        email: administrator.email,
        role: "ADMIN",
      },
    });
  }

  const student = await Student.findById(verification.studentId);
  if (!student || student.accountStatus !== "ACTIVE")
    return res.status(403).json({ error: "Account unavailable" });
  verification.consumedAt = new Date();
  await verification.save();
  student.emailVerified = true;
  await student.save();
  const raw = crypto.randomBytes(32).toString("hex");
  await Session.create({
    tokenHash: hashSession(raw),
    studentId: student.id,
    expiresAt: new Date(Date.now() + SESSION_TTL),
  });
  res.setHeader("Set-Cookie", cookie(raw));
  res.json({
    token: raw,
    user: {
      id: student.id,
      email: student.email,
      fullName: student.fullName,
      registrationId: student.studentId,
      profileVerified: Boolean(student.emailVerified),
      accountStatus: student.accountStatus,
      role: "STUDENT",
    },
  });
}
async function logout(req, res) {
  if (req.session) await Session.deleteOne({ _id: req.session.id });
  res.setHeader(
    "Set-Cookie",
    `kgs_session=; HttpOnly; Path=/; Max-Age=0; SameSite=${process.env.NODE_ENV === "production" ? "None; Secure; Partitioned" : "Lax"}`,
  );
  res.json({ ok: true });
}
async function me(req, res) {
  if (req.auth.role === "ADMIN")
    return res.json({
      user: {
        id: req.admin.id,
        email: req.admin.email,
        role: "ADMIN",
      },
    });
  res.json({
    user: {
      id: req.student.id,
      email: req.student.email,
      fullName: req.student.fullName,
      registrationId: req.student.studentId,
      profileVerified: Boolean(req.student.emailVerified),
      accountStatus: req.student.accountStatus,
      role: "STUDENT",
    },
  });
}
module.exports = {
  registerStudent,
  requestOtp,
  resendOtp,
  verifyOtp,
  logout,
  me,
};
