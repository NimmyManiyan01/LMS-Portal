const router = require("express").Router();
const crypto = require("node:crypto");
const mongoose = require("mongoose");
const Exam = require("../models/Exam");
const Attempt = require("../models/Attempt");
const PaperSet = require("../models/PaperSet");
const PaperAllocation = require("../models/PaperAllocation");
const Answer = require("../models/Answer");
const FinalResult = require("../models/FinalResult");
const Question = require("../models/Question");
const { finalizeAttempt } = require("../services/finalizeAttempt");
const { authenticate, requirePermission } = require("../middleware/auth");

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

function eligible(exam, student) {
  const rules = exam.eligibility || {};
  return (
    student.accountStatus === "ACTIVE" &&
    (!rules.studentIds?.length ||
      rules.studentIds.some((id) => {
        const sId = String(id);
        return (
          sId === String(student._id) ||
          sId === String(student.id) ||
          sId === String(student.studentId)
        );
      })) &&
    (!rules.colleges?.length || rules.colleges.includes(student.college)) &&
    (!rules.branches?.length || rules.branches.includes(student.branch)) &&
    (!rules.passOutYears?.length ||
      rules.passOutYears.includes(student.passOutYear))
  );
}

router.get(
  "/",
  authenticate,
  asyncHandler(async (_req, res) =>
    res.json(
      await Exam.find({ status: { $in: ["PUBLISHED", "LIVE"] } }).select("-__v"),
    ),
  ),
);

router.get(
  "/:id/instructions",
  authenticate,
  asyncHandler(async (req, res) => {
    const exam = await Exam.findById(req.params.id)
      .select(
        "code title durationMinutes totalQuestions totalMarks maxAttempts negativeMarking instructions readinessRequirements integrityProfile integrityRules",
      )
      .lean();
    if (!exam || !eligible(exam, req.student))
      return res.status(404).json({ error: "Exam not found" });
    res.json({
      examId: exam.code || exam._id,
      examName: exam.title,
      durationMinutes: exam.durationMinutes,
      totalQuestions: exam.totalQuestions,
      maximumMarks: exam.totalMarks,
      maximumAttempts: exam.maxAttempts,
      negativeMarking: exam.negativeMarking || 0,
      instructions: exam.instructions || [],
      readinessRequirements: exam.readinessRequirements || {},
      monitoring: { profile: exam.integrityProfile, rules: exam.integrityRules },
    });
  }),
);

