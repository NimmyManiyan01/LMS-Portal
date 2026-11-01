const router = require("express").Router();
const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const Student = require("../models/Student");
const AdminUser = require("../models/AdminUser");
const Exam = require("../models/Exam");
const Attempt = require("../models/Attempt");
const IntegrityEvent = require("../models/IntegrityEvent");
const ReportExport = require("../models/ReportExport");
const AuditLog = require("../models/AuditLog");
const Counter = require("../models/Counter");
const ExcelJS = require("exceljs");
const mongoose = require("mongoose");
const Question = require("../models/Question");
const PaperSet = require("../models/PaperSet");
const FinalResult = require("../models/FinalResult");
const ExamFeedback = require("../models/ExamFeedback");
const { authenticate } = require("../middleware/auth");
const adminOnly = (req, res, next) =>
  req.auth?.role === "ADMIN"
    ? next()
    : res.status(403).json({ error: "Administrator access required" });
const effectiveExamStatus = (exam, now = new Date()) => {
  if (exam.status === "DRAFT") return "DRAFT";
  if (exam.status === "COMPLETED" || exam.status === "CLOSED")
    return exam.status;
  if (exam.closesAt && new Date(exam.closesAt) <= now) return "EXPIRED";
  if (exam.scheduledAt && new Date(exam.scheduledAt) > now) return "SCHEDULED";
  if (["SCHEDULED", "ACTIVE", "LIVE", "PUBLISHED"].includes(exam.status))
    return "ACTIVE";
  return exam.status;
};
const reserveExamCode = async () => {
  const year = new Date().getFullYear();
  for (;;) {
    const counter = await Counter.findOneAndUpdate(
      { _id: `examCode:${year}` },
      { $inc: { sequence: 1 } },
      { upsert: true, new: true },
    );
    const code = `EXAM-${year}-${String(counter.sequence).padStart(4, "0")}`;
    if (!(await Exam.exists({ code }))) return code;
  }
};

router.get("/administrators", authenticate, adminOnly, async (_req, res) => {
  const administrators = await AdminUser.find()
    .select("email role active createdAt updatedAt")
    .sort({ createdAt: -1 })
    .lean();
  res.set("Cache-Control", "no-store");
  res.json({
    administrators: administrators.map((admin) => ({
      id: String(admin._id),
      email: admin.email,
      role: admin.role,
      active: admin.active,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    })),
  });
});

router.post("/administrators", authenticate, adminOnly, async (req, res) => {
  const email = String(req.body.email || "")
    .toLowerCase()
    .trim();
  if (!/^[\w.!#$%&'*+/=?^`{|}~-]+@[\w-]+(?:\.[\w-]+)+$/.test(email))
    return res
      .status(400)
      .json({ error: "A valid administrator email is required" });

  const existing = await AdminUser.findOne({ email });
  if (existing) {
    if (existing.active)
      return res
        .status(409)
        .json({ error: "This administrator already has access" });
    existing.active = true;
    existing.role = "ADMIN";
    await existing.save();
    return res.json({
      administrator: {
        id: String(existing._id),
        email: existing.email,
        role: existing.role,
        active: existing.active,
      },
    });
  }

  const administrator = await AdminUser.create({
    email,
    role: "ADMIN",
    active: true,
  });
  res
    .status(201)
    .json({
      administrator: {
        id: String(administrator._id),
        email: administrator.email,
        role: administrator.role,
        active: administrator.active,
      },
    });
});

router.get("/feedback", authenticate, adminOnly, async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
  const [rows, total, summary] = await Promise.all([
    ExamFeedback.find()
      .populate("studentId", "fullName email studentId college")
      .populate("examId", "title code")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    ExamFeedback.countDocuments(),
    ExamFeedback.aggregate([
      {
        $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } },
      },
    ]),
  ]);
  res.set("Cache-Control", "no-store");
  res.json({
    rows: rows.map((row) => ({
      id: String(row._id),
      rating: row.rating,
      comment: row.comment,
      createdAt: row.createdAt,
      student: row.studentId,
      exam: row.examId,
    })),
    summary: { total, average: Number((summary[0]?.average || 0).toFixed(1)) },
    pagination: {
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
    },
  });
});

