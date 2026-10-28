interface Props { examTitle: string; submittedAt: Date; marksScored?: number; maximumMarks?: number; resultsReleased?: boolean; onBackToDashboard: () => void; onViewMarks?: () => void; }

export function SubmissionConfirmation({ examTitle, submittedAt, marksScored, maximumMarks, resultsReleased = false, onBackToDashboard, onViewMarks }: Props) {
  return (
    <div className="submission-success-page">
      <div className="submission-success-card">
        <div className="success-check">✓</div>
        <div className="eyebrow">SUBMISSION CONFIRMATION</div>
        <h1>Examination Submitted Successfully</h1>
        <div className="submission-details">
          <div><small>EXAM</small><b>{examTitle}</b></div>
          <div><small>SUBMISSION STATUS</small><b>Completed</b></div>
          <div><small>SUBMITTED AT</small><b>{submittedAt.toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })}</b></div>
        </div>
        <p className="submission-recorded">Your examination has been recorded.</p>
        {resultsReleased && <div className="submission-marks"><small>MARKS SCORED</small><strong>{marksScored} / {maximumMarks}</strong></div>}
        {resultsReleased ? <p className="submission-release">Your marks are available.</p> : <p className="submission-release">Your results will be available after they are released.</p>}
        <div className="submission-actions"><button className="primary" onClick={onBackToDashboard}>Back to Dashboard</button>{resultsReleased && onViewMarks && <button className="secondary" onClick={onViewMarks}>View Marks</button>}</div>
      </div>
    </div>
  );
}
