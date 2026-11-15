export interface Footer16Link {
  label: string
  href: string
}

export interface Footer16Column {
  title: string
  links: Footer16Link[]
}

export interface Footer16Social {
  label: string
  href: string
  icon: "facebook" | "twitter" | "instagram" | "linkedin"
}

export interface Footer16Props {
  brandName?: string
  tagline?: string
  columns?: Footer16Column[]
  legalLinks?: Footer16Link[]
  socials?: Footer16Social[]
  copyright?: string
  backgroundImage?: string
}

const defaultColumns: Footer16Column[] = [
  {
    title: "Solutions",
    links: [
      { label: "Candidate Assessments", href: "#" },
      { label: "Proctored Examinations", href: "#" },
      { label: "Automated Evaluation", href: "#" },
      { label: "Enterprise Analytics", href: "#" },
    ],
  },
  {
    title: "Capabilities",
    links: [
      { label: "Web Architecture", href: "#" },
      { label: "Proctoring Systems", href: "#" },
      { label: "Paper Set Builder", href: "#" },
      { label: "Audit Infrastructure", href: "#" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Placement Policy", href: "/placement-policy" },
      { label: "Candidate Guidelines", href: "#" },
      { label: "System Check", href: "#" },
      { label: "Campus Assistance", href: "mailto:enquiry@kaizentrixglobal.com" },
    ],
  },
]

const defaultLegalLinks: Footer16Link[] = [
  { label: "Privacy Policy", href: "/policy" },
  { label: "Terms of Service", href: "/policy" },
  { label: "Cookie Policy", href: "/policy" },
]

const defaultSocials: Footer16Social[] = [
  { label: "Facebook", href: "#", icon: "facebook" },
  { label: "Twitter", href: "#", icon: "twitter" },
  { label: "Instagram", href: "#", icon: "instagram" },
  { label: "LinkedIn", href: "#", icon: "linkedin" },
]

export function Footer16({
  brandName = "KAIZENTRIX",
  tagline = "Empowering enterprise assessments, candidate evaluations,\nand certified examination lifecycles with\nintegrity and real-time analytics.",
  columns = defaultColumns,
  legalLinks = defaultLegalLinks,
  socials = defaultSocials,
  copyright = "© 2026 Kaizentrix Global Solutions Private Limited. All rights reserved.",
}: Footer16Props) {
  return (
    <footer className="relative w-full overflow-hidden bg-[#090D16] font-sans text-white antialiased border-t border-white/10">
      {/* Background Glow Orbs */}
      <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-[#00C4DF]/20 blur-[150px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-[600px] h-[600px] rounded-full bg-[#00D084]/20 blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-12">
        {/* Brand Big Watermark */}
        <div className="w-full flex justify-center overflow-hidden mb-12 select-none opacity-25">
          <span className="text-6xl sm:text-8xl lg:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white/40 to-white/5">
            {brandName}
          </span>
        </div>

        <div className="grid gap-10 lg:grid-cols-[minmax(280px,1fr)_minmax(520px,1fr)] lg:gap-x-16 border-t border-white/10 pt-10">
          {/* Brand Info & Tagline */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#00D084] via-[#057A55] to-[#1E3A34] flex items-center justify-center text-white font-black italic text-base shadow-lg shadow-emerald-500/20">
                K
              </div>
              <div>
                <span className="block text-lg font-black tracking-tight text-white">
                  KGS EXAM PORTAL
                </span>
                <span className="block text-[9px] font-extrabold tracking-widest text-[#00D084] uppercase">
                  FLUX ENTERPRISE SUITE
                </span>
              </div>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed font-semibold text-slate-300 whitespace-pre-line max-w-md">
              {tagline}
            </p>
          </div>

          {/* Navigation Links Columns */}
          <nav aria-label="Footer navigation" className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {columns.map((column) => (
              <div key={column.title} className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-[#00D084]">
                  {column.title}
                </h3>
                <ul className="space-y-2.5 p-0 m-0 list-none">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-xs font-bold text-slate-300 hover:text-white transition-colors duration-200"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* Footer Bottom Legal & Copyright Bar */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-400">
          <p className="m-0 text-center sm:text-left">{copyright}</p>

          <div className="flex flex-wrap items-center gap-5">
            {legalLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-xs font-bold text-slate-400 hover:text-white transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
