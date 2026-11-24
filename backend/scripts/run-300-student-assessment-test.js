/**
 * 300-Student Concurrent Assessment Stress Test
 * 
 * Verifies that the deployed Azure backend handles 300 parallel students
 * attending, answering, and submitting an assessment without errors.
 */
const mongoose = require("mongoose");
const crypto = require("node:crypto");
const path = require("node:path");

const MONGO_URI = "mongodb+srv://harshavardhandevang_db_user:WidTX3FijxB03ePR@cluster0.rtgs8it.mongodb.net/exam-portal";
const SESSION_SECRET = "be63173c24c88e6f3641dcb272460782e551bd367fa2c5b36b4f6b429695def1";
const BASE_URL = process.env.TARGET_URL || "https://kgs-lms-backend-cafdhmc2gtdtfde4.centralindia-01.azurewebsites.net";
const TOTAL_STUDENTS = 300;
const ANSWERS_PER_STUDENT = 5;

const hashSession = (value) =>
  crypto.createHmac("sha256", SESSION_SECRET).update(value).digest("hex");

// Latency tracker helper
class StatsTracker {
  constructor() {
    this.requests = [];
  }

  record(endpoint, method, status, durationMs, error = null) {
    this.requests.push({
      endpoint,
      method,
      status,
      durationMs,
      error,
      timestamp: Date.now(),
    });
  }

  summary() {
    const total = this.requests.length;
    const successes = this.requests.filter((r) => r.status >= 200 && r.status < 300).length;
    const failures = total - successes;
    const latencies = this.requests.map((r) => r.durationMs).sort((a, b) => a - b);

    const percentile = (p) => {
      if (!latencies.length) return 0;
      const idx = Math.min(Math.floor((p / 100) * latencies.length), latencies.length - 1);
      return latencies[idx];
    };

    const avg = latencies.length
      ? Math.round((latencies.reduce((sum, v) => sum + v, 0) / latencies.length) * 10) / 10
      : 0;

    // Per-endpoint breakdown
    const endpoints = {};
    for (const r of this.requests) {
      const key = `${r.method} ${r.endpoint}`;
      if (!endpoints[key]) {
        endpoints[key] = { count: 0, successes: 0, failures: 0, latencies: [] };
      }
      endpoints[key].count += 1;
      if (r.status >= 200 && r.status < 300) endpoints[key].successes += 1;
      else endpoints[key].failures += 1;
      endpoints[key].latencies.push(r.durationMs);
    }

    const endpointBreakdown = {};
    for (const [key, data] of Object.entries(endpoints)) {
      data.latencies.sort((a, b) => a - b);
      const epAvg = Math.round((data.latencies.reduce((s, v) => s + v, 0) / data.latencies.length) * 10) / 10;
      endpointBreakdown[key] = {
        total: data.count,
        success: data.successes,
        failed: data.failures,
        minMs: data.latencies[0],
        maxMs: data.latencies[data.latencies.length - 1],
        avgMs: epAvg,
        p50Ms: data.latencies[Math.floor(data.latencies.length * 0.5)],
        p95Ms: data.latencies[Math.min(Math.floor(data.latencies.length * 0.95), data.latencies.length - 1)],
      };
    }

    return {
      totalRequests: total,
      successfulRequests: successes,
      failedRequests: failures,
      successRatePct: total ? Math.round((successes / total) * 1000) / 10 : 0,
      minLatencyMs: latencies[0] || 0,
      maxLatencyMs: latencies[latencies.length - 1] || 0,
      avgLatencyMs: avg,
      p50Ms: percentile(50),
      p90Ms: percentile(90),
      p95Ms: percentile(95),
      p99Ms: percentile(99),
      endpointBreakdown,
    };
  }
}

async function httpRequest(url, options = {}) {
  const start = Date.now();
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(options.headers || {}),
      },
    });
    const duration = Date.now() - start;
    let body = null;
    try {
      body = await res.json();
    } catch {
      // empty or non-json body
    }
    return { status: res.status, ok: res.ok, body, duration };
  } catch (err) {
    const duration = Date.now() - start;
    return { status: 0, ok: false, error: err.message, duration };
  }
}