router.get("/exams", authenticate, adminOnly, async (_req, res) => {
  const exams = await Exam.find({ status: { $ne: "CLOSED" } })
    .select(
      "_id code title status scheduledAt closesAt totalMarks totalQuestions durationMinutes examinationType maxAttempts readinessRequirements integrityProfile integrityRules resultReleasePolicy instructions description",
    )
    .sort({ createdAt: -1 })
    .lean();

  const examIds = exams
    .map((e) => e._id)
    .filter((id) => id && mongoose.isValidObjectId(id));
  const paperSets = examIds.length
    ? await PaperSet.find({
        examId: { $in: examIds },
      })
        .select(
          "_id examId name code status durationMinutes totalMarks passingMarks questionIds active",
        )
        .sort({ createdAt: -1 })
        .lean()
    : [];

  const setsByExam = new Map();
  paperSets.forEach((set) => {
    const key = String(set.examId);
    if (!setsByExam.has(key)) setsByExam.set(key, []);
    setsByExam.get(key).push({
      id: String(set._id),
      _id: String(set._id),
      name: set.name,
      code: set.code,
      status: set.status,
      questionCount: set.questionIds ? set.questionIds.length : 0,
      totalMarks: set.totalMarks,
      passingMarks: set.passingMarks,
      durationMinutes: set.durationMinutes,
    });
  });

  res.set("Cache-Control", "no-store");
  res.json({
    exams: exams.map((exam) => {
      const sets = setsByExam.get(String(exam._id)) || [];
      const publishedSet = sets.find((s) => s.status === "PUBLISHED") || null;
      return {
        id: String(exam._id),
        code: exam.code,
        title: exam.title,
        status: effectiveExamStatus(exam),
        storedStatus: exam.status,
        scheduledAt: exam.scheduledAt,
        closesAt: exam.closesAt,
        totalMarks: exam.totalMarks,
        totalQuestions: exam.totalQuestions,
        durationMinutes: exam.durationMinutes,
        examinationType: exam.examinationType,
        maxAttempts: exam.maxAttempts,
        description: exam.description,
        instructions: exam.instructions,
        readinessRequirements: exam.readinessRequirements,
        integrityProfile: exam.integrityProfile,
        integrityRules: exam.integrityRules,
        resultReleasePolicy: exam.resultReleasePolicy,
        paperSets: sets,
        paperSet: publishedSet || sets[0] || null,
      };
    }),
  });
});
router.get("/results", authenticate, adminOnly, async (req, res) => {
  const examId =
    req.query.examId && mongoose.isValidObjectId(req.query.examId)
      ? req.query.examId
      : null;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
  const search = String(req.query.search || "")
    .trim()
    .toLowerCase();
  const college = String(req.query.college || "").trim();
  const query = examId ? { examId } : {};
  const results = await FinalResult.find(query)
    .populate(
      "examId",
      "title code totalMarks durationMinutes resultReleasePolicy resultsPublishedAt",
    )
    .populate("studentId", "studentId fullName email college")
    .sort({ submittedAt: -1, finalizedAt: -1 })
    .lean();
  const exams = await Exam.find({ status: { $ne: "CLOSED" } })
    .select(
      "_id title code status totalMarks resultReleasePolicy resultsPublishedAt eligibility",
    )
    .sort({ createdAt: -1 })
    .lean();
  const examIds = [
    ...new Set(
      results
        .map((result) => result.examId?._id || result.examId)
        .filter((id) => id && mongoose.isValidObjectId(id)),
    ),
  ];
  const publishedSets = examIds.length
    ? await PaperSet.find({
        examId: { $in: examIds },
        status: "PUBLISHED",
        active: true,
      })
        .select("examId totalMarks")
        .lean()
    : [];
  const paperMarks = new Map();
  publishedSets.forEach((set) => {
    const key = String(set.examId);
    paperMarks.set(
      key,
      Math.max(Number(paperMarks.get(key) || 0), Number(set.totalMarks || 0)),
    );
  });
  const allRows = results.map((result) => ({
    id: String(result._id),
    attemptId: String(result.attemptId),
    student: result.studentId
      ? {
          id: String(result.studentId._id),
          studentId: result.studentId.studentId,
          fullName: result.studentId.fullName,
          email: result.studentId.email,
          college: result.studentId.college || "College Not Specified",
        }
      : null,
    exam: result.examId
      ? {
          id: String(result.examId._id),
          title: result.examId.title,
          code: result.examId.code,
          totalMarks:
            result.examId.totalMarks ??
            paperMarks.get(String(result.examId._id)) ??
            null,
        }
      : null,
    marksScored: result.marksScored,
    maximumMarks:
      result.maximumMarks ??
      result.maxMarks ??
      result.examId?.totalMarks ??
      paperMarks.get(String(result.examId?._id)) ??
      null,
    submittedAt: result.submittedAt || result.finalizedAt,
    evaluationStatus: "FINALIZED",
    releaseStatus: result.releaseStatus || "PENDING",
    attemptNumber: result.attemptNumber || null,
  }));
  const marksFilter = String(req.query.marksFilter || "").trim();
  const minScore = req.query.minScore !== undefined && req.query.minScore !== null && req.query.minScore !== "" ? Number(req.query.minScore) : null;
  const maxScore = req.query.maxScore !== undefined && req.query.maxScore !== null && req.query.maxScore !== "" ? Number(req.query.maxScore) : null;
  const releaseStatusFilter = String(req.query.releaseStatus || "").trim();

  const filteredRows = allRows.filter((row) => {
    if (college && row.student?.college !== college) return false;
    if (
      search &&
      !`${row.student?.studentId || ""} ${row.student?.fullName || ""} ${row.student?.email || ""} ${row.exam?.title || ""} ${row.exam?.code || ""}`
        .toLowerCase()
        .includes(search)
    )
      return false;

    if (releaseStatusFilter === "RELEASED" && row.releaseStatus !== "RELEASED") return false;
    if (releaseStatusFilter === "AWAITING" && row.releaseStatus === "RELEASED") return false;

    const scored = Number(row.marksScored || 0);
    const maxMarks = Number(row.maximumMarks || 100);
    const percentage = maxMarks > 0 ? (scored / maxMarks) * 100 : 0;

    if (minScore !== null && Number.isFinite(minScore) && scored < minScore) return false;
    if (maxScore !== null && Number.isFinite(maxScore) && scored > maxScore) return false;

    if (marksFilter === "PASSED" && percentage < 35) return false;
    if (marksFilter === "FAILED" && percentage >= 35) return false;
    if (marksFilter === "HIGH" && percentage < 75) return false;
    if (marksFilter === "AVERAGE" && (percentage < 40 || percentage >= 75)) return false;
    if (marksFilter === "LOW" && percentage >= 40) return false;

    return true;
  });
  const selectedExam = examId
    ? exams.find((exam) => String(exam._id) === String(examId))
    : null;
  const counts = {
    assignedStudents: selectedExam
      ? selectedExam.eligibility?.studentIds?.length || 0
      : exams.reduce(
          (sum, exam) => sum + (exam.eligibility?.studentIds?.length || 0),
          0,
        ),
    submittedAttempts: results.length,
    pendingEvaluations: 0,
    awaitingRelease: results.filter(
      (result) => result.releaseStatus !== "RELEASED",
    ).length,
    released: results.filter((result) => result.releaseStatus === "RELEASED")
      .length,
  };
  const colleges = [
    ...new Set(allRows.map((row) => row.student?.college).filter(Boolean)),
  ].sort();
  res
    .set("Cache-Control", "no-store")
    .json({
      rows: filteredRows.slice((page - 1) * limit, page * limit),
      exams: exams.map((exam) => ({
        id: String(exam._id),
        title: exam.title,
        code: exam.code,
        status: effectiveExamStatus(exam),
        totalMarks: exam.totalMarks,
        resultsPublishedAt: exam.resultsPublishedAt,
      })),
      colleges,
      counts,
      pagination: {
        page,
        limit,
        total: filteredRows.length,
        pages: Math.max(1, Math.ceil(filteredRows.length / limit)),
      },
    });
});
router.get("/results/:resultId", authenticate, adminOnly, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.resultId))
    return res.status(400).json({ error: "Invalid result ID" });
  const result = await FinalResult.findById(req.params.resultId)
    .populate("examId", "title code totalMarks")
    .populate("studentId", "studentId fullName email college")
    .lean();
  if (!result) return res.status(404).json({ error: "Result not found" });
  const publishedSet = result.examId?._id
    ? await PaperSet.findOne({
        examId: result.examId._id,
        status: "PUBLISHED",
        active: true,
      })
        .select("totalMarks")
        .sort({ updatedAt: -1 })
        .lean()
    : null;
  res.json({
    result: {
      resultId: String(result._id),
      attemptId: String(result.attemptId),
      student: result.studentId
        ? {
            name: result.studentId.fullName,
            studentId: result.studentId.studentId,
            email: result.studentId.email,
            college: result.studentId.college || "College Not Specified",
          }
        : null,
      examination: result.examId
        ? { name: result.examId.title, code: result.examId.code }
        : null,
      marksScored: result.marksScored,
      maximumMarks:
        result.maximumMarks ??
        result.maxMarks ??
        result.examId?.totalMarks ??
        publishedSet?.totalMarks ??
        null,
      submittedAt: result.submittedAt || result.finalizedAt,
      evaluationStatus: "FINALIZED",
      releaseStatus: result.releaseStatus || "PENDING",
    },
  });
});
router.post(
  "/results/exams/:id/publish",
  authenticate,
  adminOnly,
  async (req, res) => {
    const exam = await Exam.findByIdAndUpdate(
      req.params.id,
      { resultsPublishedAt: new Date() },
      { new: true },
    ).select("_id resultsPublishedAt");
    if (!exam) return res.status(404).json({ error: "Exam not found" });
    await FinalResult.updateMany(
      { examId: exam._id, releaseStatus: "PENDING" },
      {
        $set: {
          releaseStatus: "RELEASED",
          publishedAt: exam.resultsPublishedAt,
        },
      },
    );
    res.json({
      released: true,
      examId: String(exam._id),
      publishedAt: exam.resultsPublishedAt,
    });
  },
);
router.get(
  "/monitoring/attempts",
  authenticate,
  adminOnly,
  async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
    const filter = req.query.status
      ? { status: String(req.query.status).toUpperCase() }
      : { status: "IN_PROGRESS" };
    const [attempts, total] = await Promise.all([
      Attempt.find(filter)
        .populate(
          "examId",
          "title code scheduledAt closesAt readinessRequirements",
        )
        .populate("studentId", "studentId fullName email")
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Attempt.countDocuments(filter),
    ]);
    const ids = attempts.map((attempt) => attempt._id);
    const events = await IntegrityEvent.find({ attemptId: { $in: ids } })
      .sort({ recordedAt: -1 })
      .lean();
    const byAttempt = new Map();
    events.forEach((event) => {
      const key = String(event.attemptId);
      if (!byAttempt.has(key)) byAttempt.set(key, []);
      byAttempt.get(key).push(event);
    });
    res
      .set("Cache-Control", "no-store")
      .json({
        attempts: attempts.map((attempt) => ({
          id: String(attempt._id),
          attemptId: String(attempt._id),
          status: attempt.status,
          startedAt: attempt.startedAt,
          expiresAt: attempt.expiresAt,
          submittedAt: attempt.submittedAt,
          answeredCount: attempt.answers
            ? Object.keys(attempt.answers).length
            : 0,
          integrityCounts: attempt.integrityCounts || {},
          exam: attempt.examId,
          student: attempt.studentId,
          latestIncident: byAttempt.get(String(attempt._id))?.[0] || null,
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.max(1, Math.ceil(total / limit)),
        },
      });
  },
);
router.get(
  "/monitoring/attempts/:attemptId/events",
  authenticate,
  adminOnly,
  async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.attemptId))
      return res.status(400).json({ error: "Invalid attempt ID" });
    const attempt = await Attempt.findById(req.params.attemptId)
      .populate("examId", "title code")
      .populate("studentId", "studentId fullName email")
      .lean();
    if (!attempt) return res.status(404).json({ error: "Attempt not found" });
    const events = await IntegrityEvent.find({ attemptId: attempt._id })
      .sort({ recordedAt: -1 })
      .lean();
    res.json({
      attempt: {
        attemptId: String(attempt._id),
        status: attempt.status,
        exam: attempt.examId,
        student: attempt.studentId,
      },
      events,
    });
  },
);
router.get("/exams/next-code", authenticate, adminOnly, async (_req, res) => {
  const year = new Date().getFullYear();
  const counter = await Counter.findOne({ _id: `examCode:${year}` }).lean();
  res.json({
    code: `EXAM-${year}-${String((counter?.sequence || 0) + 1).padStart(4, "0")}`,
  });
});
router.post("/exams", authenticate, adminOnly, async (req, res) => {
  const title = String(req.body.name || req.body.title || "").trim();
  let code;
  const start = new Date(req.body.startAt || req.body.scheduledAt);
  const end = new Date(req.body.endAt || req.body.closesAt);
  const duration = Number(req.body.durationMinutes);
  const attempts = Number(req.body.maxAttempts || 1);
  const windowMinutes = (end - start) / 60000;
  if (
    !title ||
    !Number.isFinite(start.getTime()) ||
    !Number.isFinite(end.getTime()) ||
    start <= new Date() ||
    end <= start ||
    !Number.isFinite(duration) ||
    duration <= 0 ||
    duration > windowMinutes ||
    !Number.isInteger(attempts) ||
    attempts < 1
  )
    return res
      .status(400)
      .json({ error: "Provide valid examination details and date range." });
  code = await reserveExamCode();
  try {
    const exam = await Exam.create({
      title,
      name: title,
      code,
      description: String(req.body.description || ""),
      examinationType: String(req.body.examinationType || "MCQ"),
      scheduledAt: start,
      closesAt: end,
      durationMinutes: duration,
      maxAttempts: attempts,
      instructions: Array.isArray(req.body.instructions)
        ? req.body.instructions
        : String(req.body.instructions || "")
            .split(/\r?\n/)
            .map((v) => v.trim())
            .filter(Boolean),
      readinessRequirements: req.body.readinessRequirements,
      integrityProfile: req.body.integrityProfile,
      integrityRules: req.body.integrityRules,
      resultReleasePolicy:
        req.body.resultReleasePolicy === "IMMEDIATE"
          ? "IMMEDIATE"
          : "ADMIN_CONTROLLED",
      status: "DRAFT",
      createdBy: req.admin?._id,
    });
    res.status(201).json({ exam });
  } catch (error) {
    if (error?.code === 11000)
      return res
        .status(409)
        .json({ error: "Examination code already exists." });
    throw error;
  }
});
router.get("/exams/:id", authenticate, adminOnly, async (req, res) => {
  const exam = await Exam.findById(req.params.id).lean();
  if (!exam) return res.status(404).json({ error: "Examination not found" });
  res.json({ exam });
});
router.patch("/exams/:id", authenticate, adminOnly, async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) return res.status(404).json({ error: "Examination not found" });
  if (
    ["ACTIVE", "COMPLETED", "CLOSED"].includes(exam.status) &&
    req.body.status &&
    req.body.status !== exam.status
  )
    return res
      .status(409)
      .json({
        error: "This examination lifecycle state cannot be changed that way.",
      });
  const fields = {
    name: "title",
    title: "title",
    description: "description",
    examinationType: "examinationType",
    startAt: "scheduledAt",
    scheduledAt: "scheduledAt",
    endAt: "closesAt",
    closesAt: "closesAt",
    durationMinutes: "durationMinutes",
    maxAttempts: "maxAttempts",
    status: "status",
    readinessRequirements: "readinessRequirements",
    integrityProfile: "integrityProfile",
    integrityRules: "integrityRules",
    resultReleasePolicy: "resultReleasePolicy",
  };
  for (const [from, to] of Object.entries(fields))
    if (req.body[from] !== undefined)
      exam[to] = ["scheduledAt", "closesAt"].includes(to)
        ? new Date(req.body[from])
        : req.body[from];
  if (
    exam.integrityRules?.tabSwitchThreshold !== undefined &&
    (!Number.isInteger(Number(exam.integrityRules.tabSwitchThreshold)) ||
      Number(exam.integrityRules.tabSwitchThreshold) < 1)
  )
    return res
      .status(400)
      .json({
        error: "Tab-switch warning threshold must be a positive whole number.",
      });
  if (
    exam.scheduledAt ||
    exam.closesAt ||
    req.body.startAt !== undefined ||
    req.body.endAt !== undefined
  ) {
    if (
      !exam.scheduledAt ||
      !exam.closesAt ||
      !Number.isFinite(exam.scheduledAt.getTime()) ||
      !Number.isFinite(exam.closesAt.getTime()) ||
      exam.closesAt <= exam.scheduledAt
    )
      return res
        .status(400)
        .json({
          error: "End date and time must be later than start date and time.",
        });
    const durationWindow = (exam.closesAt - exam.scheduledAt) / 60000;
    if (
      !Number.isFinite(Number(exam.durationMinutes)) ||
      Number(exam.durationMinutes) <= 0 ||
      durationWindow < Number(exam.durationMinutes)
    )
      return res
        .status(400)
        .json({
          error:
            "The examination duration must fit within the scheduled window.",
        });
  }
  if (exam.status === "SCHEDULED") {
    const publishedSet = await PaperSet.findOne({
      examId: exam._id,
      status: "PUBLISHED",
      active: true,
    })
      .select("_id durationMinutes")
      .lean();
    if (!publishedSet)
      return res
        .status(409)
        .json({
          error:
            "At least one published paper set is required before scheduling.",
        });
    if (Number(publishedSet.durationMinutes) !== Number(exam.durationMinutes))
      return res
        .status(409)
        .json({
          error:
            "The published paper set duration must match the examination duration.",
        });
  }
  await exam.save();
  res.json({ exam });
});
router.get(
  "/exams/:id/assignments",
  authenticate,
  adminOnly,
  async (req, res) => {
    const exam = await Exam.findById(req.params.id).lean();
    if (!exam) return res.status(404).json({ error: "Examination not found" });
    const assignedIds = (exam.eligibility?.studentIds || []).map(String);
    const college = String(req.query.college || "").trim();
    const studentFilter = { accountStatus: "ACTIVE" };
    if (college)
      studentFilter.college = {
        $regex: `^${escapeRegex(college)}$`,
        $options: "i",
      };
    const students = await Student.find(studentFilter)
      .select(
        "studentId fullName email college branch passOutYear accountStatus createdAt",
      )
      .sort({ fullName: 1 })
      .lean();
    const colleges = await Student.aggregate([
      {
        $match: {
          accountStatus: "ACTIVE",
          college: { $exists: true, $nin: [null, ""] },
        },
      },
      {
        $group: {
          _id: { $toLower: "$college" },
          name: { $first: "$college" },
          count: { $sum: 1 },
        },
      },
      { $sort: { name: 1 } },
    ]);
    const assignmentAudit = await AuditLog.findOne({
      action: "EXAM_STUDENTS_ASSIGNED",
      entityType: "Exam",
      entityId: exam._id,
    })
      .sort({ createdAt: -1 })
      .select("createdAt")
      .lean();
    res.json({
      exam: {
        id: String(exam._id),
        title: exam.title,
        code: exam.code,
        scheduledAt: exam.scheduledAt,
        closesAt: exam.closesAt,
        durationMinutes: exam.durationMinutes,
        maxAttempts: exam.maxAttempts,
      },
      colleges: colleges.map((item) => ({
        name: item.name,
        count: item.count,
      })),
      assignedStudentIds: assignedIds,
      assignedAt: assignmentAudit?.createdAt || null,
      students: students.map(studentView),
    });
  },
);
router.put(
  "/exams/:id/assignments",
  authenticate,
  adminOnly,
  async (req, res) => {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ error: "Examination not found" });
    if (exam.status !== "SCHEDULED")
      return res
        .status(409)
        .json({
          error: "Students can only be assigned to scheduled examinations.",
        });
    const publishedSet = await PaperSet.findOne({
      examId: exam._id,
      status: "PUBLISHED",
      active: true,
    })
      .select("_id")
      .lean();
    if (!publishedSet)
      return res
        .status(409)
        .json({
          error: "A published paper set is required before assigning students.",
        });
    const ids = Array.isArray(req.body.studentIds)
      ? [...new Set(req.body.studentIds.map(String))]
      : [];
    if (!ids.length)
      return res
        .status(400)
        .json({ error: "Select at least one active student." });
    if (ids.some((id) => !mongoose.isValidObjectId(id)))
      return res
        .status(400)
        .json({ error: "Assignment contains an invalid student." });
    const activeCount = await Student.countDocuments({
      _id: { $in: ids },
      accountStatus: "ACTIVE",
    });
    if (activeCount !== ids.length)
      return res
        .status(400)
        .json({ error: "Only active students can be assigned." });
    exam.eligibility = {
      ...(exam.eligibility?.toObject?.() || exam.eligibility || {}),
      studentIds: ids,
    };
    await exam.save();
    await AuditLog.create({
      actorId: req.admin?._id,
      actorRole: "ADMIN",
      action: "EXAM_STUDENTS_ASSIGNED",
      entityType: "Exam",
      entityId: exam._id,
      metadata: { studentIds: ids },
    });
    res.json({ assignedStudentIds: ids, assignedStudentCount: ids.length });
  },
);

