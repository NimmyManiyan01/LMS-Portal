const router = require("express").Router();
const mongoose = require("mongoose");
const ExcelJS = require("exceljs");
const Student = require("../models/Student");
const Exam = require("../models/Exam");
const Attempt = require("../models/Attempt");
const FinalResult = require("../models/FinalResult");
const PaperSet = require("../models/PaperSet");
const ReportExport = require("../models/ReportExport");
const { requirePermission } = require("../middleware/auth");

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function safeCell(value) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /^[\s\u0000-\u001f]*[=+\-@]/.test(text) ? `'${text}` : text;
}
function addRows(sheet, columns, rows) {
  sheet.columns = columns.map((header) => ({ header, key: header }));
  rows.forEach((row) =>
    sheet.addRow(
      Object.fromEntries(
        columns.map((column) => [column, safeCell(row[column])]),
      ),
    ),
  );
  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: "frozen", ySplit: 1 }];
}
async function buildWorkbook(filters = {}) {
  const {
    examId,
    reportType,
    college,
    releaseStatus,
    search,
    status,
    marksFilter,
    minScore,
    maxScore,
  } = filters;

  const query = {};
  if (examId && mongoose.isValidObjectId(examId)) {
    query.examId = examId;
  }

  const results = await FinalResult.find(query)
    .populate("examId", "title code totalMarks")
    .populate("studentId", "studentId fullName email college branch passOutYear createdAt emailVerified phone")
    .sort({ submittedAt: -1, finalizedAt: -1 })
    .lean();

  const exams = await Exam.find({ status: { $ne: "CLOSED" } }).lean();
  const sets = await PaperSet.find({}).lean();
  const selectedColleges = Array.isArray(college)
    ? college.map(String).map((value) => value.trim()).filter(Boolean)
    : college
      ? [String(college).trim()]
      : [];
  const studentFilter = {};
  if (selectedColleges.length) {
    studentFilter.college = {
      $in: selectedColleges.map(
        (value) => new RegExp(`^${escapeRegex(value)}$`, "i"),
      ),
    };
  }
  const normalizedStatus = String(status || "").toUpperCase();
  if (["ACTIVE", "SUSPENDED"].includes(normalizedStatus)) {
    studentFilter.accountStatus = normalizedStatus;
  }
  if (search && String(search).trim()) {
    const term = new RegExp(escapeRegex(String(search).trim()), "i");
    studentFilter.$or = [
      { studentId: term },
      { fullName: term },
      { email: term },
    ];
  }
  const students = await Student.find(studentFilter).lean();
  const examMap = new Map(exams.map((e) => [String(e._id), e]));

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "KGS Exam Portal";

  // Build raw result rows
  let resultRows = results.map((r) => {
    const student = r.studentId || {};
    const exam = r.examId || {};
    const scored = Number(r.marksScored || 0);
    const maxMarks = Number(
      r.maximumMarks ?? r.maxMarks ?? exam?.totalMarks ?? 100,
    );
    const percentage = maxMarks > 0 ? (scored / maxMarks) * 100 : 0;
    const performance =
      percentage >= 75
        ? "Top Scorer"
        : percentage >= 35
          ? "Passed"
          : "Failed";

    return {
      "Student ID": student?.studentId || "—",
      "Student Name": student?.fullName || "—",
      Email: student?.email || "—",
      College: student?.college || "College Not Specified",
      "Exam Name": exam?.title || "—",
      "Exam Code": exam?.code || String(r.examId || "—"),
      "Attempt ID": r.attemptId,
      "Submission Date": r.submittedAt || r.finalizedAt
        ? new Date(r.submittedAt || r.finalizedAt).toLocaleString()
        : "—",
      "Marks Scored": scored,
      "Maximum Marks": maxMarks,
      Percentage: `${Math.round(percentage)}%`,
      Performance: performance,
      "Evaluation Status": "FINALIZED",
      "Release Status": r.releaseStatus || "PENDING",
      _rawScored: scored,
      _rawMax: maxMarks,
      _rawPercentage: percentage,
      _rawReleaseStatus: r.releaseStatus || "PENDING",
      _rawStudentName: student?.fullName || "",
      _rawStudentId: student?.studentId || "",
      _rawEmail: student?.email || "",
      _rawCollege: student?.college || "",
      _rawExamTitle: exam?.title || "",
      _rawExamCode: exam?.code || "",
    };
  });

  // Apply filters to resultRows matching the Results Page filters
  if (selectedColleges.length) {
    const selected = new Set(selectedColleges.map((value) => value.toLowerCase()));
    resultRows = resultRows.filter((r) => selected.has(r._rawCollege.toLowerCase()));
  }

  if (search && String(search).trim()) {
    const term = String(search).trim().toLowerCase();
    resultRows = resultRows.filter((r) =>
      `${r._rawStudentId} ${r._rawStudentName} ${r._rawEmail} ${r._rawExamTitle} ${r._rawExamCode}`
        .toLowerCase()
        .includes(term),
    );
  }

  if (releaseStatus) {
    if (releaseStatus === "RELEASED") {
      resultRows = resultRows.filter((r) => r._rawReleaseStatus === "RELEASED");
    } else if (releaseStatus === "AWAITING") {
      resultRows = resultRows.filter((r) => r._rawReleaseStatus !== "RELEASED");
    }
  }

  const minVal =
    minScore !== undefined && minScore !== null && String(minScore).trim() !== ""
      ? Number(minScore)
      : null;
  const maxVal =
    maxScore !== undefined && maxScore !== null && String(maxScore).trim() !== ""
      ? Number(maxScore)
      : null;

  if (minVal !== null && Number.isFinite(minVal)) {
    resultRows = resultRows.filter((r) => r._rawScored >= minVal);
  }

  if (maxVal !== null && Number.isFinite(maxVal)) {
    resultRows = resultRows.filter((r) => r._rawScored <= maxVal);
  }

  if (marksFilter) {
    resultRows = resultRows.filter((r) => {
      const pct = r._rawPercentage;
      if (marksFilter === "PASSED") return pct >= 35;
      if (marksFilter === "FAILED") return pct < 35;
      if (marksFilter === "HIGH") return pct >= 75;
      if (marksFilter === "AVERAGE") return pct >= 40 && pct < 75;
      if (marksFilter === "LOW") return pct < 40;
      return true;
    });
  }

  if (reportType !== "RESULTS") addRows(
    workbook.addWorksheet("Student Registration"),
    [
      "Student ID",
      "Name",
      "Email",
      "Phone",
      "College",
      "Branch",
      "Pass-out Year",
      "Email Verified",
      "Registered At",
    ],
    students.map((s) => ({
      "Student ID": s.studentId,
      Name: s.fullName,
      Email: s.email,
      Phone: s.phone,
      College: s.college,
      Branch: s.branch,
      "Pass-out Year": s.passOutYear,
      "Email Verified": s.emailVerified ? "Yes" : "No",
      "Registered At": s.createdAt,
    })),
  );

  addRows(
    workbook.addWorksheet("Examination Results"),
    [
      "Student ID",
      "Student Name",
      "Email",
      "College",
      "Exam Name",
      "Exam Code",
      "Attempt ID",
      "Submission Date",
      "Marks Scored",
      "Maximum Marks",
      "Percentage",
      "Performance",
      "Evaluation Status",
      "Release Status",
    ],
    resultRows,
  );

  const filteredAttemptIds = new Set(resultRows.map((r) => r["Attempt ID"]));
  const filteredResults = results.filter((r) => filteredAttemptIds.has(r.attemptId));

  const summary = sets.map((set) => {
    const marks = filteredResults
      .filter((r) => String(r.assignedSetId) === String(set._id))
      .map((r) => Number(r.marksScored));
    return {
      "Exam ID": examMap.get(String(set.examId))?.code || String(set.examId),
      "Set ID": set.code,
      Candidates: marks.length,
      "Mean Marks": marks.length
        ? (marks.reduce((a, b) => a + b, 0) / marks.length).toFixed(1)
        : 0,
      "Lowest Marks": marks.length ? Math.min(...marks) : 0,
      "Highest Marks": marks.length ? Math.max(...marks) : 0,
    };
  });

  if (reportType !== "RESULTS") addRows(
    workbook.addWorksheet("Set Summary"),
    [
      "Exam ID",
      "Set ID",
      "Candidates",
      "Mean Marks",
      "Lowest Marks",
      "Highest Marks",
    ],
    summary,
  );

  return workbook;
}
router.post(
  "/exports",
  ...requirePermission("reports:read"),
  async (req, res) => {
    const record = await ReportExport.create({
      requestedBy: req.auth.sub,
      examId: req.body.examId || undefined,
      filters: req.body,
    });
    try {
      await buildWorkbook(req.body);
      record.status = "READY";
      record.completedAt = new Date();
      record.fileName = `kgs-exam-report-${record.id}.xlsx`;
      await record.save();
      res.status(201).json({
        exportId: record.id,
        status: record.status,
        fileName: record.fileName,
        completedAt: record.completedAt,
      });
    } catch (error) {
      record.status = "FAILED";
      record.error = error.message;
      await record.save();
      res.status(500).json({ error: "Report generation failed" });
    }
  },
);
router.get(
  "/exports/:exportId",
  ...requirePermission("reports:read"),
  async (req, res) => {
    const record = await ReportExport.findOne({
      _id: req.params.exportId,
      requestedBy: req.auth.sub,
    });
    if (!record) return res.status(404).json({ error: "Export not found" });
    res.json(record);
  },
);
router.get(
  "/exports/:exportId/download",
  ...requirePermission("reports:read"),
  async (req, res) => {
    const record = await ReportExport.findOne({
      _id: req.params.exportId,
      requestedBy: req.auth.sub,
      status: "READY",
    });
    if (!record)
      return res.status(404).json({ error: "Ready export not found" });
    const workbook = await buildWorkbook(
      record.filters || { examId: record.examId },
    );
    res.attachment(record.fileName);
    await workbook.xlsx.write(res);
    res.end();
  },
);
module.exports = router;
