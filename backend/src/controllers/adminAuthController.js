const crypto = require("node:crypto");
const AdminUser = require("../models/AdminUser");
const Session = require("../models/Session");
const { sessionSecret } = require("../config/env");
const SESSION_TTL = 8 * 60 * 60 * 1000;
const hash = (value) =>
  crypto.createHmac("sha256", sessionSecret).update(value).digest("hex");
const passwordHash = (value) =>
  crypto
    .scryptSync(value, process.env.JWT_SECRET || "local-salt", 64)
    .toString("hex");
const cookie = (token) =>
  `kgs_admin_session=${token}; HttpOnly; Path=/; Max-Age=${SESSION_TTL / 1000}; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
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
  res.json({ user: { id: admin.id, email: admin.email, role: "ADMIN" } });
}
async function logout(req, res) {
  res.setHeader(
    "Set-Cookie",
    "kgs_admin_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax",
  );
  res.json({ ok: true });
}
module.exports = { login, logout };