const emailPattern = /^[\w.!#$%&'*+/=?^`{|}~-]+@[\w-]+(?:\.[\w-]+)+$/;
const studentView = (student) => ({
  id: String(student._id),
  studentId: student.studentId,
  fullName: student.fullName,
  email: student.email,
  phone: student.phone || "",
  college: student.college,
  branch: student.branch,
  passOutYear: student.passOutYear,
  accountStatus: student.accountStatus,
  emailVerified: Boolean(student.emailVerified),
  createdAt: student.createdAt,
  updatedAt: student.updatedAt,
});
const nextStudentId = async () => {
  const counter = await Counter.findOneAndUpdate(
    { _id: "studentId" },
    { $inc: { sequence: 1 } },
    { upsert: true, new: true },
  ).lean();
  return `KGS-STU-${String(counter.sequence).padStart(6, "0")}`;
};
const questionView = (question) => ({
  id: String(question._id),
  questionId: String(question._id),
  questionText: question.questionText || "",
  questionType: question.questionType || "MCQ",
  category: question.sectionName || question.sectionId || "Uncategorized",
  difficulty: question.difficulty || "Not configured",
  marks: Number(question.marks || 0),
  negativeMarks: Number(question.negativeMarks || 0),
  status: question.status || "ACTIVE",
  options: question.options || [],
  correctOptionId: question.correctOptionId || null,
  correctOptionIds: question.correctOptionIds || [],
  acceptedAnswers: question.acceptedAnswers || [],
  explanation: question.explanation || "",
  createdAt: question.createdAt || null,
});
const normalizeImportHeader = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z]/g, "");
const parseCsvLine = (line) => {
  const values = [];
  let value = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"' && line[i + 1] === '"') {
      value += '"';
      i += 1;
    } else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) {
      values.push(value.trim());
      value = "";
    } else value += char;
  }
  values.push(value.trim());
  return values;
};
const importQuestionRow = (row, rowNumber) => {
  const get = (name) => String(row[normalizeImportHeader(name)] ?? "").trim();
  const options = ["A", "B", "C", "D"].map((id) => ({
    id,
    text: get(`Option ${id}`),
  }));
  const errors = [];
  const text = get("Question Text");
  const type = get("Question Type").toUpperCase() || "MCQ";
  const category = get("Category");
  const difficulty = get("Difficulty").toUpperCase();
  const status = get("Status").toUpperCase() || "DRAFT";
  const marks = Number(get("Marks"));
  const correct = get("Correct Answer").toUpperCase();
  if (!text) errors.push("Question text is required");
  if (type !== "MCQ") errors.push("Question Type must be MCQ");
  if (!category) errors.push("Category is required");
  if (!["EASY", "MEDIUM", "HARD"].includes(difficulty))
    errors.push("Difficulty must be Easy, Medium, or Hard");
  if (!Number.isFinite(marks) || marks <= 0)
    errors.push("Marks must be positive");
  if (options.some((option) => !option.text))
    errors.push("Options A, B, C, and D are required");
  if (new Set(options.map((option) => option.text.toLowerCase())).size !== 4)
    errors.push("Options must be distinct");
  if (!["A", "B", "C", "D"].includes(correct))
    errors.push("Correct Answer must be A, B, C, or D");
  if (!["DRAFT", "ACTIVE"].includes(status))
    errors.push("Status must be Draft or Active");
  return {
    rowNumber,
    questionText: text,
    questionType: "MCQ",
    category,
    difficulty,
    marks,
    options,
    correctOptionId: correct,
    explanation: get("Explanation"),
    status,
    errors,
  };
};

