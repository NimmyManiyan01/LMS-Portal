import { useMemo, useState } from "react"

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
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const visible = useMemo(() => students.filter((student) => `${student.studentId} ${student.fullName} ${student.email}`.toLowerCase().includes(search.toLowerCase())), [students, search])
  const groups = useMemo(() => visible.reduce<Record<string, Student[]>>((result, student) => { const key = student.college?.trim() || "Unassigned College"; (result[key] ||= []).push(student); return result }, {}), [visible])
  const eligible = (list: Student[]) => list.filter((student) => student.accountStatus === "ACTIVE" && !assignedIds.includes(student.id))

  return <div className="modal-backdrop"><div className="modal-card assignment-modal"><div className="modal-header"><div><div className="eyebrow">EXAMINATION ASSIGNMENT</div><h2>Assign Students</h2><p>{examination.title || examination.name} · {examination.code}</p></div><button className="modal-close" onClick={onClose} aria-label="Close assignment modal">×</button></div><div className="assignment-modal-body"><label>Filter by College<select value={college} onChange={(event) => onCollege(event.target.value)}><option value="">All Colleges</option>{colleges.map((item) => <option key={item.name} value={item.name}>{item.name} ({item.count})</option>)}</select></label><label>Search students<input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search student ID, name, or email" /></label><div className="assignment-toolbar"><strong>{assignedIds.length} selected</strong></div>{Object.keys(groups).length === 0 ? <div className="dashboard-empty">No eligible students match the selected filters.</div> : Object.entries(groups).map(([name, list]) => { const open = collapsed[name] !== true; const available = eligible(list); return <section className="assignment-college-group" key={name}><button className="assignment-college-heading" type="button" onClick={() => setCollapsed((current) => ({ ...current, [name]: open }))}><span>{open ? "▾" : "▸"} {name} ({list.length} students)</span>{available.length > 0 && <button className="text-button" type="button" onClick={(event) => { event.stopPropagation(); onSelectEligible(available.map((student) => student.id)) }}>Select all eligible</button>}</button>{open && <div className="assignment-student-list">{list.map((student) => { const assigned = assignedIds.includes(student.id); const canSelect = student.accountStatus === "ACTIVE" && !assigned; return <label key={student.id}><input type="checkbox" checked={assignedIds.includes(student.id)} disabled={!canSelect} onChange={(event) => onToggle(student.id, event.target.checked)} /><span><strong>{student.fullName}</strong> · {student.studentId}<small>{student.email} · {assigned ? "Already assigned" : student.accountStatus}</small></span></label> })}</div>}</section> })}</div><div className="modal-actions"><button className="secondary" disabled={saving} onClick={onClose}>Cancel</button><button className="primary" disabled={saving || !assignedIds.length} onClick={onAssign}>{saving ? "Assigning..." : "Assign Students"}</button></div></div></div>
}
