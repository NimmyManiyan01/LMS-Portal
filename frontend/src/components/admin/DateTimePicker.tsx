import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"

let latestStartValue = ""
const pad = (value: number) => String(value).padStart(2, "0")

function parts(value: string) {
  const [date = "", time = "10:00"] = value.split("T")
  const [hourText = "10", minute = "00"] = time.split(":")
  const h = Number(hourText)
  return { date, hour: h % 12 || 12, minute, period: h >= 12 ? "PM" : "AM", time }
}

function makeValueFromTime(dateKey: string, time24: string) {
  if (!dateKey) return ""
  return `${dateKey}T${time24}`
}

function valid(value: string) {
  return /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)
}

function preview(value: string) {
  if (!value) return "No date & time selected"
  const [date, time] = value.split("T")
  if (!date || !time) return "No date & time selected"
  const [hour, minute] = time.split(":")
  const h = Number(hour)
  const d = new Date(`${date}T00:00:00`)
  const dateStr = Number.isFinite(d.getTime())
    ? d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
    : date
  return `${dateStr} at ${pad(h % 12 || 12)}:${minute} ${h >= 12 ? "PM" : "AM"}`
}

function dateFromValue(value: string) {
  const [year, month, day] = (value || "").split("-").map(Number)
  return year && month && day ? new Date(year, month - 1, day) : new Date()
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

// Generate 37 time slots from 09:00 to 18:00 at 15-minute intervals
const timeSlots = Array.from({ length: 37 }, (_, index) => {
  const totalMinutes = index * 15
  const hour = Math.floor(totalMinutes / 60) + 9
  const minute = totalMinutes % 60
  return `${pad(hour)}:${pad(minute)}`
})

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
    width: 440,
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
    const width = Math.min(460, window.innerWidth - 16)
    const height = Math.min(popover.current?.scrollHeight ?? 420, maxHeight)
    const below = window.innerHeight - rect.bottom
    const placeBelow = below - 6 >= height || below >= rect.top
    const top = placeBelow
      ? Math.min(rect.bottom + 6, window.innerHeight - height - viewportPadding)
      : Math.max(viewportPadding, rect.top - height - 6)
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
    const selectedDateKey = dateKey(date)
    const selectedTime24 = current.time || "10:00"
    update(makeValueFromTime(selectedDateKey, selectedTime24))
    setMonth(date)
  }

  const chooseTime = (time24: string) => {
    const selectedDateKey = current.date || dateKey(new Date())
    update(makeValueFromTime(selectedDateKey, time24))
  }

  const popup = open
    ? createPortal(
        <div
          ref={popover}
          className="kgs-datetime-popover fixed z-[3000] p-4 sm:p-5 bg-white/95 backdrop-blur-2xl border border-white/90 rounded-3xl shadow-[0_20px_50px_0_rgba(30,58,52,0.2)] max-h-[calc(100vh-16px)] overflow-y-auto box-border text-[#1E3A34] w-[340px] sm:w-[460px]"
          style={{
            top: position.top,
            left: position.left,
            width: position.width,
            maxHeight: position.maxHeight || undefined,
          }}
          role="dialog"
          aria-label={`${label} picker`}
        >
          {/* Header Title */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#F0EBE1]">
            <span className="text-xs font-black uppercase tracking-wider text-[#057A55]">
              {label}
            </span>
            <button
              type="button"
              className="text-xs font-bold text-[#D9532F] hover:bg-rose-50 px-2 py-0.5 rounded-full transition-colors cursor-pointer border-none bg-transparent"
              onClick={() => setOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* Calendar & Time Slots Split View */}
          <div className="flex flex-col sm:flex-row gap-4 items-stretch">

            {/* Left Column: Calendar Grid */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-3 text-[#1E3A34] font-black text-xs sm:text-sm">
                <button
                  type="button"
                  className="p-1 px-2.5 text-base font-bold text-[#1E3A34] hover:bg-white/80 rounded-xl transition-colors cursor-pointer border border-[#E2DBD0]"
                  onClick={() =>
                    setMonth(
                      new Date(month.getFullYear(), month.getMonth() - 1, 1),
                    )
                  }
                >
                  ‹
                </button>
                <b className="text-[#1E3A34] font-extrabold text-xs sm:text-sm">
                  {month.toLocaleString(undefined, {
                    month: "long",
                    year: "numeric",
                  })}
                </b>
                <button
                  type="button"
                  className="p-1 px-2.5 text-base font-bold text-[#1E3A34] hover:bg-white/80 rounded-xl transition-colors cursor-pointer border border-[#E2DBD0]"
                  onClick={() =>
                    setMonth(
                      new Date(month.getFullYear(), month.getMonth() + 1, 1),
                    )
                  }
                >
                  ›
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] uppercase text-[#057A55] mb-2">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                  <b key={day} className="font-extrabold">
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
                      className={`h-8 border-none rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        current.date === dateKey(date)
                          ? "bg-[#1E3A34] text-white font-black shadow-md border-white/20"
                          : "text-[#1E3A34] hover:bg-[#00D084]/15 hover:text-[#057A55] bg-white/60"
                      } disabled:text-slate-300 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed`}
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

            {/* Right Column: Time Slot Selector Scroll Area */}
            <div className="w-full sm:w-36 border-t sm:border-t-0 sm:border-l border-[#F0EBE1] pt-3 sm:pt-0 sm:pl-3 flex flex-col gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#057A55] block mb-1 text-center">
                Time Slot
              </span>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                {timeSlots.map((time) => {
                  const isSelected = current.time === time
                  const hour = Number(time.split(":")[0])
                  const minute = time.split(":")[1]
                  const display12 = `${pad(hour % 12 || 12)}:${minute} ${hour >= 12 ? "PM" : "AM"}`

                  return (
                    <button
                      key={time}
                      type="button"
                      onClick={() => chooseTime(time)}
                      className={`h-8 w-full rounded-full text-xs font-bold transition-all cursor-pointer border ${
                        isSelected
                          ? "bg-[#1E3A34] text-white font-extrabold shadow-md border-white/20"
                          : "bg-white/80 text-[#1E3A34] hover:bg-[#00D084]/15 hover:text-[#057A55] border-[#E2DBD0]"
                      }`}
                    >
                      {display12}
                    </button>
                  )
                })}
              </div>
            </div>

          </div>

          {/* Appointment Status Footer */}
          <div className="mt-4 pt-3 border-t border-[#F0EBE1] space-y-3">
            <div className="p-3 bg-[#F6F2E6]/80 rounded-2xl text-[#1E3A34] text-xs font-bold border border-[#E2DBD0] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00D084] animate-pulse" />
              <span>{preview(value)}</span>
            </div>

            {/* Validation Warning */}
            {invalid && (
              <small className="text-xs font-bold text-rose-600 block">
                {label === "End Date and Time"
                  ? "End Date & Time must be later than Start Date & Time."
                  : "Select a valid future date & time."}
              </small>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                className="text-xs font-bold text-rose-600 hover:text-rose-700 transition-colors border-none bg-transparent p-0 cursor-pointer"
                onClick={() => onChange("")}
              >
                Clear Selection
              </button>
              <button
                type="button"
                className="px-5 py-2 text-xs font-black text-white bg-[#057A55] hover:bg-[#035E41] active:scale-95 rounded-full shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer border border-emerald-400/30"
                disabled={!canConfirm}
                onClick={() => canConfirm && setOpen(false)}
              >
                Confirm Time
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )
    : null

  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <span className="text-xs sm:text-sm font-extrabold text-[#1E3A34]">{label}</span>
      <button
        type="button"
        ref={anchor}
        className="h-10 w-full px-3.5 text-left bg-white/80 backdrop-blur-md border border-[#E2DBD0] rounded-xl text-[#1E3A34] font-semibold hover:border-[#00D084] focus:outline-none focus:border-[#00D084] focus:ring-2 focus:ring-[#00D084]/20 whitespace-nowrap overflow-hidden text-ellipsis text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
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
        {value ? preview(value) : "Select date & time"}
      </button>
      {invalid && (
        <small className="text-xs font-bold text-rose-600 mt-1 block">
          {label === "End Date and Time"
            ? "End date and time must be later than the start date and time."
            : "Select a valid date and time."}
        </small>
      )}
      {popup}
    </div>
  )
}