router.post(
  "/questions/import-file",
  authenticate,
  adminOnly,
  async (req, res) => {
    const fileName = String(req.body.fileName || "");
    const encoded = String(req.body.fileBase64 || "");
    if (!encoded || !/\.(csv|xlsx|pdf)$/i.test(fileName))
      return res
        .status(400)
        .json({ error: "Upload a CSV, XLSX, or PDF file." });
    if (/\.pdf$/i.test(fileName))
      return res
        .status(415)
        .json({
          error:
            "Only the structured PDF template is supported; PDF text extraction is not configured on this server.",
        });
    try {
      const buffer = Buffer.from(
        encoded.replace(/^data:[^;]+;base64,/, ""),
        "base64",
      );
      let rows = [];
      if (/\.csv$/i.test(fileName)) {
        const lines = String(buffer)
          .split(/\r?\n/)
          .filter((line) => line.split(",").some((value) => value.trim()));
        const headers = parseCsvLine(lines.shift() || "").map(
          normalizeImportHeader,
        );
        if (!headers.includes("questiontext"))
          return res
            .status(400)
            .json({ error: "Required Question Text header is missing." });
        rows = lines
          .map((line, index) =>
            Object.fromEntries(
              parseCsvLine(line).map((value, column) => [
                headers[column],
                value,
              ]),
            ),
          )
          .map((row, index) => importQuestionRow(row, index + 2));
      } else {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        const sheet = workbook.worksheets[0];
        const headers = (sheet.getRow(1).values || [])
          .slice(1)
          .map(normalizeImportHeader);
        if (!headers.includes("questiontext"))
          return res
            .status(400)
            .json({ error: "Required Question Text header is missing." });
        sheet.eachRow((line, index) => {
          const values = line.values.slice(1);
          if (index > 1 && values.some((value) => String(value || "").trim())) {
            const row = Object.fromEntries(
              values.map((value, column) => [
                headers[column],
                typeof value === "object"
                  ? value.text ||
                    value.result ||
                    (value.richText || [])
                      .map((part) => part.text || "")
                      .join("")
                  : value,
              ]),
            );
            rows.push(importQuestionRow(row, index));
          }
        });
      }
      const existing = new Set(
        (await Question.find({}).select("questionText options").lean()).map(
          (question) =>
            `${String(question.questionText || "")
              .trim()
              .toLowerCase()}|${(question.options || [])
              .map((option) =>
                String(option.text || "")
                  .trim()
                  .toLowerCase(),
              )
              .join("|")}`,
        ),
      );
      const seen = new Set();
      const valid = [];
      const invalid = [];
      const duplicates = [];
      rows.forEach((row) => {
        const key = `${row.questionText.toLowerCase()}|${row.options.map((option) => option.text.toLowerCase()).join("|")}`;
        if (row.errors.length) invalid.push(row);
        else if (seen.has(key) || existing.has(key))
          duplicates.push({ ...row, errors: ["Duplicate question"] });
        else {
          seen.add(key);
          valid.push(row);
        }
      });
      res.json({ total: rows.length, valid, invalid, duplicates });
    } catch {
      res
        .status(400)
        .json({
          error: "The file could not be read. Check its format and headers.",
        });
    }
  },
);
router.post("/questions/import", authenticate, adminOnly, async (req, res) => {
  const rows = Array.isArray(req.body.rows) ? req.body.rows : [];
  if (!rows.length)
    return res.status(400).json({ error: "No valid questions were supplied." });
  const imported = [];
  for (const row of rows)
    imported.push(
      await Question.create({
        questionText: row.questionText,
        questionType: "MCQ",
        sectionName: row.category,
        difficulty: row.difficulty,
        marks: row.marks,
        options: row.options,
        correctOptionId: row.correctOptionId,
        correctOptionIds: [row.correctOptionId],
        explanation: row.explanation,
        status: row.status,
      }),
    );
  res
    .status(201)
    .json({
      imported: imported.length,
      ids: imported.map((question) => String(question._id)),
    });
});
router.get(
  "/questions/import-template",
  authenticate,
  adminOnly,
  async (req, res) => {
    const format = String(req.query.format || "csv").toLowerCase();
    const headers =
      "Question Text,Question Type,Category,Difficulty,Marks,Option A,Option B,Option C,Option D,Correct Answer,Explanation,Status\n";
    if (format === "csv")
      return res
        .type("text/csv")
        .set(
          "Content-Disposition",
          'attachment; filename="kgs-question-import-template.csv"',
        )
        .send(headers);
    if (format === "xlsx") {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Questions");
      sheet.addRow(headers.trim().split(","));
      sheet.getRow(1).font = { bold: true };
      sheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE6F1FB" },
      };
      sheet.columns = headers
        .trim()
        .split(",")
        .map(() => ({ width: 20 }));
      sheet.views = [{ state: "frozen", ySplit: 1 }];
      const buffer = await workbook.xlsx.writeBuffer();
      return res
        .set(
          "Content-Disposition",
          'attachment; filename="kgs-question-import-template.xlsx"',
        )
        .type(
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        .send(Buffer.from(buffer));
    }
    if (format === "pdf") {
      const text =
        "KGS QUESTION IMPORT TEMPLATE\\n\\nQuestion 1: [Question Text]\\nA. [Option A]\\nB. [Option B]\\nC. [Option C]\\nD. [Option D]\\nCorrect Answer: A\\nCategory: [Category]\\nDifficulty: Easy\\nMarks: 1\\nExplanation: [Optional]\\nStatus: Draft";
      const stream = `BT /F1 11 Tf 50 760 Td (${text.replace(/[()]/g, "")}) Tj ET`;
      const pdf = `%PDF-1.4\\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>endobj\\n4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\\n5 0 obj<</Length ${stream.length}>>stream\\n${stream}\\nendstream endobj\\ntrailer<</Root 1 0 R>>\\n%%EOF`;
      return res
        .set(
          "Content-Disposition",
          'attachment; filename="kgs-question-import-template.pdf"',
        )
        .type("application/pdf")
        .send(pdf);
    }
    res.status(400).json({ error: "Unsupported template format" });
  },
);

