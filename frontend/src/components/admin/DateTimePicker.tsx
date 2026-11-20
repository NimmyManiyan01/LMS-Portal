import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"

const pad = (v: number) => String(v).padStart(2, "0")

function parseISO(value: string) {
  if (!value) return null
  const [datePart, timePart] = value.split("T")
  if (!datePart || !timePart) return null
  const [year, month, day] = datePart.split("-").map(Number)
  const [hour, minute] = timePart.split(":").map(Number)
  if (!year || !month || !day) return null
  return {
    year,
    month: month - 1,
    day,
    hour: Number.isFinite(hour) ? hour : 10,
    minute: Number.isFinite(minute) ? minute : 0,
  }
}

function formatISO(year: number, month: number, day: number, hour24: number, minute: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}T${pad(hour24)}:${pad(minute)}`
}

function formatPreview(value: string) {
  const parsed = parseISO(value)
  if (!parsed) return null
  const d = new Date(parsed.year, parsed.month, parsed.day)
  const dateStr = d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
  const h12 = parsed.hour % 12 || 12
  const ampm = parsed.hour >= 12 ? "PM" : "AM"
  return `${dateStr} at ${pad(h12)}:${pad(parsed.minute)} ${ampm}`
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
  const anchorRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ top: 0, left: 0, width: 420 })

  const parsedValue = useMemo(() => parseISO(value), [value])
  const parsedMin = useMemo(() => parseISO(minValue || ""), [minValue])

  const [viewDate, setViewDate] = useState(() => {
    if (parsedValue) return new Date(parsedValue.year, parsedValue.month, 1)
    return new Date()
  })

  // Selected date components or default to today
  const selectedYear = parsedValue?.year ?? viewDate.getFullYear()
  const selectedMonth = parsedValue?.month ?? viewDate.getMonth()
  const selectedDay = parsedValue?.day ?? viewDate.getDate()
  const selectedHour24 = parsedValue?.hour ?? 10
  const selectedMinute = parsedValue?.minute ?? 0

  const hour12 = selectedHour24 % 12 || 12
  const period = selectedHour24 >= 12 ? "PM" : "AM"

  // Reposition popover floating portal
  const reposition = () => {
    if (!anchorRef.current) return
    const rect = anchorRef.current.getBoundingClientRect()
    const width = Math.min(420, window.innerWidth - 24)
    const height = 440
    const spaceBelow = window.innerHeight - rect.bottom
    const top = spaceBelow >= height || spaceBelow >= rect.top
      ? rect.bottom + 8
      : Math.max(12, rect.top - height - 8)
    const left = Math.min(
      Math.max(12, rect.left),
      window.innerWidth - width - 12,
    )
    setPos({ top, left, width })
  }

  useEffect(() => {
    if (!open) return
    reposition()
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        !anchorRef.current?.contains(target) &&
        !popoverRef.current?.contains(target)
      ) {
        setOpen(false)
      }
    }
    const handleResize = () => reposition()
    window.addEventListener("scroll", handleResize, true)
    window.addEventListener("resize", handleResize)
    document.addEventListener("mousedown", handleOutside)
    return () => {
      window.removeEventListener("scroll", handleResize, true)
      window.removeEventListener("resize", handleResize)
      document.removeEventListener("mousedown", handleOutside)
    }
  }, [open])

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const cells: (Date | null)[] = []
    for (let i = 0; i < firstDay; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
    return cells
  }, [viewDate])

  const commit = (
    y = selectedYear,
    m = selectedMonth,
    d = selectedDay,
    h24 = selectedHour24,
    min = selectedMinute,
  ) => {
    const iso = formatISO(y, m, d, h24, min)
    onChange(iso)
  }

  const selectDay = (date: Date) => {
    const y = date.getFullYear()
    const m = date.getMonth()
    const d = date.getDate()
    commit(y, m, d, selectedHour24, selectedMinute)
  }

  const selectHour = (h12Val: number) => {
    let h24 = h12Val % 12
    if (period === "PM") h24 += 12
    commit(selectedYear, selectedMonth, selectedDay, h24, selectedMinute)
  }

  const selectMinute = (minVal: number) => {
    commit(selectedYear, selectedMonth, selectedDay, selectedHour24, minVal)
  }

  const togglePeriod = (p: "AM" | "PM") => {
    let h24 = hour12 % 12
    if (p === "PM") h24 += 12
    commit(selectedYear, selectedMonth, selectedDay, h24, selectedMinute)
  }

  const isDaySelected = (date: Date) => {
    return (
      parsedValue &&
      date.getFullYear() === parsedValue.year &&
      date.getMonth() === parsedValue.month &&
      date.getDate() === parsedValue.day
    )
  }

  const isDayDisabled = (date: Date) => {
    if (!parsedMin) return false
    const dStr = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
    const minStr = `${parsedMin.year}-${pad(parsedMin.month + 1)}-${pad(parsedMin.day)}`
    return dStr < minStr
  }

  const presetTimes = [
    { label: "09:00 AM", h24: 9, min: 0 },
    { label: "10:00 AM", h24: 10, min: 0 },
    { label: "11:30 AM", h24: 11, min: 30 },
    { label: "02:00 PM", h24: 14, min: 0 },
    { label: "04:00 PM", h24: 16, min: 0 },
    { label: "06:00 PM", h24: 18, min: 0 },
  ]

  const dropdownPopover = open ? createPortal(
    <div
      ref={popoverRef}
      className="fixed z-[3000] bg-white/95 backdrop-blur-2xl border border-white rounded-3xl p-5 shadow-[0_20px_50px_rgba(30,58,52,0.25)] text-[#1E3A34] space-y-4 font-sans max-w-[95vw]"
      style={{
        top: pos.top,
        left: pos.left,
        width: pos.width,
      }}
    >
      {/* Popover Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#F0EBE1]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00D084] animate-pulse" />
          <span className="text-xs font-black uppercase tracking-wider text-[#057A55]">
            {label}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-slate-400 hover:text-slate-700 text-sm font-bold border-none bg-transparent cursor-pointer"
        >
          ✕
        </button>
      </div>

      {/* Calendar Section */}
      <div className="space-y-2">
        {/* Month & Year Navigation */}
        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
            className="w-7 h-7 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#1E3A34] font-black text-sm flex items-center justify-center border-none cursor-pointer"
          >
            ‹
          </button>
          <span className="text-xs sm:text-sm font-black text-[#1E3A34]">
            {viewDate.toLocaleString("en-US", { month: "long", year: "numeric" })}
          </span>
          <button
            type="button"
            onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
            className="w-7 h-7 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#1E3A34] font-black text-sm flex items-center justify-center border-none cursor-pointer"
          >
            ›
          </button>
        </div>

        {/* Day Header */}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black uppercase text-[#057A55]">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
            <div key={day} className="py-1">{day}</div>
          ))}
        </div>

        {/* Day Grid */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {calendarDays.map((date, idx) => {
            if (!date) return <div key={`empty-${idx}`} />
            const selected = isDaySelected(date)
            const disabled = isDayDisabled(date)
            return (
              <button
                key={date.toISOString()}
                type="button"
                disabled={disabled}
                onClick={() => selectDay(date)}
                className={`h-8 rounded-xl text-xs font-bold transition-all border-none cursor-pointer ${
                  selected
                    ? "bg-[#1E3A34] text-white font-black shadow-md scale-105"
                    : disabled
                      ? "text-slate-300 opacity-40 cursor-not-allowed"
                      : "text-[#1E3A34] hover:bg-[#00D084]/20 hover:text-[#057A55]"
                }`}
              >
                {date.getDate()}
              </button>
            )
          })}
        </div>
      </div>

      {/* Time Selection Section */}
      <div className="pt-3 border-t border-[#F0EBE1] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-[#057A55]">
            Select Time
          </span>
          {/* AM / PM Toggle */}
          <div className="flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => togglePeriod("AM")}
              className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all border-none cursor-pointer ${
                period === "AM"
                  ? "bg-[#176B58] text-white shadow-xs"
                  : "text-slate-600 hover:text-[#1E3A34]"
              }`}
            >
              AM
            </button>
            <button
              type="button"
              onClick={() => togglePeriod("PM")}
              className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all border-none cursor-pointer ${
                period === "PM"
                  ? "bg-[#176B58] text-white shadow-xs"
                  : "text-slate-600 hover:text-[#1E3A34]"
              }`}
            >
              PM
            </button>
          </div>
        </div>

        {/* Hour & Minute Pickers */}
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-[10px] font-extrabold text-[#057A55]">
            <span>Hour</span>
            <select
              value={hour12}
              onChange={(e) => selectHour(Number(e.target.value))}
              className="h-10 px-3 rounded-xl border border-slate-200/90 bg-white font-bold text-xs text-[#1E3A34] outline-none focus:border-[#00D084] cursor-pointer shadow-xs"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                <option key={h} value={h}>
                  {pad(h)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-[10px] font-extrabold text-[#057A55]">
            <span>Minute</span>
            <select
              value={selectedMinute}
              onChange={(e) => selectMinute(Number(e.target.value))}
              className="h-10 px-3 rounded-xl border border-slate-200/90 bg-white font-bold text-xs text-[#1E3A34] outline-none focus:border-[#00D084] cursor-pointer shadow-xs"
            >
              {Array.from({ length: 60 }, (_, m) => m).map((m) => (
                <option key={m} value={m}>
                  {pad(m)}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Quick Time Presets */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {presetTimes.map((pt) => (
            <button
              key={pt.label}
              type="button"
              onClick={() => commit(selectedYear, selectedMonth, selectedDay, pt.h24, pt.min)}
              className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-[#00D084]/20 hover:text-[#057A55] text-[10px] font-extrabold text-[#1E3A34] transition-all border-none cursor-pointer"
            >
              {pt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Footer Preview & Done Action */}
      <div className="pt-3 border-t border-[#F0EBE1] flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onChange("")}
          className="text-xs font-bold text-rose-600 hover:underline border-none bg-transparent cursor-pointer p-0"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="h-10 px-6 rounded-2xl bg-[#176B58] hover:bg-[#125445] text-white text-xs font-black shadow-md shadow-[#176B58]/20 transition-all cursor-pointer border-none"
        >
          Done
        </button>
      </div>
    </div>,
    document.body,
  ) : null

  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <span className="text-xs sm:text-sm font-extrabold text-[#1E3A34]">{label}</span>
      <button
        ref={anchorRef}
        type="button"
        onClick={() => {
          setOpen(!open)
          requestAnimationFrame(reposition)
        }}
        className="h-11 w-full px-4 bg-white/90 border border-[#E2DBD0] rounded-2xl text-[#1E3A34] font-bold text-xs sm:text-sm outline-none hover:border-[#00D084] focus:border-[#00D084] focus:ring-4 focus:ring-[#00D084]/20 shadow-sm transition-all cursor-pointer flex items-center justify-between gap-2"
      >
        <span className="truncate">
          {formatPreview(value) || "Select Date & Time"}
        </span>
        <span className="text-xs text-[#057A55] font-black shrink-0">
          {open ? "▲" : "▼"}
        </span>
      </button>
      {dropdownPopover}
    </div>
  )
}
