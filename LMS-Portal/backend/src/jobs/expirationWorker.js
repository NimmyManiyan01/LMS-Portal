const Attempt = require("../models/Attempt");
const { finalizeAttempt } = require("../services/finalizeAttempt");

async function processExpiredAttempts() {
  const expired = await Attempt.find({
    status: "IN_PROGRESS",
    expiresAt: { $lte: new Date() },
  })
    .select("_id studentId")
    .limit(100)
    .lean();
  for (const attempt of expired) {
    try {
      await finalizeAttempt({
        attemptId: attempt._id,
        studentId: attempt.studentId,
        reason: "TIMER_EXPIRY",
      });
    } catch (error) {
      console.error(
        `Expiration finalization failed for ${attempt._id}:`,
        error.message,
      );
    }
  }
  return expired.length;
}

function startExpirationWorker() {
  const run = () =>
    processExpiredAttempts().catch((error) =>
      console.error("Expiration worker failed:", error.message),
    );
  run();
  return setInterval(run, 60 * 1000);
}

module.exports = { processExpiredAttempts, startExpirationWorker };
