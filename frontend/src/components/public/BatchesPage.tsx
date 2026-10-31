import { BATCH_TRACKS } from "./LandingPage"

interface BatchesPageProps {
  onBack: () => void
  onRegister: () => void
}

export function BatchesPage({ onBack, onRegister }: BatchesPageProps) {
  return (
    <div className="min-h-screen bg-[#faf8ff] font-sans text-slate-900">
      <header className="cinematic-navbar sticky top-0 z-20 border-b border-white/80 bg-[#faf8ff]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-[calc(100%-32px)] max-w-7xl items-center justify-between gap-4 sm:w-[calc(100%-48px)]">
          <button onClick={onBack} className="border-0 bg-transparent text-left text-lg font-black text-blue-700">Kaizentrix Global Solutions</button>
          <nav className="hidden items-center gap-5 lg:flex"><a href="/" className="text-sm font-semibold text-slate-600 no-underline">About Us</a><a href="/batches" className="text-sm font-semibold text-blue-600 no-underline">Batches</a><a href="/placement-track" className="text-sm font-semibold text-slate-600 no-underline">Placement Track</a><a href="/achievers" className="text-sm font-semibold text-slate-600 no-underline">Achievers</a><a href="/lms-gateway" className="text-sm font-semibold text-slate-600 no-underline">LMS Gateway</a></nav>
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Back to home</button>
            <button onClick={onRegister} className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-md">Apply now</button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-[calc(100%-32px)] max-w-7xl py-12 sm:w-[calc(100%-48px)] sm:py-16">
        <section className="mb-10 rounded-[28px] border border-white bg-gradient-to-br from-blue-50 via-white to-violet-50 p-7 shadow-[0_18px_50px_rgba(79,70,229,.12)] sm:p-12">
          <span className="text-xs font-extrabold uppercase tracking-[.18em] text-blue-600">Accelerated curriculum</span>
          <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">Upcoming Batches &amp; Engineering Tracks</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">Choose a focused learning path built for modern engineering roles, practical projects, and placement readiness.</p>
        </section>

        <div className="grid gap-5 md:grid-cols-2">
          {BATCH_TRACKS.map((track) => (
            <article key={track.id} className="flex flex-col justify-between rounded-[24px] border border-indigo-100 bg-white p-6 shadow-[0_10px_30px_rgba(79,70,229,.08)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(79,70,229,.14)]">
              <div>
                <span className={`inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold ${track.badgeColor}`}>
                  <span className="material-symbols-outlined text-[17px]">{track.badgeIcon}</span>
                  {track.badge}
                </span>
                <h2 className="mt-5 text-2xl font-black text-slate-950">{track.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">{track.description}</p>
              </div>
              <button onClick={onRegister} className={`mt-7 rounded-xl px-5 py-3 text-sm font-bold shadow-sm transition ${track.actionColor}`}>Apply for track</button>
            </article>
          ))}
        </div>
      </main>
    </div>
  )
}
