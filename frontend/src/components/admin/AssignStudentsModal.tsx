import { useEffect, useMemo, useRef, useState } from "react"

type Student = {
  id: string
  studentId: string
  fullName: string
  email: string
  college?: string
  accountStatus: string
}
type Props = {
  examination: any
  students: Student[]
  colleges: { name: string; count: number }[]
  assignedIds: string[]
  search: string
  college: string
  saving: boolean
  onSearch: (value: string) => void
  onCollege: (value: string) => void
  onToggle: (id: string, selected: boolean) => void
  onSelectEligible: (ids: string[]) => void
  onClose: () => void
  onAssign: () => void
}

export function AssignStudentsModal({
  examination,
  students,
  colleges,
  assignedIds,
  search,
  college,
  saving,
  onSearch,
  onCollege,
  onToggle,
  onSelectEligible,
  onClose,
  onAssign,
}: Props) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const visible = useMemo(
    () =>
      students.filter((student) =>
        `${student.studentId} ${student.fullName} ${student.email}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [students, search],
  )
  const groups = useMemo(
    () =>
      visible.reduce<Record<string, Student[]>>((result, student) => {
        const key = student.college?.trim() || "College Not Specified"
        ;(result[key] ||= []).push(student)
        return result
      }, {}),
    [visible],
  )
  const names = Object.keys(groups)
  const [activeCollege, setActiveCollege] = useState("")
  useEffect(() => {
    setActiveCollege((current) =>
      current && groups[current] ? current : names[0] || "",
    )
  }, [college, search, names.join("|")])
  const eligible = (list: Student[]) =>
    list.filter(
      (student) =>
        student.accountStatus === "ACTIVE" && !assignedIds.includes(student.id),
    )
  const allEligible = visible
    .filter(
      (student) =>
        student.accountStatus === "ACTIVE" && !assignedIds.includes(student.id),
    )
    .map((student) => student.id)
  const toggleCollege = (name: string) =>
    setActiveCollege((current) => (current === name ? "" : name))

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    const dialog = dialogRef.current
    const focusableSelector =
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
    dialog?.querySelector<HTMLElement>(focusableSelector)?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== "Tab" || !dialog) return

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(focusableSelector),
      ).filter((element) => !element.hasAttribute("disabled"))
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      previouslyFocused?.focus()
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
      <div
        ref={dialogRef}
        className="relative w-full max-w-[900px] max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden text-slate-900"
        role="dialog"
        aria-modal="true"
        aria-labelledby="assign-students-title"
      >
        {/* Modal Header */}
        <div className="flex-none flex items-start justify-between gap-4 p-5 sm:px-7 sm:py-6 border-b border-slate-100 bg-slate-50/50">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 mb-1">
              EXAMINATION ASSIGNMENT
            </div>
            <h2
              id="assign-students-title"
              className="text-xl sm:text-[22px] font-bold text-slate-900 tracking-tight leading-tight"
            >
              Assign Students
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              {examination.title || examination.name} · {examination.code}
            </p>
          </div>
          <button
            type="button"
            className="flex items-center justify-center w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors text-xl font-medium leading-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            onClick={onClose}
            aria-label="Close assignment modal"
          >
            ×
          </button>
        </div>

        {/* Modal Body */}
        <div className="min-h-0 flex-1 flex flex-col gap-4 p-5 sm:px-7 sm:pb-6 overflow-hidden">
          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 flex-none">
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
              Filter by College
              <select
                value={college}
                onChange={(event) => onCollege(event.target.value)}
                className="w-full h-10 px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
              >
                <option value="">All Colleges</option>
                {colleges.map((item) => (
                  <option key={item.name} value={item.name}>
                    {item.name} ({item.count})
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
              Search students
              <input
                value={search}
                onChange={(event) => onSearch(event.target.value)}
                placeholder="Search student ID, name, or email"
                className="w-full h-10 px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
              />
            </label>
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-slate-600 flex-none pb-1 border-b border-slate-100">
            <strong className="font-semibold text-slate-900">
              {assignedIds.length} selected
            </strong>
            <div className="flex items-center gap-3">
              <button
                className="font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors border-none bg-transparent p-0 text-xs sm:text-sm"
                type="button"
                disabled={!allEligible.length}
                onClick={() => onSelectEligible(allEligible)}
              >
                Select all eligible
              </button>
              <button
                className="font-semibold text-slate-500 hover:text-slate-700 cursor-pointer transition-colors border-none bg-transparent p-0 text-xs sm:text-sm"
                type="button"
                onClick={() => onSelectEligible([])}
              >
                Clear
              </button>
            </div>
          </div>

          {/* College & Student List */}
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-3 pr-1.5">
            {!names.length ? (
              <div className="py-12 text-center text-xs sm:text-sm text-slate-500 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                No eligible students match the selected filters.
              </div>
            ) : (
              names.map((name) => {
                const list = groups[name]
                const open = activeCollege === name
                const available = eligible(list)
                const selectedInGroup = list.filter((student) =>
                  assignedIds.includes(student.id),
                ).length
                const sectionId = `college-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`
                return (
                  <section
                    className="border border-slate-200/90 rounded-xl bg-slate-50/40 overflow-hidden transition-all"
                    key={name}
                  >
                    <div className="w-full flex items-center justify-between gap-3 p-3 sm:px-4 sm:py-3 bg-slate-100/70 text-slate-900 font-semibold text-xs sm:text-sm select-none">
                      <button
                        type="button"
                        className="flex-1 flex flex-wrap sm:flex-nowrap items-center gap-2 text-left cursor-pointer border-none bg-transparent p-0 focus:outline-none focus:text-blue-600 transition-colors"
                        aria-expanded={open}
                        aria-controls={sectionId}
                        onClick={() => toggleCollege(name)}
                      >
                        <span aria-hidden="true" className="text-slate-400 text-xs w-4 text-center font-bold">
                          {open ? "▾" : "▸"}
                        </span>
                        <span className="text-slate-900 font-bold text-xs sm:text-sm break-words">
                          {name}
                        </span>
                        <small className="text-slate-500 font-medium text-xs break-normal ml-auto sm:ml-2">
                          {list.length} students · {selectedInGroup} selected
                        </small>
                      </button>
                      {available.length > 0 && (
                        <button
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700 whitespace-nowrap cursor-pointer border-none bg-transparent p-0 transition-colors ml-2"
                          type="button"
                          onClick={() =>
                            onSelectEligible(
                              available.map((student) => student.id),
                            )
                          }
                        >
                          Select all eligible
                        </button>
                      )}
                    </div>
                    {open && (
                      <div
                        className="p-2.5 sm:p-3 flex flex-col gap-2 bg-white border-t border-slate-200/70"
                        id={sectionId}
                      >
                        {list.map((student) => {
                          const assigned = assignedIds.includes(student.id)
                          const canSelect =
                            student.accountStatus === "ACTIVE" && !assigned
                          return (
                            <label
                              className="group min-w-0 flex items-start sm:items-center gap-3 p-3 rounded-lg border border-slate-200/70 bg-white hover:border-blue-300 hover:bg-blue-50/20 transition-all cursor-pointer has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-75 has-[:disabled]:bg-slate-50/50"
                              key={student.id}
                            >
                              <input
                                type="checkbox"
                                checked={assigned}
                                disabled={!canSelect}
                                onChange={(event) =>
                                  onToggle(student.id, event.target.checked)
                                }
                                className="mt-0.5 sm:mt-0 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-2 cursor-pointer disabled:cursor-not-allowed flex-shrink-0 transition-colors"
                              />
                              <span className="min-w-0 flex-1 grid grid-cols-1 sm:grid-cols-[minmax(120px,1.1fr)_minmax(100px,0.8fr)_minmax(150px,1.4fr)_auto] items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                                <strong className="font-semibold text-slate-900 truncate">
                                  {student.fullName}
                                </strong>
                                <span className="text-slate-500 font-mono text-xs truncate">
                                  {student.studentId}
                                </span>
                                <span className="text-slate-500 truncate text-xs sm:text-sm">
                                  {student.email}
                                </span>
                                <em
                                  className={
                                    assigned
                                      ? "justify-self-start sm:justify-self-end px-2.5 py-0.5 text-[11px] font-semibold not-italic rounded-full whitespace-nowrap text-amber-800 bg-amber-100/80 border border-amber-200/60"
                                      : canSelect
                                        ? "justify-self-start sm:justify-self-end px-2.5 py-0.5 text-[11px] font-semibold not-italic rounded-full whitespace-nowrap text-emerald-800 bg-emerald-100/80 border border-emerald-200/60"
                                        : "justify-self-start sm:justify-self-end px-2.5 py-0.5 text-[11px] font-semibold not-italic rounded-full whitespace-nowrap text-slate-500 bg-slate-100 border border-slate-200/60"
                                  }
                                >
                                  {assigned
                                    ? "Already assigned"
                                    : student.accountStatus}
                                </em>
                              </span>
                            </label>
                          )
                        })}
                      </div>
                    )}
                  </section>
                )
              })
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex-none flex items-center justify-end gap-3 p-4 sm:px-7 sm:py-5 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            className="h-10 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-50 cursor-pointer transition-all shadow-sm"
            disabled={saving}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="h-10 px-5 py-2 text-xs sm:text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all shadow-sm shadow-blue-500/20"
            disabled={saving || !assignedIds.length}
            onClick={onAssign}
          >
            {saving ? "Assigning..." : "Assign Students"}
          </button>
        </div>
      </div>
    </div>
  )
}