router.get("/questions", authenticate, adminOnly, async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const search = String(req.query.search || "").trim();
  const filter = {};
  if (search)
    filter.$or = [
      { questionText: { $regex: search, $options: "i" } },
      { sectionName: { $regex: search, $options: "i" } },
    ];
  if (req.query.type)
    filter.questionType = String(req.query.type).toUpperCase();
  if (req.query.category) filter.sectionName = String(req.query.category);
  if (req.query.difficulty) filter.difficulty = String(req.query.difficulty);
  if (req.query.status) filter.status = String(req.query.status).toUpperCase();
  const [questions, total, active, draft, types] = await Promise.all([
    Question.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Question.countDocuments(filter),
    Question.countDocuments({
      ...filter,
      status: { $in: ["ACTIVE", "PUBLISHED"] },
    }),
    Question.countDocuments({ ...filter, status: "DRAFT" }),
    Question.aggregate([
      { $match: filter },
      { $project: { type: { $ifNull: ["$questionType", "MCQ"] } } },
      { $group: { _id: "$type", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);
  const categories = await Question.distinct("sectionName", filter);
  res.json({
    questions: questions.map(questionView),
    stats: {
      total,
      active,
      draft,
      byType: types.map((type) => ({ type: type._id, count: type.count })),
    },
    filters: { categories: categories.filter(Boolean) },
    pagination: {
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
    },
  });
});

router.get("/questions/:id", authenticate, adminOnly, async (req, res) => {
  if (!require("mongoose").isValidObjectId(req.params.id))
    return res.status(400).json({ error: "Invalid question ID" });
  const question = await Question.findById(req.params.id).lean();
  if (!question) return res.status(404).json({ error: "Question not found" });
  res.json({ question: questionView(question) });
});

router.patch(
  "/questions/:id/status",
  authenticate,
  adminOnly,
  async (req, res) => {
    if (!require("mongoose").isValidObjectId(req.params.id))
      return res.status(400).json({ error: "Invalid question ID" });
    const status = String(req.body.status || "").toUpperCase();
    if (!["ACTIVE", "INACTIVE"].includes(status))
      return res
        .status(400)
        .json({ error: "Status must be ACTIVE or INACTIVE" });
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ error: "Question not found" });
    if (status === "ACTIVE") {
      const options = Array.isArray(question.options)
        ? question.options.filter((option) => String(option.text || "").trim())
        : [];
      const validIds = new Set(options.map((option) => String(option.id)));
      if (
        question.questionType === "MCQ" &&
        (options.length !== 4 ||
          !question.correctOptionId ||
          !validIds.has(String(question.correctOptionId)))
      )
        return res
          .status(400)
          .json({
            error:
              "This question requires four nonempty options and exactly one valid correct answer before activation.",
          });
      if (
        ["MSQ", "TRUE_FALSE"].includes(question.questionType) &&
        (options.length < 2 ||
          !Array.isArray(question.correctOptionIds) ||
          !question.correctOptionIds.length ||
          question.correctOptionIds.some((id) => !validIds.has(String(id))))
      )
        return res
          .status(400)
          .json({
            error: "This question is missing valid options or correct answers.",
          });
      if (
        !question.questionText ||
        !question.sectionName ||
        !Number.isFinite(Number(question.marks)) ||
        Number(question.marks) <= 0
      )
        return res
          .status(400)
          .json({ error: "This question is missing required information." });
    }
    question.status = status;
    await question.save();
    await AuditLog.create({
      actorId: req.admin?._id,
      actorRole: "ADMIN",
      action:
        status === "ACTIVE" ? "QUESTION_ACTIVATED" : "QUESTION_DEACTIVATED",
      entityType: "Question",
      entityId: question._id,
    });
    res.json({ question: questionView(question) });
  },
);

router.post("/questions", authenticate, adminOnly, async (req, res) => {
  const questionText = String(req.body.questionText || "").trim();
  const questionType = String(req.body.questionType || "MCQ").toUpperCase();
  const category = String(req.body.category || "").trim();
  const difficulty = String(req.body.difficulty || "").toUpperCase();
  const status = String(req.body.status || "DRAFT").toUpperCase();
  const marks = Number(req.body.marks);
  const options = Array.isArray(req.body.options)
    ? req.body.options
        .map((option) => ({
          id: String(option.id || ""),
          text: String(option.text || "").trim(),
        }))
        .filter((option) => option.id && option.text)
    : [];
  const correctOptionIds = Array.isArray(req.body.correctOptionIds)
    ? req.body.correctOptionIds.map(String).filter(Boolean)
    : req.body.correctOptionId
      ? [String(req.body.correctOptionId)]
      : [];
  const acceptedAnswers = Array.isArray(req.body.acceptedAnswers)
    ? req.body.acceptedAnswers
        .map((answer) => String(answer).trim())
        .filter(Boolean)
    : [];
  if (
    !questionText ||
    !category ||
    !["MCQ", "MSQ", "TRUE_FALSE", "SHORT_ANSWER"].includes(questionType) ||
    !["EASY", "MEDIUM", "HARD"].includes(difficulty) ||
    !Number.isFinite(marks) ||
    marks <= 0 ||
    !["DRAFT", "ACTIVE"].includes(status)
  )
    return res
      .status(400)
      .json({
        error: "Complete the required question fields with valid values.",
      });
  if (["MCQ", "MSQ", "TRUE_FALSE"].includes(questionType) && options.length < 2)
    return res
      .status(400)
      .json({ error: "At least two answer options are required." });
  if (
    (questionType === "TRUE_FALSE" &&
      !options.some((option) => ["TRUE", "FALSE"].includes(option.id))) ||
    (questionType === "TRUE_FALSE" && correctOptionIds.length !== 1)
  )
    return res
      .status(400)
      .json({
        error: "True/False questions require exactly one correct answer.",
      });
  if (questionType === "MCQ" && correctOptionIds.length !== 1)
    return res
      .status(400)
      .json({
        error: "Single-choice questions require exactly one correct answer.",
      });
  if (questionType === "MSQ" && correctOptionIds.length < 1)
    return res
      .status(400)
      .json({
        error: "Multiple-choice questions require at least one correct answer.",
      });
  if (questionType === "SHORT_ANSWER" && acceptedAnswers.length < 1)
    return res
      .status(400)
      .json({
        error: "Short-answer questions require at least one accepted answer.",
      });
  if (
    status === "ACTIVE" &&
    (!questionText ||
      (["MCQ", "MSQ", "TRUE_FALSE"].includes(questionType) &&
        (!options.length || !correctOptionIds.length)))
  )
    return res
      .status(400)
      .json({ error: "This question is not complete enough to activate." });
  const normalizedOptions =
    questionType === "TRUE_FALSE"
      ? [
          { id: "TRUE", text: "True" },
          { id: "FALSE", text: "False" },
        ]
      : options;
  const question = await Question.create({
    questionText,
    options: normalizedOptions,
    correctOptionId: questionType === "MCQ" ? correctOptionIds[0] : undefined,
    correctOptionIds,
    acceptedAnswers,
    sectionName: category,
    marks,
    negativeMarks: Number(req.body.negativeMarks || 0),
    status,
    difficulty,
    questionType,
    explanation: String(req.body.explanation || "").trim(),
  });
  await AuditLog.create({
    actorId: req.admin?._id,
    actorRole: "ADMIN",
    action: "QUESTION_CREATED",
    entityType: "Question",
    entityId: question._id,
  });
  res.status(201).json({ question: questionView(question) });
});
const excelCellText = (value) => {
  if (value === null || value === undefined) return "";
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  )
    return String(value);
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value.richText))
    return value.richText.map((part) => String(part?.text || "")).join("");
  if (value.hyperlink !== undefined)
    return excelCellText(value.text || value.hyperlink);
  if (value.result !== undefined) return excelCellText(value.result);
  if (value.text !== undefined) return excelCellText(value.text);
  return "";
};