router.post(
  "/:id/start",
  authenticate,
  asyncHandler(async (req, res) => {
    const exam = await Exam.findById(req.params.id).lean();
    if (!exam || !eligible(exam, req.student))
      return res
        .status(403)
        .json({ error: "You are not eligible for this examination" });
    if (
      exam.status === "CLOSED" ||
      (exam.closesAt && new Date(exam.closesAt) <= new Date())
    )
      return res.status(409).json({ error: "This examination is closed" });
    if (exam.scheduledAt && new Date(exam.scheduledAt) > new Date())
      return res.status(409).json({
        error: `Your examination is scheduled for ${new Date(exam.scheduledAt).toISOString()}. You can enter the examination when the permitted access window opens.`,
        scheduledAt: exam.scheduledAt,
      });

    let active = await Attempt.findOne({
      examId: exam._id,
      studentId: req.student.id,
      status: "IN_PROGRESS",
    }).lean();

    if (active && new Date(active.expiresAt) <= new Date()) {
      await Attempt.updateOne(
        { _id: active._id },
        { $set: { status: "AUTO_SUBMITTED", submittedAt: new Date() } },
      );
      active = null;
    }

    if (active)
      return res.json({
        attemptId: String(active._id),
        examName: exam.title,
        status: active.status,
        startedAt: active.startedAt,
        deadline: active.expiresAt,
        serverTime: new Date(),
        durationSeconds: Math.max(
          0,
          Math.ceil((new Date(active.expiresAt) - Date.now()) / 1000),
        ),
      });

    const attemptCount = await Attempt.countDocuments({
      examId: exam._id,
      studentId: req.student.id,
    });
    if (attemptCount >= (exam.maxAttempts || 1))
      return res.status(409).json({ error: "Maximum attempts reached" });

    const sets = await PaperSet.find({
      examId: exam._id,
      status: "PUBLISHED",
      active: { $ne: false },
    }).lean();
    if (!sets.length)
      return res
        .status(503)
        .json({ error: "Question paper is not available yet" });

    const isMcqType = (t) =>
      !t ||
      ["MCQ", "SINGLE_ANSWER_MCQ", "MCQ_SINGLE", "MULTIPLE_CHOICE", "OBJECTIVE"].includes(
        String(t).toUpperCase(),
      );

    const setChecks = await Promise.all(
      sets.map(async (set) => {
        const qIds = (set.questionIds || []).map(String);
        const questions = await Question.find({ _id: { $in: qIds } })
          .select("_id marks questionType sectionName status")
          .lean();

        const qCount = questions.length > 0 ? questions.length : qIds.length;
        const questionMarks = questions.reduce(
          (sum, q) => sum + Number(q.marks ?? 1),
          0,
        );
        const setMarks = Number(
          set.totalMarks ?? set.blueprint?.maximumMarks ?? questionMarks ?? 0,
        );

        const questionTypesMatch =
          !exam.examinationType ||
          isMcqType(exam.examinationType) ||
          questions.every(
            (q) => String(q.questionType || "MCQ").toUpperCase() === String(exam.examinationType).toUpperCase(),
          );

        const countMatches = !exam.totalQuestions || qCount === exam.totalQuestions;
        const marksMatches = !exam.totalMarks || setMarks === exam.totalMarks || questionMarks === exam.totalMarks;

        return {
          set,
          valid: qCount > 0 && countMatches && marksMatches && questionTypesMatch,
        };
      }),
    );

    const validSets = setChecks.filter((check) => check.valid).map((check) => check.set);
    if (!validSets.length)
      return res
        .status(409)
        .json({
          error: "Question paper sets do not match the examination blueprint",
        });

    const paperSet = validSets.sort(
      (a, b) => a.allocationCount - b.allocationCount || crypto.randomInt(-1, 2),
    )[0];

    const startedAt = new Date();
    const expiresAt = new Date(
      startedAt.getTime() + (exam.durationMinutes || 60) * 60 * 1000,
    );
    let attempt;
    const studentId = req.student._id || req.student.id;

    try {
      const lockedSet = await PaperSet.findOneAndUpdate(
        { _id: paperSet._id, status: "PUBLISHED", active: { $ne: false } },
        { $inc: { allocationCount: 1 } },
        { new: true },
      );
      const orderSeed = crypto.randomBytes(24).toString("hex");
      await PaperAllocation.create({
        studentId,
        examId: exam._id,
        assignedSetId: lockedSet._id,
        orderSeed,
        attemptNumber: attemptCount + 1,
      }).catch(() => null);

      attempt = await Attempt.create({
        examId: exam._id,
        studentId,
        paperSetId: lockedSet._id,
        assignedQuestionIds: lockedSet.questionIds,
        orderSeed,
        attemptNumber: attemptCount + 1,
        startedAt,
        expiresAt,
      });
    } catch (error) {
      if (error?.code === 11000) {
        attempt = await Attempt.findOne({
          examId: exam._id,
          studentId,
          status: "IN_PROGRESS",
        });
      } else {
        console.error("Error starting exam attempt:", error);
        return res
          .status(500)
          .json({ error: "Unable to start examination attempt. Please try again." });
      }
    }

    if (!attempt) {
      return res.status(500).json({ error: "Unable to start examination attempt." });
    }

    res
      .status(201)
      .json({
        attemptId: String(attempt._id),
        examName: exam.title,
        status: attempt.status,
        startedAt: attempt.startedAt,
        deadline: attempt.expiresAt,
        serverTime: new Date(),
        durationSeconds: (exam.durationMinutes || 60) * 60,
      });
  }),
);

router.get(
  "/attempts/:attemptId",
  authenticate,
  asyncHandler(async (req, res) => {
    const attempt = await Attempt.findOne({
      _id: req.params.attemptId,
      studentId: req.student.id,
    })
      .select("-__v -paperSetId")
      .lean();
    if (!attempt) return res.status(404).json({ error: "Attempt not found" });
    const expired =
      attempt.status === "IN_PROGRESS" &&
      new Date(attempt.expiresAt) <= new Date();
    if (expired) {
      await Attempt.updateOne(
        { _id: attempt._id },
        { $set: { status: "AUTO_SUBMITTED", submittedAt: new Date() } },
      );
      attempt.status = "AUTO_SUBMITTED";
    }
    res.json({
      attemptId: attempt.id,
      status: attempt.status,
      startedAt: attempt.startedAt,
      deadline: attempt.expiresAt,
      serverTime: new Date(),
      answers: Object.fromEntries(attempt.answers || []),
      questionIds: attempt.assignedQuestionIds || [],
      tabSwitchCount: attempt.tabSwitchCount,
    });
  }),
);

