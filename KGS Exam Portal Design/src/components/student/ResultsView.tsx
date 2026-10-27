import { Exam, Question, AnswerState } from '../../types';

interface ResultsViewProps {
  exam: Exam;
  questions: Question[];
  answers: Record<string, AnswerState>;
  onBackToDashboard: () => void;
}

export function ResultsView({ exam, questions, answers, onBackToDashboard }: ResultsViewProps) {
  // The student-facing result is intentionally marks-only. Evaluation details,
  // answer keys, rankings, and qualification decisions remain admin-only.
  let totalScore = 0;

  questions.forEach((q) => {
    const ans = answers[q.id];
    if (ans && ans.selectedOptionId) {
      if (ans.selectedOptionId === q.correctOptionId) {
        totalScore += q.marks;
      } else {
        totalScore -= q.negativeMarks;
      }
    }
  });

  const maxMarks = exam.totalMarks;
  const submissionToken = `SUB-KGS-89421-2025-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  return (
    <div className="results-view">
      <header className="results-header">
        <div>
          <button className="text-button" onClick={onBackToDashboard}>← Back to Dashboard</button>
          <h2>{exam.title} — Examination Marks</h2>
          <p className="muted">Registration ID: KGS25-08421 · Submitted on 24 Feb 2025</p>
        </div>
        <div className="token-pill">
          <small>RECEIPT TOKEN</small>
          <b>{submissionToken}</b>
        </div>
      </header>

      <div className="scorecard-body">
          <div className="kpi-banner">
            <div className="kpi-card highlight">
              <small>TOTAL MARKS</small>
              <strong>{totalScore.toFixed(1)} <span className="denom">/ {maxMarks}</span></strong>
            </div>
          </div>
          <p className="marks-only-note">Your examination marks have been published.</p>
        </div>
    </div>
  );
}