router.get("/paper-sets", authenticate, adminOnly, async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = String(req.query.status).toUpperCase();
  if (req.query.examId && mongoose.isValidObjectId(req.query.examId))
    filter.examId = req.query.examId;
  if (req.query.search)
    filter.name = { $regex: String(req.query.search).trim(), $options: "i" };
  const sets = await PaperSet.find(filter)
    .populate("examId", "title code")
    .sort({ createdAt: -1 })
    .lean();
  const countFor = (s) =>
    s.blueprint?.automaticRandomization
      ? Number(s.blueprint?.totalQuestions || 50)
      : (s.questionIds || []).length;
  const stats = {
    total: sets.length,
    draft: sets.filter((s) => s.status === "DRAFT").length,
    published: sets.filter((s) => s.status === "PUBLISHED").length,
    questions: sets.reduce((n, s) => n + countFor(s), 0),
  };
  res.json({
    paperSets: sets.map((s) => ({
      ...s,
      id: String(s._id),
      exam: s.examId
        ? {
            id: String(s.examId._id),
            title: s.examId.title,
            code: s.examId.code,
          }
        : null,
      questionCount: countFor(s),
      totalMarks: s.totalMarks ?? s.blueprint?.maximumMarks ?? 0,
    })),
    stats,
  });
});
router.get(
  "/paper-sets/questions/eligible",
  authenticate,
  adminOnly,
  async (req, res) => {
    const filter = { status: "ACTIVE" };
    if (req.query.search)
      filter.questionText = { $regex: String(req.query.search), $options: "i" };
    if (req.query.category) filter.sectionName = String(req.query.category);
    if (req.query.difficulty)
      filter.difficulty = String(req.query.difficulty).toUpperCase();
    res.json({
      questions: (
        await Question.find(filter).sort({ createdAt: -1 }).limit(200).lean()
      ).map(questionView),
    });
  },
);
router.get("/paper-sets/:id", authenticate, adminOnly, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(400).json({ error: "Invalid paper set ID" });
  const set = await PaperSet.findById(req.params.id)
    .populate("examId", "title code totalMarks durationMinutes")
    .populate("questionIds")
    .lean();
  if (!set) return res.status(404).json({ error: "Paper set not found" });
  res.json({ paperSet: { ...set, id: String(set._id) } });
});
router.get(
  "/paper-sets/questions/eligible",
  authenticate,
  adminOnly,
  async (req, res) => {
    const filter = { status: "ACTIVE" };
    if (req.query.search)
      filter.questionText = { $regex: String(req.query.search), $options: "i" };
    if (req.query.category) filter.sectionName = String(req.query.category);
    if (req.query.difficulty)
      filter.difficulty = String(req.query.difficulty).toUpperCase();
    res.json({
      questions: (
        await Question.find(filter).sort({ createdAt: -1 }).limit(200).lean()
      ).map(questionView),
    });
  },
);
router.post("/paper-sets", authenticate, adminOnly, async (req, res) => {
  const {
    name,
    examId,
    description = "",
    durationMinutes,
    totalMarks,
    passingMarks,
    instructions = [],
    questionIds = [],
    automaticRandomization = true,
  } = req.body;
  if (
    !name?.trim() ||
    !mongoose.isValidObjectId(examId) ||
    Number(durationMinutes) <= 0 ||
    Number(totalMarks) <= 0 ||
    Number(passingMarks) <= 0 ||
    Number(passingMarks) > Number(totalMarks)
  )
    return res
      .status(400)
      .json({
        error:
          "Passing marks must be greater than zero and cannot exceed total marks.",
      });
  const exam = await Exam.findById(examId).select("durationMinutes").lean();
  if (!exam)
    return res
      .status(400)
      .json({ error: "The selected examination does not exist." });
  if (Number(durationMinutes) !== Number(exam.durationMinutes))
    return res
      .status(400)
      .json({
        error: "Duration must match the selected examination duration.",
      });
  const duplicate = await PaperSet.findOne({
    examId,
    $or: [
      { name: { $regex: `^${escapeRegex(name.trim())}$`, $options: "i" } },
      { code: name.trim() },
    ],
  });
  if (duplicate)
    return res
      .status(409)
      .json({
        error: "A paper set with this name already exists for the examination.",
      });
  const code = `SET-${Date.now().toString(36).toUpperCase()}`;
  if (automaticRandomization) {
    const previewQuestions = await Question.find({ status: "ACTIVE" })
      .select("_id")
      .lean();
    previewQuestions.sort(() => Math.random() - 0.5);
    const previewQuestionIds = previewQuestions
      .slice(0, 50)
      .map((question) => question._id);
    const set = await PaperSet.create({
      examId,
      code,
      name: name.trim(),
      description,
      durationMinutes: Number(durationMinutes),
      totalMarks: Number(totalMarks),
      passingMarks: Number(passingMarks),
      instructions: Array.isArray(instructions) ? instructions : [],
      questionIds: previewQuestionIds,
      blueprint: {
        totalQuestions: 50,
        maximumMarks: Number(totalMarks),
        automaticRandomization: true,
        topicDistribution: {
          programming: 10,
          operating: 10,
          logical: 20,
          quantitative: 10,
        },
      },
      status: "DRAFT",
      active: false,
    });
    return res
      .status(201)
      .json({ paperSet: { ...set.toObject(), id: String(set._id) } });
  }
  const questions = await Question.find({
    _id: { $in: questionIds },
    status: "ACTIVE",
  })
    .select("_id marks")
    .lean();
  if (questions.length !== new Set(questionIds.map(String)).size)
    return res
      .status(400)
      .json({
        error: "One or more selected questions are unavailable or inactive.",
      });
  const calculatedMarks = questions.reduce(
    (sum, question) => sum + Number(question.marks || 0),
    0,
  );
  if (Number(totalMarks) !== calculatedMarks)
    return res
      .status(400)
      .json({
        error: "Total marks must equal the sum of selected question marks.",
      });
  const set = await PaperSet.create({
    examId,
    code,
    name: name.trim(),
    description,
    durationMinutes: Number(durationMinutes),
    totalMarks: calculatedMarks,
    passingMarks: Number(passingMarks),
    instructions: Array.isArray(instructions) ? instructions : [],
    questionIds: questions.map((q) => q._id),
    blueprint: {
      totalQuestions: questions.length,
      maximumMarks: calculatedMarks,
    },
    status: "DRAFT",
    active: false,
  });
  res
    .status(201)
    .json({ paperSet: { ...set.toObject(), id: String(set._id) } });
});
router.patch("/paper-sets/:id", authenticate, adminOnly, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(400).json({ error: "Invalid paper set ID" });
  const set = await PaperSet.findById(req.params.id);
  if (!set) return res.status(404).json({ error: "Paper set not found" });
  if (set.status === "PUBLISHED")
    return res
      .status(409)
      .json({ error: "Published paper sets cannot be modified." });
  const allowed = [
    "name",
    "description",
    "durationMinutes",
    "totalMarks",
    "passingMarks",
    "instructions",
    "questionIds",
  ];
  for (const key of allowed)
    if (req.body[key] !== undefined) set[key] = req.body[key];
  const exam = await Exam.findById(set.examId).select("durationMinutes").lean();
  if (!exam)
    return res
      .status(400)
      .json({ error: "The selected examination does not exist." });
  if (Number(set.durationMinutes) !== Number(exam.durationMinutes))
    return res
      .status(400)
      .json({
        error: "Duration must match the selected examination duration.",
      });
  const duplicate = await PaperSet.findOne({
    _id: { $ne: set._id },
    examId: set.examId,
    name: { $regex: `^${escapeRegex(set.name || "")}$`, $options: "i" },
  });
  if (duplicate)
    return res
      .status(409)
      .json({
        error: "A paper set with this name already exists for the examination.",
      });
  if (set.blueprint?.automaticRandomization) {
    if (
      Number(set.durationMinutes) <= 0 ||
      Number(set.passingMarks) <= 0 ||
      Number(set.passingMarks) > Number(set.totalMarks)
    )
      return res
        .status(400)
        .json({
          error:
            "Passing marks must be greater than zero and cannot exceed total marks.",
        });
    set.questionIds = [];
    set.blueprint = {
      ...(set.blueprint || {}),
      totalQuestions: 50,
      maximumMarks: Number(set.totalMarks),
      automaticRandomization: true,
      topicDistribution: {
        programming: 10,
        operating: 10,
        logical: 20,
        quantitative: 10,
      },
    };
    await set.save();
    return res.json({ paperSet: { ...set.toObject(), id: String(set._id) } });
  }
  const questions = await Question.find({
    _id: { $in: set.questionIds },
    status: "ACTIVE",
  })
    .select("_id marks")
    .lean();
  if (questions.length !== new Set((set.questionIds || []).map(String)).size)
    return res
      .status(400)
      .json({
        error: "One or more selected questions are unavailable or inactive.",
      });
  const calculatedMarks = questions.reduce(
    (sum, question) => sum + Number(question.marks || 0),
    0,
  );
  if (Number(set.totalMarks) !== calculatedMarks)
    return res
      .status(400)
      .json({
        error: "Total marks must equal the sum of selected question marks.",
      });
  if (
    Number(set.durationMinutes) <= 0 ||
    Number(set.passingMarks) <= 0 ||
    Number(set.passingMarks) > calculatedMarks
  )
    return res
      .status(400)
      .json({
        error:
          "Passing marks must be greater than zero and cannot exceed total marks.",
      });
  set.totalMarks = calculatedMarks;
  set.questionIds = questions.map((q) => q._id);
  set.blueprint = {
    ...(set.blueprint || {}),
    totalQuestions: set.questionIds.length,
    maximumMarks: calculatedMarks,
  };
  await set.save();
  res.json({ paperSet: { ...set.toObject(), id: String(set._id) } });
});
router.post(
  "/paper-sets/:id/validate",
  authenticate,
  adminOnly,
  async (req, res) => {
    const set = await PaperSet.findById(req.params.id).lean();
    if (!set) return res.status(404).json({ error: "Paper set not found" });
    const errors = [];
    const questions = await Question.find({
      _id: { $in: set.questionIds },
    }).lean();
    if (!set.blueprint?.automaticRandomization && !set.questionIds?.length)
      errors.push("At least one question is required.");
    if (
      !set.blueprint?.automaticRandomization &&
      questions.length !== set.questionIds.length
    )
      errors.push("One or more selected questions do not exist.");
    if (
      !set.blueprint?.automaticRandomization &&
      questions.some((q) => q.status !== "ACTIVE")
    )
      errors.push("All selected questions must be active.");
    if (Number(set.passingMarks) <= 0)
      errors.push("Passing marks must be greater than zero.");
    if (Number(set.passingMarks) > Number(set.totalMarks))
      errors.push("Passing marks cannot exceed total marks.");
    if (
      !set.blueprint?.automaticRandomization &&
      questions.some(
        (q) =>
          q.questionType === "MCQ" &&
          (q.options?.length !== 4 ||
            !q.correctOptionId ||
            !q.options.some((o) => o.id === q.correctOptionId)),
      )
    )
      errors.push(
        "Every MCQ must have four options and one valid correct answer.",
      );
    res.json({
      valid: errors.length === 0,
      errors,
      questionCount: questions.length,
    });
  },
);
router.post(
  "/paper-sets/:id/publish",
  authenticate,
  adminOnly,
  async (req, res) => {
    const set = await PaperSet.findById(req.params.id);
    if (!set) return res.status(404).json({ error: "Paper set not found" });
    if (set.status === "PUBLISHED")
      return res.json({ published: true, paperSet: set });
    const questions = await Question.find({
      _id: { $in: set.questionIds },
      status: "ACTIVE",
    }).lean();
    if (
      !set.blueprint?.automaticRandomization &&
      (!questions.length ||
        questions.length !== set.questionIds.length ||
        questions.some(
          (q) =>
            q.questionType === "MCQ" &&
            (q.options?.length !== 4 || !q.correctOptionId),
        ))
    )
      return res.status(409).json({ error: "Paper set validation failed." });
    set.status = "PUBLISHED";
    set.active = true;
    set.publishedAt = new Date();
    set.publishedBy = req.admin?._id;
    if (!set.blueprint?.automaticRandomization)
      set.blueprint = {
        ...(set.blueprint || {}),
        totalQuestions: questions.length,
        maximumMarks: Number(set.totalMarks),
      };
    await set.save();
    res.json({ published: true, paperSet: set });
  },
);

