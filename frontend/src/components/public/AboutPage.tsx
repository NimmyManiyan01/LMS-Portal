import logoRevealVideo from "../../assets/KGS_logo_reveal_animation_3b0e3d6c_1080p.mp4"
import { TransparentLogoVideo } from "./TransparentLogoVideo"

interface AboutPageProps {
  onBackToLanding: () => void
  onLogin: () => void
}

const values = [
  {
    icon: "verified_user",
    title: "Trust by design",
    description: "We build secure, transparent systems that institutions and candidates can rely on.",
  },
  {
    icon: "insights",
    title: "Measurable outcomes",
    description: "Every learning and assessment experience is designed around clear, useful results.",
  },
  {
    icon: "groups",
    title: "People first",
    description: "Accessible experiences and thoughtful support keep technology centered on real people.",
  },
]

export function AboutPage({ onBackToLanding, onLogin }: AboutPageProps) {
  return (
    <div className="min-h-screen bg-surface font-sans text-on-surface">
      <header className="cinematic-navbar sticky top-0 z-50 bg-surface/90 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl">
        <div className="flex h-16 w-full items-center justify-between gap-space-md px-margin">
          <button
            type="button"
            onClick={onBackToLanding}
            className="group flex cursor-pointer items-center gap-space-sm border-0 bg-transparent p-0 text-left"
            aria-label="Go to the Kaizentrix Global Solutions landing page"
          >
            <TransparentLogoVideo
              src={logoRevealVideo}
              loop
              className="h-9 w-24 object-contain transition-transform group-hover:scale-105"
            />
            <span className="font-headline-sm text-headline-sm font-bold tracking-tight text-primary">
              Kaizentrix Global Solutions
            </span>
          </button>
          <nav className="hidden items-center gap-space-lg xl:flex">
            <span className="font-label-lg text-label-lg font-bold text-primary">About Us</span>
            <a href="/batches" className="public-nav-link font-label-lg text-label-lg text-on-surface-variant">Batches</a>
            <a href="/placement-track" className="public-nav-link font-label-lg text-label-lg text-on-surface-variant">Placement Track</a>
            <a href="/achievers" className="public-nav-link font-label-lg text-label-lg text-on-surface-variant">Achievers</a>
            <a href="/lms-gateway" className="public-nav-link font-label-lg text-label-lg text-on-surface-variant">LMS Gateway</a>
          </nav>
          <div className="flex items-center gap-space-md">
            <button
              type="button"
              onClick={onLogin}
              className="hidden cursor-pointer items-center rounded-xl border-0 bg-primary px-space-md py-1.5 font-label-md text-label-md text-on-primary shadow-sm transition-colors hover:bg-primary-container hover:text-on-primary-container md:inline-flex"
            >
              Portal Login
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden px-margin py-20 sm:py-28">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(37,99,235,0.12),transparent_34%),radial-gradient(circle_at_85%_70%,rgba(124,58,237,0.10),transparent_36%)]" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <span className="inline-flex rounded-full bg-primary/10 px-3 py-1.5 font-label-sm font-bold uppercase tracking-wider text-primary">
                About KGS
              </span>
              <h1 className="mt-5 max-w-3xl font-headline-xl text-headline-xl leading-tight tracking-tight text-on-surface">
                Customer-centric technology, built with engineering excellence.
              </h1>
              <p className="mt-6 max-w-2xl font-body-lg text-body-lg leading-relaxed text-on-surface-variant">
                As a group of companies with over 11 years of technology expertise, Kaizentrix
                Global Solutions, InfyStrat, and StratNex collaborate with industry partners to
                develop customer-centric products and innovative solutions globally.
              </p>
              <p className="mt-4 max-w-2xl font-body-md text-body-md leading-relaxed text-on-surface-variant">
                Driven by collaboration and continuous improvement, we evolve with customer needs
                to deliver lasting value through technology and engineering excellence.
              </p>
            </div>
            <div className="rounded-3xl border border-surface-container bg-surface-container-lowest p-8 shadow-xl sm:p-10">
              <span className="material-symbols-outlined text-[44px] text-primary">track_changes</span>
              <h2 className="mt-5 font-headline-lg text-headline-lg text-on-surface">Learn. Build. Innovate. Deploy.</h2>
              <p className="mt-4 font-body-md text-body-md leading-relaxed text-on-surface-variant">
                Our capabilities span product development, artificial intelligence and machine
                learning, data engineering, cloud, cybersecurity, IT infrastructure, consulting,
                talent services, and corporate learning.
              </p>
            </div>
          </div>
        </section>

        <section className="px-margin py-16 sm:py-20">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
            <div>
              <span className="font-label-sm font-bold uppercase tracking-wider text-primary">Our wider group</span>
              <h2 className="mt-3 font-headline-lg text-headline-lg text-on-surface">Technology and infrastructure for a connected future.</h2>
              <p className="mt-4 font-body-md text-body-md leading-relaxed text-on-surface-variant">
                Beyond software and digital products, our group’s capabilities extend to power
                infrastructure and data-center setup through GTV Power Pvt. Ltd. across India.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {["Customer-centric products", "Innovative global solutions", "Power & data-center infrastructure"].map((item, index) => (
                <article key={item} className="rounded-2xl border border-surface-container bg-surface-container-lowest p-6 shadow-sm transition duration-500 hover:-translate-y-2 hover:shadow-xl" style={{ animationDelay: `${index * 100}ms` }}>
                  <span className="material-symbols-outlined text-[32px] text-primary">{index === 0 ? "devices" : index === 1 ? "public" : "electric_bolt"}</span>
                  <h3 className="mt-5 font-headline-sm text-headline-sm font-bold text-on-surface">{item}</h3>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-surface-container-low px-margin py-16 sm:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <span className="font-label-sm font-bold uppercase tracking-wider text-primary">What guides us</span>
              <h2 className="mt-3 font-headline-lg text-headline-lg text-on-surface">Built on practical values</h2>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {values.map((value) => (
                <article key={value.title} className="rounded-2xl border border-surface-container bg-surface-container-lowest p-6 shadow-sm">
                  <span className="material-symbols-outlined flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    {value.icon}
                  </span>
                  <h3 className="mt-5 font-headline-sm text-headline-sm font-bold text-on-surface">{value.title}</h3>
                  <p className="mt-3 font-body-md text-body-md leading-relaxed text-on-surface-variant">{value.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-margin py-16 sm:py-20">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 rounded-3xl bg-inverse-surface p-8 text-inverse-on-surface sm:p-12 lg:flex-row lg:items-center">
            <div>
              <h2 className="font-headline-lg text-headline-lg">Ready to explore the KGS platform?</h2>
              <p className="mt-3 max-w-2xl font-body-md text-body-md opacity-80">
                Return to the landing page to view programs, outcomes, and platform capabilities.
              </p>
            </div>
            <button
              type="button"
              onClick={onBackToLanding}
              className="shrink-0 cursor-pointer rounded-xl border-0 bg-primary px-space-lg py-3 font-label-lg font-bold text-on-primary"
            >
              Explore KGS
            </button>
          </div>
        </section>
      </main>

      <footer className="border-t border-surface-container bg-surface-container-low px-margin py-6 text-center font-body-sm text-body-sm text-on-surface-variant">
        © {new Date().getFullYear()} Kaizentrix Global Solutions. All rights reserved.
      </footer>
    </div>
  )
}
