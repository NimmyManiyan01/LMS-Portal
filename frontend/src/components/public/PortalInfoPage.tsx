type PortalPageKind = "placement" | "achievers" | "lms"

const content = {
  placement: {
    eyebrow: "PLACEMENT TRACK",
    title: "Build skills. Clear rounds. Get placement ready.",
    summary: "A structured path from technical preparation to interview execution, with progress visibility at every stage.",
    cards: [["01", "Skill preparation", "Strengthen DSA, system design, full-stack engineering, AI, and data skills through focused practice."], ["02", "Mock rounds", "Practice coding, technical, behavioral, and system-design rounds with actionable feedback."], ["03", "Placement execution", "Track applications, interview schedules, recruiter communication, and offer progress in one workspace."]],
  },
  achievers: {
    eyebrow: "VERIFIED OUTCOMES",
    title: "Meet the engineers who moved forward with KGS.",
    summary: "Real offers, verified salaries, and interview breakthroughs from learners across our engineering tracks.",
    cards: [["14.2 LPA", "Sneha Reddy · Amazon", "Cloud Support Engineer II · Bangalore"], ["11.5 LPA", "Karthik Varma · Cisco", "Software Engineer (Networks) · Chennai"], ["10.8 LPA", "Divya Menon · Juspay", "Backend Engineer · Remote"], ["8.5 LPA", "Arun Prakash · Zoho Corp", "Full Stack Engineer · Bengaluru"]],
  },
  lms: {
    eyebrow: "LMS GATEWAY",
    title: "Your connected student operating system.",
    summary: "Access assessments, learning resources, placement rounds, announcements, and progress tracking from one secure gateway.",
    cards: [["Assessments", "Secure examination workspace", "View eligible exams, complete system checks, and submit responses with autosave support."], ["Learning", "Practice and master concepts", "Work through coding challenges, live classes, mock interviews, and technical learning paths."], ["Placements", "Track every round in real time", "Follow applications, interview schedules, recruiter updates, and published results."]],
  },
} as const

export function PortalInfoPage({ kind, onBack, onLogin, onRegister }: { kind: PortalPageKind; onBack: () => void; onLogin: () => void; onRegister: () => void }) {
  const page = content[kind]
  return <div className="min-h-screen bg-[#faf8ff] font-sans text-slate-900">
    <header className="sticky top-0 z-20 border-b border-white/80 bg-[#faf8ff]/90 backdrop-blur-xl"><div className="mx-auto flex h-16 w-[calc(100%-32px)] max-w-7xl items-center justify-between gap-4 sm:w-[calc(100%-48px)]"><button onClick={onBack} className="border-0 bg-transparent text-left text-lg font-black text-blue-700">Kaizentrix Global Solutions</button><nav className="hidden items-center gap-5 lg:flex"><a href="/" className="text-sm font-semibold text-slate-600 no-underline">About Us</a><a href="/batches" className="text-sm font-semibold text-slate-600 no-underline">Batches</a><a href="/placement-track" className={`text-sm font-semibold no-underline ${kind === "placement" ? "text-blue-600" : "text-slate-600"}`}>Placement Track</a><a href="/achievers" className={`text-sm font-semibold no-underline ${kind === "achievers" ? "text-blue-600" : "text-slate-600"}`}>Achievers</a><a href="/lms-gateway" className={`text-sm font-semibold no-underline ${kind === "lms" ? "text-blue-600" : "text-slate-600"}`}>LMS Gateway</a></nav><div className="flex gap-2"><button onClick={onBack} className="hidden rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 sm:inline-flex">Back to home</button><button onClick={kind === "lms" ? onLogin : onRegister} className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-md">{kind === "lms" ? "Portal login" : "Get started"}</button></div></div></header>
    <main className="mx-auto w-[calc(100%-32px)] max-w-7xl py-12 sm:w-[calc(100%-48px)] sm:py-16"><section className="mb-10 rounded-[28px] border border-white bg-gradient-to-br from-blue-50 via-white to-violet-50 p-7 shadow-[0_18px_50px_rgba(79,70,229,.12)] sm:p-12"><span className="text-xs font-extrabold uppercase tracking-[.18em] text-blue-600">{page.eyebrow}</span><h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">{page.title}</h1><p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">{page.summary}</p></section><div className="grid gap-5 md:grid-cols-3">{page.cards.map((card) => <article key={card[0]} className="rounded-[24px] border border-indigo-100 bg-white p-6 shadow-[0_10px_30px_rgba(79,70,229,.08)]"><span className="text-xs font-extrabold uppercase tracking-[.16em] text-indigo-500">{card[0]}</span><h2 className="mt-4 text-xl font-black text-slate-950">{card[1]}</h2><p className="mt-3 text-sm leading-6 text-slate-600">{card[2]}</p></article>)}</div></main>
  </div>
}
