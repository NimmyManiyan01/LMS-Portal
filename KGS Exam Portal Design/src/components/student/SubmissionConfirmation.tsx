import { useState } from "react";

interface Props {
  examTitle: string;
  submittedAt: Date;
  marksScored?: number;
  maximumMarks?: number;
  resultsReleased?: boolean;
  onBackToDashboard: () => void;
  onViewMarks?: () => void;
}

export function SubmissionConfirmation({
  examTitle,
  submittedAt,
  marksScored,
  maximumMarks,
  resultsReleased = false,
  onBackToDashboard,
  onViewMarks,
}: Props) {
  const [showToast, setShowToast] = useState(true);

  return (
    <div className="submission-success-page">
      <div className="submission-success-card">
        {showToast && (
          <div className="mb-6 flex items-center justify-between w-full bg-blue-600/90 backdrop-blur-md text-white px-3.5 py-2.5 rounded-lg shadow-md transition-all">
            <div className="flex items-center gap-2">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="shrink-0 text-white"
              >
                <path
                  d="M10 14.167q.354 0 .593-.24.24-.24.24-.594a.8.8 0 0 0-.24-.593.8.8 0 0 0-.594-.24.8.8 0 0 0-.593.24.8.8 0 0 0-.24.593q0 .354.24.594t.593.24m-.834-3.334h1.667v-5H9.166zm.833 7.5a8.1 8.1 0 0 1-3.25-.656 8.4 8.4 0 0 1-2.645-1.781 8.4 8.4 0 0 1-1.782-2.646A8.1 8.1 0 0 1 1.666 10q0-1.73.656-3.25a8.4 8.4 0 0 1 1.782-2.646 8.4 8.4 0 0 1 2.645-1.781A8.1 8.1 0 0 1 10 1.667q1.73 0 3.25.656a8.4 8.4 0 0 1 2.646 1.781 8.4 8.4 0 0 1 1.781 2.646 8.1 8.1 0 0 1 .657 3.25 8.1 8.1 0 0 1-.657 3.25 8.4 8.4 0 0 1-1.78 2.646 8.4 8.4 0 0 1-2.647 1.781 8.1 8.1 0 0 1-3.25.656"
                  fill="currentColor"
                />
              </svg>
              <p className="text-xs font-semibold">
                Success! Your examination submission is fully recorded.
              </p>
            </div>
            <button
              type="button"
              aria-label="close"
              className="active:scale-90 transition-all ml-2 hover:bg-white/20 p-1 rounded"
              onClick={() => setShowToast(false)}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15 5 5 15M5 5l10 10"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        )}

        <div className="success-check">✓</div>
        <div className="eyebrow">SUBMISSION CONFIRMATION</div>
        <h1>Examination Submitted Successfully</h1>
        <div className="submission-details">
          <div>
            <small>EXAM</small>
            <b>{examTitle}</b>
          </div>
          <div>
            <small>SUBMISSION STATUS</small>
            <b>Completed</b>
          </div>
          <div>
            <small>SUBMITTED AT</small>
            <b>
              {submittedAt.toLocaleString("en-IN", {
                dateStyle: "long",
                timeStyle: "short",
              })}
            </b>
          </div>
        </div>
        <p className="submission-recorded">
          Your examination has been recorded.
        </p>
        {resultsReleased && (
          <div className="submission-marks">
            <small>MARKS SCORED</small>
            <strong>
              {marksScored} / {maximumMarks}
            </strong>
          </div>
        )}
        {resultsReleased ? (
          <p className="submission-release">Your marks are available.</p>
        ) : (
          <p className="submission-release">
            Your results will be available after they are released.
          </p>
        )}
        <div className="submission-actions">
          <button className="primary" onClick={onBackToDashboard}>
            Back to Dashboard
          </button>
          {resultsReleased && onViewMarks && (
            <button className="secondary" onClick={onViewMarks}>
              View Marks
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
