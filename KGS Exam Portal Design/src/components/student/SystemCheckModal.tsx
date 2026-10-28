import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../../api";

interface Props {
  onClose: () => void;
  onProceedToExam: () => void;
  examTitle: string;
  examId?: string;
  scheduledAt?: string;
  closesAt?: string;
  requirements?: {
    camera?: boolean;
    microphone?: boolean;
    fullscreen?: boolean;
  };
}
type State = "PENDING" | "CHECKING" | "PASSED" | "FAILED" | "NOT_REQUIRED";
type Key = "browser" | "network" | "camera" | "microphone" | "fullscreen";
const api = API_BASE_URL;
const name = () =>
  /Edg\//.test(navigator.userAgent)
    ? "Microsoft Edge"
    : /Chrome\//.test(navigator.userAgent)
      ? "Google Chrome"
      : /Firefox\//.test(navigator.userAgent)
        ? "Mozilla Firefox"
        : /Safari\//.test(navigator.userAgent)
          ? "Safari"
          : "Unknown browser";

export function SystemCheckModal({
  onClose,
  onProceedToExam,
  examTitle,
  examId,
  scheduledAt,
  closesAt,
  requirements = {},
}: Props) {
  const req = useMemo(
    () => ({
      camera: !!requirements.camera,
      microphone: !!requirements.microphone,
      fullscreen: !!requirements.fullscreen,
    }),
    [requirements],
  );
  const initial = (): Record<Key, State> => ({
    browser: "PENDING",
    network: "PENDING",
    camera: req.camera ? "PENDING" : "NOT_REQUIRED",
    microphone: req.microphone ? "PENDING" : "NOT_REQUIRED",
    fullscreen: req.fullscreen ? "PENDING" : "NOT_REQUIRED",
  });
  const [checks, setChecks] = useState(initial);
  const [active, setActive] = useState<Key>("browser");
  const [error, setError] = useState("");
  const [browser, setBrowser] = useState("");
  useEffect(() => {
    setChecks(initial());
    setActive("browser");
    setError("");
  }, [req]);
  const set = (key: Key, value: State) =>
    setChecks((current) => ({ ...current, [key]: value }));
  const runBrowser = () => {
    set("browser", "CHECKING");
    setError("");
    const ok = !!(
      window.fetch &&
      window.localStorage &&
      document.documentElement.requestFullscreen &&
      document.fullscreenEnabled !== false
    );
    setBrowser(name());
    set("browser", ok ? "PASSED" : "FAILED");
    if (!ok)
      setError("This browser does not provide all required capabilities.");
  };
  const runNetwork = async () => {
    set("network", "CHECKING");
    setError("");
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(`${api}/api/health`, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error();
      set("network", "PASSED");
    } catch {
      set("network", "FAILED");
      setError(
        "The examination service could not be reached. Check your connection and retry.",
      );
    } finally {
      window.clearTimeout(timer);
    }
  };
  const runMedia = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      if (req.camera) set("camera", "FAILED");
      if (req.microphone) set("microphone", "FAILED");
      setError("Media permissions are not supported by this browser.");
      return;
    }
    set("camera", req.camera ? "CHECKING" : "NOT_REQUIRED");
    set("microphone", req.microphone ? "CHECKING" : "NOT_REQUIRED");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: req.camera,
        audio: req.microphone,
      });
      stream.getTracks().forEach((track) => track.stop());
      if (req.camera) set("camera", "PASSED");
      if (req.microphone) set("microphone", "PASSED");
    } catch {
      if (req.camera) set("camera", "FAILED");
      if (req.microphone) set("microphone", "FAILED");
      setError("Required camera or microphone permission was not granted.");
    }
  };
  const runFullscreen = async () => {
    set("fullscreen", "CHECKING");
    setError("");
    try {
      if (!document.fullscreenElement)
        await document.documentElement.requestFullscreen();
      set("fullscreen", "PASSED");
    } catch {
      set("fullscreen", "FAILED");
      setError("Fullscreen permission was not granted.");
    }
  };
  const allPassed = (Object.keys(checks) as Key[]).every(
    (key) => checks[key] === "PASSED" || checks[key] === "NOT_REQUIRED",
  );
  const items: { key: Key; label: string }[] = [
    { key: "browser", label: "Browser" },
    { key: "network", label: "Network" },
    { key: "camera", label: "Camera" },
    { key: "microphone", label: "Microphone" },
    { key: "fullscreen", label: "Fullscreen" },
  ];
  const text = (value: State) => value.replace("_", " ");
  const accessOpen =
    !scheduledAt || new Date(scheduledAt).getTime() <= Date.now();
  const launch = () => {
    if (!allPassed) {
      setError("Complete all required checks before launching the exam.");
      return;
    }
    if (!accessOpen) {
      setError(
        `Your examination is scheduled for ${new Date(scheduledAt as string).toLocaleString()}. You can enter the examination when the permitted access window opens.`,
      );
      return;
    }
    if (closesAt && new Date(closesAt).getTime() <= Date.now()) {
      setError("The examination access window has ended.");
      return;
    }
    if (examId) {
      localStorage.setItem(`kgs_readiness_${examId}`, "PASSED");
    }
    onClose();
    onProceedToExam();
  };
  return (
    <div className="modal-scrim readiness-scrim" onClick={onClose}>
      <div
        className="modal-card readiness-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <div className="eyebrow">PRE-EXAM DIAGNOSTICS</div>
            <h2>System Readiness Verification</h2>
            <p className="muted">{examTitle}</p>
          </div>
          <button
            className="close-button"
            onClick={onClose}
            aria-label="Close readiness check"
          >
            ×
          </button>
        </div>
        <div className="readiness-stepper" aria-label="Readiness checks">
          {items.map((item) => (
            <button
              key={item.key}
              className={`readiness-step ${active === item.key ? "active" : ""} ${checks[item.key] === "PASSED" ? "passed" : ""}`}
              onClick={() => setActive(item.key)}
            >
              <span>{checks[item.key] === "PASSED" ? "✓" : item.label[0]}</span>
              <b>{item.label}</b>
              <small>{text(checks[item.key])}</small>
            </button>
          ))}
        </div>
        <div className="modal-body step-content">
          {active === "browser" && (
            <div className="check-box">
              <h4>Browser compatibility</h4>
              <p>
                We verify the browser capabilities required by this examination.
              </p>
              <div
                className={`result-badge ${checks.browser === "PASSED" ? "success" : "failure"}`}
              >
                {checks.browser === "PASSED"
                  ? `✓ ${browser} supports the required capabilities.`
                  : "Browser check not passed."}
              </div>
              <button
                className="primary"
                onClick={() => {
                  runBrowser();
                  setActive("network");
                }}
              >
                Run Browser Check →
              </button>
            </div>
          )}
          {active === "network" && (
            <div className="check-box">
              <h4>Network connectivity</h4>
              <p>We verify connectivity to the KGS examination service.</p>
              <div className="result-badge">
                {checks.network === "CHECKING"
                  ? "Checking service connectivity..."
                  : checks.network === "PASSED"
                    ? "✓ Backend service is reachable."
                    : checks.network === "FAILED"
                      ? "Network check failed."
                      : "Check not completed."}
              </div>
              <button
                className="primary"
                onClick={() => {
                  void runNetwork();
                }}
              >
                {checks.network === "FAILED"
                  ? "Retry Network Check"
                  : "Run Network Check"}{" "}
                →
              </button>
            </div>
          )}
          {(active === "camera" || active === "microphone") && (
            <div className="check-box">
              <h4>Camera and microphone</h4>
              <p>
                {req.camera || req.microphone
                  ? "This examination requires the configured permissions."
                  : "Camera and microphone are not required."}
              </p>
              <div className="result-badge">
                {req.camera || req.microphone
                  ? "Permission check required."
                  : "Not required for this examination."}
              </div>
              {(req.camera || req.microphone) && (
                <button
                  className="primary"
                  onClick={() => {
                    void runMedia();
                  }}
                >
                  Check Required Permissions →
                </button>
              )}
            </div>
          )}
          {active === "fullscreen" && (
            <div className="check-box">
              <h4>Fullscreen</h4>
              <p>
                {req.fullscreen
                  ? "Fullscreen is required for this examination."
                  : "Fullscreen is not required for this examination."}
              </p>
              <div className="result-badge">
                {checks.fullscreen === "PASSED"
                  ? "✓ Fullscreen verified."
                  : checks.fullscreen === "FAILED"
                    ? "Fullscreen check failed."
                    : checks.fullscreen === "NOT_REQUIRED"
                      ? "Not required for this examination."
                      : "Check not completed."}
              </div>
              {req.fullscreen && (
                <button
                  className="primary"
                  onClick={() => {
                    void runFullscreen();
                  }}
                >
                  Test Fullscreen Mode
                </button>
              )}
            </div>
          )}
          {error && (
            <p className="readiness-error" role="alert">
              {error}
            </p>
          )}
        </div>
        <div className="modal-footer">
          <button className="secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="primary" disabled={!allPassed} onClick={launch}>
            Launch Exam Environment →
          </button>
        </div>
      </div>
    </div>
  );
}
