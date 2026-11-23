function studentEvaluation(evaluation) {
  return {
    passed: evaluation.passed,
    passCount: evaluation.passCount,
    totalTestCases: evaluation.totalTestCases,
    scoreRatio: evaluation.scoreRatio,
    testResults: evaluation.testResults.filter((result) => result.isHidden === false),
  };
}

module.exports = { studentEvaluation };
