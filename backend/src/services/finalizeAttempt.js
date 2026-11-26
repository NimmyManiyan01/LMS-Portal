const crypto = require("node:crypto");
const mongoose = require("mongoose");
const Attempt = require("../models/Attempt");
const Answer = require("../models/Answer");
const Question = require("../models/Question");
const FinalResult = require("../models/FinalResult");
const Exam = require("../models/Exam");
const PaperSet = require("../models/PaperSet");

async function finalizeAttempt({
  attemptId,
  studentId,
  reason = "MANUAL",
  reasonDetail,
  answers,
}) {
  const session = await mongoose.startSession();
  let response;
  try {
    await session.withTransaction(async () => {
      const attempt = await Attempt.findOne({
        _id: attemptId,
        ...(studentId ? { studentId } : {}),
      }).session(session);
      if (!attempt)
        throw Object.assign(new Error("Attempt not found"), { status: 404 });
      const deadline = attempt.expiresAt ? new Date(attempt.expiresAt).getTime() : NaN;
      const expired = Number.isFinite(deadline) && deadline <= Date.now();
      if (reason === "MANUAL" && (!Number.isFinite(deadline) || expired)) {
        throw Object.assign(new Error("The examination deadline has passed or is unavailable."), { status: 409 });
      }
      const existing = await FinalResult.findOne({ attemptId }).session(
        session,
      );
      if (existing) {
        response = {
          receiptToken: existing.receiptToken,
          attemptId,
          score: existing.score ?? existing.marksScored,
          marksScored: existing.marksScored ?? existing.score,
          maxMarks: existing.maxMarks ?? existing.maximumMarks,
          maximumMarks: existing.maximumMarks ?? existing.maxMarks,
          correctCount: existing.correctCount,
          incorrectCount: existing.incorrectCount,
          unansweredCount: existing.unansweredCount,
          status: "FINALIZED",
          finalizedAt: existing.finalizedAt,
        };
        return;
      }
      const timerGraceExpired = Number.isFinite(deadline) && deadline <= (Date.now() + 5000);
      if (reason === "TIMER_EXPIRY" && !timerGraceExpired) {
        throw Object.assign(new Error("The examination deadline has not passed."), { status: 409 });
      }
      const legacyTimeout = reason === "TIMER_EXPIRY" &&
        attempt.status === "AUTO_SUBMITTED" && !attempt.submissionReason;
      if (attempt.status !== "IN_PROGRESS" && !legacyTimeout)
        throw Object.assign(new Error("Attempt is already finalized"), {
          status: 409,
        });
      if (answers && typeof answers === "object") {
        const entries = Array.isArray(answers)
          ? answers.map((a) => [
              a.questionId || a.id || a._id,
              typeof a.selectedOptionId !== "undefined"
                ? a.selectedOptionId
                : typeof a === "string"
                  ? a
                  : a.value,
            ])
          : Object.entries(answers).map(([qId, val]) => [
              qId,
              typeof val === "object" && val !== null
                ? val.selectedOptionId
                : val,
            ]);

        const validOps = entries
          .filter(([questionId]) => questionId && mongoose.isValidObjectId(questionId))
          .map(([questionId, selectedOptionId]) => ({
            updateOne: {
              filter: { attemptId, questionId },
              update: {
                $set: { selectedOptionId: selectedOptionId || null, savedAt: new Date() },
                $setOnInsert: { attemptId, questionId, version: 1 },
              },
              upsert: true,
            },
          }));

        if (validOps.length > 0) {
          await Answer.bulkWrite(validOps, { session });
        }
      }
      const saved = await Answer.find({ attemptId }).session(session).lean();
      const questions = await Question.find({
        _id: { $in: attempt.assignedQuestionIds },
      })
        .session(session)
        .lean();
      const byId = new Map(questions.map((q) => [String(q._id), q]));
      const exam = await Exam.findById(attempt.examId).session(session).lean();
      const scheme = exam?.markingScheme || {};
      let score = 0;
      let correctCount = 0;
      let incorrectCount = 0;
      let unansweredCount = 0;
      for (const questionId of attempt.assignedQuestionIds) {
        const answer = saved.find(
          (item) => String(item.questionId) === String(questionId),
        );
        const q = byId.get(String(questionId));
        if (!q) continue;
        const grade = gradeQuestion(q, answer, scheme);
        score += grade.score;
        if (grade.status === "correct") correctCount++;
        else if (grade.status === "incorrect") incorrectCount++;
        else unansweredCount++;
      }
      if (scheme.floorNegativeScoreAtZero) score = Math.max(0, score);
      let maximumMarks = exam?.totalMarks;
      if (maximumMarks == null && attempt.paperSetId) {
        const paper = await PaperSet.findOne({
          _id: attempt.paperSetId,
          examId: attempt.examId,
        }).select("totalMarks blueprint.maximumMarks").session(session).lean();
        maximumMarks = paper?.totalMarks ?? paper?.blueprint?.maximumMarks;
      }
      if (maximumMarks != null) {
        score = Math.min(score, Number(maximumMarks));
      }
      const finalizedAt = new Date();
      const receiptToken = `SUB-${crypto.randomBytes(10).toString("hex").toUpperCase()}`;
      attempt.status =
        reason === "MANUAL" || reason === "ADMINISTRATIVE"
          ? "SUBMITTED"
          : "AUTO_SUBMITTED";
      attempt.submittedAt = finalizedAt;
      attempt.submissionReason = reasonDetail || reason;
      attempt.score = score;
      await attempt.save({ session });
      const result = await FinalResult.create(
        [
          {
            attemptId,
            examId: attempt.examId,
            studentId: attempt.studentId,
            assignedSetId: attempt.paperSetId,
            marksScored: score,
            maximumMarks,
            score,
            maxMarks: maximumMarks,
            correctCount,
            incorrectCount,
            unansweredCount,
            reason,
            reasonDetail,
            scoringVersion: Number(scheme.scoringVersion || 1),
            // Scores are calculated against the persisted answer key at finalization
            // and require administrator publication to be released to candidates.
            releaseStatus: "PENDING",
            submittedAt: finalizedAt,
            receiptToken,
            finalizedAt,
          },
        ],
        { session },
      );
      response = {
        receiptToken: result[0].receiptToken,
        attemptId,
        score,
        marksScored: score,
        maxMarks: maximumMarks,
        maximumMarks,
        correctCount,
        incorrectCount,
        unansweredCount,
        status: "FINALIZED",
        finalizedAt,
      };
    });
  } finally {
    await session.endSession();
  }
  return response;
}
function gradeQuestion(question, answer, scheme) {
  if (question.questionType === "CODING") {
    if (!(answer?.totalTestCases > 0)) return { status: "unanswered", score: 0 };
    const score = Number(answer.score || 0);
    return { status: score > 0 ? "correct" : "incorrect", score };
  }
  if (!answer?.selectedOptionId) {
    return { status: "unanswered", score: Number(scheme.unansweredMarks || 0) };
  }
  if (answer.selectedOptionId === question.correctOptionId) {
    return { status: "correct", score: Number(scheme.correctMarks ?? question.marks ?? 0) };
  }
  const questionPenalty = Number(question.negativeMarks || 0);
  const schemePenalty = Number(scheme.incorrectMarks || 0);
  return { status: "incorrect", score: -Math.abs(questionPenalty || schemePenalty) || 0 };
}

module.exports = { finalizeAttempt, gradeQuestion };