router.get("/students", authenticate, adminOnly, async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const search = String(req.query.search || "").trim();
  const status = String(req.query.status || "").toUpperCase();
  const college = String(req.query.college || "").trim();
  const filter = {};
  if (search)
    filter.$or = [
      { studentId: { $regex: search, $options: "i" } },
      { fullName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  if (["ACTIVE", "SUSPENDED"].includes(status)) filter.accountStatus = status;
  if (college)
    filter.college = { $regex: `^${escapeRegex(college)}$`, $options: "i" };
  const [students, total] = await Promise.all([
    Student.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Student.countDocuments(filter),
  ]);
  const colleges = await Student.aggregate([
    { $match: { college: { $exists: true, $nin: [null, ""] } } },
    {
      $group: {
        _id: { $toLower: "$college" },
        name: { $first: "$college" },
        count: { $sum: 1 },
      },
    },
    { $sort: { name: 1 } },
  ]);
  res.json({
    students: students.map(studentView),
    colleges: colleges.map((item) => ({ name: item.name, count: item.count })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
    },
  });
});

router.get(
  "/students/import-template",
  authenticate,
  adminOnly,
  async (req, res) => {
    if (String(req.query.format || "csv").toLowerCase() === "xlsx") {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Students");
      sheet.addRow([
        "Full Name",
        "Email Address",
        "Phone",
        "College Name",
        "Branch",
        "Pass-out Year",
      ]);
      const header = sheet.getRow(1);
      header.font = { bold: true, color: { argb: "FF173E6A" } };
      header.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE6F1FB" },
      };
      header.alignment = { vertical: "middle" };
      header.height = 22;
      sheet.columns = [
        { width: 28 },
        { width: 36 },
        { width: 18 },
        { width: 32 },
        { width: 24 },
        { width: 16 },
      ];
      sheet.views = [{ state: "frozen", ySplit: 1 }];
      const buffer = await workbook.xlsx.writeBuffer();
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="kgs-student-import-template.xlsx"',
      );
      res
        .type(
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        .send(Buffer.from(buffer));
    } else
      res
        .type("text/csv")
        .send(
          "Full Name,Email Address,Phone,College Name,Branch,Pass-out Year\n",
        );
  },
);

router.get("/students/:id", authenticate, adminOnly, async (req, res) => {
  const student = await Student.findById(req.params.id).lean();
  if (!student) return res.status(404).json({ error: "Student not found" });
  res.json({ student: studentView(student) });
});

router.post("/students", authenticate, adminOnly, async (req, res) => {
  const fullName = String(req.body.fullName || "").trim();
  const email = String(req.body.email || "")
    .toLowerCase()
    .trim();
  const phone = String(req.body.phone || "").trim();
  const college = String(req.body.college || "").trim();
  const branch = String(req.body.branch || "").trim();
  const passOutYear = Number(req.body.passOutYear);
  const current = new Date().getFullYear();
  if (
    fullName.length < 2 ||
    fullName.length > 100 ||
    !emailPattern.test(email) ||
    (phone && !/^[6-9]\d{9}$/.test(phone)) ||
    college.length < 2 ||
    college.length > 150 ||
    !branch ||
    !Number.isInteger(passOutYear) ||
    passOutYear < current - 10 ||
    passOutYear > current + 10
  )
    return res
      .status(400)
      .json({
        error:
          "Provide valid name, email, phone, college, branch, and pass-out year.",
      });
  try {
    const student = await Student.create({
      studentId: await nextStudentId(),
      fullName,
      email,
      phone,
      college,
      branch,
      passOutYear,
      emailVerified: false,
    });
    await AuditLog.create({
      actorId: req.admin?._id,
      actorRole: "ADMIN",
      action: "STUDENT_CREATED",
      entityType: "Student",
      entityId: student._id,
    });
    res.status(201).json({ student: studentView(student) });
  } catch (error) {
    if (error?.code === 11000)
      return res
        .status(409)
        .json({ error: "A student with this email already exists." });
    throw error;
  }
});

router.patch("/students/:id", authenticate, adminOnly, async (req, res) => {
  const updates = {};
  if (req.body.fullName !== undefined)
    updates.fullName = String(req.body.fullName).trim();
  if (req.body.phone !== undefined)
    updates.phone = String(req.body.phone || "").trim();
  if (req.body.email !== undefined)
    updates.email = String(req.body.email).toLowerCase().trim();
  if (req.body.college !== undefined)
    updates.college = String(req.body.college || "").trim();
  if (req.body.branch !== undefined)
    updates.branch = String(req.body.branch || "").trim();
  if (req.body.passOutYear !== undefined)
    updates.passOutYear = Number(req.body.passOutYear);
  if (req.body.accountStatus !== undefined)
    updates.accountStatus = req.body.accountStatus;
  if (
    updates.fullName !== undefined &&
    (updates.fullName.length < 2 || updates.fullName.length > 100)
  )
    return res
      .status(400)
      .json({ error: "Full name must contain 2–100 characters." });
  if (updates.email !== undefined && !emailPattern.test(updates.email))
    return res.status(400).json({ error: "Valid email is required." });
  if (
    updates.phone !== undefined &&
    updates.phone &&
    !/^[6-9]\d{9}$/.test(updates.phone)
  )
    return res.status(400).json({ error: "Phone number is invalid." });
  if (
    updates.college !== undefined &&
    (updates.college.length < 2 || updates.college.length > 150)
  )
    return res
      .status(400)
      .json({ error: "College name must contain 2–150 characters." });
  if (updates.branch !== undefined && !updates.branch)
    return res.status(400).json({ error: "Branch is required." });
  if (
    updates.passOutYear !== undefined &&
    (!Number.isInteger(updates.passOutYear) ||
      updates.passOutYear < new Date().getFullYear() - 10 ||
      updates.passOutYear > new Date().getFullYear() + 10)
  )
    return res.status(400).json({ error: "Pass-out year is invalid." });
  if (
    updates.accountStatus !== undefined &&
    !["ACTIVE", "SUSPENDED"].includes(updates.accountStatus)
  )
    return res.status(400).json({ error: "Invalid student status." });
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true },
    ).lean();
    if (!student) return res.status(404).json({ error: "Student not found" });
    await AuditLog.create({
      actorId: req.admin?._id,
      actorRole: "ADMIN",
      action: "STUDENT_UPDATED",
      entityType: "Student",
      entityId: student._id,
      metadata: { fields: Object.keys(updates) },
    });
    res.json({ student: studentView(student) });
  } catch (error) {
    if (error?.code === 11000)
      return res
        .status(409)
        .json({ error: "A student with this email already exists." });
    throw error;
  }
});

