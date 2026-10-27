const crypto = require("node:crypto");
const AdminUser = require("../../models/AdminUser");

function hashPassword(password) {
  return crypto
    .scryptSync(password, process.env.JWT_SECRET || "local-seed-salt", 64)
    .toString("hex");
}

async function ensureAdminAccount() {
  if (process.env.NODE_ENV === "production") return null;
  const email = String(process.env.ADMIN_EMAIL || process.env.DEMO_ADMIN_EMAIL || "")
    .toLowerCase()
    .trim();
  const password = process.env.ADMIN_PASSWORD || process.env.DEMO_ADMIN_PASSWORD || "";
  if (!email || !password) {
    console.warn("Development admin auto-seed skipped: ADMIN_EMAIL and ADMIN_PASSWORD are not configured.");
    return null;
  }
  const admin = await AdminUser.findOneAndUpdate(
    { email },
    { $set: { email, passwordHash: hashPassword(password), role: "ADMIN", active: true } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();
  console.log(`Development Admin ready: ${admin.email}`);
  return admin;
}

module.exports = { ensureAdminAccount };
