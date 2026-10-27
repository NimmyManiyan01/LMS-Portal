const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');

function loadFinalizer({ existingResult = null } = {}) {
  const originalLoad = Module._load;
  const attempt = {
    _id: 'attempt-1',
    studentId: 'student-1',
    examId: 'exam-1',
    paperSetId: 'set-1',
    assignedQuestionIds: ['q-1', 'q-2'],
    status: 'IN_PROGRESS',
    integrityCounts: {},
    save: async function () {},
  };
  const result = existingResult || null;
  const session = { withTransaction: async (callback) => callback(), endSession: async () => {} };
  const query = (value) => ({ session() { return this; }, lean: async () => value, then(resolve, reject) { return Promise.resolve(value).then(resolve, reject); } });
  const fakeMongoose = { startSession: async () => session };
  const fakeAttempt = { findOne: () => query(attempt) };
  const fakeAnswer = {
    updateOne: async () => {},
    find: () => query([
      { questionId: 'q-1', selectedOptionId: 'a' },
      { questionId: 'q-2', selectedOptionId: 'wrong' },
    ]),
  };
  const fakeQuestion = { find: () => query([
    { _id: 'q-1', correctOptionId: 'a', marks: 1, negativeMarks: 0.5 },
    { _id: 'q-2', correctOptionId: 'b', marks: 1, negativeMarks: 0.5 },
  ]) };
  const fakeExam = { findById: () => query({ totalMarks: 2, resultReleasePolicy: 'IMMEDIATE', markingScheme: { correctMarks: 1, incorrectMarks: -0.5, unansweredMarks: 0, scoringVersion: 1 } }) };
  const fakeFinalResult = {
    findOne: () => query(result),
    create: async (docs) => [{ ...docs[0], receiptToken: 'SUB-TEST', finalizedAt: new Date() }],
  };
  Module._load = function (request, parent, isMain) {
    if (request === 'mongoose') return fakeMongoose;
    if (request.endsWith('/models/Attempt')) return fakeAttempt;
    if (request.endsWith('/models/Answer')) return fakeAnswer;
    if (request.endsWith('/models/Question')) return fakeQuestion;
    if (request.endsWith('/models/FinalResult')) return fakeFinalResult;
    if (request.endsWith('/models/Exam')) return fakeExam;
    return originalLoad.call(this, request, parent, isMain);
  };
  delete require.cache[require.resolve('../src/services/finalizeAttempt')];
  const loaded = require('../src/services/finalizeAttempt');
  Module._load = originalLoad;
  return loaded.finalizeAttempt;
}

test('manual finalization scores answers and releases immediate results', async () => {
  const finalizeAttempt = loadFinalizer();
  const result = await finalizeAttempt({ attemptId: 'attempt-1', studentId: 'student-1' });
  assert.equal(result.status, 'FINALIZED');
  assert.equal(result.marksScored, 0.5);
  assert.equal(result.maximumMarks, 2);
});

test('repeated finalization returns the existing result without creating another result', async () => {
  const finalizeAttempt = loadFinalizer({ existingResult: { receiptToken: 'SUB-EXISTING', score: 1, maxMarks: 2, finalizedAt: new Date() } });
  const result = await finalizeAttempt({ attemptId: 'attempt-1', studentId: 'student-1' });
  assert.equal(result.status, 'FINALIZED');
  assert.equal(result.receiptToken, 'SUB-EXISTING');
  assert.equal(result.score, 1);
});