router.post("/students/import", authenticate, adminOnly, async (req, res) => {
  const rows = Array.isArray(req.body.rows) ? req.body.rows : [];
  if (!rows.length || rows.length > 5000)
    return res.status(400).json({ error: "Provide between 1 and 5000 rows." });
  const seen = new Set();
  const valid = [];
  const invalid = [];
  for (const [index, row] of rows.entries()) {
    const rowNumber = row.rowNumber || row.row || index + 2;
    const fullName = String(row.fullName || row.name || "").trim();
    const email = String(row.email || "")
      .toLowerCase()
      .trim();
    const phone = String(row.phone || "").trim();
    const college = String(row.college || row.collegeName || "").trim();
    const branch = String(row.branch || "").trim();
    const passOutYear = Number(row.passOutYear);
    const yearValid =
      Number.isInteger(passOutYear) &&
      passOutYear >= new Date().getFullYear() - 10 &&
      passOutYear <= new Date().getFullYear() + 10;
    if (
      fullName.length < 2 ||
      !emailPattern.test(email) ||
      (phone && !/^[6-9]\d{9}$/.test(phone)) ||
      college.length < 2 ||
      !branch ||
      !yearValid ||
      seen.has(email)
    ) {
      invalid.push({
        row: rowNumber,
        fullName,
        email,
        type: seen.has(email) ? "DUPLICATE" : "INVALID",
        reason: seen.has(email)
          ? "Duplicate — Email already included in this file"
          : "Invalid name, email, phone, college, branch, or pass-out year",
      });
      continue;
    }
    seen.add(email);
    valid.push({
      fullName,
      email,
      phone,
      college,
      branch,
      passOutYear,
      rowNumber,
    });
  }
  const existing = new Set(
    (
      await Student.find({ email: { $in: valid.map((row) => row.email) } })
        .select("email")
        .lean()
    ).map((row) => row.email),
  );
  for (let index = valid.length - 1; index >= 0; index -= 1) {
    if (existing.has(valid[index].email)) {
      invalid.push({
        row: valid[index].rowNumber || "",
        fullName: valid[index].fullName,
        email: valid[index].email,
        type: "DUPLICATE",
        reason: "Duplicate — Email already registered",
      });
      valid.splice(index, 1);
    }
  }
  if (req.body.confirm !== true)
    return res.json({
      preview: true,
      total: valid.length + invalid.length,
      valid: valid.length,
      invalid: invalid.filter((row) => row.type !== "DUPLICATE"),
      duplicates: invalid.filter((row) => row.type === "DUPLICATE"),
      rows: valid,
    });
  let imported = 0;
  const duplicates = [];
  for (const row of valid) {
    try {
      await Student.create({
        ...row,
        studentId: await nextStudentId(),
        emailVerified: false,
      });
      imported += 1;
    } catch (error) {
      if (error?.code === 11000) duplicates.push(row.email);
      else throw error;
    }
  }
  res.status(201).json({ imported, invalid, duplicates });
});

router.post(
  "/students/import-file",
  authenticate,
  adminOnly,
  async (req, res) => {
    const encoded = String(req.body.fileBase64 || "");
    if (!encoded || !/\.(csv|xlsx)$/i.test(String(req.body.fileName || "")))
      return res.status(400).json({ error: "Upload a CSV or XLSX file." });
    try {
      const buffer = Buffer.from(
        encoded.replace(/^data:[^;]+;base64,/, ""),
        "base64",
      );
      let rows = [];
      if (/\.csv$/i.test(req.body.fileName)) {
        const lines = String(buffer)
          .split(/\r?\n/)
          .filter((line) => line.split(",").some((value) => value.trim()));
        const header = (lines.shift() || "").split(",").map((value) =>
          value
            .trim()
            .replace(/^"|"$/g, "")
            .toLowerCase()
            .replace(/[^a-z]/g, ""),
        );
        const fullNameIndex = header.findIndex((value) =>
          ["fullname", "name"].includes(value),
        );
        const emailIndex = header.findIndex((value) =>
          ["email", "emailaddress"].includes(value),
        );
        const phoneIndex = header.indexOf("phone");
        const collegeIndex = header.findIndex((value) =>
          ["college", "collegename"].includes(value),
        );
        const branchIndex = header.indexOf("branch");
        const yearIndex = header.findIndex((value) =>
          ["passoutyear", "graduationyear"].includes(value),
        );
        if (fullNameIndex < 0 || emailIndex < 0)
          return res
            .status(400)
            .json({
              error: "CSV must contain Full Name and Email Address headers.",
            });
        rows = lines.map((line, index) => {
          const values = line
            .split(",")
            .map((value) => value.trim().replace(/^"|"$/g, ""));
          return {
            rowNumber: index + 2,
            fullName: values[fullNameIndex] || "",
            email: values[emailIndex] || "",
            phone: phoneIndex >= 0 ? values[phoneIndex] || "" : "",
            college: collegeIndex >= 0 ? values[collegeIndex] || "" : "",
            branch: branchIndex >= 0 ? values[branchIndex] || "" : "",
            passOutYear: yearIndex >= 0 ? values[yearIndex] || "" : "",
          };
        });
      } else {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        const sheet = workbook.worksheets[0];
        const headers = (sheet.getRow(1).values || []).slice(1).map((value) =>
          excelCellText(value)
            .toLowerCase()
            .trim()
            .replace(/[^a-z]/g, ""),
        );
        const fullNameIndex = headers.findIndex((value) =>
          ["fullname", "name"].includes(value),
        );
        const emailIndex = headers.findIndex((value) =>
          ["email", "emailaddress"].includes(value),
        );
        const phoneIndex = headers.indexOf("phone");
        const collegeIndex = headers.findIndex((value) =>
          ["college", "collegename"].includes(value),
        );
        const branchIndex = headers.indexOf("branch");
        const yearIndex = headers.findIndex((value) =>
          ["passoutyear", "graduationyear"].includes(value),
        );
        if (fullNameIndex < 0 || emailIndex < 0)
          return res
            .status(400)
            .json({
              error: "XLSX must contain Full Name and Email Address headers.",
            });
        sheet.eachRow((row, index) => {
          const values = row.values.slice(1);
          if (index > 1 && values.some((value) => excelCellText(value).trim()))
            rows.push({
              rowNumber: index,
              fullName: excelCellText(values[fullNameIndex]).trim(),
              email: excelCellText(values[emailIndex]).trim(),
              phone:
                phoneIndex >= 0 ? excelCellText(values[phoneIndex]).trim() : "",
              college:
                collegeIndex >= 0
                  ? excelCellText(values[collegeIndex]).trim()
                  : "",
              branch:
                branchIndex >= 0
                  ? excelCellText(values[branchIndex]).trim()
                  : "",
              passOutYear:
                yearIndex >= 0 ? excelCellText(values[yearIndex]).trim() : "",
            });
        });
      }
      req.body.rows = rows;
      req.body.confirm = false;
      const page = rows;
      res.json({ preview: true, rows: page, valid: rows.length, invalid: [] });
    } catch {
      res
        .status(400)
        .json({
          error: "The file could not be read. Check its format and headers.",
        });
    }
  },
);
router.get("/dashboard", authenticate, adminOnly, async (req, res) => {
  const days =
    req.query.range === "week" ? 7 : req.query.range === "quarter" ? 90 : 30;
  const from = new Date(Date.now() - days * 86400000);
  const completedStates = ["SUBMITTED", "AUTO_SUBMITTED", "ADMIN_FINALIZED"];
  const [
    registrations,
    activeExams,
    activeAttempts,
    completedAttempts,
    pendingReviews,
    latestExport,
    recentIncidents,
  ] = await Promise.all([
    Student.countDocuments({ createdAt: { $gte: from } }),
    Exam.countDocuments({ status: "LIVE" }),
    Attempt.countDocuments({ status: "IN_PROGRESS" }),
    Attempt.countDocuments({
      status: { $in: completedStates },
      finalizedAt: { $gte: from },
    }),
    IntegrityEvent.countDocuments({ action: "WARNING" }),
    ReportExport.findOne({ status: "READY" }).sort({ completedAt: -1 }).lean(),
    AuditLog.find({ createdAt: { $gte: from } })
      .sort({ createdAt: -1 })
      .limit(8)
      .lean(),
  ]);
  const [registrationsByDay, completedByDay] = await Promise.all([
    Student.aggregate([
      { $match: { createdAt: { $gte: from } } },
      {
        $group: {
          _id: { $dateToString: { date: "$createdAt", format: "%Y-%m-%d" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Attempt.aggregate([
      {
        $match: {
          status: { $in: completedStates },
          finalizedAt: { $gte: from },
        },
      },
      {
        $group: {
          _id: { $dateToString: { date: "$finalizedAt", format: "%Y-%m-%d" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);
  res.json({
    stats: {
      registrations,
      activeExams,
      activeAttempts,
      completedAttempts,
      pendingReviews,
      latestExport: latestExport?.completedAt || null,
    },
    chart: {
      registrations: registrationsByDay,
      completed: completedByDay,
      from,
      to: new Date(),
    },
    activity: recentIncidents.map((event) => ({
      id: String(event._id),
      action: event.action,
      entityType: event.entityType,
      recordedAt: event.createdAt,
      actorRole: event.actorRole,
    })),
  });
});
module.exports = router;
