/* Controlled development/QA migration for legacy question content.
 * Dry-run by default. Writes require --approve and NODE_ENV=development|qa.
 * The supplied question bank must contain the existing question IDs; IDs are never replaced.
 */
const fs = require("node:fs");
const path = require("node:path");
const mongoose = require("mongoose");
const { mongoUri } = require("../src/config/env");
const Exam = require("../src/models/Exam");
const Attempt = require("../src/models/Attempt");

const args = new Set(process.argv.slice(2));
const bankArg = process.argv.find((value) =>
  value.startsWith("--question-bank="),
);
const bankPath = bankArg
  ? path.resolve(bankArg.split("=").slice(1).join("="))
  : null;
const approved = args.has("--approve");
const environment = process.env.NODE_ENV;

function fail(message) {
  console.error(`MIGRATION_REFUSED: ${message}`);
  process.exitCode = 1;
}
function validOption(option) {
  return (
    option &&
    typeof option.id === "string" &&
    typeof option.text === "string" &&
    option.text.trim()
  );
}
function validateReplacement(question) {
  const errors = [];
  if (!question.questionText?.trim()) errors.push("missing questionText");
  if (
    !Array.isArray(question.options) ||
    question.options.length < 2 ||
    question.options.some((option) => !validOption(option))
  )
    errors.push("invalid options");
  if (!question.sectionName?.trim()) errors.push("missing sectionName");
  if (
    !Number.isFinite(Number(question.marks)) ||
    !Number.isFinite(Number(question.negativeMarks))
  )
    errors.push("invalid marking values");
  if (
    !question.correctOptionId ||
    !question.options?.some((option) => option.id === question.correctOptionId)
  )
    errors.push("correct answer is not one of the options");
  return errors;
}

async function main() {
  if (!["development", "qa", "test"].includes(environment))
    return fail(
      `NODE_ENV=${environment || "(unset)"} is not an isolated development/QA environment`,
    );
  if (!bankPath) return fail("provide --question-bank=<approved JSON file>");
  if (!fs.existsSync(bankPath))
    return fail(`question bank not found: ${bankPath}`);
  if (approved && !args.has("--confirm-kgs-exam-001"))
    return fail("approval requires --confirm-kgs-exam-001");
  const bank = JSON.parse(fs.readFileSync(bankPath, "utf8"));
  if (!Array.isArray(bank)) return fail("question bank must be a JSON array");

  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 8000 });
  const db = mongoose.connection.db;
  const exam = await Exam.findOne({ code: "KGS-EXAM-001" }).lean();
  if (!exam) return fail("KGS-EXAM-001 was not found");
  const attempts = await Attempt.find({
    examId: exam._id,
    status: "IN_PROGRESS",
  })
    .select("_id studentId assignedQuestionIds expiresAt startedAt answers")
    .lean();
  const ids = [
    ...new Set(
      attempts.flatMap((attempt) =>
        (attempt.assignedQuestionIds || []).map(String),
      ),
    ),
  ];
  const records = await db
    .collection("questions")
    .find({ _id: { $in: ids.map((id) => new mongoose.Types.ObjectId(id)) } })
    .toArray();
  const byId = new Map(records.map((record) => [String(record._id), record]));
  const bankById = new Map(
    bank.map((question) => [String(question._id || question.id), question]),
  );
  const proposed = ids.map((id) => {
    const current = byId.get(id);
    const replacement = bankById.get(id);
    const missing =
      !current?.questionText ||
      !Array.isArray(current.options) ||
      current.options.length === 0 ||
      !current.sectionName;
    return {
      questionId: id,
      present: Boolean(current),
      missingContent: missing,
      replacementProvided: Boolean(replacement),
      validationErrors: replacement ? validateReplacement(replacement) : [],
      current: current
        ? {
            questionText: current.questionText || null,
            options: current.options || [],
            sectionName: current.sectionName || null,
            marks: current.marks,
            negativeMarks: current.negativeMarks,
          }
        : null,
    };
  });
  const report = {
    environment,
    exam: {
      id: String(exam._id),
      code: exam.code,
      totalQuestions: exam.totalQuestions,
      totalMarks: exam.totalMarks,
      markingScheme: exam.markingScheme,
    },
    activeAttempts: attempts.map((attempt) => ({
      attemptId: String(attempt._id),
      studentId: String(attempt.studentId),
      startedAt: attempt.startedAt,
      expiresAt: attempt.expiresAt,
      questionIds: attempt.assignedQuestionIds.map(String),
    })),
    affectedQuestions: proposed,
    writePlanned: approved,
  };
  console.log(JSON.stringify(report, null, 2));
  if (approved) {
    const backupPath = path.resolve(
      `backup-${exam.code}-${new Date().toISOString().replaceAll(":", "-")}.json`,
    );
    fs.writeFileSync(
      backupPath,
      JSON.stringify({ exam, attempts, questions: records }, null, 2),
    );
    for (const item of proposed) {
      const replacement = bankById.get(item.questionId);
      if (!replacement || item.validationErrors.length || !item.missingContent)
        continue;
      await db.collection("questions").updateOne(
        { _id: new mongoose.Types.ObjectId(item.questionId) },
        {
          $set: {
            questionText: replacement.questionText,
            options: replacement.options,
            sectionId: replacement.sectionId,
            sectionName: replacement.sectionName,
            questionNumber: replacement.questionNumber,
            marks: replacement.marks,
            negativeMarks: replacement.negativeMarks,
          },
        },
      );
    }
    console.log(`BACKUP_WRITTEN=${backupPath}`);
  }
  await mongoose.disconnect();
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
