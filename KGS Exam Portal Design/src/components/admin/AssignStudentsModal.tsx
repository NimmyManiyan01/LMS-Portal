import { useEffect, useMemo, useState } from "react"

type Student = { id: string; studentId: string; fullName: string; email: string; college?: string; accountStatus: string }
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

export function AssignStudentsModal({ examination, students, colleges, assignedIds, search, college, saving, onSearch, onCollege, onToggle, onSelectEligible, onClose, onAssign }: Props) {
  const visible = useMemo(() => students.filter((student) => `${student.studentId} ${student.fullName} ${student.email}`.toLowerCase().includes(search.toLowerCase())), [students, search])
  const groups = useMemo(() => visible.reduce<Record<string, Student[]>>((result, student) => { const key = student.college?.trim() || "College Not Specified"; (result[key] ||= []).push(student); return result }, {}), [visible])
  const names = Object.keys(groups)
  const [activeCollege, setActiveCollege] = useState("")
  useEffect(() => { setActiveCollege((current) => current && groups[current] ? current : names[0] || "") }, [college, search, names.join("|")])
  const eligible = (list: Student[]) => list.filter((student) => student.accountStatus === "ACTIVE" && !assignedIds.includes(student.id))
  const allEligible = visible.filter((student) => student.accountStatus === "ACTIVE" && !assignedIds.includes(student.id)).map((student) => student.id)
  const toggleCollege = (name: string) => setActiveCollege((current) => current === name ? "" : name)

  return <div className="modal-backdrop"><div className="modal-card assignment-modal" role="dialog" aria-modal="true" aria-labelledby="assign-students-title"><div className="modal-header"><div><div className="eyebrow">EXAMINATION ASSIGNMENT</div><h2 id="assign-students-title">Assign Students</h2><p>{examination.title || examination.name} · {examination.code}</p></div><button className="modal-close" onClick={onClose} aria-label="Close assignment modal">×</button></div><div className="assignment-modal-body"><div className="assignment-filters"><label>Filter by College<select value={college} onChange={(event) => onCollege(event.target.value)}><option value="">All Colleges</option>{colleges.map((item) => <option key={item.name} value={item.name}>{item.name} ({item.count})</option>)}</select></label><label>Search students<input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search student ID, name, or email" /></label></div><div className="assignment-toolbar"><strong>{assignedIds.length} selected</strong><div><button className="text-button" type="button" disabled={!allEligible.length} onClick={() => onSelectEligible(allEligible)}>Select all eligible</button><button className="text-button" type="button" onClick={() => onSelectEligible([])}>Clear</button></div></div><div className="assignment-college-list">{!names.length ? <div className="dashboard-empty">No eligible students match the selected filters.</div> : names.map((name) => { const list = groups[name]; const open = activeCollege === name; const available = eligible(list); const selectedInGroup = list.filter((student) => assignedIds.includes(student.id)).length; const sectionId = `college-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`; return <section className="assignment-college-group" key={name}><div className="assignment-college-heading"><button type="button" className="assignment-college-toggle" aria-expanded={open} aria-controls={sectionId} onClick={() => toggleCollege(name)}><span aria-hidden="true">{open ? "▾" : "▸"}</span><span>{name}</span><small>{list.length} students · {selectedInGroup} selected</small></button>{available.length > 0 && <button className="text-button" type="button" onClick={() => onSelectEligible(available.map((student) => student.id))}>Select all eligible</button>}</div>{open && <div className="assignment-student-list" id={sectionId}>{list.map((student) => { const assigned = assignedIds.includes(student.id); const canSelect = student.accountStatus === "ACTIVE" && !assigned; return <label className="assignment-student-row" key={student.id}><input type="checkbox" checked={assigned} disabled={!canSelect} onChange={(event) => onToggle(student.id, event.target.checked)} /><span className="assignment-student-details"><strong>{student.fullName}</strong><span>{student.studentId}</span><span>{student.email}</span><em className={assigned ? "assigned" : canSelect ? "eligible" : "ineligible"}>{assigned ? "Already assigned" : student.accountStatus}</em></span></label> })}</div>}</section> })}</div></div><div className="modal-actions"><button className="secondary" disabled={saving} onClick={onClose}>Cancel</button><button className="primary" disabled={saving || !assignedIds.length} onClick={onAssign}>{saving ? "Assigning..." : "Assign Students"}</button></div></div></div>
}
