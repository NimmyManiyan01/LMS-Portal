const mongoose = require("mongoose");
const path = require("node:path");

// Load backend .env if available
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const MONGO_URI =
  process.env.MONGODB_URI && !process.env.MONGODB_URI.includes("<username>")
    ? process.env.MONGODB_URI
    : "mongodb+srv://harshavardhandevang_db_user:WidTX3FijxB03ePR@cluster0.rtgs8it.mongodb.net/exam-portal";

const adminUserSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true, lowercase: true },
    passwordHash: String,
    role: { type: String, enum: ["ADMIN"], default: "ADMIN" },
    active: { type: Boolean, default: true },
  },
  { collection: "admin_users", timestamps: true }
);

const AdminUser = mongoose.model("AdminUser", adminUserSchema);

async function addAdmin(targetEmail) {
  if (!targetEmail || !/^[\w.!#$%&'*+/=?^`{|}~-]+@[\w-]+(?:\.[\w-]+)+$/.test(targetEmail)) {
    console.error("Please provide a valid email address.");
    process.exit(1);
  }

  const normalizedEmail = targetEmail.toLowerCase().trim();

  console.log(`Connecting to MongoDB...`);
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  console.log(`Connected to database: ${mongoose.connection.name}`);

  console.log("\n--- Current Administrators ---");
  const currentAdmins = await AdminUser.find({}).lean();
  console.log(`Found ${currentAdmins.length} administrator(s):`);
  for (const a of currentAdmins) {
    console.log(`  - [${a.active ? "ACTIVE" : "INACTIVE"}] ${a.email} (${a.role}) - ID: ${a._id}`);
  }

  console.log(`\nAdding/Activating admin: ${normalizedEmail}...`);
  const admin = await AdminUser.findOneAndUpdate(
    { email: normalizedEmail },
    {
      $set: {
        email: normalizedEmail,
        role: "ADMIN",
        active: true,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  console.log("\n--- Successfully Registered Admin ---");
  console.log(JSON.stringify(admin, null, 2));

  console.log("\n--- Updated Administrator List ---");
  const allAdmins = await AdminUser.find({}).lean();
  console.log(`Total: ${allAdmins.length} administrator(s):`);
  for (const a of allAdmins) {
    console.log(`  - [${a.active ? "ACTIVE" : "INACTIVE"}] ${a.email} (${a.role}) - ID: ${a._id}`);
  }

  await mongoose.disconnect();
  console.log("\nMongoDB disconnected. Done.");
}

const inputEmail = process.argv[2] || "vigneshrao370@gmail.com";
addAdmin(inputEmail).catch((err) => {
  console.error("Failed to add admin:", err);
  process.exit(1);
});
