/**
 * Database index verification and migration script.
 * Ensures all production indexes exist without relying on Mongoose autoIndex.
 */
const mongoose = require("mongoose");
const path = require("node:path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const { mongoUri } = require("../src/config/env");

async function ensureAllIndexes() {
  console.log("Connecting to MongoDB to verify and create production indexes...");
  await mongoose.connect(mongoUri, { maxPoolSize: 5 });

  const Session = require("../src/models/Session");
  const Answer = require("../src/models/Answer");
  const Attempt = require("../src/models/Attempt");
  const Student = require("../src/models/Student");
  const AdminUser = require("../src/models/AdminUser");
  const EmailVerification = require("../src/models/EmailVerification");
  const IntegrityEvent = require("../src/models/IntegrityEvent");
  const Question = require("../src/models/Question");
  const Exam = require("../src/models/Exam");

  const models = [
    { model: Session, name: "Session" },
    { model: Answer, name: "Answer" },
    { model: Attempt, name: "Attempt" },
    { model: Student, name: "Student" },
    { model: AdminUser, name: "AdminUser" },
    { model: EmailVerification, name: "EmailVerification" },
    { model: IntegrityEvent, name: "IntegrityEvent" },
    { model: Question, name: "Question" },
    { model: Exam, name: "Exam" },
  ];

  for (const { model, name } of models) {
    try {
      await model.createIndexes();
      console.log(`[Index OK] Indexes ensured for model: ${name}`);
    } catch (err) {
      console.error(`[Index Warning] Failed ensuring indexes for ${name}:`, err.message);
    }
  }

  await mongoose.disconnect();
  console.log("Index synchronization complete.");
}

if (require.main === module) {
  ensureAllIndexes()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Index synchronization failed:", err);
      process.exit(1);
    });
}

module.exports = { ensureAllIndexes };
