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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[760px] max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden text-slate-900"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex-none flex items-start justify-between gap-4 p-5 sm:px-7 sm:py-6 border-b border-slate-100 bg-slate-50/50">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 mb-1">
              EXAMINATION INFORMATION
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight">
              {exam.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-mono font-medium mt-0.5">
              {exam.examCode}
            </p>
          </div>
          <button
            className="flex items-center justify-center w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors text-xl font-medium leading-none cursor-pointer focus:outline-none"
            onClick={onClose}
            aria-label="Close instructions"
          >
            ×
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-7 overflow-y-auto min-h-0 flex-1 flex flex-col gap-5 text-xs sm:text-sm">
          {/* Fact Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50/80 rounded-xl border border-slate-200/80">
            <div className="flex flex-col gap-0.5">
              <small className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                DURATION
              </small>
              <b className="text-xs sm:text-sm font-bold text-slate-900">
                {exam.durationMinutes} minutes
              </b>
            </div>
            <div className="flex flex-col gap-0.5">
              <small className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                QUESTIONS
              </small>
              <b className="text-xs sm:text-sm font-bold text-slate-900">
                {exam.totalQuestions}
              </b>
            </div>
            <div className="flex flex-col gap-0.5">
              <small className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                MAXIMUM MARKS
              </small>
              <b className="text-xs sm:text-sm font-bold text-slate-900">
                {exam.totalMarks}
              </b>
            </div>
            <div className="flex flex-col gap-0.5">
              <small className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                QUESTION TYPE
              </small>
              <b className="text-xs sm:text-sm font-bold text-slate-900">
                Single-answer MCQ
              </b>
            </div>
            <div className="flex flex-col gap-0.5">
              <small className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                CORRECT
              </small>
              <b className="text-xs sm:text-sm font-bold text-emerald-700">
                +{markingScheme.correctMarks ?? 0}
              </b>
            </div>
            <div className="flex flex-col gap-0.5">
              <small className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                INCORRECT
              </small>
              <b className="text-xs sm:text-sm font-bold text-red-700">
                {(markingScheme.incorrectMarks ?? 0) > 0 ? "+" : ""}
                {markingScheme.incorrectMarks ?? 0}
              </b>
            </div>
            <div className="flex flex-col gap-0.5">
              <small className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                UNANSWERED
              </small>
              <b className="text-xs sm:text-sm font-bold text-slate-900">
                {(markingScheme.unansweredMarks ?? 0) > 0 ? "+" : ""}
                {markingScheme.unansweredMarks ?? 0}
              </b>
            </div>
            <div className="flex flex-col gap-0.5">
              <small className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                MAXIMUM ATTEMPTS
              </small>
              <b className="text-xs sm:text-sm font-bold text-slate-900">
                {exam.maxAttempts ?? 1}
              </b>
            </div>
          </div>

          <h3 className="text-base font-bold text-slate-900 mt-1">
            Examination instructions
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-slate-700 font-medium pl-1 leading-relaxed">
            {instructions.map((instruction) => (
              <li key={instruction}>{instruction}</li>
            ))}
          </ol>

          {/* Monitoring Notice */}
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 flex flex-col gap-1 text-xs sm:text-sm">
            <strong className="font-bold text-blue-950">
              Monitoring notice
            </strong>
            <p className="text-blue-900 font-medium leading-relaxed m-0">
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

          {/* Acknowledgement Checkbox */}
          <label className="flex items-center gap-2.5 pt-2 text-xs sm:text-sm font-semibold text-slate-800 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(event) => setAcknowledged(event.target.checked)}
              className="h-4.5 w-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-2 cursor-pointer flex-shrink-0"
            />
            <span>
              I have read and understood the examination instructions.
            </span>
          </label>

          {!acknowledged && (
            <p
              className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200/80 p-3 rounded-xl m-0"
              role="status"
            >
              Please acknowledge the examination instructions to continue.
            </p>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex-none flex items-center justify-end gap-3 p-4 sm:px-7 sm:py-4 border-t border-slate-100 bg-slate-50/50">
          <button
            className="h-10 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 transition-all cursor-pointer shadow-sm"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="h-10 px-5 py-2 text-xs sm:text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm shadow-blue-500/20 border-none"
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