router.patch(
  "/attempts/:attemptId/answers",
  authenticate,
  asyncHandler(async (req, res) => {
    const attempt = await Attempt.findOne({
      _id: req.params.attemptId,
      studentId: req.student.id,
      status: "IN_PROGRESS",
    });
    if (!attempt)
      return res.status(404).json({ error: "Active attempt not found" });
    if (new Date(attempt.expiresAt) <= new Date()) {
      attempt.status = "AUTO_SUBMITTED";
      attempt.submittedAt = new Date();
      await attempt.save();
      return res
        .status(409)
        .json({ error: "The examination deadline has passed" });
    }
    const answer = req.body.answer;
    if (
      !answer?.questionId ||
      (answer.selectedOptionId !== undefined &&
        typeof answer.selectedOptionId !== "string")
    )
      return res.status(400).json({ error: "Invalid answer payload" });
    attempt.answers.set(String(answer.questionId), {
      selectedOptionId: answer.selectedOptionId,
      isMarkedForReview: Boolean(answer.isMarkedForReview),
      visited: Boolean(answer.visited),
      timeSpentSeconds: Number(answer.timeSpentSeconds || 0),
    });
    if (req.body.tabSwitchCount !== undefined)
      attempt.tabSwitchCount = Math.max(
        attempt.tabSwitchCount,
        Number(req.body.tabSwitchCount),
      );
    await attempt.save();
    res.json({ saved: true, savedAt: new Date(), serverTime: new Date() });
  }),
);

router.put(
  "/attempts/:attemptId/answers/:questionId",
  authenticate,
  asyncHandler(async (req, res) => {
    const attempt = await Attempt.findOne({
      _id: req.params.attemptId,
      studentId: req.student.id,
      status: "IN_PROGRESS",
    }).lean();
    if (!attempt)
      return res.status(404).json({ error: "Active attempt not found" });
    if (new Date(attempt.expiresAt) <= new Date())
      return res
        .status(409)
        .json({ error: "The examination deadline has passed" });
    if (
      !attempt.assignedQuestionIds.some(
        (id) => String(id) === String(req.params.questionId),
      )
    )
      return res
        .status(400)
        .json({ error: "Question is not part of this attempt" });
    const requestedVersion = Number(req.body.version);
    if (!Number.isInteger(requestedVersion) || requestedVersion < 1)
      return res
        .status(400)
        .json({ error: "A valid answer version is required" });
    const update = {
      selectedOptionId: req.body.selectedOptionId,
      isMarkedForReview: Boolean(req.body.isMarkedForReview),
      visited: Boolean(req.body.visited),
      timeSpentSeconds: Math.max(0, Number(req.body.timeSpentSeconds || 0)),
      version: requestedVersion,
      savedAt: new Date(),
    };
    const saved = await Answer.findOneAndUpdate(
      {
        attemptId: attempt._id,
        questionId: req.params.questionId,
        $or: [
          { version: { $lt: requestedVersion } },
          { version: { $exists: false } },
        ],
      },
      {
        $set: update,
        $setOnInsert: {
          attemptId: attempt._id,
          questionId: req.params.questionId,
        },
      },
      { upsert: true, new: true, rawResult: true },
    );
    if (!saved.value) {
      const current = await Answer.findOne({
        attemptId: attempt._id,
        questionId: req.params.questionId,
      }).lean();
      return res
        .status(409)
        .json({
          saved: false,
          error: "A newer answer version already exists",
          version: current?.version,
        });
    }
    res.json({
      saved: true,
      version: saved.value.version,
      savedAt: saved.value.savedAt,
    });
  }),
);

