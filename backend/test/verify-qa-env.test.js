const { spawnSync } = require("node:child_process");
const { join } = require("node:path");
const assert = require("node:assert/strict");
const { test } = require("node:test");

function verifyQaEnvironment(overrides, args = []) {
  return spawnSync(process.execPath, [join(__dirname, "../scripts/verify-qa-env.js"), ...args], {
    encoding: "utf8",
    env: {
      ...process.env,
      QA_ENV_FILE: join(__dirname, "missing-test-environment"),
      NODE_ENV: "qa",
      QA_CONFIRMATION: "I_UNDERSTAND_QA_ONLY",
      MONGODB_URI: "mongodb://qa.example.invalid/exam-portal-qa",
      QA_MONGODB_HOST: "qa.example.invalid",
      ...overrides,
    },
  });
}

test("reports verification for a valid QA configuration", () => {
  const result = verifyQaEnvironment();
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /QA environment verified/);
});

test("rejects a non-MongoDB URI before connecting", () => {
  const result = verifyQaEnvironment(
    { MONGODB_URI: "https://qa.example.invalid/exam-portal-qa" },
    ["--connect"],
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /must use mongodb or mongodb\+srv/);
  assert.doesNotMatch(result.stdout, /verified/);
});

test("does not report verification for a rejected QA configuration", () => {
  const result = verifyQaEnvironment({ NODE_ENV: "production" });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /NODE_ENV must be exactly qa/);
  assert.doesNotMatch(result.stdout, /QA environment verified/);
});
