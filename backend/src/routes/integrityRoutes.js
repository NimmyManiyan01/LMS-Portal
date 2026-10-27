const router = require("express").Router();
const Attempt = require("../models/Attempt");
const Exam = require("../models/Exam");
const IntegrityEvent = require("../models/IntegrityEvent");
const { authenticate } = require("../middleware/auth");
const { finalizeAttempt } = require("../services/finalizeAttempt");

router.post("/:attemptId/integrity-events", authenticate, async (req, res) => {
  const { eventId, eventType, clientTimestamp } = req.body;
  if (!eventId || typeof eventId !== "string" || eventId.length > 160)
    return res.status(400).json({ error: "A valid event ID is required" });
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
      confirmedCount: existing.newCount,
      threshold: existing.threshold,
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
    : eventType === "FULLSCREEN_EXIT"
      ? "integrityCounts.fullscreenExit"
      : isTab
      ? "integrityCounts.tabSwitch"
      : null;
  if (!field)
    return res
      .status(400)
      .json({ error: "Unsupported integrity event for this examination" });
  const counterName = isCopyPaste ? "copyPaste" : eventType === "FULLSCREEN_EXIT" ? "fullscreenExit" : "tabSwitch";
  const threshold = isCopyPaste
    ? exam.integrityRules?.copyPasteThreshold || 3
    : eventType === "FULLSCREEN_EXIT"
      ? exam.integrityRules?.fullscreenExitThreshold || 2
    : exam.integrityRules?.tabSwitchThreshold || 2;
  let event;
  try {
    event = await IntegrityEvent.create({
      eventId,
      studentId: req.student.id,
      attemptId: attempt.id,
      eventType,
      action: "RECORDED",
      clientTimestamp,
    });
  } catch (error) {
    if (error?.code === 11000) {
      const duplicate = await IntegrityEvent.findOne({ attemptId: attempt.id, eventId });
      return res.json({ duplicate: true, action: duplicate?.action || "RECORDED", count: duplicate?.newCount || 0, confirmedCount: duplicate?.newCount || 0, threshold: duplicate?.threshold });
    }
    throw error;
  }
  const updatedAttempt = await Attempt.findOneAndUpdate(
    { _id: attempt.id, studentId: req.student.id, status: "IN_PROGRESS" },
    { $inc: { [field]: 1 } },
    { new: true },
  );
  if (!updatedAttempt) {
    await IntegrityEvent.deleteOne({ _id: event._id });
    return res.status(409).json({ error: "Attempt is no longer active" });
  }
  const next = Number(updatedAttempt.integrityCounts?.[counterName] || 0);
  const previous = next - 1;
  const action = next >= threshold ? "AUTO_SUBMIT" : "WARNING";
  event.previousCount = previous;
  event.newCount = next;
  event.threshold = threshold;
  event.action = action;
  await event.save();
  if (action === "AUTO_SUBMIT")
    await finalizeAttempt({
      attemptId: attempt.id,
      studentId: req.student.id,
      reason: "INTEGRITY",
      reasonDetail: eventType === "TAB_HIDDEN" ? "TAB_SWITCH_THRESHOLD" : eventType === "FULLSCREEN_EXIT" ? "FULLSCREEN_EXIT_THRESHOLD" : "INTEGRITY_THRESHOLD",
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
