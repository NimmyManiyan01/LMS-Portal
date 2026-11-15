import logo from "../../assets/Logo.png"

interface Footer16Props {
  onLogin?: () => void
  onOpenContact?: () => void
}

export function Footer16({ onLogin, onOpenContact }: Footer16Props) {
  return (
    <footer className="relative w-full overflow-hidden bg-white font-sans antialiased text-[#1E3A34] border-t border-slate-200/80 pt-12 pb-8 px-6 sm:px-12">
      {/* SVG Stroke Drawing Animation Keyframes */}
      <style>{`
        @keyframes kgsStrokeDraw {
          0% {
            stroke-dashoffset: 1400;
            fill: transparent;
          }
          45% {
            stroke-dashoffset: 0;
            fill: rgba(5, 122, 85, 0.04);
          }
          75% {
            stroke-dashoffset: 0;
            fill: rgba(5, 122, 85, 0.07);
          }
          100% {
            stroke-dashoffset: -1400;
            fill: transparent;
          }
        }
        .kgs-watermark-stroke {
          stroke-dasharray: 1400;
          animation: kgsStrokeDraw 10s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>

      {/* SVG Drawing Line-Stroke Animated Watermark Background */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none select-none z-0">
        <svg
          className="w-full h-full max-h-[320px] select-none"
          viewBox="0 0 1000 220"
          preserveAspectRatio="xMidYMid meet"
        >
          <text
            x="50%"
            y="55%"
            dominantBaseline="middle"
            textAnchor="middle"
            fontSize="145"
            fontWeight="900"
            letterSpacing="8"
            stroke="#057A55"
            strokeWidth="1.8"
            className="kgs-watermark-stroke font-sans"
          >
            KAIZENTRIX
          </text>
        </svg>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-10">

        {/* UPPER CONTENT (Company Logo, Description, ISO Badges, Social Buttons, Quick Links, Contact Details) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

          {/* Left Column: Brand Logo, Description, ISO Badges, Social Channels (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <img
                alt="Kaizentrix Global Solutions"
                className="h-9 w-auto"
                src={logo}
              />
              <span className="text-xl font-black tracking-tight text-[#057A55]">
                Kaizentrix Global Solutions
              </span>
            </div>

            <p className="text-xs sm:text-sm font-bold text-slate-600 leading-relaxed max-w-md m-0">
              India&apos;s leading specialized accelerator for algorithmic mastery, full-stack systems engineering, and Tier-1 product placement training.
            </p>

            {/* ISO Certification Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-[11px] font-extrabold text-slate-700 shadow-2xs">
                ISO 9001 – Quality Management
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-[11px] font-extrabold text-slate-700 shadow-2xs">
                ISO/IEC 27001 – Information Security
              </span>
            </div>

            {/* Social Channels */}
            <div className="flex items-center gap-2.5 pt-2">
              <a
                aria-label="LinkedIn"
                className="w-9 h-9 rounded-2xl bg-slate-100 border border-slate-200/80 hover:bg-[#057A55] hover:text-white hover:border-[#057A55] text-slate-600 flex items-center justify-center transition-all shadow-2xs"
                href="https://www.linkedin.com/company/kaizentrix-global-solutions-pvt-ltd/posts/"
                target="_blank"
                rel="noreferrer"
              >
                <svg className="h-4.5 w-4.5 fill-current" viewBox="0 0 24 24">
                  <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V8.98h3.42v1.57h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.29ZM5.32 7.41a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13ZM7.1 20.45H3.54V8.98H7.1v11.47Z" />
                </svg>
              </a>
              <a
                aria-label="GitHub"
                className="w-9 h-9 rounded-2xl bg-slate-100 border border-slate-200/80 hover:bg-[#057A55] hover:text-white hover:border-[#057A55] text-slate-600 flex items-center justify-center transition-all shadow-2xs"
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
              >
                <svg className="h-4.5 w-4.5 fill-current" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.48 2 2 6.58 2 12.23c0 4.52 2.87 8.35 6.84 9.71.5.1.68-.22.68-.49 0-.24-.01-1.05-.01-1.9-2.78.62-3.37-1.2-3.37-1.2-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.35 1.12 2.92.85.09-.66.35-1.12.64-1.37-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05A9.35 9.35 0 0 1 12 6.96a9.3 9.3 0 0 1 2.5.35c1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.35 4.8-4.58 5.05.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.59.69.49A10.23 10.23 0 0 0 22 12.23C22 6.58 17.52 2 12 2Z" clipRule="evenodd" />
                </svg>
              </a>
              <a
                aria-label="YouTube"
                className="w-9 h-9 rounded-2xl bg-slate-100 border border-slate-200/80 hover:bg-[#057A55] hover:text-white hover:border-[#057A55] text-slate-600 flex items-center justify-center transition-all shadow-2xs"
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
              >
                <svg className="h-4.5 w-4.5 fill-current" viewBox="0 0 24 24">
                  <path d="M23.5 6.2a3 3 0 0 0-2.1-2.12C19.55 3.57 12 3.57 12 3.57s-7.55 0-9.4.51A3 3 0 0 0 .5 6.2 31.2 31.2 0 0 0 0 12a31.2 31.2 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.12c1.85.51 9.4.51 9.4.51s7.55 0 9.4-.51a3 3 0 0 0 2.1-2.12A31.2 31.2 0 0 0 24 12a31.2 31.2 0 0 0-.5-5.8ZM9.6 15.57V8.43L15.82 12 9.6 15.57Z" />
                </svg>
              </a>
              <a
                aria-label="Discord"
                className="w-9 h-9 rounded-2xl bg-slate-100 border border-slate-200/80 hover:bg-[#057A55] hover:text-white hover:border-[#057A55] text-slate-600 flex items-center justify-center transition-all shadow-2xs"
                href="https://discord.com"
                target="_blank"
                rel="noreferrer"
              >
                <svg className="h-4.5 w-4.5 fill-current" viewBox="0 0 24 24">
                  <path d="M20.32 4.37A19.8 19.8 0 0 0 15.44 2.9l-.6 1.22a18.3 18.3 0 0 0-5.67 0L8.56 2.9A19.7 19.7 0 0 0 3.68 4.38C.6 8.96-.23 13.42.18 17.82a19.9 19.9 0 0 0 5.99 3.03l1.46-1.98a12.8 12.8 0 0 1-2.3-1.1l.57-.45c3.96 1.84 8.26 1.84 12.17 0l.58.45c-.74.43-1.5.8-2.3 1.1l1.46 1.98a19.8 19.8 0 0 0 6-3.03c.48-5.1-.83-9.51-3.49-13.45ZM8.02 15.13c-1.2 0-2.18-1.1-2.18-2.45s.96-2.45 2.18-2.45c1.21 0 2.2 1.1 2.18 2.45 0 1.35-.96 2.45-2.18 2.45Zm7.96 0c-1.2 0-2.18-1.1-2.18-2.45s.96-2.45 2.18-2.45c1.22 0 2.2 1.1 2.18 2.45 0 1.35-.96 2.45-2.18 2.45Z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Center Column: Navigation Links (3 Cols) */}
          <div className="lg:col-span-3 flex flex-wrap items-center lg:items-start lg:flex-col gap-3.5 text-xs font-bold text-[#1E3A34] pt-1">
            <a
              className="hover:text-[#057A55] transition-colors"
              href="https://www.kaizentrixglobal.com/"
              target="_blank"
              rel="noreferrer"
            >
              About Us
            </a>
            {onOpenContact && (
              <button
                onClick={onOpenContact}
                className="cursor-pointer border-0 bg-transparent p-0 text-left text-xs font-bold text-[#1E3A34] hover:text-[#057A55] transition-colors"
              >
                Contact Us
              </button>
            )}
            <a
              className="hover:text-[#057A55] transition-colors"
              href="https://www.linkedin.com/company/kaizentrix-global-solutions-pvt-ltd/posts/"
              target="_blank"
              rel="noreferrer"
            >
              LinkedIn
            </a>
            {onLogin && (
              <button
                onClick={onLogin}
                className="cursor-pointer border-0 bg-transparent p-0 text-left text-xs font-bold text-[#1E3A34] hover:text-[#057A55] transition-colors"
              >
                Portal Login
              </button>
            )}
          </div>

          {/* Right Column: Contact Details (4 Cols) */}
          <div className="lg:col-span-4 space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-[#057A55] block mb-1">
              Contact
            </span>

            <div className="flex items-start gap-3 text-xs font-bold text-[#1E3A34]">
              <span className="text-base text-[#057A55]">✉️</span>
              <a
                className="break-all hover:text-[#057A55] transition-colors"
                href="mailto:enquiry@kaizentrixglobal.com"
              >
                enquiry@kaizentrixglobal.com
              </a>
            </div>

            <div className="flex items-start gap-3 text-xs font-bold text-[#1E3A34]">
              <span className="text-base text-[#057A55]">📞</span>
              <a className="hover:text-[#057A55] transition-colors" href="tel:+919187980031">
                080-23143355 / +91 91879 80031
              </a>
            </div>

            <div className="flex items-start gap-3 text-xs font-bold text-[#1E3A34]">
              <span className="text-base text-[#057A55]">📍</span>
              <span className="leading-relaxed">
                100 DC Complex, Chandra Layout,<br />
                Vijayanagar, Bengaluru,<br />
                Karnataka 560056
              </span>
            </div>
          </div>

        </div>

        {/* LOWER SECTION (Separated by subtle line) */}
        <div className="pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-extrabold text-[#1E3A34]">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <a
              className="hover:text-[#057A55] transition-colors"
              href="mailto:enquiry@kaizentrixglobal.com"
            >
              Campus Assistance
            </a>
            <span className="text-[#1E3A34]/30">•</span>
            <a
              className="hover:text-[#057A55] transition-colors"
              href="/placement-policy"
            >
              Placement Policy
            </a>
            <span className="text-[#1E3A34]/30">•</span>
            <a
              className="hover:text-[#057A55] transition-colors"
              href="/policy"
            >
              Privacy &amp; Terms
            </a>
          </div>

          <div className="text-center sm:text-right text-xs font-extrabold text-slate-500">
            © 2026 Kaizentrix Global Solutions Private Limited. All rights reserved.
          </div>
        </div>

      </div>
    </footer>
  )
}
