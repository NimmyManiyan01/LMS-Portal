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
  return (
    <label className="flex flex-col gap-1.5 text-xs sm:text-sm font-extrabold text-[#1E3A34] min-w-0">
      <span>{label}</span>
      <input
        type="datetime-local"
        value={value}
        min={minValue}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full px-3.5 bg-white/90 border border-[#E2DBD0] rounded-2xl text-[#1E3A34] font-extrabold text-xs sm:text-sm outline-none focus:border-[#00D084] focus:ring-4 focus:ring-[#00D084]/20 shadow-sm transition-all cursor-pointer"
      />
    </label>
  )
}
