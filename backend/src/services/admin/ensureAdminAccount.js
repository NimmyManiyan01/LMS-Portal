const crypto = require("node:crypto");
const AdminUser = require("../../models/AdminUser");
const { jwtSecret, isProduction } = require("../../config/env");

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  return `scrypt$${salt}$${crypto.scryptSync(password, salt, 64).toString("hex")}`;
}

async function ensureAdminAccount() {
  if (isProduction) return null;
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
  const password =
    process.env.ADMIN_PASSWORD || process.env.DEMO_ADMIN_PASSWORD || "";
  if (!emails.length) {
    console.warn(
      "Admin auto-seed skipped: neither ADMIN_EMAILS nor DEMO_ADMIN_EMAILS are configured.",
    );
    return null;
  }
  const admins = [];
  for (const email of emails) {
    const updateFields = {
      email,
      role: "ADMIN",
      active: true,
    };
    if (password) {
      updateFields.passwordHash = hashPassword(password);
    }
    const admin = await AdminUser.findOneAndUpdate(
      { email },
      {
        $set: updateFields,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();
    admins.push(admin);
  }
  console.log(
    `Seeded Admins ready: ${admins.map((admin) => admin.email).join(", ")}`,
  );
  return admins;
}

module.exports = { ensureAdminAccount };
