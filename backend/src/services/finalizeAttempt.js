const crypto = require("node:crypto");
const mongoose = require("mongoose");
const Attempt = require("../models/Attempt");
const Answer = require("../models/Answer");
const Question = require("../models/Question");
const FinalResult = require("../models/FinalResult");
const Exam = require("../models/Exam");

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
      const existing = await FinalResult.findOne({ attemptId }).session(
        session,
      );
      if (existing) {
        response = {
          receiptToken: existing.receiptToken,
          attemptId,
          score: existing.score,
          maxMarks: existing.maxMarks,
          status: "FINALIZED",
          finalizedAt: existing.finalizedAt,
        };
        return;
      }
      if (attempt.status !== "IN_PROGRESS")
        throw Object.assign(new Error("Attempt is already finalized"), {
          status: 409,
        });
      if (answers && typeof answers === "object") {
        for (const [questionId, selectedOptionId] of Object.entries(answers))
          await Answer.updateOne(
            { attemptId, questionId },
            {
              $set: { selectedOptionId, savedAt: new Date() },
              $setOnInsert: { attemptId, questionId, version: 1 },
            },
            { upsert: true, session },
          );
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
        if (!q || !answer?.selectedOptionId) {
          unansweredCount++;
          score += Number(scheme.unansweredMarks || 0);
        } else if (answer.selectedOptionId === q.correctOptionId) {
          correctCount++;
          score += Number(scheme.correctMarks ?? q.marks ?? 0);
        } else {
          incorrectCount++;
          const questionPenalty = Number(q.negativeMarks || 0);
          const schemePenalty = Number(scheme.incorrectMarks || 0);
          score += questionPenalty
            ? -Math.abs(questionPenalty)
            : schemePenalty > 0
              ? -schemePenalty
              : schemePenalty;
        }
      }
      if (scheme.floorNegativeScoreAtZero) score = Math.max(0, score);
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
            maximumMarks: exam?.totalMarks,
            score,
            maxMarks: exam?.totalMarks,
            correctCount,
            incorrectCount,
            unansweredCount,
            reason,
            reasonDetail,
            scoringVersion: Number(scheme.scoringVersion || 1),
            // Scores are calculated against the persisted answer key at finalization
            // and are available to the candidate immediately after submission.
            releaseStatus: "RELEASED",
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
        marksScored: score,
        maximumMarks: exam?.totalMarks,
        status: "FINALIZED",
        finalizedAt,
      };
    });
  } finally {
    await session.endSession();
  }
  return response;
}
module.exports = { finalizeAttempt };