router.get(
  "/:id/readiness-requirements",
  authenticate,
  asyncHandler(async (req, res) => {
    const exam = await Exam.findById(req.params.id).select(
      "readinessRequirements",
    );
    if (!exam) return res.status(404).json({ error: "Exam not found" });
    res.json({
      examId: exam.id,
      requirements: {
        browser: true,
        internet: true,
        camera: Boolean(exam.readinessRequirements?.camera),
        microphone: Boolean(exam.readinessRequirements?.microphone),
        fullscreen: Boolean(exam.readinessRequirements?.fullscreen),
      },
    });
  }),
);

router.post(
  "/:id/readiness",
  authenticate,
  asyncHandler(async (req, res) => {
    const exam = await Exam.findById(req.params.id).select(
      "readinessRequirements status",
    );
    if (!exam) return res.status(404).json({ error: "Exam not found" });
    const required = {
      browser: true,
      internet: true,
      camera: Boolean(exam.readinessRequirements?.camera),
      microphone: Boolean(exam.readinessRequirements?.microphone),
      fullscreen: Boolean(exam.readinessRequirements?.fullscreen),
    };
    const checks = req.body.checks || {};
    const failed = Object.keys(required).filter(
      (key) => required[key] && checks[key] !== true,
    );
    res.json({
      ready: failed.length === 0,
      failedChecks: failed,
      attemptCreated: false,
      timerStarted: false,
    });
  }),
);

router.post(
  "/",
  ...requirePermission("exams:manage"),
  asyncHandler(async (req, res) =>
    res
      .status(201)
      .json(await Exam.create({ ...req.body, createdBy: req.auth.sub })),
  ),
);

router.post(
  "/:id/finalize-marks",
  ...requirePermission("marks:finalize"),
  asyncHandler(async (req, res) =>
    res.json({ ok: true, examId: req.params.id, finalizedBy: req.auth.sub }),
  ),
);

router.post(
  "/:id/publish-results",
  ...requirePermission("marks:finalize"),
  asyncHandler(async (req, res) => {
    const exam = await Exam.findByIdAndUpdate(
      req.params.id,
      { resultsPublishedAt: new Date() },
      { new: true },
    ).select("id resultsPublishedAt");
    if (!exam) return res.status(404).json({ error: "Exam not found" });
    await FinalResult.updateMany(
      { examId: exam.id, releaseStatus: "PENDING" },
      { $set: { releaseStatus: "RELEASED" } },
    );
    res.json({
      released: true,
      examId: exam.id,
      publishedAt: exam.resultsPublishedAt,
    });
  }),
);

router.get(
  "/:id/results",
  authenticate,
  asyncHandler(async (req, res) => {
    const exam = await Exam.findById(req.params.id).select(
      "resultsPublishedAt totalMarks title",
    );
    if (!exam) return res.status(404).json({ error: "Exam not found" });
    if (!exam.resultsPublishedAt)
      return res
        .status(409)
        .json({ released: false, message: "Marks have not been published yet" });
    const result = await FinalResult.findOne({
      examId: exam.id,
      studentId: req.auth.sub,
      releaseStatus: "RELEASED",
    }).select("marksScored maximumMarks submittedAt finalizedAt");
    if (!result)
      return res.status(404).json({ error: "Submitted result not found" });
    res.json({
      released: true,
      examTitle: exam.title,
      marks: result.marksScored,
      maxMarks: result.maximumMarks,
      submittedAt: result.submittedAt,
      finalizedAt: result.finalizedAt,
    });
  }),
);

router.post(
  "/attempts/:id/submit",
  authenticate,
  asyncHandler(async (req, res) => {
    try {
      res.json(
        await finalizeAttempt({
          attemptId: req.params.id,
          studentId: req.student.id,
          reason:
            new Date() >=
            (await Attempt.findById(req.params.id).select("expiresAt")).expiresAt
              ? "TIMER_EXPIRY"
              : "MANUAL",
          answers: req.body.answers,
        }),
      );
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  }),
);

router.patch(
  "/attempts/:id/marks",
  ...requirePermission("marks:correct"),
  asyncHandler(async (req, res) => {
    const attempt = await Attempt.findById(req.params.id);
    if (!attempt) return res.status(404).json({ error: "Attempt not found" });
    if (attempt.status === "IN_PROGRESS")
      return res.status(409).json({ error: "Attempt is not finalized" });
    attempt.score = Number(req.body.score);
    await attempt.save();
    res.json({ ok: true, score: attempt.score });
  }),
);

module.exports = router;
