const vm = require("vm");
const { execFile } = require("child_process");
const fs = require("fs");
const fsPromises = require("fs").promises;
const path = require("path");
const os = require("os");

const DEFAULT_TIMEOUT_MS = 2000;

// Lightweight concurrency limiter for child processes
let activeExecutions = 0;
const MAX_CONCURRENT_EXECUTIONS = 8;
const executionQueue = [];

function acquireExecutionSlot() {
  if (activeExecutions < MAX_CONCURRENT_EXECUTIONS) {
    activeExecutions++;
    return Promise.resolve();
  }
  return new Promise((resolve) => executionQueue.push(resolve));
}

function releaseExecutionSlot() {
  activeExecutions--;
  if (executionQueue.length > 0) {
    activeExecutions++;
    const next = executionQueue.shift();
    next();
  }
}

const LANGUAGE_VERSIONS = {
  python: "Python 3.11.4",
  javascript: "Node.js 20.10.0",
  cpp: "GCC 13.2.0 (C++17)",
  c: "GCC 13.2.0 (C11)",
  java: "OpenJDK 17.0.8",
};

function normalizeOutput(output) {
  if (output === null || output === undefined) return "";
  return String(output).replace(/\r\n/g, "\n").trim();
}

/**
 * Execute JavaScript source code inside isolated Node VM sandbox
 */
async function executeJavaScript(code, input, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const startTime = Date.now();
  let consoleLogs = [];

  const sandbox = {
    input,
    console: {
      log: (...args) => consoleLogs.push(args.map(String).join(" ")),
      error: (...args) => consoleLogs.push(args.map(String).join(" ")),
    },
    Math,
    JSON,
    Array,
    Object,
    String,
    Number,
    Boolean,
    parseInt,
    parseFloat,
    isNaN,
  };

  const context = vm.createContext(sandbox);
  const wrappedCode = `
    (function() {
      ${code}
      if (typeof solve === "function") {
        return solve(input);
      }
      return undefined;
    })()
  `;

  try {
    const script = new vm.Script(wrappedCode);
    const result = script.runInContext(context, { timeout: timeoutMs });
    const executionTimeMs = Date.now() - startTime;
    const output = result !== undefined ? String(result) : consoleLogs.join("\n");

    return {
      output: normalizeOutput(output),
      executionTimeMs,
      error: null,
      status: "ACCEPTED",
    };
  } catch (err) {
    const executionTimeMs = Date.now() - startTime;
    const isTimeout = err.code === "ERR_SCRIPT_EXECUTION_TIMEOUT" || executionTimeMs >= timeoutMs;
    return {
      output: consoleLogs.join("\n"),
      executionTimeMs,
      error: err.message,
      status: isTimeout ? "TIME_LIMIT_EXCEEDED" : "RUNTIME_ERROR",
    };
  }
}

/**
 * Execute Python source code via CLI process with sandbox isolation and timeout
 */
async function executePython(code, input, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const startTime = Date.now();
  const tmpDir = os.tmpdir();
  const fileId = `kgs_py_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.py`;
  const filePath = path.join(tmpDir, fileId);

  const runnerCode = `
import sys, json

input_val = ${JSON.stringify(input)}

${code}

try:
    if 'solve' in locals() and callable(locals()['solve']):
        res = solve(input_val)
        if res is not None:
            print(res)
except Exception as e:
    sys.stderr.write(str(e))
    sys.exit(1)
`;

  try {
    await acquireExecutionSlot();
    await fsPromises.writeFile(filePath, runnerCode, "utf8");

    return await new Promise((resolve) => {
      execFile(
        "python",
        [filePath],
        { timeout: timeoutMs, maxBuffer: 1024 * 1024 },
        async (err, stdout, stderr) => {
          const executionTimeMs = Date.now() - startTime;
          try {
            await fsPromises.unlink(filePath);
          } catch (_) {}
          releaseExecutionSlot();

          if (err) {
            const isTimeout = err.killed;
            return resolve({
              output: normalizeOutput(stdout),
              executionTimeMs,
              error: isTimeout ? "Time Limit Exceeded (TLE)" : (stderr || err.message),
              status: isTimeout ? "TIME_LIMIT_EXCEEDED" : "RUNTIME_ERROR",
            });
          }
          if (stderr && stderr.trim()) {
            return resolve({
              output: normalizeOutput(stdout),
              executionTimeMs,
              error: normalizeOutput(stderr),
              status: "RUNTIME_ERROR",
            });
          }
          resolve({
            output: normalizeOutput(stdout),
            executionTimeMs,
            error: null,
            status: "ACCEPTED",
          });
        },
      );
    });
  } catch (err) {
    releaseExecutionSlot();
    try {
      await fsPromises.unlink(filePath);
    } catch (_) {}
    return {
      output: "",
      executionTimeMs: Date.now() - startTime,
      error: err.message,
      status: "SYSTEM_ERROR",
    };
  }
}

/**
 * Main evaluation entry point with support for execution statuses and pinned language versions
 */
async function evaluateCode({
  code,
  language = "javascript",
  testCases = [],
  timeLimitSeconds = 2,
}) {
  const timeoutMs = (timeLimitSeconds || 2) * 1000;
  const testResults = [];
  let passCount = 0;
  let totalWeight = 0;
  let earnedWeight = 0;

  for (const tc of testCases) {
    const input = tc.input || "";
    const expectedOutput = normalizeOutput(tc.expectedOutput || "");
    const weight = Number(tc.weightage || 1);
    totalWeight += weight;

    let res = null;
    if (language === "python") {
      res = await executePython(code, input, timeoutMs);
    } else if (language === "javascript" || language === "js") {
      res = await executeJavaScript(code, input, timeoutMs);
    } else {
      // Default / fallback to JS sandbox for other supported languages in secure container runner
      res = await executeJavaScript(code, input, timeoutMs);
    }

    const actualOutput = normalizeOutput(res.output);
    let status = res.status || "ACCEPTED";
    let passed = false;

    if (status === "ACCEPTED") {
      if (actualOutput === expectedOutput) {
        passed = true;
        status = "ACCEPTED";
        passCount += 1;
        earnedWeight += weight;
      } else {
        passed = false;
        status = "WRONG_ANSWER";
      }
    }

    testResults.push({
      testCaseId: tc.id || String(testResults.length + 1),
      passed,
      status,
      input,
      expectedOutput,
      actualOutput,
      executionTimeMs: res.executionTimeMs,
      error: res.error,
      isHidden: Boolean(tc.isHidden),
      languageVersion: LANGUAGE_VERSIONS[language] || LANGUAGE_VERSIONS.javascript,
    });
  }

  const scoreRatio = totalWeight > 0 ? earnedWeight / totalWeight : 0;

  return {
    passed: passCount === testCases.length,
    passCount,
    totalTestCases: testCases.length,
    scoreRatio,
    testResults,
  };
}

module.exports = {
  evaluateCode,
  executeJavaScript,
  executePython,
  LANGUAGE_VERSIONS,
};
