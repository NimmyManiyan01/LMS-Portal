import logo from "../../assets/Logo.png"

interface Footer16Props {
  onLogin?: () => void
  onOpenContact?: () => void
}

/**
 * Clean boolean-UNION 10 vector paths for "KAIZENTRIX" (K A I Z E N T R I X).
 * Outlined heavy geometric ExtraBold capitals stretching edge-to-edge.
 * ViewBox 0 0 1000 200 with preserveAspectRatio="none".
 */
const WORDMARK_PATHS = [
  // 1. K
  "M 10 5 L 42 5 L 42 85 L 75 5 L 110 5 L 62 90 L 112 195 L 78 195 L 42 118 L 42 195 L 10 195 Z",
  // 2. A (Compound outer + counter hole cutout)
  "M 145 5 L 160 5 L 205 195 L 172 195 L 163 155 L 125 155 L 116 195 L 83 195 Z M 144 60 L 133 118 L 155 118 Z",
  // 3. I
  "M 205 5 L 235 5 L 235 195 L 205 195 Z",
  // 4. Z
  "M 245 5 L 335 5 L 335 38 L 285 162 L 335 162 L 335 195 L 245 195 L 245 162 L 295 38 L 245 38 Z",
  // 5. E
  "M 345 5 L 435 5 L 435 38 L 382 38 L 382 82 L 428 82 L 428 115 L 382 115 L 382 162 L 435 162 L 435 195 L 345 195 Z",
  // 6. N
  "M 445 5 L 478 5 L 512 130 L 512 5 L 545 5 L 545 195 L 512 195 L 478 70 L 478 195 L 445 195 Z",
  // 7. T
  "M 555 5 L 655 5 L 655 38 L 620 38 L 620 195 L 590 195 L 590 38 L 555 38 Z",
  // 8. R (Compound outer + counter loop cutout)
  "M 665 5 L 730 5 C 752 5 765 19 765 48 C 765 72 750 88 730 92 L 765 195 L 730 195 L 700 102 L 695 102 L 695 195 L 665 195 Z M 695 35 L 695 72 L 722 72 C 732 72 738 66 738 53 C 738 41 732 35 722 35 Z",
  // 9. I
  "M 775 5 L 805 5 L 805 195 L 775 195 Z",
  // 10. X
  "M 815 5 L 848 5 L 868 78 L 888 5 L 920 5 L 888 98 L 922 195 L 890 195 L 868 118 L 846 195 L 814 195 L 846 98 Z",
]

/**
 * Reusable <FooterWaveWordmark /> Component.
 * Darker, subtle, blended KAIZENTRIX watermark filling the bottom half of the deep forest-green footer.
 */
export function FooterWaveWordmark() {
  return (
    <div
      aria-hidden="true"
      className="absolute bottom-0 left-0 right-0 h-[68%] w-full pointer-events-none select-none overflow-hidden z-0"
    >
      <svg
        className="w-full h-full select-none opacity-45"
        viewBox="0 0 1000 200"
        preserveAspectRatio="none"
      >
        {WORDMARK_PATHS.map((d, index) => (
          <path
            key={index}
            d={d}
            fill="#03140F"
            stroke="none"
          />
        ))}
      </svg>
    </div>
  )
}

