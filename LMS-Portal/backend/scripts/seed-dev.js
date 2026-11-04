const crypto = require("node:crypto");
const mongoose = require("mongoose");
const { mongoUri } = require("../src/config/env");
const AdminUser = require("../src/models/AdminUser");

if (process.env.NODE_ENV === "production") {
  console.error("Refusing to seed demo data in production.");
  process.exit(1);
}
const adminEmail = String(process.env.DEMO_ADMIN_EMAIL || "")
  .toLowerCase()
  .trim();
const password = process.env.DEMO_ADMIN_PASSWORD || "";
const hashPassword = (value) =>
  crypto
    .scryptSync(value, process.env.JWT_SECRET || "local-seed-salt", 64)
    .toString("hex");

async function seed() {
  if (!adminEmail || !password)
    throw new Error(
      "DEMO_ADMIN_EMAIL and DEMO_ADMIN_PASSWORD must be set in backend/.env",
    );
  await mongoose.connect(mongoUri);
  await AdminUser.findOneAndUpdate(
    { email: adminEmail },
    {
      email: adminEmail,
      passwordHash: hashPassword(password),
      role: "ADMIN",
      active: true,
    },
    { upsert: true, new: true },
  );
  console.log(`Development admin seed complete. Admin email: ${adminEmail}`);
  console.log("Development admin password was read from backend/.env.");
  await mongoose.disconnect();
}
seed().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
