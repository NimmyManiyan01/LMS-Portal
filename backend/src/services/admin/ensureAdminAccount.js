const crypto = require("node:crypto");
const AdminUser = require("../../models/AdminUser");

function hashPassword(password) {
  return crypto
    .scryptSync(password, process.env.JWT_SECRET || "local-seed-salt", 64)
    .toString("hex");
}

async function ensureAdminAccount() {
  const emails = String(
    process.env.ADMIN_EMAILS ||
      process.env.ADMIN_EMAIL ||
      process.env.DEMO_ADMIN_EMAILS ||
      process.env.DEMO_ADMIN_EMAIL ||
      "",
  )
    .split(",")
    .map((value) => value.toLowerCase().trim())
    .filter(Boolean);
  const password = process.env.ADMIN_PASSWORD || process.env.DEMO_ADMIN_PASSWORD || "";
  if (!emails.length || !password) {
    console.warn("Development admin auto-seed skipped: ADMIN_EMAIL and ADMIN_PASSWORD are not configured.");
    return null;
  }
  const admins = [];
  for (const email of emails) {
    const admin = await AdminUser.findOneAndUpdate(
      { email },
      { $set: { email, passwordHash: hashPassword(password), role: "ADMIN", active: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();
    admins.push(admin);
  }
  console.log(`Seeded Admins ready: ${admins.map((admin) => admin.email).join(", ")}`);
  return admins;
}

module.exports = { ensureAdminAccount };
