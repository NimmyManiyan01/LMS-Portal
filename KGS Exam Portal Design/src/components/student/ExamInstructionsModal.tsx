import { useEffect, useState } from "react";
import { Exam } from "../../types";

interface Props {
  exam: Exam;
  onClose: () => void;
  onContinue: () => void;
}

export function ExamInstructionsModal({
  exam,
  onClose,
  onContinue: continueHandler,
}: Props) {
  const [acknowledged, setAcknowledged] = useState(false);
  const onContinue = () => {
    if (acknowledged) continueHandler();
  };
  useEffect(() => {
    setAcknowledged(false);
  }, [exam.id]);
  const markingScheme = exam.markingScheme || {
    correctMarks: 1,
    incorrectMarks: exam.negativeMarking ? -exam.negativeMarking : 0,
    unansweredMarks: 0,
  };
  const instructions =
    Array.isArray(exam.instructions) && exam.instructions.length > 0
      ? exam.instructions
      : [
          "Read every question carefully.",
          "Select one answer per question.",
          "Use Previous and Next to navigate.",
          "Use Mark for Review to revisit questions.",
          "Answers are saved automatically.",
          "The examination timer continues during disconnections.",
          "Submit before the deadline.",
          "Follow the examination monitoring rules.",
        ];
  return (
    <div className="modal-scrim instructions-scrim" onClick={onClose}>
      <div
        className="modal-card instructions-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <div className="eyebrow">EXAMINATION INFORMATION</div>
            <h2>{exam.title}</h2>
            <p className="muted">{exam.examCode}</p>
          </div>
          <button
            className="close-button"
            onClick={onClose}
            aria-label="Close instructions"
          >
            ×
          </button>
        </div>
        <div className="modal-body instructions-body">
          <div className="instruction-facts">
            <div>
              <small>DURATION</small>
              <b>{exam.durationMinutes} minutes</b>
            </div>
            <div>
              <small>QUESTIONS</small>
              <b>{exam.totalQuestions}</b>
            </div>
            <div>
              <small>MAXIMUM MARKS</small>
              <b>{exam.totalMarks}</b>
            </div>
            <div>
              <small>QUESTION TYPE</small>
              <b>Single-answer MCQ</b>
            </div>
            <div>
              <small>CORRECT</small>
              <b>+{markingScheme.correctMarks ?? 0}</b>
            </div>
            <div>
              <small>INCORRECT</small>
              <b>
                {(markingScheme.incorrectMarks ?? 0) > 0 ? "+" : ""}
                {markingScheme.incorrectMarks ?? 0}
              </b>
            </div>
            <div>
              <small>UNANSWERED</small>
              <b>
                {(markingScheme.unansweredMarks ?? 0) > 0 ? "+" : ""}
                {markingScheme.unansweredMarks ?? 0}
              </b>
            </div>
            <div>
              <small>MAXIMUM ATTEMPTS</small>
              <b>{exam.maxAttempts ?? 1}</b>
            </div>
          </div>
          <h3>Examination instructions</h3>
          <ol>
            {instructions.map((instruction) => (
              <li key={instruction}>{instruction}</li>
            ))}
          </ol>
          <div className="monitoring-notice">
            <strong>Monitoring notice</strong>
            <p>
              {exam.integrityProfile
                ? `${exam.integrityProfile} monitoring is enabled for this examination. `
                : ""}
              Browser visibility and configured fullscreen events may be
              recorded as incidents. Tab-switch incidents generate warnings and
              incident records; they do not automatically submit the
              examination. Camera or microphone access is requested only when
              configured. The portal does not claim to monitor activity outside
              the browser.
            </p>
          </div>
          <label className="instruction-ack">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(event) => setAcknowledged(event.target.checked)}
            />{" "}
            <span>
              I have read and understood the examination instructions.
            </span>
          </label>
          {!acknowledged && (
            <p className="instruction-validation" role="status">
              Please acknowledge the examination instructions to continue.
            </p>
          )}
        </div>
        <div className="modal-footer">
          <button className="secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="primary"
            disabled={!acknowledged}
            onClick={onContinue}
          >
            Continue to System Check →
          </button>
        </div>
      </div>
    </div>
  );
}
