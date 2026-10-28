import { useEffect, useMemo, useState } from "react";
import { DateTimePicker } from "./DateTimePicker";
import { API_BASE_URL, authFetch } from "../../api";
import { AssignStudentsModal } from "./AssignStudentsModal";
const API = API_BASE_URL;
const formatLocalDateTime = (value: string | Date) => {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
const localDateTimeToISOString = (value: string) => {
  if (!value) return value;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : value;
};
const durationBetween = (start: string, end: string) => {
  if (!start || !end) return null;
  const minutes = (new Date(end).getTime() - new Date(start).getTime()) / 60000;
  return Number.isFinite(minutes) ? minutes : null;
};
export function ExaminationsPage({
  Icon,
  PageHead,
}: {
  Icon: any;
  PageHead: any;
}) {
  const [exams, setExams] = useState<any[]>([]),
    [stats, setStats] = useState<any>({}),
    [open, setOpen] = useState(false),
    [editing, setEditing] = useState<any>(null),
    [saving, setSaving] = useState(false),
    [scheduling, setScheduling] = useState(false),
    [scheduleTarget, setScheduleTarget] = useState<any>(null),
    [scheduleSet, setScheduleSet] = useState<any>(null),
    [assignmentTarget, setAssignmentTarget] = useState<any>(null),
    [assignmentStudents, setAssignmentStudents] = useState<any[]>([]),
    [assignmentColleges, setAssignmentColleges] = useState<any[]>([]),
    [assignedIds, setAssignedIds] = useState<string[]>([]),
    [assignmentCollege, setAssignmentCollege] = useState(""),
    [assignmentSearch, setAssignmentSearch] = useState(""),
    [assignmentSaving, setAssignmentSaving] = useState(false),
    [successMessage, setSuccessMessage] = useState(""),
    [message, setMessage] = useState(""),
    [form, setForm] = useState<any>({
      name: "",
      code: "",
      description: "",
      examinationType: "MCQ",
      startAt: "",
      endAt: "",
      durationMinutes: "",
      maxAttempts: 1,
      instructions: "",
      readinessRequirements: {
        camera: false,
        microphone: false,
        fullscreen: false,
      },
      integrityProfile: "BASIC",
      integrityRules: { tabSwitchThreshold: 2 },
      resultReleasePolicy: "ADMIN_CONTROLLED",
    });
  const load = async () => {
    const r = await authFetch(`${API}/api/admin/exams`, {}, true),
      d = await r.json();
    if (!r.ok) return setMessage(d.error || "Unable to load examinations.");
    const list = d.exams || [];
    setExams(list);
    setStats({
      total: list.length,
      draft: list.filter((e: any) => e.status === "DRAFT").length,
      scheduled: list.filter((e: any) => e.status === "SCHEDULED").length,
      active: list.filter((e: any) => ["ACTIVE", "LIVE"].includes(e.status))
        .length,
      completed: list.filter((e: any) =>
        ["COMPLETED", "CLOSED"].includes(e.status),
      ).length,
    });
  };
  useEffect(() => {
    void load();
  }, []);
  const openCreate = async () => {
    const r = await authFetch(`${API}/api/admin/exams/next-code`, {}, true),
      d = await r.json();
    if (!r.ok) return setMessage(d.error || "Unable to generate code.");
    setEditing(null);
    setForm({
      name: "",
      code: d.code,
      description: "",
      examinationType: "MCQ",
      startAt: "",
      endAt: "",
      durationMinutes: "",
      maxAttempts: 1,
      instructions: "",
      readinessRequirements: {
        camera: false,
        microphone: false,
        fullscreen: false,
      },
      integrityProfile: "BASIC",
      integrityRules: { tabSwitchThreshold: 2 },
      resultReleasePolicy: "ADMIN_CONTROLLED",
    });
    setOpen(true);
  };
  const updateDate = (key: string, value: string) =>
    setForm((current: any) => {
      const next = { ...current, [key]: value };
      const duration = durationBetween(
        key === "startAt" ? value : next.startAt,
        key === "endAt" ? value : next.endAt,
      );
      return {
        ...next,
        durationMinutes: duration && duration > 0 ? duration : "",
      };
    });
  const duration = useMemo(
    () => durationBetween(form.startAt, form.endAt),
    [form.startAt, form.endAt],
  );
  const invalidRange = Boolean(
    form.startAt && form.endAt && duration !== null && duration <= 0,
  );
  const save = async () => {
    if (saving) return;
    const start = new Date(form.startAt),
      end = new Date(form.endAt),
      calculated = durationBetween(form.startAt, form.endAt),
      errors: string[] = [];
    if (!form.name.trim()) errors.push("Examination name is required.");
    if (!form.startAt) errors.push("Start date and time are required.");
    if (!form.endAt) errors.push("End date and time are required.");
    if (!editing && form.startAt && start <= new Date())
      errors.push("Start date must be in the future.");
    if (calculated === null || calculated <= 0)
      errors.push("End Date & Time must be later than Start Date & Time.");
    if (!Number.isInteger(Number(calculated)) || Number(calculated) <= 0)
      errors.push("Duration must be a positive number of minutes.");
    if (Number(form.maxAttempts) < 1)
      errors.push("Maximum attempts must be at least 1.");
    if (
      !Number.isInteger(Number(form.integrityRules?.tabSwitchThreshold)) ||
      Number(form.integrityRules?.tabSwitchThreshold) < 1
    )
      errors.push(
        "Tab-switch warning threshold must be a positive whole number.",
      );
    if (errors.length) return setMessage(errors.join(" "));
    setSaving(true);
    const r = await authFetch(
        `${API}/api/admin/exams${editing ? `/${editing.id}` : ""}`,
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            startAt: localDateTimeToISOString(form.startAt),
            endAt: localDateTimeToISOString(form.endAt),
            durationMinutes: calculated,
            ...(editing ? {} : { status: "DRAFT" }),
          }),
        },
        true,
      ),
      d = await r.json();
    setSaving(false);
    if (!r.ok) return setMessage(d.error || "Unable to save examination.");
    setMessage(editing ? "Examination updated." : "Examination created.");
    setOpen(false);
    await load();
  };
  const edit = (e: any) => {
    setEditing(e);
    setForm({
      name: e.title || e.name || "",
      code: e.code || "",
      description: e.description || "",
      examinationType: e.examinationType || "MCQ",
      startAt: e.scheduledAt ? formatLocalDateTime(e.scheduledAt) : "",
      endAt: e.closesAt ? formatLocalDateTime(e.closesAt) : "",
      durationMinutes: e.durationMinutes || "",
      maxAttempts: e.maxAttempts || 1,
      instructions: Array.isArray(e.instructions)
        ? e.instructions.join("\n")
        : "",
      readinessRequirements: {
        camera: Boolean(e.readinessRequirements?.camera),
        microphone: Boolean(e.readinessRequirements?.microphone),
        fullscreen: Boolean(e.readinessRequirements?.fullscreen),
      },
      integrityProfile: e.integrityProfile || "BASIC",
      integrityRules: {
        tabSwitchThreshold: e.integrityRules?.tabSwitchThreshold ?? 2,
      },
      resultReleasePolicy: e.resultReleasePolicy || "ADMIN_CONTROLLED",
    });
    setOpen(true);
  };
  const openSchedule = async (exam: any) => {
    setMessage("");
    setSuccessMessage("");
    try {
      const response = await authFetch(
        `${API}/api/admin/paper-sets?examId=${encodeURIComponent(exam.id)}&status=PUBLISHED`,
        {},
        true,
      );
      const data = await response.json();
      if (!response.ok)
        return setMessage(
          data.error || "Unable to verify published paper sets.",
        );
      const published = data.paperSets?.find(
        (paperSet: any) => paperSet.status === "PUBLISHED",
      );
      if (!published)
        return setMessage(
          "At least one published paper set is required before scheduling.",
        );
      setScheduleTarget(exam);
      setScheduleSet(published);
    } catch (cause) {
      setMessage(
        cause instanceof Error
          ? cause.message
          : "Unable to verify published paper sets.",
      );
    }
  };
  const schedule = async () => {
    if (!scheduleTarget || scheduling) return;
    setScheduling(true);
    try {
      const response = await authFetch(
        `${API}/api/admin/exams/${scheduleTarget.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "SCHEDULED" }),
        },
        true,
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Unable to schedule examination.");
      setScheduleTarget(null);
      setScheduleSet(null);
      setSuccessMessage("Examination scheduled successfully.");
      await load();
    } catch (cause) {
      setMessage(
        cause instanceof Error
          ? cause.message
          : "Unable to schedule examination.",
      );
    } finally {
      setScheduling(false);
    }
  };
  const openAssignment = async (exam: any) => {
    setMessage("");
    try {
      const response = await authFetch(
        `${API}/api/admin/exams/${exam.id}/assignments`,
        {},
        true,
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Unable to load assignment data.");
      setAssignmentTarget({
        ...exam,
        assignmentExam: data.exam,
        assignmentAt: data.assignedAt,
      });
      setAssignmentStudents(data.students || []);
      setAssignmentColleges(data.colleges || []);
      setAssignmentCollege("");
      setAssignedIds(data.assignedStudentIds || []);
    } catch (cause) {
      setMessage(
        cause instanceof Error
          ? cause.message
          : "Unable to load assignment data.",
      );
    }
  };
  const filterAssignmentCollege = async (college: string) => {
    if (!assignmentTarget) return;
    setAssignmentCollege(college);
    const response = await authFetch(
      `${API}/api/admin/exams/${assignmentTarget.id}/assignments?college=${encodeURIComponent(college)}`,
      {},
      true,
    );
    const data = await response.json();
    if (response.ok) setAssignmentStudents(data.students || []);
    else setMessage(data.error || "Unable to filter students by college.");
  };
  const saveAssignments = async () => {
    if (!assignmentTarget || assignmentSaving || !assignedIds.length) return;
    setAssignmentSaving(true);
    try {
      const response = await authFetch(
        `${API}/api/admin/exams/${assignmentTarget.id}/assignments`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentIds: assignedIds }),
        },
        true,
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Unable to assign students.");
      setAssignmentTarget(null);
      setMessage(
        `${data.assignedStudentCount} student${data.assignedStudentCount === 1 ? "" : "s"} assigned successfully.`,
      );
      await load();
    } catch (cause) {
      setMessage(
        cause instanceof Error ? cause.message : "Unable to assign students.",
      );
    } finally {
      setAssignmentSaving(false);
    }
  };
  return (
    <>
      <PageHead
        admin
        student={null}
        title="Examinations"
        description="Create, schedule, and manage examinations."
        showCreateAction={false}
      />
      <div className="student-management-head">
        <div>
          <h2>Examinations</h2>
          <p>Manage the examination lifecycle and scheduling.</p>
        </div>
        <button className="primary" onClick={() => void openCreate()}>
          <Icon name="plus" />
          Create Examination
        </button>
      </div>
      <section className="kpi-grid">
        {[
          ["Total Examinations", "total"],
          ["Draft", "draft"],
          ["Scheduled", "scheduled"],
          ["Active", "active"],
          ["Completed", "completed"],
        ].map(([label, key]) => (
          <article className="kpi" key={key}>
            <small>{label}</small>
            <strong>{stats[key] || 0}</strong>
          </article>
        ))}
      </section>
      {message && <div className="import-notice error">{message}</div>}
      {successMessage && (
        <div className="import-notice success">{successMessage}</div>
      )}
      <div className="panel student-table-panel">
        <div className="table-scroll">
          <table className="student-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Type</th>
                <th>Start</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((e) => (
                <tr key={e.id}>
                  <td>{e.code}</td>
                  <td>{e.title || e.name}</td>
                  <td>{e.examinationType || "MCQ"}</td>
                  <td>
                    {e.scheduledAt
                      ? new Date(e.scheduledAt).toLocaleString()
                      : "—"}
                  </td>
                  <td>
                    {e.durationMinutes ? `${e.durationMinutes} min` : "—"}
                  </td>
                  <td>{e.status}</td>
                  <td>
                    <button className="text-button" onClick={() => edit(e)}>
                      Edit
                    </button>
                    {e.status === "DRAFT" && (
                      <button
                        className="text-button"
                        onClick={() => void openSchedule(e)}
                      >
                        Schedule
                      </button>
                    )}
                    {e.status === "SCHEDULED" && (
                      <button
                        className="text-button"
                        onClick={() => void openAssignment(e)}
                      >
                        Assign Students
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {open && (
        <div className="modal-backdrop">
          <div className="modal-card paper-set-modal">
            <button className="modal-close" onClick={() => setOpen(false)}>
              ×
            </button>
            <div className="paper-set-body">
              <h2>{editing ? "Edit Examination" : "Create Examination"}</h2>
              <label>
                Examination Name
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </label>
              <label>
                Examination Code
                <input value={form.code} readOnly />
              </label>
              <label>
                Description
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </label>
              <label>
                Examination Type
                <select
                  value={form.examinationType}
                  onChange={(e) =>
                    setForm({ ...form, examinationType: e.target.value })
                  }
                >
                  <option>MCQ</option>
                  <option>Assessment</option>
                </select>
              </label>
              <div className="form-grid">
                <DateTimePicker
                  label="Start Date and Time"
                  value={form.startAt}
                  onChange={(value) => updateDate("startAt", value)}
                />
                <DateTimePicker
                  label="End Date and Time"
                  value={form.endAt}
                  onChange={(value) => updateDate("endAt", value)}
                />
                <label>
                  Duration (minutes)
                  <input
                    readOnly
                    value={duration && duration > 0 ? duration : ""}
                  />
                  {invalidRange && (
                    <small className="field-error">
                      End Date &amp; Time must be later than Start Date &amp;
                      Time.
                    </small>
                  )}
                </label>
              </div>
              <label>
                Maximum Attempts
                <input
                  type="number"
                  min="1"
                  value={form.maxAttempts}
                  onChange={(e) =>
                    setForm({ ...form, maxAttempts: e.target.value })
                  }
                />
              </label>
              <section className="exam-security-section">
                <h3>Examination Security &amp; Proctoring</h3>
                <div className="form-grid">
                  {(
                    [
                      ["camera", "Camera Required"],
                      ["microphone", "Microphone Required"],
                      ["fullscreen", "Fullscreen Required"],
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key} className="checkbox-field">
                      <input
                        type="checkbox"
                        checked={Boolean(form.readinessRequirements?.[key])}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            readinessRequirements: {
                              ...form.readinessRequirements,
                              [key]: e.target.checked,
                            },
                          })
                        }
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                  <label>
                    Integrity Profile
                    <select
                      value={form.integrityProfile}
                      onChange={(e) =>
                        setForm({ ...form, integrityProfile: e.target.value })
                      }
                    >
                      <option value="BASIC">Basic</option>
                      <option value="STANDARD">Standard</option>
                      <option value="STRICT">Strict</option>
                    </select>
                  </label>
                  <label>
                    Tab-Switch Warning Threshold
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={form.integrityRules?.tabSwitchThreshold ?? ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          integrityRules: {
                            ...form.integrityRules,
                            tabSwitchThreshold: e.target.value,
                          },
                        })
                      }
                    />
                  </label>
                </div>
                <small>
                  Tab-switch monitoring follows the selected backend integrity
                  profile.
                </small>
              </section>
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={form.resultReleasePolicy === "IMMEDIATE"}
                  disabled={Boolean(editing)}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      resultReleasePolicy: e.target.checked
                        ? "IMMEDIATE"
                        : "ADMIN_CONTROLLED",
                    })
                  }
                />
                <span>
                  Show Marks Immediately After Submission
                  {editing && (
                    <small> Existing examination policy is preserved.</small>
                  )}
                </span>
              </label>
              <label>
                Instructions
                <textarea
                  value={form.instructions}
                  onChange={(e) =>
                    setForm({ ...form, instructions: e.target.value })
                  }
                />
              </label>
            </div>
            <div className="modal-actions">
              <button className="secondary" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button
                className="primary"
                disabled={saving || invalidRange}
                onClick={() => void save()}
              >
                {saving ? "Saving..." : "Save Examination"}
              </button>
            </div>
          </div>
        </div>
      )}
      {assignmentTarget && (
        <AssignStudentsModal
          examination={assignmentTarget}
          students={assignmentStudents}
          colleges={assignmentColleges}
          assignedIds={assignedIds}
          search={assignmentSearch}
          college={assignmentCollege}
          saving={assignmentSaving}
          onSearch={setAssignmentSearch}
          onCollege={(value) => void filterAssignmentCollege(value)}
          onToggle={(id, selected) =>
            setAssignedIds((current) =>
              selected
                ? [...new Set([...current, id])]
                : current.filter((value) => value !== id),
            )
          }
          onSelectEligible={(ids) =>
            setAssignedIds(
              ids.length ? [...new Set([...assignedIds, ...ids])] : [],
            )
          }
          onClose={() => !assignmentSaving && setAssignmentTarget(null)}
          onAssign={() => void saveAssignments()}
        />
      )}
      {false && assignmentTarget && (
        <div className="modal-backdrop">
          <div
            className="modal-card paper-set-modal assignment-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="assignment-title"
          >
            <div className="modal-header">
              <div>
                <h2 id="assignment-title">Assign Students</h2>
                <p>
                  {assignmentTarget.title || assignmentTarget.name} ·{" "}
                  {assignmentTarget.code}
                </p>
              </div>
              <button
                className="modal-close"
                onClick={() => !assignmentSaving && setAssignmentTarget(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="paper-set-body">
              <div className="publish-summary">
                <div className="publish-summary-row">
                  <div>Examination</div>
                  <div>
                    {assignmentTarget.title || assignmentTarget.name} (
                    {assignmentTarget.code})
                  </div>
                </div>
                <div className="publish-summary-row">
                  <div>Schedule</div>
                  <div>
                    {assignmentTarget.scheduledAt
                      ? new Date(assignmentTarget.scheduledAt).toLocaleString()
                      : "—"}{" "}
                    –{" "}
                    {assignmentTarget.closesAt
                      ? new Date(assignmentTarget.closesAt).toLocaleString()
                      : "—"}
                  </div>
                </div>
                <div className="publish-summary-row">
                  <div>Duration</div>
                  <div>
                    {assignmentTarget.durationMinutes ?? "—"} minutes · Maximum
                    attempts {assignmentTarget.maxAttempts || 1}
                  </div>
                </div>
              </div>
              <label>
                Search students
                <input
                  value={assignmentSearch}
                  onChange={(e) => setAssignmentSearch(e.target.value)}
                  placeholder="Search student ID, name, or email"
                />
              </label>
              <div className="assignment-toolbar">
                <strong>{assignedIds.length} selected</strong>
                <button
                  className="text-button"
                  onClick={() =>
                    setAssignedIds(
                      assignmentStudents
                        .filter((s) => s.accountStatus === "ACTIVE")
                        .map((s) => s.id),
                    )
                  }
                >
                  Select all eligible
                </button>
                <button
                  className="text-button"
                  onClick={() => setAssignedIds([])}
                >
                  Clear
                </button>
              </div>
              <div className="assignment-student-list">
                {assignmentStudents
                  .filter((s) =>
                    `${s.studentId} ${s.fullName} ${s.email}`
                      .toLowerCase()
                      .includes(assignmentSearch.toLowerCase()),
                  )
                  .map((student) => (
                    <label key={student.id}>
                      <input
                        type="checkbox"
                        checked={assignedIds.includes(student.id)}
                        onChange={(e) =>
                          setAssignedIds(
                            e.target.checked
                              ? [...new Set([...assignedIds, student.id])]
                              : assignedIds.filter((id) => id !== student.id),
                          )
                        }
                      />
                      <span>
                        <strong>{student.studentId}</strong> ·{" "}
                        {student.fullName}
                        <small>
                          {student.email} · {student.accountStatus} ·{" "}
                          {assignmentTarget.assignmentAt
                            ? `Assigned ${new Date(assignmentTarget.assignmentAt).toLocaleDateString()}`
                            : "Not assigned"}
                        </small>
                      </span>
                    </label>
                  ))}
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="secondary"
                disabled={assignmentSaving}
                onClick={() => setAssignmentTarget(null)}
              >
                Cancel
              </button>
              <button
                className="primary"
                disabled={assignmentSaving || !assignedIds.length}
                onClick={() => void saveAssignments()}
              >
                {assignmentSaving ? "Assigning..." : "Assign Students"}
              </button>
            </div>
          </div>
        </div>
      )}
      {scheduleTarget && (
        <div className="modal-backdrop">
          <div
            className="modal-card publish-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="schedule-title"
          >
            <div className="modal-header">
              <div>
                <h2 id="schedule-title">Schedule Examination?</h2>
                <p>Review the schedule before changing its lifecycle status.</p>
              </div>
              <button
                className="modal-close"
                disabled={scheduling}
                onClick={() => setScheduleTarget(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="modal-body publish-confirm-body">
              <div className="publish-summary">
                <div className="publish-summary-row">
                  <div>Examination Name</div>
                  <div>{scheduleTarget.title || scheduleTarget.name}</div>
                </div>
                <div className="publish-summary-row">
                  <div>Examination Code</div>
                  <div>{scheduleTarget.code}</div>
                </div>
                <div className="publish-summary-row">
                  <div>Start Date and Time</div>
                  <div>
                    {scheduleTarget.scheduledAt
                      ? new Date(scheduleTarget.scheduledAt).toLocaleString()
                      : "—"}
                  </div>
                </div>
                <div className="publish-summary-row">
                  <div>End Date and Time</div>
                  <div>
                    {scheduleTarget.closesAt
                      ? new Date(scheduleTarget.closesAt).toLocaleString()
                      : "—"}
                  </div>
                </div>
                <div className="publish-summary-row">
                  <div>Duration</div>
                  <div>{scheduleTarget.durationMinutes ?? "—"} minutes</div>
                </div>
                <div className="publish-summary-row">
                  <div>Linked Published Paper Set</div>
                  <div>{scheduleSet?.name || scheduleSet?.code || "—"}</div>
                </div>
                <div className="publish-summary-row">
                  <div>Current Status</div>
                  <div>
                    <span className="publish-status-badge draft">DRAFT</span>
                  </div>
                </div>
                <div className="publish-summary-row">
                  <div>New Status</div>
                  <div>
                    <span className="publish-status-badge published">
                      SCHEDULED
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="secondary"
                disabled={scheduling}
                onClick={() => setScheduleTarget(null)}
              >
                Cancel
              </button>
              <button
                className="primary"
                disabled={scheduling}
                onClick={() => void schedule()}
              >
                {scheduling ? "Scheduling..." : "Schedule Examination"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
