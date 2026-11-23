const { test } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const AuditLog = require("../src/models/AuditLog");
const { recordCodeExecutionEvent } = require("../src/services/securityLogger");

test("CODE_EXECUTION audit casts string and ObjectId attempt IDs to the same stored reference", async (t) => {
  const attemptId = new mongoose.Types.ObjectId();
  const studentId = new mongoose.Types.ObjectId();
  const entries = [];
  t.mock.method(AuditLog, "create", async (payload) => {
    const entry = new AuditLog(payload);
    assert.equal(entry.validateSync(), undefined);
    entries.push(entry.toObject());
    return entry;
  });

  for (const id of [String(attemptId), attemptId]) {
    recordCodeExecutionEvent({ auth: { sub: String(studentId), role: "STUDENT" }, headers: {} }, {
      attemptId: id, language: "javascript", testResults: [{ passed: true }, { passed: true }], score: 10,
    });
  }

  assert.equal(entries.length, 2);
  for (const entry of entries) {
    assert.equal(entry.action, "CODE_EXECUTION");
    assert.equal(entry.entityId._bsontype, "ObjectId");
    assert.ok(entry.entityId.equals(attemptId));
    assert.ok(entry.actorId.equals(studentId));
    assert.equal(entry.metadata.passCount, 2);
    assert.equal(entry.metadata.totalTestCases, 2);
    assert.equal(entry.metadata.score, 10);
    const query = AuditLog.findOne({ action: entry.action, entityId: String(attemptId) });
    assert.ok(query.cast(AuditLog).entityId.equals(entry.entityId));
  }
});