export function Footer16({ onLogin, onOpenContact }: Footer16Props) {
  return (
    <footer className="relative w-full overflow-hidden bg-[#0B1F1A] font-sans antialiased text-slate-200 pt-14 pb-8 px-6 sm:px-12 border-t border-[#00D084]/20">

      {/* Giant Blended KAIZENTRIX Background Watermark (z-0) */}
      <FooterWaveWordmark />

      <div className="relative z-10 max-w-7xl mx-auto space-y-12">

        {/* UPPER CONTENT COLUMNS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

          {/* COLUMN 1: Brand & Certification (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#00D084] via-[#057A55] to-[#1E3A34] flex items-center justify-center text-white font-black italic text-lg shadow-lg shadow-emerald-500/20">
                K
              </div>
              <div>
                <span className="block text-xl font-extrabold tracking-tight text-white">
                  Kaizentrix Global Solutions
                </span>
                <span className="block text-[9px] font-black tracking-widest text-[#00D084] uppercase">
                  FLUX ENTERPRISE SUITE
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm font-medium text-slate-300 leading-relaxed max-w-md m-0">
              India&apos;s leading specialized accelerator for algorithmic mastery, full-stack systems engineering, and Tier-1 product placement training.
            </p>

            {/* ISO Certification Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="px-3 py-1 rounded-full bg-[#132D26] border border-[#00D084]/30 text-xs font-semibold text-emerald-300 shadow-2xs">
                ISO 9001 – Quality Management
              </span>
              <span className="px-3 py-1 rounded-full bg-[#132D26] border border-[#00D084]/30 text-xs font-semibold text-emerald-300 shadow-2xs">
                ISO/IEC 27001 – Information Security
              </span>
            </div>

            {/* Social Channels */}
            <div className="flex items-center gap-2.5 pt-2">
              <a
                aria-label="LinkedIn"
                className="w-9 h-9 rounded-xl bg-[#132D26] border border-[#00D084]/30 hover:bg-[#00D084] hover:text-[#0A1F1A] text-slate-200 flex items-center justify-center transition-all duration-200 shadow-2xs"
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
                className="w-9 h-9 rounded-xl bg-[#132D26] border border-[#00D084]/30 hover:bg-[#00D084] hover:text-[#0A1F1A] text-slate-200 flex items-center justify-center transition-all duration-200 shadow-2xs"
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
                className="w-9 h-9 rounded-xl bg-[#132D26] border border-[#00D084]/30 hover:bg-[#00D084] hover:text-[#0A1F1A] text-slate-200 flex items-center justify-center transition-all duration-200 shadow-2xs"
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
                className="w-9 h-9 rounded-xl bg-[#132D26] border border-[#00D084]/30 hover:bg-[#00D084] hover:text-[#0A1F1A] text-slate-200 flex items-center justify-center transition-all duration-200 shadow-2xs"
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

          {/* COLUMN 2: QUICK LINKS (3 Cols) */}
          <div className="lg:col-span-3 space-y-3.5">
            <span className="text-xs font-black uppercase tracking-wider text-[#00D084] block mb-2">
              Quick Links
            </span>
            <ul className="space-y-2.5 p-0 m-0 list-none text-xs sm:text-sm font-semibold">
              <li>
                <a
                  className="text-slate-300 hover:text-[#00D084] transition-colors duration-200"
                  href="https://www.kaizentrixglobal.com/"
                  target="_blank"
                  rel="noreferrer"
                >
                  About Us
                </a>
              </li>
              {onOpenContact && (
                <li>
                  <button
                    onClick={onOpenContact}
                    className="cursor-pointer border-0 bg-transparent p-0 text-left text-xs sm:text-sm font-semibold text-slate-300 hover:text-[#00D084] transition-colors duration-200"
                  >
                    Contact Us
                  </button>
                </li>
              )}
              <li>
                <a
                  className="text-slate-300 hover:text-[#00D084] transition-colors duration-200"
                  href="https://www.linkedin.com/company/kaizentrix-global-solutions-pvt-ltd/posts/"
                  target="_blank"
                  rel="noreferrer"
                >
                  LinkedIn
                </a>
              </li>
              {onLogin && (
                <li>
                  <button
                    onClick={onLogin}
                    className="cursor-pointer border-0 bg-transparent p-0 text-left text-xs sm:text-sm font-semibold text-[#00D084] hover:underline transition-colors duration-200"
                  >
                    Portal Login
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* COLUMN 3: CONTACT & INQUIRIES (4 Cols) */}
          <div className="lg:col-span-4 space-y-3.5">
            <span className="text-xs font-black uppercase tracking-wider text-[#00D084] block mb-2">
              Contact &amp; Inquiries
            </span>

            <div className="space-y-3 text-xs sm:text-sm font-medium text-slate-300">
              <div className="flex items-start gap-3">
                <span className="text-base text-[#00D084] shrink-0">✉️</span>
                <a
                  className="break-all hover:text-[#00D084] transition-colors duration-200"
                  href="mailto:enquiry@kaizentrixglobal.com"
                >
                  enquiry@kaizentrixglobal.com
                </a>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-base text-[#00D084] shrink-0">📞</span>
                <a className="hover:text-[#00D084] transition-colors duration-200" href="tel:+919187980031">
                  080-23143355 / +91 91879 80031
                </a>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-base text-[#00D084] shrink-0">📍</span>
                <span className="leading-relaxed">
                  100 DC Complex, Chandra Layout,<br />
                  Vijayanagar, Bengaluru,<br />
                  Karnataka 560056
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* LOWER SECTION: COPYRIGHT & POLICY BAR */}
        <div className="pt-6 border-t border-[#00D084]/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-400">
          <div className="text-center sm:text-left text-xs font-semibold text-slate-300">
            © 2026 Kaizentrix Global Solutions Private Limited. All rights reserved.
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 font-bold">
            <a
              className="hover:text-[#00D084] transition-colors duration-200"
              href="mailto:enquiry@kaizentrixglobal.com"
            >
              Campus Assistance
            </a>
            <span className="text-slate-600">•</span>
            <a
              className="hover:text-[#00D084] transition-colors duration-200"
              href="/placement-policy"
            >
              Placement Policy
            </a>
            <span className="text-slate-600">•</span>
            <a
              className="hover:text-[#00D084] transition-colors duration-200"
              href="/policy"
            >
              Privacy &amp; Terms
            </a>
          </div>
        </div>

      </div>
    </footer>
  )
}
