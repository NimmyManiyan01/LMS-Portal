import { Question, AnswerState } from '../../types';

interface SubmissionModalProps {
  onClose: () => void;
  onConfirmSubmit: () => void;
  questions: Question[];
  answers: Record<string, AnswerState>;
  examTitle: string;
  submitting?: boolean;
  error?: string;
}

export function SubmissionModal({ onClose, onConfirmSubmit, questions, answers, examTitle, submitting = false, error = '' }: SubmissionModalProps) {
  let answeredCount = 0;
  let markedCount = 0;
  let unvisitedCount = 0;
  let unansweredCount = 0;

  questions.forEach((q) => {
    const st = answers[q.id];
    if (!st || !st.visited) {
      unvisitedCount++;
    } else if (st.selectedOptionId) {
      answeredCount++;
    } else {
      unansweredCount++;
    }
    if (st?.isMarkedForReview) {
      markedCount++;
    }
  });

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal-card submission-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="eyebrow">ATTEMPT SUMMARY</div>
            <h2>Submit Examination</h2>
            <p className="muted">{examTitle}</p>
          </div>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <p>Are you sure you want to finalize your exam attempt? Once submitted, you cannot modify your responses.</p>
          {error && <div className="error-alert" role="alert">{error}</div>}

          <div className="summary-table">
            <div className="summary-row">
              <span>Total Questions</span>
              <strong>{questions.length}</strong>
            </div>
            <div className="summary-row green">
              <span>Answered Questions</span>
              <strong>{answeredCount}</strong>
            </div>
            <div className="summary-row red">
              <span>Unanswered Questions</span>
              <strong>{unansweredCount + unvisitedCount}</strong>
            </div>
            <div className="summary-row purple">
              <span>Marked for Review</span>
              <strong>{markedCount}</strong>
            </div>
          </div>

          {(unansweredCount > 0 || unvisitedCount > 0) && (
            <div className="warning-callout">
              ⚠️ You have <strong>{unansweredCount + unvisitedCount} unanswered question(s)</strong>. Unanswered questions earn 0 marks.
            </div>
          )}
        </div>

        <div className="modal-footer">
          {submitting && <span className="muted">Submitting your examination...</span>}
          <button className="secondary" onClick={onClose}>Return to Test</button>
          <button className="primary submit-final" disabled={submitting} onClick={onConfirmSubmit}>
            Yes, Finalize & Submit →
          </button>
        </div>
      </div>
    </div>
  );
}
