import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

let latestStartValue = "";
const pad = (value: number) => String(value).padStart(2, "0");
function parts(value: string) {
  const [date = "", time = "00:00"] = value.split("T");
  const [hourText = "00", minute = "00"] = time.split(":");
  const h = Number(hourText);
  return { date, hour: h % 12 || 12, minute, period: h >= 12 ? "PM" : "AM" };
}
function makeValue(date: string, hour: number, minute: string, period: string) {
  let h = hour % 12;
  if (period === "PM") h += 12;
  return date ? `${date}T${pad(h)}:${minute}` : "";
}
function valid(value: string) {
  return /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
}
function preview(value: string) {
  if (!value) return "No date selected";
  const [date, time] = value.split("T");
  const [hour, minute] = time.split(":");
  const h = Number(hour);
  return `${date} · ${pad(h % 12 || 12)}:${minute} ${h >= 12 ? "PM" : "AM"}`;
}
function dateFromValue(value: string) {
  const [year, month, day] = (value || "").split("-").map(Number);
  return year && month && day ? new Date(year, month - 1, day) : new Date();
}
function dateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function DateTimePicker({
  value,
  onChange,
  label,
  minValue,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  minValue?: string;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 320 });
  const [month, setMonth] = useState(() => dateFromValue(value));
  const anchor = useRef<HTMLButtonElement>(null);
  const current = parts(value);
  if (label === "Start Date and Time" && value) latestStartValue = value;
  const effectiveMin =
    minValue || (label === "End Date and Time" ? latestStartValue : "");
  const invalid =
    Boolean(value && !valid(value)) ||
    Boolean(effectiveMin && value && valid(value) && value <= effectiveMin);
  const canConfirm = valid(value) && !invalid;
  const days = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
    const count = new Date(
      month.getFullYear(),
      month.getMonth() + 1,
      0,
    ).getDate();
    return Array.from({ length: first + count }, (_, index) =>
      index < first
        ? null
        : new Date(month.getFullYear(), month.getMonth(), index - first + 1),
    );
  }, [month]);
  const reposition = () => {
    const rect = anchor.current?.getBoundingClientRect();
    if (!rect) return;
    const height = 390;
    const below = window.innerHeight - rect.bottom;
    const top =
      below >= height || below >= rect.top
        ? rect.bottom + 6
        : Math.max(8, rect.top - height - 6);
    const width = Math.min(340, window.innerWidth - 16);
    setPosition({
      top,
      left: Math.min(Math.max(8, rect.left), window.innerWidth - width - 8),
      width,
    });
  };
  useEffect(() => {
    if (!open) return;
    reposition();
    const escape = (event: KeyboardEvent) =>
      event.key === "Escape" && setOpen(false);
    const outside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !anchor.current?.contains(target) &&
        !(target as HTMLElement).closest(".kgs-datetime-popover")
      )
        setOpen(false);
    };
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("keydown", escape);
    document.addEventListener("mousedown", outside);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("keydown", escape);
      document.removeEventListener("mousedown", outside);
    };
  }, [open]);
  useEffect(() => {
    const closeOther = (event: Event) => {
      if ((event as CustomEvent).detail !== label) setOpen(false);
    };
    window.addEventListener("kgs-datetime-open", closeOther);
    return () => window.removeEventListener("kgs-datetime-open", closeOther);
  }, [label]);
  const update = (next: string) => {
    if (label === "Start Date and Time") latestStartValue = next;
    onChange(next);
  };
  const chooseDate = (date: Date) => {
    update(
      makeValue(dateKey(date), current.hour, current.minute, current.period),
    );
    setMonth(date);
  };
  const popup = open
    ? createPortal(
        <div
          className="kgs-datetime-popover"
          style={{
            top: position.top,
            left: position.left,
            width: position.width,
          }}
          role="dialog"
          aria-label={`${label} picker`}
        >
          <div className="kgs-calendar">
            <div className="kgs-calendar-header">
              <button
                type="button"
                className="text-button"
                onClick={() =>
                  setMonth(
                    new Date(month.getFullYear(), month.getMonth() - 1, 1),
                  )
                }
              >
                ‹
              </button>
              <b>
                {month.toLocaleString(undefined, {
                  month: "long",
                  year: "numeric",
                })}
              </b>
              <button
                type="button"
                className="text-button"
                onClick={() =>
                  setMonth(
                    new Date(month.getFullYear(), month.getMonth() + 1, 1),
                  )
                }
              >
                ›
              </button>
            </div>
            <div className="kgs-calendar-weekdays">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                <b key={day}>{day}</b>
              ))}
            </div>
            <div className="kgs-calendar-grid">
              {days.map((date, index) =>
                date ? (
                  <button
                    type="button"
                    key={date.toISOString()}
                    className={current.date === dateKey(date) ? "selected" : ""}
                    disabled={Boolean(
                      effectiveMin && dateKey(date) < effectiveMin.slice(0, 10),
                    )}
                    onClick={() => chooseDate(date)}
                  >
                    {date.getDate()}
                  </button>
                ) : (
                  <span key={`blank-${index}`} />
                ),
              )}
            </div>
          </div>
          <div className="kgs-datetime-time">
            <label>
              Hour
              <select
                value={current.hour}
                onChange={(e) =>
                  update(
                    makeValue(
                      current.date,
                      Number(e.target.value),
                      current.minute,
                      current.period,
                    ),
                  )
                }
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => (
                  <option key={hour}>{hour}</option>
                ))}
              </select>
            </label>
            <label>
              Minute
              <select
                value={current.minute}
                onChange={(e) =>
                  update(
                    makeValue(
                      current.date,
                      current.hour,
                      e.target.value,
                      current.period,
                    ),
                  )
                }
              >
                {Array.from({ length: 60 }, (_, minute) => (
                  <option key={minute} value={pad(minute)}>
                    {pad(minute)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              AM/PM
              <select
                value={current.period}
                onChange={(e) =>
                  update(
                    makeValue(
                      current.date,
                      current.hour,
                      current.minute,
                      e.target.value,
                    ),
                  )
                }
              >
                <option>AM</option>
                <option>PM</option>
              </select>
            </label>
          </div>
          <div className="kgs-datetime-preview">{preview(value)}</div>
          {invalid && (
            <small className="field-error">
              {label === "End Date and Time"
                ? "End date and time must be later than the start date and time."
                : "Select a valid date and time."}
            </small>
          )}
          <div className="kgs-datetime-actions">
            <button
              type="button"
              className="text-button"
              onClick={() => onChange("")}
            >
              Clear date
            </button>
            <button
              type="button"
              className="primary mini"
              disabled={!canConfirm}
              onClick={() => canConfirm && setOpen(false)}
            >
              Done
            </button>
          </div>
        </div>,
        document.body,
      )
    : null;
  return (
    <div className="kgs-datetime-field">
      <span>{label}</span>
      <button
        type="button"
        ref={anchor}
        className="kgs-datetime-trigger"
        onClick={() => {
          window.dispatchEvent(
            new CustomEvent("kgs-datetime-open", { detail: label }),
          );
          setMonth(dateFromValue(value));
          setOpen((state) => !state);
          setTimeout(reposition, 0);
        }}
        aria-expanded={open}
      >
        {value ? preview(value) : "Select date and time"}
      </button>
      {invalid && (
        <small className="field-error">
          {label === "End Date and Time"
            ? "End date and time must be later than the start date and time."
            : "Select a valid date and time."}
        </small>
      )}
      {popup}
    </div>
  );
}
