const router = require("express").Router();
const ExcelJS = require("exceljs");
const Student = require("../models/Student");
const Exam = require("../models/Exam");
const Attempt = require("../models/Attempt");
const FinalResult = require("../models/FinalResult");
const PaperSet = require("../models/PaperSet");
const ReportExport = require("../models/ReportExport");
const { requirePermission } = require("../middleware/auth");

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
async function buildWorkbook(examId) {
  const [students, exams, results, attempts, sets] = await Promise.all([
    Student.find({}).lean(),
    Exam.find(examId ? { _id: examId } : {}).lean(),
    FinalResult.find(examId ? { examId } : {}).lean(),
    Attempt.find(examId ? { examId } : {}).lean(),
    PaperSet.find(examId ? { examId } : {}).lean(),
  ]);
  const examMap = new Map(exams.map((e) => [String(e._id), e]));
  const studentMap = new Map(students.map((s) => [String(s._id), s]));
  const setMap = new Map(sets.map((s) => [String(s._id), s]));
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "KGS Exam Portal";
  addRows(
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
      "Exam ID",
      "Exam Name",
      "Marks Scored",
      "Maximum Marks",
      "Attempt Status",
      "Submission Reason",
      "Submitted At",
      "Finalized At",
      "Paper Set ID",
    ],
    results.map((r) => ({
      "Student ID": studentMap.get(String(r.studentId))?.studentId,
      "Exam ID": examMap.get(String(r.examId))?.code || String(r.examId),
      "Exam Name": examMap.get(String(r.examId))?.title,
      "Marks Scored": r.marksScored,
      "Maximum Marks": r.maximumMarks,
      "Attempt Status": attempts.find(
        (a) => String(a._id) === String(r.attemptId),
      )?.status,
      "Submission Reason": r.reason,
      "Submitted At": r.submittedAt,
      "Finalized At": r.finalizedAt,
      "Paper Set ID":
        setMap.get(String(r.assignedSetId))?.code || String(r.assignedSetId),
    })),
  );
  const summary = sets.map((set) => {
    const marks = results
      .filter((r) => String(r.assignedSetId) === String(set._id))
      .map((r) => Number(r.marksScored));
    return {
      "Exam ID": examMap.get(String(set.examId))?.code || String(set.examId),
      "Set ID": set.code,
      Candidates: marks.length,
      "Mean Marks": marks.length
        ? marks.reduce((a, b) => a + b, 0) / marks.length
        : 0,
      "Lowest Marks": marks.length ? Math.min(...marks) : 0,
      "Highest Marks": marks.length ? Math.max(...marks) : 0,
    };
  });
  addRows(
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
      await buildWorkbook(req.body.examId);
      record.status = "READY";
      record.completedAt = new Date();
      record.fileName = `kgs-exam-report-${record.id}.xlsx`;
      await record.save();
      res
        .status(201)
        .json({
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
    const workbook = await buildWorkbook(record.examId);
    res.attachment(record.fileName);
    await workbook.xlsx.write(res);
    res.end();
  },
);
module.exports = router;
