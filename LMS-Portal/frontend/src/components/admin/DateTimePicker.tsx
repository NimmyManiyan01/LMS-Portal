import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"

let latestStartValue = ""
const pad = (value: number) => String(value).padStart(2, "0")
function parts(value: string) {
  const [date = "", time = "00:00"] = value.split("T")
  const [hourText = "00", minute = "00"] = time.split(":")
  const h = Number(hourText)
  return { date, hour: h % 12 || 12, minute, period: h >= 12 ? "PM" : "AM" }
}
function makeValue(date: string, hour: number, minute: string, period: string) {
  let h = hour % 12
  if (period === "PM") h += 12
  return date ? `${date}T${pad(h)}:${minute}` : ""
}
function valid(value: string) {
  return /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)
}
function preview(value: string) {
  if (!value) return "No date selected"
  const [date, time] = value.split("T")
  const [hour, minute] = time.split(":")
  const h = Number(hour)
  return `${date} · ${pad(h % 12 || 12)}:${minute} ${h >= 12 ? "PM" : "AM"}`
}
function dateFromValue(value: string) {
  const [year, month, day] = (value || "").split("-").map(Number)
  return year && month && day ? new Date(year, month - 1, day) : new Date()
}
function dateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function DateTimePicker({
  value,
  onChange,
  label,
  minValue,
}: {
  value: string
  onChange: (value: string) => void
  label: string
  minValue?: string
}) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    width: 320,
    maxHeight: 0,
  })
  const [month, setMonth] = useState(() => dateFromValue(value))
  const anchor = useRef<HTMLButtonElement>(null)
  const popover = useRef<HTMLDivElement>(null)
  const current = parts(value)
  if (label === "Start Date and Time" && value) latestStartValue = value
  const effectiveMin =
    minValue || (label === "End Date and Time" ? latestStartValue : "")
  const invalid =
    Boolean(value && !valid(value)) ||
    Boolean(effectiveMin && value && valid(value) && value <= effectiveMin)
  const canConfirm = valid(value) && !invalid
  const days = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1).getDay()
    const count = new Date(
      month.getFullYear(),
      month.getMonth() + 1,
      0,
    ).getDate()
    return Array.from({ length: first + count }, (_, index) =>
      index < first
        ? null
        : new Date(month.getFullYear(), month.getMonth(), index - first + 1),
    )
  }, [month])
  const reposition = () => {
    const rect = anchor.current?.getBoundingClientRect()
    if (!rect) return
    const viewportPadding = 8
    const maxHeight = Math.max(0, window.innerHeight - viewportPadding * 2)
    const height = Math.min(popover.current?.scrollHeight ?? 390, maxHeight)
    const below = window.innerHeight - rect.bottom
    const placeBelow = below - 6 >= height || below >= rect.top
    const top = placeBelow
      ? Math.min(rect.bottom + 6, window.innerHeight - height - viewportPadding)
      : Math.max(viewportPadding, rect.top - height - 6)
    const width = Math.min(340, window.innerWidth - 16)
    setPosition({
      top: Math.max(viewportPadding, top),
      left: Math.min(
        Math.max(viewportPadding, rect.left),
        window.innerWidth - width - viewportPadding,
      ),
      width,
      maxHeight,
    })
  }
  useEffect(() => {
    if (!open) return
    reposition()
    const escape = (event: KeyboardEvent) =>
      event.key === "Escape" && setOpen(false)
    const outside = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        !anchor.current?.contains(target) &&
        !(target as HTMLElement).closest(".kgs-datetime-popover")
      )
        setOpen(false)
    }
    window.addEventListener("resize", reposition)
    window.addEventListener("scroll", reposition, true)
    window.addEventListener("keydown", escape)
    document.addEventListener("mousedown", outside)
    return () => {
      window.removeEventListener("resize", reposition)
      window.removeEventListener("scroll", reposition, true)
      window.removeEventListener("keydown", escape)
      document.removeEventListener("mousedown", outside)
    }
  }, [open])
  useEffect(() => {
    const closeOther = (event: Event) => {
      if ((event as CustomEvent).detail !== label) setOpen(false)
    }
    window.addEventListener("kgs-datetime-open", closeOther)
    return () => window.removeEventListener("kgs-datetime-open", closeOther)
  }, [label])
  const update = (next: string) => {
    if (label === "Start Date and Time") latestStartValue = next
    onChange(next)
  }
  const chooseDate = (date: Date) => {
    update(
      makeValue(dateKey(date), current.hour, current.minute, current.period),
    )
    setMonth(date)
  }
  const popup = open
    ? createPortal(
        <div
          ref={popover}
          className="kgs-datetime-popover fixed z-[3000] p-4 bg-white border border-slate-200 rounded-xl shadow-xl max-h-[calc(100vh-16px)] overflow-y-auto box-border text-slate-900"
          style={{
            top: position.top,
            left: position.left,
            width: position.width,
            maxHeight: position.maxHeight || undefined,
          }}
          role="dialog"
          aria-label={`${label} picker`}
        >
          {/* Calendar */}
          <div className="w-full">
            <div className="flex items-center justify-between mb-3 text-slate-800 font-bold text-sm">
              <button
                type="button"
                className="p-1 px-2.5 text-lg font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer border-none bg-transparent"
                onClick={() =>
                  setMonth(
                    new Date(month.getFullYear(), month.getMonth() - 1, 1),
                  )
                }
              >
                ‹
              </button>
              <b className="text-slate-800 font-semibold text-xs sm:text-sm">
                {month.toLocaleString(undefined, {
                  month: "long",
                  year: "numeric",
                })}
              </b>
              <button
                type="button"
                className="p-1 px-2.5 text-lg font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer border-none bg-transparent"
                onClick={() =>
                  setMonth(
                    new Date(month.getFullYear(), month.getMonth() + 1, 1),
                  )
                }
              >
                ›
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-slate-400 font-bold text-[11px] mb-1.5">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                <b key={day} className="font-semibold text-slate-400">
                  {day}
                </b>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {days.map((date, index) =>
                date ? (
                  <button
                    type="button"
                    key={date.toISOString()}
                    className={`min-h-[32px] border-none rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      current.date === dateKey(date)
                        ? "bg-blue-600 text-white font-bold shadow-sm"
                        : "text-slate-700 hover:bg-blue-50 hover:text-blue-700 bg-transparent"
                    } disabled:text-slate-300 disabled:hover:bg-transparent disabled:cursor-not-allowed`}
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

          {/* Time Selectors */}
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100">
            <label className="flex flex-col gap-1 text-[11px] font-semibold text-slate-600">
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
                className="h-9 w-full px-2 bg-white border border-slate-200 rounded-md text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 cursor-pointer"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => (
                  <option key={hour}>{hour}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-[11px] font-semibold text-slate-600">
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
                className="h-9 w-full px-2 bg-white border border-slate-200 rounded-md text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 cursor-pointer"
              >
                {Array.from({ length: 60 }, (_, minute) => (
                  <option key={minute} value={pad(minute)}>
                    {pad(minute)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-[11px] font-semibold text-slate-600">
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
                className="h-9 w-full px-2 bg-white border border-slate-200 rounded-md text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 cursor-pointer"
              >
                <option>AM</option>
                <option>PM</option>
              </select>
            </label>
          </div>

          {/* Preview */}
          <div className="mt-3 p-2.5 bg-slate-50 rounded-lg text-slate-700 text-xs font-medium border border-slate-100 text-center">
            {preview(value)}
          </div>

          {/* Validation Error */}
          {invalid && (
            <small className="text-xs font-medium text-red-600 mt-1.5 block">
              {label === "End Date and Time"
                ? "End date and time must be later than the start date and time."
                : "Select a valid date and time."}
            </small>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between mt-3.5 pt-2">
            <button
              type="button"
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors border-none bg-transparent p-0 cursor-pointer"
              onClick={() => onChange("")}
            >
              Clear date
            </button>
            <button
              type="button"
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer border-none"
              disabled={!canConfirm}
              onClick={() => canConfirm && setOpen(false)}
            >
              Done
            </button>
          </div>
        </div>,
        document.body,
      )
    : null

  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <span className="text-xs sm:text-sm font-semibold text-slate-700">{label}</span>
      <button
        type="button"
        ref={anchor}
        className="h-10 w-full px-3 text-left bg-white border border-slate-200 rounded-lg text-slate-800 hover:border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 whitespace-nowrap overflow-hidden text-ellipsis text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
        onClick={() => {
          window.dispatchEvent(
            new CustomEvent("kgs-datetime-open", { detail: label }),
          )
          setMonth(dateFromValue(value))
          setOpen((state) => !state)
          requestAnimationFrame(reposition)
        }}
        aria-expanded={open}
      >
        {value ? preview(value) : "Select date and time"}
      </button>
      {invalid && (
        <small className="text-xs font-medium text-red-600 mt-1 block">
          {label === "End Date and Time"
            ? "End date and time must be later than the start date and time."
            : "Select a valid date and time."}
        </small>
      )}
      {popup}
    </div>
  )
}
