const router = require("express").Router();
const Attempt = require("../models/Attempt");
const Exam = require("../models/Exam");
const IntegrityEvent = require("../models/IntegrityEvent");
const { authenticate } = require("../middleware/auth");
const { finalizeAttempt } = require("../services/finalizeAttempt");

router.post("/:attemptId/integrity-events", authenticate, async (req, res) => {
  const { eventId, eventType, clientTimestamp } = req.body;
  const attempt = await Attempt.findOne({
    _id: req.params.attemptId,
    studentId: req.student.id,
    status: "IN_PROGRESS",
  });
  if (!attempt)
    return res.status(404).json({ error: "Active attempt not found" });
  const exam = await Exam.findById(attempt.examId).select(
    "integrityProfile integrityRules",
  );
  if (!exam) return res.status(404).json({ error: "Exam not found" });
  const existing = await IntegrityEvent.findOne({
    attemptId: attempt.id,
    eventId,
  });
  if (existing)
    return res.json({
      duplicate: true,
      action: existing.action,
      count: existing.newCount,
    });
  const isCamera = eventType === "CAMERA_INTERRUPTED";
  const isTab = eventType === "TAB_HIDDEN" || eventType === "FULLSCREEN_EXIT";
  const isCopyPaste = eventType === "COPY" || eventType === "PASTE";
  if (isCamera) {
    const event = await IntegrityEvent.create({ eventId, studentId: req.student.id, attemptId: attempt.id, eventType, action: "RECORDED", clientTimestamp });
    return res.status(201).json({ recorded: true, eventId: event.eventId, confirmedCount: 0, action: "RECORDED" });
  }
  if (
    (isTab &&
      exam.integrityProfile === "BASIC" &&
      eventType === "FULLSCREEN_EXIT") ||
    (isCopyPaste && exam.integrityProfile === "STRICT" && false)
  )
    return res.json({ recorded: false, action: "RECORDED", count: 0 });
  const field = isCopyPaste
    ? "integrityCounts.copyPaste"
    : isTab
      ? "integrityCounts.tabSwitch"
      : null;
  if (!field)
    return res
      .status(400)
      .json({ error: "Unsupported integrity event for this examination" });
  const previous = Number(
    attempt.integrityCounts?.[isCopyPaste ? "copyPaste" : "tabSwitch"] || 0,
  );
  const threshold = isCopyPaste
    ? exam.integrityRules?.copyPasteThreshold || 3
    : exam.integrityRules?.tabSwitchThreshold || 2;
  const next = previous + 1;
  const action = next >= threshold ? "AUTO_SUBMIT" : "WARNING";
  const event = await IntegrityEvent.create({
    eventId,
    studentId: req.student.id,
    attemptId: attempt.id,
    eventType,
    previousCount: previous,
    newCount: next,
    threshold,
    action,
    clientTimestamp,
  });
  await Attempt.updateOne({ _id: attempt.id }, { $inc: { [field]: 1 } });
  if (action === "AUTO_SUBMIT")
    await finalizeAttempt({
      attemptId: attempt.id,
      studentId: req.student.id,
      reason: "INTEGRITY",
    });
  res
    .status(201)
    .json({
      recorded: true,
      eventId: event.eventId,
      confirmedCount: next,
      threshold,
      action,
    });
});

router.get("/:attemptId/integrity-status", authenticate, async (req, res) => {
  const attempt = await Attempt.findOne({
    _id: req.params.attemptId,
    studentId: req.student.id,
  }).select("status integrityCounts examId");
  if (!attempt) return res.status(404).json({ error: "Attempt not found" });
  const exam = await Exam.findById(attempt.examId).select(
    "integrityProfile integrityRules",
  );
  res.json({
    status: attempt.status,
    profile: exam?.integrityProfile,
    counts: attempt.integrityCounts,
    rules: exam?.integrityRules,
  });
});

module.exports = router;
