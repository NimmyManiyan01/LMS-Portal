import { useEffect, useRef, useState } from "react"
import logo from "../../assets/Logo.png"

interface Footer16Props {
  onLogin?: () => void
  onOpenContact?: () => void
}

/**
 * Clean boolean-UNION vector paths for "KAIZENTRIX" letters.
 * Outlined geometric ExtraBold capitals with zero internal overlap contours.
 */
const WORDMARK_PATHS = [
  // K
  "M 20 20 L 45 20 L 45 62 L 72 20 L 102 20 L 64 75 L 104 140 L 74 140 L 45 90 L 45 140 L 20 140 Z",
  // A (Compound outer + inner counter cutout)
  "M 150 20 L 190 140 L 163 140 L 155 114 L 125 114 L 117 140 L 90 140 Z M 140 60 L 131 92 L 149 92 Z",
  // I
  "M 205 20 L 235 20 L 235 140 L 205 140 Z",
  // Z
  "M 250 20 L 330 20 L 330 44 L 283 116 L 330 116 L 330 140 L 250 140 L 250 116 L 297 44 L 250 44 Z",
  // E
  "M 345 20 L 420 20 L 420 44 L 373 44 L 373 68 L 415 68 L 415 92 L 373 92 L 373 116 L 420 116 L 420 140 L 345 140 Z",
  // N
  "M 435 20 L 463 20 L 492 92 L 492 20 L 520 20 L 520 140 L 492 140 L 463 68 L 463 140 L 435 140 Z",
  // T
  "M 535 20 L 615 20 L 615 44 L 589 44 L 589 140 L 561 140 L 561 44 L 535 44 Z",
  // R (Compound outer + inner loop cutout)
  "M 630 20 L 685 20 C 702 20 715 31 715 48 C 715 62 705 72 690 75 L 718 140 L 688 140 L 664 82 L 658 82 L 658 140 L 630 140 Z M 658 42 L 658 62 L 682 62 C 691 62 696 57 696 52 C 696 47 691 42 682 42 Z",
  // I
  "M 725 20 L 755 20 L 755 140 L 725 140 Z",
  // X
  "M 770 20 L 798 20 L 815 65 L 832 20 L 860 20 L 832 80 L 862 140 L 834 140 L 815 95 L 796 140 L 768 140 L 798 80 Z",
]

/**
 * Animated "KAIZENTRIX" SVG Wordmark Component.
 * Features 10s infinite keyframe timeline, staggered letter paths,
 * CPU-saving IntersectionObserver pausing, and reduced-motion fallback.
 */
export function FooterWordmark() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isIntersecting, setIsIntersecting] = useState(true)

  useEffect(() => {
    const el = containerRef.current
    if (!el || typeof IntersectionObserver === "undefined") return

    const observer = new IntersectionObserver(
      ([entry]) => setIsIntersecting(entry.isIntersecting),
      { threshold: 0.05 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-[1400px] h-[65%] flex items-center justify-center overflow-hidden pointer-events-none select-none z-0"
    >
      <style>{`
        :root {
          --wm-stroke: #057A55;
          --wm-fill-hold: rgba(5, 122, 85, 0.07);
          --wm-fill-ghost: rgba(5, 122, 85, 0.04);
        }

        @keyframes kgsWordmarkDraw {
          0% {
            stroke-dashoffset: 1;
            stroke-opacity: 1;
            fill-opacity: 0;
            will-change: stroke-dashoffset, opacity;
          }
          12.5% {
            /* 1.25s: DRAW phase complete */
            stroke-dashoffset: 0;
            stroke-opacity: 1;
            fill-opacity: 0;
          }
          17.5% {
            /* 1.75s: FILL IN phase complete */
            stroke-dashoffset: 0;
            stroke-opacity: 1;
            fill-opacity: 0.07;
          }
          45% {
            /* 4.5s: HOLD breathing sub-peak */
            stroke-dashoffset: 0;
            stroke-opacity: 0.92;
            fill-opacity: 0.07;
          }
          75% {
            /* 7.5s: HOLD phase complete */
            stroke-dashoffset: 0;
            stroke-opacity: 1;
            fill-opacity: 0.07;
          }
          80% {
            /* 8.0s: FADE OUT phase complete */
            stroke-dashoffset: 0;
            stroke-opacity: 0;
            fill-opacity: 0.04;
          }
          100% {
            /* 10.0s: GHOST phase complete -> loop restarts */
            stroke-dashoffset: 0;
            stroke-opacity: 0;
            fill-opacity: 0.04;
            will-change: auto;
          }
        }

        .kgs-letter-path {
          stroke: var(--wm-stroke);
          fill: var(--wm-stroke);
          stroke-width: 1.8;
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
          stroke-linecap: round;
          stroke-linejoin: round;
          vector-effect: non-scaling-stroke;
          animation: kgsWordmarkDraw 10s cubic-bezier(0.65, 0, 0.35, 1) infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .kgs-letter-path {
            animation: none !important;
            stroke-dashoffset: 0 !important;
            stroke-opacity: 0 !important;
            fill-opacity: 0.04 !important;
          }
        }
      `}</style>

      <svg
        className="w-full h-full select-none"
        viewBox="0 0 900 160"
        preserveAspectRatio="xMidYMid meet"
        style={{
          animationPlayState: isIntersecting ? "running" : "paused",
        }}
      >
        {WORDMARK_PATHS.map((d, index) => (
          <path
            key={index}
            d={d}
            pathLength={1}
            className="kgs-letter-path"
            style={{
              animationDelay: `${(index * 0.08).toFixed(2)}s`,
              animationPlayState: isIntersecting ? "running" : "paused",
            }}
          />
        ))}
      </svg>
    </div>
  )
}

export function Footer16({ onLogin, onOpenContact }: Footer16Props) {
  return (
    <footer className="relative w-full overflow-hidden bg-white font-sans antialiased text-[#1E3A34] border-t border-slate-200/80 pt-12 pb-8 px-6 sm:px-12">

      {/* Decorative SVG Animated Wordmark Layer */}
      <FooterWordmark />

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

        {/* LOWER SECTION (Clean Border Divider Above Watermark Area) */}
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
