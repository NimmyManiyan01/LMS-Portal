export function Footer16() {
  return (
    <footer className="relative w-full overflow-hidden bg-[#090D16] font-sans text-white antialiased border-t border-white/10 py-12">
      {/* Background Atmospheric Glow Orbs */}
      <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-[#00C4DF]/20 blur-[150px] pointer-events-none z-0" />
      <div className="absolute -bottom-32 -right-32 w-[600px] h-[600px] rounded-full bg-[#00D084]/20 blur-[150px] pointer-events-none z-0" />

      {/* Big Brand Watermark Background */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none select-none opacity-15 z-0">
        <span className="text-7xl sm:text-9xl lg:text-[13rem] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white/40 to-transparent">
          KAIZENTRIX
        </span>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 flex flex-col items-center gap-6 text-xs font-semibold text-slate-300">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-extrabold text-slate-200">
          <a
            className="hover:text-[#00D084] transition-colors"
            href="mailto:enquiry@kaizentrixglobal.com"
          >
            Campus Assistance
          </a>
          <span className="text-white/20">•</span>
          <a
            className="hover:text-[#00D084] transition-colors"
            href="/placement-policy"
          >
            Placement Policy
          </a>
          <span className="text-white/20">•</span>
          <a
            className="hover:text-[#00D084] transition-colors"
            href="/policy"
          >
            Privacy &amp; Terms
          </a>
        </div>

        <div className="w-full pt-4 border-t border-white/10 text-center text-xs font-bold text-slate-400">
          © 2026 Kaizentrix Global Solutions Private Limited. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
