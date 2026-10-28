import { useEffect, useState } from "react";
import { API_BASE_URL, authFetch } from "../../api";

interface ResultsViewProps {
  onBackToDashboard: () => void;
}

export function ResultsView({ onBackToDashboard }: ResultsViewProps) {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    authFetch(`${API_BASE_URL}/api/student/results`, { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok)
          throw new Error(payload.error || "Unable to load results.");
        if (active)
          setResults(Array.isArray(payload) ? payload : payload.results || []);
      })
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof Error ? cause.message : "Unable to load results.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  return (
    <div className="results-view">
      <header className="results-header">
        <div>
          <button className="text-button" onClick={onBackToDashboard}>
            ← Back to Dashboard
          </button>
          <h2>Examination Results</h2>
          <p className="muted">
            Your submitted examinations and published marks.
          </p>
        </div>
      </header>
      <div className="scorecard-body">
        {loading ? (
          <div className="dashboard-empty">Loading results...</div>
        ) : error ? (
          <div className="dashboard-empty">
            <h3>Unable to load results</h3>
            <p>{error}</p>
          </div>
        ) : !results.length ? (
          <div className="dashboard-empty">
            <h3>No results available</h3>
            <p>
              Submitted examinations will appear here when results are released.
            </p>
          </div>
        ) : (
          <div className="student-results-list">
            {results.map((result) => (
              <article className="student-result-card" key={result.attemptId}>
                <div>
                  <small>EXAMINATION</small>
                  <h3>{result.examName}</h3>
                  <p className="muted">{result.examCode || "Examination"}</p>
                </div>
                {result.released ? (
                  <>
                    <div>
                      <small>MARKS SCORED</small>
                      <strong>
                        {result.marksScored === null ||
                        result.marksScored === undefined ||
                        result.maximumMarks === null ||
                        result.maximumMarks === undefined
                          ? "Marks unavailable"
                          : `${result.marksScored} / ${result.maximumMarks}`}
                      </strong>
                    </div>
                    <div>
                      <small>RESULT STATUS</small>
                      <span className="status-pill active">Released</span>
                    </div>
                  </>
                ) : (
                  <div>
                    <strong>Examination Submitted Successfully</strong>
                    <span className="status-pill inactive">
                      Results Awaiting Release
                    </span>
                  </div>
                )}
                <div>
                  <small>SUBMITTED</small>
                  <span>
                    {result.submittedAt
                      ? new Date(result.submittedAt).toLocaleString()
                      : "—"}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