async function runBenchmark() {
  console.log("==================================================================");
  console.log(` Starting 300-Student Parallel Assessment Benchmark against:`);
  console.log(` Target Backend: ${BASE_URL}`);
  console.log("==================================================================");

  await mongoose.connect(MONGO_URI, { maxPoolSize: 10 });
  console.log("[Setup] Connected to MongoDB Atlas.");

  const Student = require("../src/models/Student");
  const Exam = require("../src/models/Exam");
  const PaperSet = require("../src/models/PaperSet");
  const Session = require("../src/models/Session");
  const Attempt = require("../src/models/Attempt");
  const Answer = require("../src/models/Answer");
  const FinalResult = require("../src/models/FinalResult");
  const Question = require("../src/models/Question");

  // 1. Clean previous benchmark data if present
  console.log("[Setup] Cleaning prior benchmark data...");
  const oldStudents = await Student.find({ email: /@kaizentrix\.benchmark$/ }).select("_id").lean();
  const oldStudentIds = oldStudents.map((s) => s._id);
  if (oldStudentIds.length) {
    const oldAttempts = await Attempt.find({ studentId: { $in: oldStudentIds } }).select("_id").lean();
    const oldAttemptIds = oldAttempts.map((a) => a._id);
    if (oldAttemptIds.length) {
      await Answer.deleteMany({ attemptId: { $in: oldAttemptIds } });
      await FinalResult.deleteMany({ attemptId: { $in: oldAttemptIds } });
      await Attempt.deleteMany({ _id: { $in: oldAttemptIds } });
    }
    await Session.deleteMany({ studentId: { $in: oldStudentIds } });
    await Student.deleteMany({ _id: { $in: oldStudentIds } });
    console.log(`[Setup] Cleaned ${oldStudentIds.length} prior benchmark student records.`);
  }

  // 2. Ensure Benchmark Exam exists and is PUBLISHED
  let exam = await Exam.findOne({ code: "BENCHMARK-300" });
  if (!exam) {
    console.log("[Setup] Creating published Benchmark Exam...");
    exam = await Exam.create({
      code: "BENCHMARK-300",
      title: "KGS 300-Student Concurrent Scalability Benchmark",
      name: "KGS Scalability Benchmark",
      description: "Automated empirical concurrency benchmark for 300+ students",
      examinationType: "MCQ",
      status: "PUBLISHED",
      durationMinutes: 120,
      totalQuestions: 50,
      totalMarks: 50,
      scheduledAt: new Date(Date.now() - 3600000), // opened 1 hour ago
      closesAt: new Date(Date.now() + 86400000), // closes in 24 hours
      readinessRequirements: { camera: false, microphone: false, fullscreen: false },
      markingScheme: { correctMarks: 1, incorrectMarks: 0, unansweredMarks: 0 },
      resultReleasePolicy: "IMMEDIATE",
      maxAttempts: 1,
      eligibility: {},
    });
  }

  // 3. Ensure PaperSet exists in real paper_sets collection with 50 questions
  let paperSet = await PaperSet.findOne({ examId: exam._id });
  if (!paperSet) {
    console.log("[Setup] Selecting questions and creating PaperSet in paper_sets...");
    const sampleQuestions = await Question.find({ status: "ACTIVE" }).select("_id").limit(50).lean();
    paperSet = await PaperSet.create({
      examId: exam._id,
      code: "SET-BENCHMARK-A",
      name: "Set A - 300 Student Benchmark",
      durationMinutes: 120,
      totalMarks: 50,
      status: "PUBLISHED",
      active: true,
      questionIds: sampleQuestions.map((q) => q._id),
      blueprint: {
        totalQuestions: 50,
        maximumMarks: 50,
      },
    });
  }

  console.log(`[Setup] Benchmark Exam ID: ${exam._id} (Status: ${exam.status})`);
  console.log(`[Setup] PaperSet ID: ${paperSet._id} (Questions: ${paperSet.questionIds?.length})`);

  // 4. Create 300 dummy students and sessions in bulk
  console.log(`[Setup] Provisioning ${TOTAL_STUDENTS} dummy students & session tokens...`);
  const studentDocs = [];
  const sessionDocs = [];
  const studentTokens = [];

  for (let i = 1; i <= TOTAL_STUDENTS; i++) {
    const sId = new mongoose.Types.ObjectId();
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashSession(token);

    studentDocs.push({
      _id: sId,
      studentId: `KGS-BENCH-${String(i).padStart(4, "0")}`,
      fullName: `Benchmark Student ${i}`,
      email: `dummy_student_${String(i).padStart(3, "0")}@kaizentrix.benchmark`,
      phone: `98765${String(i).padStart(5, "0")}`,
      college: "Kaizen Global Institute",
      branch: "Computer Science",
      passOutYear: 2026,
      accountStatus: "ACTIVE",
      emailVerified: true,
      privacyAcceptedAt: new Date(),
      monitoringAcceptedAt: new Date(),
      acknowledgementVersion: "1.0",
    });

    sessionDocs.push({
      tokenHash,
      studentId: sId,
      expiresAt: new Date(Date.now() + 8 * 3600 * 1000),
      createdAt: new Date(),
    });

    studentTokens.push({
      studentId: sId,
      email: `dummy_student_${String(i).padStart(3, "0")}@kaizentrix.benchmark`,
      token,
    });
  }

  await Student.insertMany(studentDocs);
  await Session.insertMany(sessionDocs);
  console.log(`[Setup] Successfully provisioned ${studentDocs.length} students & ${sessionDocs.length} sessions.`);

  // 5. Run the Parallel Load Test
  console.log("\n==================================================================");
  console.log(` [EXECUTION] Launching ${TOTAL_STUDENTS} concurrent student workers...`);
  console.log("==================================================================");

  const tracker = new StatsTracker();
  const overallStart = Date.now();

  const studentWorker = async (studentInfo, index) => {
    const authHeaders = { Authorization: `Bearer ${studentInfo.token}` };

    // Step A: Get Instructions
    const instrRes = await httpRequest(`${BASE_URL}/api/exams/${exam._id}/instructions`, {
      method: "GET",
      headers: authHeaders,
    });
    tracker.record("/api/exams/:id/instructions", "GET", instrRes.status, instrRes.duration, instrRes.error);
    if (!instrRes.ok) {
      return { index, success: false, step: "instructions", status: instrRes.status, error: instrRes.body };
    }

    // Step B: Start Exam Attempt
    const startRes = await httpRequest(`${BASE_URL}/api/exams/${exam._id}/start`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({}),
    });
    tracker.record("/api/exams/:id/start", "POST", startRes.status, startRes.duration, startRes.error);
    if (!startRes.ok) {
      return { index, success: false, step: "start", status: startRes.status, error: startRes.body };
    }
    const attemptId = startRes.body?.attemptId;
    if (!attemptId) {
      return { index, success: false, step: "start", error: "Missing attemptId in response" };
    }

    // Step C: Fetch Questions
    const qRes = await httpRequest(`${BASE_URL}/api/attempts/${attemptId}/questions`, {
      method: "GET",
      headers: authHeaders,
    });
    tracker.record("/api/attempts/:id/questions", "GET", qRes.status, qRes.duration, qRes.error);
    if (!qRes.ok) {
      return { index, success: false, step: "questions", status: qRes.status, error: qRes.body };
    }
    const questions = qRes.body?.questions || [];
    if (!questions.length) {
      return { index, success: false, step: "questions", error: "No questions returned" };
    }

    // Step D: Save multiple answers
    const answersToSave = questions.slice(0, ANSWERS_PER_STUDENT);
    const savedAnswers = [];

    for (let qIdx = 0; qIdx < answersToSave.length; qIdx++) {
      const q = answersToSave[qIdx];
      const selectedOptionId = (q.options && q.options[0]?.id) || "A";

      const ansRes = await httpRequest(`${BASE_URL}/api/attempts/${attemptId}/answers/${q.id}`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({
          selectedOptionId,
          version: 1,
          visited: true,
          timeSpentSeconds: 12 + qIdx * 5,
        }),
      });
      tracker.record("/api/attempts/:id/answers/:qid", "PUT", ansRes.status, ansRes.duration, ansRes.error);
      if (!ansRes.ok) {
        return { index, success: false, step: `answer_${qIdx}`, status: ansRes.status, error: ansRes.body };
      }
      savedAnswers.push({ questionId: q.id, selectedOptionId });
    }

    // Step E: Submit Assessment
    const submitRes = await httpRequest(`${BASE_URL}/api/attempts/${attemptId}/submit`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ answers: savedAnswers }),
    });
    tracker.record("/api/attempts/:id/submit", "POST", submitRes.status, submitRes.duration, submitRes.error);
    if (!submitRes.ok) {
      return { index, success: false, step: "submit", status: submitRes.status, error: submitRes.body };
    }

    // Step F: Verify Final Attempt State
    const verifyRes = await httpRequest(`${BASE_URL}/api/attempts/${attemptId}`, {
      method: "GET",
      headers: authHeaders,
    });
    tracker.record("/api/attempts/:id", "GET", verifyRes.status, verifyRes.duration, verifyRes.error);

    return {
      index,
      success: true,
      attemptId,
      finalStatus: verifyRes.body?.status || submitRes.body?.status,
      result: submitRes.body?.finalResult,
    };
  };

  // Run all 300 student workers simultaneously via Promise.all
  console.log(`[Execution] Dispatched all ${TOTAL_STUDENTS} student workers in parallel.`);
  const results = await Promise.all(studentTokens.map((st, idx) => studentWorker(st, idx + 1)));

  const totalTimeSeconds = (Date.now() - overallStart) / 1000;
  console.log(`\n==================================================================`);
  console.log(` [EXECUTION COMPLETE] 300 Workers finished in ${totalTimeSeconds.toFixed(2)}s`);
  console.log("==================================================================");

  // 6. Inspect MongoDB Atlas for Source of Truth verification
  console.log("\n[Source of Truth Verification] Querying live MongoDB Atlas...");
  const newStudentIds = studentTokens.map((s) => s.studentId);
  const dbAttempts = await Attempt.find({ studentId: { $in: newStudentIds } }).lean();
  const dbAttemptIds = dbAttempts.map((a) => a._id);
  const dbAnswers = await Answer.find({ attemptId: { $in: dbAttemptIds } }).lean();
  const dbFinalResults = await FinalResult.find({ attemptId: { $in: dbAttemptIds } }).lean();

  const completedAttempts = dbAttempts.filter((a) => a.status === "SUBMITTED" || a.status === "FINALIZED" || a.status === "EVALUATED");

  const stats = tracker.summary();
  const successfulWorkers = results.filter((r) => r.success).length;
  const failedWorkers = results.filter((r) => !r.success).length;

  const testReport = {
    testDate: new Date().toISOString(),
    targetUrl: BASE_URL,
    totalSimulatedStudents: TOTAL_STUDENTS,
    successfulStudentsCompleted: successfulWorkers,
    failedStudents: failedWorkers,
    totalExecutionDurationSeconds: Number(totalTimeSeconds.toFixed(2)),
    throughputRequestsPerSecond: Number((stats.totalRequests / totalTimeSeconds).toFixed(2)),
    httpPerformance: stats,
    databaseSourceOfTruth: {
      totalStudentAccountsCreated: studentDocs.length,
      totalAttemptsCreatedInDB: dbAttempts.length,
      attemptsFinalizedInDB: completedAttempts.length,
      totalAnswersStoredInDB: dbAnswers.length,
      totalFinalResultsCreatedInDB: dbFinalResults.length,
      allAttemptsSuccessfullyFinalized: completedAttempts.length === TOTAL_STUDENTS,
    },
  };

  console.log("\n--- BENCHMARK RESULTS ---");
  console.log(`Total Concurrent Students: ${testReport.totalSimulatedStudents}`);
  console.log(`Successfully Completed:    ${testReport.successfulStudentsCompleted} / ${testReport.totalSimulatedStudents} (${((successfulWorkers/TOTAL_STUDENTS)*100).toFixed(1)}%)`);
  console.log(`Total HTTP Requests:       ${stats.totalRequests}`);
  console.log(`Successful HTTP Requests:   ${stats.successfulRequests}`);
  console.log(`Failed HTTP Requests:       ${stats.failedRequests}`);
  console.log(`Success Rate:              ${stats.successRatePct}%`);
  console.log(`Total Elapsed Time:        ${testReport.totalExecutionDurationSeconds}s`);
  console.log(`Throughput:                ${testReport.throughputRequestsPerSecond} requests/sec`);
  console.log(`Latency (Min / Avg / Max): ${stats.minLatencyMs}ms / ${stats.avgLatencyMs}ms / ${stats.maxLatencyMs}ms`);
  console.log(`Latency Percentiles:       P50=${stats.p50Ms}ms, P90=${stats.p90Ms}ms, P95=${stats.p95Ms}ms, P99=${stats.p99Ms}ms`);
  console.log("\n--- PER-ENDPOINT BREAKDOWN ---");
  console.table(stats.endpointBreakdown);

  console.log("\n--- DATABASE SOURCE OF TRUTH ---");
  console.log(`Attempts in Database:      ${dbAttempts.length} / ${TOTAL_STUDENTS}`);
  console.log(`Finalized Attempts in DB:  ${completedAttempts.length} / ${TOTAL_STUDENTS}`);
  console.log(`Answers Stored in DB:      ${dbAnswers.length} (Expected: ${TOTAL_STUDENTS * ANSWERS_PER_STUDENT})`);
  console.log(`FinalResults in DB:        ${dbFinalResults.length} / ${TOTAL_STUDENTS}`);

  // Write out artifact file for persistence
  const fs = require("node:fs");
  const reportPath = path.resolve(__dirname, "../benchmark-300-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(testReport, null, 2));
  console.log(`\nFull report written to: ${reportPath}`);

  await mongoose.disconnect();
  console.log("[Completed] Disconnected from MongoDB.");
}

runBenchmark().catch((err) => {
  console.error("Benchmark failed with uncaught exception:", err);
  process.exit(1);
});
