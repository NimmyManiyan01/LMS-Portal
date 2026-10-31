import { useEffect, useRef, useState } from "react";
import logo from "../../assets/Logo.png";
import logoRevealVideo from "../../assets/KGS_logo_reveal_animation_3b0e3d6c_1080p.mp4";
import heroStudent from "../../assets/hero-student.png";
import { TransparentLogoVideo } from "./TransparentLogoVideo";

interface LandingPageProps {
  onLogin: () => void;
  onAdminLogin: () => void;
  onRegister: () => void;
  onAbout: () => void;
}

type TrackCategory = "all" | "fullstack" | "data" | "cloud";

interface Achiever {
  id: string;
  name: string;
  company: string;
  role: string;
  location: string;
  quote: string;
  college: string;
  packageLpa: string;
  companyColor: string;
}

interface BatchTrack {
  id: string;
  category: "fullstack" | "data" | "cloud";
  badge: string;
  badgeIcon: string;
  badgeColor: string;
  seatsNotice: string;
  seatsNoticeColor: string;
  title: string;
  description: string;
  startDate: string;
  duration: string;
  format: string;
  actionColor: string;
}

const ACHIEVERS: Achiever[] = [
  {
    id: "sneha",
    name: "Sneha Reddy",
    company: "Amazon",
    role: "Cloud Support Engineer II",
    location: "Bangalore",
    quote: "The continuous mock system-design rounds prepared me for unpredictable AWS distributed concurrency questions.",
    college: "JNTU College of Engg",
    packageLpa: "14.2 LPA",
    companyColor: "text-primary",
  },
  {
    id: "karthik",
    name: "Karthik Varma",
    company: "Cisco",
    role: "Software Engineer (Networks)",
    location: "Chennai",
    quote: "KGS took me from non-CS background to cracking Cisco's 4-stage technical panel in just 5 months.",
    college: "SRM University",
    packageLpa: "11.5 LPA",
    companyColor: "text-secondary",
  },
  {
    id: "divya",
    name: "Divya Menon",
    company: "Juspay",
    role: "Backend Engineer (Haskell / FP)",
    location: "Remote",
    quote: "Pure functional programming and tree algorithms at KGS were identical to what Juspay interviewed me on.",
    college: "PSG Tech Coimbatore",
    packageLpa: "10.8 LPA",
    companyColor: "text-tertiary",
  },
  {
    id: "arun",
    name: "Arun Prakash",
    company: "Zoho Corp",
    role: "Full Stack Engineer",
    location: "Tenkasi Campus",
    quote: "Cleared 3 rounds of Zoho coding tests in a single day thanks to 200+ timed module challenges.",
    college: "Anna University",
    packageLpa: "8.5 LPA",
    companyColor: "text-primary",
  },
];

const BATCH_TRACKS: BatchTrack[] = [
  {
    id: "mern",
    category: "fullstack",
    badge: "Full-Stack MERN Architecture",
    badgeIcon: "code",
    badgeColor: "text-primary",
    seatsNotice: "Only 6 Seats Left",
    seatsNoticeColor: "bg-error-container text-on-error-container animate-pulse",
    title: "Modern Web, Next.js & Distributed Node Microservices",
    description: "Deep dive into TypeScript, React 19, Node.js concurrency, Redis cache patterns, and Dockerized AWS deployment workflows.",
    startDate: "May 15, 2025",
    duration: "24 Weeks",
    format: "Live + Lab",
    actionColor: "bg-primary text-on-primary hover:bg-primary-container",
  },
  {
    id: "java",
    category: "fullstack",
    badge: "Java Enterprise & Spring Cloud",
    badgeIcon: "coffee",
    badgeColor: "text-secondary",
    seatsNotice: "8 Seats Left",
    seatsNoticeColor: "bg-secondary-fixed text-on-secondary-fixed",
    title: "Enterprise Java, Spring Boot 3 & High-Throughput Kafka",
    description: "Designed for enterprise backend roles: Event-driven architecture, CQRS patterns, PostgreSQL optimization, and Kubernetes orchestration.",
    startDate: "May 22, 2025",
    duration: "26 Weeks",
    format: "Live + Lab",
    actionColor: "bg-secondary text-on-secondary hover:opacity-90",
  },
  {
    id: "data-ai",
    category: "data",
    badge: "Data Engineering & LLM Systems",
    badgeIcon: "psychology",
    badgeColor: "text-tertiary",
    seatsNotice: "12 Seats Left",
    seatsNoticeColor: "bg-tertiary-fixed text-on-tertiary-fixed",
    title: "PySpark, Vector Databases & Enterprise RAG Pipelines",
    description: "Transform into an AI Systems Engineer. Build real data pipelines, query optimization on Snowflake, and fine-tune open-weights LLMs.",
    startDate: "June 02, 2025",
    duration: "22 Weeks",
    format: "Live + Lab",
    actionColor: "bg-tertiary text-on-tertiary hover:opacity-90",
  },
  {
    id: "cloud-devops",
    category: "cloud",
    badge: "Cloud Architecture & SRE",
    badgeIcon: "cloud_sync",
    badgeColor: "text-primary",
    seatsNotice: "Filling Fast",
    seatsNoticeColor: "bg-primary-fixed text-on-primary-fixed",
    title: "Terraform, Kubernetes (EKS), CI/CD & Observability",
    description: "From bare metal infrastructure to multi-region cloud resilience. Automated deployments, Grafana monitoring, and security controls.",
    startDate: "June 10, 2025",
    duration: "20 Weeks",
    format: "Live + Lab",
    actionColor: "bg-primary text-on-primary hover:bg-primary-container",
  },
];

const PARTNERS = [
  { name: "Amazon AWS", icon: "cloud", color: "text-primary" },
  { name: "Cisco Systems", icon: "hub", color: "text-secondary" },
  { name: "Juspay", icon: "payments", color: "text-tertiary" },
  { name: "Zoho Corp", icon: "database", color: "text-primary" },
  { name: "TCS Digital", icon: "code_blocks", color: "text-secondary" },
  { name: "Razorpay", icon: "rocket_launch", color: "text-primary-container" },
  { name: "PhonePe", icon: "deployed_code", color: "text-tertiary-container" },
  { name: "Swiggy", icon: "security", color: "text-secondary-container" },
];

const LANDING_LOADER_SESSION_KEY = "kgs-landing-loader-played";

export function LandingPage({ onLogin, onAdminLogin, onRegister, onAbout }: LandingPageProps) {
  const [isLoading, setIsLoading] = useState(
    () => sessionStorage.getItem(LANDING_LOADER_SESSION_KEY) !== "true",
  );
  const [isLoaderExiting, setIsLoaderExiting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTrackFilter, setActiveTrackFilter] = useState<TrackCategory>("all");
  const achieverGridRef = useRef<HTMLDivElement>(null);
  const loaderFinishedRef = useRef(false);
  const loaderExitTimerRef = useRef<number | null>(null);

  const finishLoading = () => {
    if (loaderFinishedRef.current) return;
    loaderFinishedRef.current = true;
    setIsLoaderExiting(true);
    loaderExitTimerRef.current = window.setTimeout(() => setIsLoading(false), 700);
  };

  useEffect(() => {
    if (!isLoading) return;
    sessionStorage.setItem(LANDING_LOADER_SESSION_KEY, "true");
    const loadingTimer = window.setTimeout(finishLoading, 15000);
    return () => {
      window.clearTimeout(loadingTimer);
      if (loaderExitTimerRef.current !== null) {
        window.clearTimeout(loaderExitTimerRef.current);
      }
    };
  }, []);

  const scrollAchievers = (direction: "left" | "right") => {
    if (achieverGridRef.current) {
      const scrollAmount = direction === "left" ? -340 : 340;
      achieverGridRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const filteredTracks = BATCH_TRACKS.filter((track) => {
    if (activeTrackFilter === "all") return true;
    return track.category === activeTrackFilter;
  });

  return (
    <div className="min-h-screen bg-surface font-sans text-on-surface antialiased selection:bg-primary selection:text-white">
      {isLoading && (
        <div
          className={`fixed inset-0 z-[100] flex min-h-screen items-center justify-center overflow-hidden bg-surface font-sans transition-all duration-700 ease-in-out ${
            isLoaderExiting ? "pointer-events-none scale-[1.03] opacity-0" : "scale-100 opacity-100"
          }`}
          role="status"
          aria-label="Loading Kaizentrix Global Solutions"
          aria-hidden={isLoaderExiting}
        >
          <TransparentLogoVideo
            className="h-auto max-h-[52vh] w-[76vw] max-w-[600px] object-contain sm:w-[58vw]"
            src={logoRevealVideo}
            playbackRate={1.75}
            onEnded={finishLoading}
            onError={finishLoading}
          />
          <span className="sr-only">Loading Kaizentrix Global Solutions</span>
        </div>
      )}

      {/* 1. STICKY GLOBAL HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 w-full px-margin flex items-center justify-between gap-space-md">
          {/* Logo & Status Badge */}
          <div className="flex items-center gap-space-lg">
            <a
              href="/"
              aria-label="Go to the Kaizentrix Global Solutions landing page"
              className="flex items-center gap-space-sm no-underline group"
            >
              <TransparentLogoVideo
                src={logoRevealVideo}
                loop
                className="h-9 w-24 object-contain transition-transform group-hover:scale-105"
              />
              <span className="font-headline-sm text-headline-sm text-primary font-bold tracking-tight">
                Kaizentrix Global Solutions
              </span>
            </a>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center gap-space-lg">
            <button
              type="button"
              onClick={onAbout}
              className="public-nav-link cursor-pointer border-0 bg-transparent font-label-lg text-label-lg text-on-surface-variant"
            >
              About Us
            </button>
            <a
              href="#batches"
              className="public-nav-link font-label-lg text-label-lg text-on-surface-variant"
            >
              Batches
            </a>
            <a
              href="#lms-preview"
              className="public-nav-link font-label-lg text-label-lg text-on-surface-variant"
            >
              Placement Track
            </a>
            <a
              href="#achievers"
              className="public-nav-link font-label-lg text-label-lg text-on-surface-variant"
            >
              Achievers
            </a>
            <a
              href="#lms-preview"
              className="public-nav-link font-label-lg text-label-lg text-on-surface-variant"
            >
              LMS Gateway
            </a>
          </nav>

          {/* Header Action Controls */}
          <div className="flex items-center gap-space-md">
            {/* Portal Login CTA */}
            <button
              onClick={onLogin}
              className="hidden md:inline-flex items-center px-space-md py-1.5 rounded-xl bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container hover:text-on-primary-container transition-all shadow-[0_1px_3px_0_rgba(15,23,42,0.05)] cursor-pointer"
            >
              Portal Login
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              className="xl:hidden flex items-center justify-center w-9 h-9 rounded-xl bg-surface-container-lowest text-on-surface border border-surface-container-high shadow-sm cursor-pointer"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation"
            >
              <span className="material-symbols-outlined text-[22px]">
                {mobileMenuOpen ? "close" : "menu"}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="xl:hidden bg-surface-container-lowest border-b border-surface-container px-margin py-4 space-y-3 shadow-xl">
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onAbout();
                }}
                className="py-2 text-left text-on-surface-variant font-label-lg"
              >
                About Us
              </button>
              <a
                href="#batches"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-on-surface-variant font-label-lg"
              >
                Batches
              </a>
              <a
                href="#lms-preview"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-on-surface-variant font-label-lg"
              >
                Placement Track
              </a>
              <a
                href="#achievers"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-on-surface-variant font-label-lg"
              >
                Achievers
              </a>
              <a
                href="#lms-preview"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-on-surface-variant font-label-lg"
              >
                LMS Gateway
              </a>
            </div>
            <div className="pt-3 border-t border-surface-container flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogin();
                }}
                className="w-full py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-center"
              >
                Student Portal Login
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onAdminLogin();
                }}
                className="w-full py-2.5 rounded-xl bg-surface-container-high text-on-surface font-label-md text-center"
              >
                Campus Partner Portal
              </button>
            </div>
          </div>
        )}
      </header>

      {/* MAIN BODY CONTENT */}
      <main className="w-full pt-16 bg-surface">
        {/* SECTION 1: HERO & LIVE WORKBENCH PREVIEW */}
        <section
          className="relative isolate overflow-hidden bg-surface-container-low pt-space-xl pb-24 px-margin"
        >
          <img
            src={heroStudent}
            alt="Student preparing for a software engineering career"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover object-[68%_center] opacity-90 max-lg:object-[72%_center] max-md:object-[center_bottom] max-md:opacity-60"
          />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(250,248,255,.98)_0%,rgba(250,248,255,.93)_30%,rgba(250,248,255,.68)_56%,rgba(250,248,255,.2)_84%,rgba(250,248,255,0)_100%)] max-md:bg-[linear-gradient(180deg,rgba(250,248,255,.96)_0%,rgba(250,248,255,.78)_38%,rgba(250,248,255,.18)_78%,rgba(250,248,255,.04)_100%)]" />
          <div className="absolute -top-32 right-10 w-96 h-96 bg-primary-fixed-dim/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 left-10 w-80 h-80 bg-tertiary-fixed/30 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center relative z-10">
            {/* Left Copy & Metric Highlights */}
            <div className="lg:col-span-7 flex flex-col gap-space-md">
              <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight leading-tight">
                Launch Your Career in <span className="text-primary font-bold">High-Impact</span>{" "}
                Software Engineering
              </h1>

              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
                From algorithmic mastery to high-throughput distributed microservices. Kaizentrix
                Global Solutions bridges the gap between academic theory and high-paying engineering roles at top
                product companies.
              </p>

              {/* Primary Call to Action Buttons */}
              <div className="flex flex-wrap items-center gap-space-md pt-space-xs">
                <button
                  onClick={onLogin}
                  className="hero-login-button px-space-lg py-3 rounded-xl font-label-lg text-label-lg shadow-md flex items-center gap-2 cursor-pointer border-0"
                >
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    terminal
                  </span>
                  <span>Student Portal Login</span>
                </button>

              </div>

              {/* 4 Key Platform Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm pt-space-lg">
                <div className="bg-surface-container-lowest p-space-md rounded-2xl shadow-sm flex flex-col justify-center">
                  <div className="font-headline-lg text-headline-lg text-primary font-bold">96%</div>
                  <div className="font-label-md text-label-md text-on-surface-variant">
                    Placement Rate
                  </div>
                  <div className="font-label-sm text-label-sm text-tertiary font-medium">
                    In 90 Days post-grad
                  </div>
                </div>

                <div className="bg-surface-container-lowest p-space-md rounded-2xl shadow-sm flex flex-col justify-center">
                  <div className="font-headline-lg text-headline-lg text-on-surface font-bold">
                    1,200+
                  </div>
                  <div className="font-label-md text-label-md text-on-surface-variant">
                    Hiring Partners
                  </div>
                  <div className="font-label-sm text-label-sm text-on-surface-variant/80 font-medium">
                    Startups &amp; MNCs
                  </div>
                </div>

                <div className="bg-surface-container-lowest p-space-md rounded-2xl shadow-sm flex flex-col justify-center">
                  <div className="font-headline-lg text-headline-lg text-tertiary font-bold">
                    14.2 LPA
                  </div>
                  <div className="font-label-md text-label-md text-on-surface-variant">
                    Highest Package
                  </div>
                  <div className="font-label-sm text-label-sm text-on-surface-variant/80 font-medium">
                    Avg: 7.8 LPA
                  </div>
                </div>

                <div className="bg-surface-container-lowest p-space-md rounded-2xl shadow-sm flex flex-col justify-center">
                  <div className="flex items-center gap-1">
                    <span className="font-headline-lg text-headline-lg text-on-surface font-bold">
                      4.8
                    </span>
                    <span
                      className="material-symbols-outlined text-amber-500 text-[24px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                  </div>
                  <div className="font-label-md text-label-md text-on-surface-variant">
                    Student Rating
                  </div>
                  <div className="font-label-sm text-label-sm text-on-surface-variant/80 font-medium">
                    5,400+ Alumni
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* SECTION 2: HIRING PARTNERS INFINITE MARQUEE */}
        <section className="py-space-lg bg-surface-container-lowest overflow-hidden border-y border-surface-container-low">
          <div className="max-w-7xl mx-auto px-margin mb-space-sm flex flex-col md:flex-row items-baseline justify-between">
            <span className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant font-bold">
              Recruiting &amp; Strategic Engineering Partners
            </span>
            <span className="font-body-sm text-body-sm text-primary font-semibold">
              1,200+ Active Enterprise Requisitions
            </span>
          </div>

          {/* Scrolling Track */}
          <div className="relative w-full overflow-hidden flex items-center py-space-sm">
            <div className="flex items-center gap-12 whitespace-nowrap animate-[marquee_25s_linear_infinite]">
              {[...PARTNERS, ...PARTNERS].map((partner, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 font-headline-sm text-headline-sm font-bold text-on-surface/80 tracking-tight"
                >
                  <span className={`material-symbols-outlined ${partner.color} text-[28px]`}>
                    {partner.icon}
                  </span>
                  {partner.name}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 3: ACHIEVER HALL OF FAME */}
        <section id="achievers" className="py-space-xl px-margin max-w-7xl mx-auto w-full">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-space-lg gap-space-sm">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container text-primary font-label-sm text-label-sm uppercase mb-2 font-semibold">
                <span className="material-symbols-outlined text-[16px]">verified</span>
                Verified Outcomes
              </div>
              <h2 className="font-headline-lg text-headline-lg text-on-surface">
                Achiever Hall of Fame
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Real offers, verified salaries, and actual interview breakthroughs by Kaizentrix Global Solutions
                engineers.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => scrollAchievers("left")}
                aria-label="Previous Stories"
                className="p-2.5 rounded-xl bg-surface-container-high text-on-surface hover:bg-surface-container transition-colors shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </button>
              <button
                onClick={() => scrollAchievers("right")}
                aria-label="Next Stories"
                className="p-2.5 rounded-xl bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* Achiever Cards Grid / Scrollable Mosaic */}
          <div
            ref={achieverGridRef}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md overflow-x-auto pb-4 scroll-smooth"
          >
            {ACHIEVERS.map((achiever) => (
              <div
                key={achiever.id}
                className="bg-surface-container-lowest p-space-md rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between group border border-surface-container-low min-w-[280px]"
              >
                <div>
                  <div className="relative w-full h-48 rounded-xl overflow-hidden mb-space-sm">
                    <div className="px-2.5 py-1 rounded-lg bg-surface-container-lowest font-label-md text-label-md text-primary font-bold">
                      {achiever.packageLpa}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-headline-sm text-headline-sm text-on-surface">
                      {achiever.name}
                    </span>
                    <span
                      className={`font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-surface-container ${achiever.companyColor} font-semibold`}
                    >
                      {achiever.company}
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                    {achiever.role} • {achiever.location}
                  </p>
                  <p className="font-body-sm text-body-sm text-outline mt-2 italic line-clamp-2">
                    "{achiever.quote}"
                  </p>
                </div>
                <div className="mt-space-md pt-3 bg-surface-container-low/50 rounded-xl p-2.5 flex items-center justify-between text-body-sm text-on-surface-variant font-label-sm">
                  <span>{achiever.college}</span>
                  <span className="text-tertiary font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                    Offer Verified
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 4: UPCOMING BATCHES & ENGINEERING TRACKS */}
        <section id="batches" className="py-space-xl px-margin bg-surface-container-low">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-space-lg gap-space-sm">
              <div>
                <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary font-bold">
                  Accelerated Curriculum
                </span>
                <h2 className="font-headline-lg text-headline-lg text-on-surface mt-1">
                  Upcoming Batches &amp; Engineering Tracks
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Live mentor-led classes, production grade capstones, and direct referral pipeline.
                </p>
              </div>

              {/* Category Filter Tabs */}
              <div className="flex items-center gap-space-xs bg-surface-container-lowest p-1 rounded-xl shadow-sm border border-surface-container-high">
                {(
                  [
                    { key: "all", label: "All Tracks" },
                    { key: "fullstack", label: "Full Stack" },
                    { key: "data", label: "Data & AI" },
                    { key: "cloud", label: "Cloud" },
                  ] as const
                ).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTrackFilter(key)}
                    className={`px-3 py-1.5 rounded-lg font-label-sm text-label-sm font-semibold transition-all cursor-pointer ${
                      activeTrackFilter === key
                        ? "bg-primary text-on-primary shadow-xs"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Batch Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
              {filteredTracks.map((track) => (
                <div
                  key={track.id}
                  className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between border border-surface-container"
                >
                  <div>
                    <div className="flex items-center justify-between mb-space-sm">
                      <span
                        className={`px-3 py-1 rounded-full bg-surface-container ${track.badgeColor} font-label-sm text-label-sm font-semibold flex items-center gap-1`}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {track.badgeIcon}
                        </span>
                        {track.badge}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-label-sm text-label-sm font-bold ${track.seatsNoticeColor}`}
                      >
                        {track.seatsNotice}
                      </span>
                    </div>

                    <h3 className="font-headline-md text-headline-md text-on-surface">
                      {track.title}
                    </h3>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-2 leading-relaxed">
                      {track.description}
                    </p>

                    <div className="grid grid-cols-3 gap-space-sm my-space-md py-space-sm bg-surface-container-low rounded-xl px-space-md text-center">
                      <div>
                        <div className="font-label-sm text-label-sm text-outline">Cohort Start</div>
                        <div className="font-label-lg text-label-lg text-on-surface mt-0.5 font-bold">
                          {track.startDate}
                        </div>
                      </div>
                      <div>
                        <div className="font-label-sm text-label-sm text-outline">Duration</div>
                        <div className="font-label-lg text-label-lg text-on-surface mt-0.5 font-bold">
                          {track.duration}
                        </div>
                      </div>
                      <div>
                        <div className="font-label-sm text-label-sm text-outline">Format</div>
                        <div className="font-label-lg text-label-lg text-on-surface mt-0.5 font-bold">
                          {track.format}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-space-xs">
                    <a
                      className="inline-flex items-center gap-1.5 text-primary font-label-md text-label-md hover:underline font-semibold"
                      href="#batches"
                    >
                      <span className="material-symbols-outlined text-[18px]">download</span>
                      <span>Download Syllabus PDF</span>
                    </a>
                    <button
                      onClick={onRegister}
                      className={`px-space-md py-2.5 rounded-xl font-label-md text-label-md shadow transition-all cursor-pointer ${track.actionColor}`}
                    >
                      Apply For Track
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 5: INTERACTIVE STUDENT OPERATING SYSTEM / LMS */}
        <section id="lms-preview" className="py-space-xl px-margin max-w-7xl mx-auto w-full">
          <div className="bg-gradient-to-br from-surface-container-high via-surface-container to-surface-container-low rounded-3xl p-space-lg lg:p-space-xl relative overflow-hidden shadow-lg border border-surface-container-high">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center relative z-10">
              <div className="lg:col-span-6 flex flex-col gap-space-md">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-lowest text-primary font-label-sm text-label-sm font-semibold w-fit shadow-xs">
                  <span className="material-symbols-outlined text-[16px]">devices</span>
                  The Student Operating System
                </div>
                <h2 className="font-headline-lg text-headline-lg text-on-surface">
                  Code Anywhere. Track Every Placement Round in Real Time.
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  Our multi-platform LMS &amp; Placement Gateway combines automated coding assessment
                  grading, mock AI technical interviews, instant campus announcements, and one-tap
                  interview scheduling.
                </p>
                <ul className="space-y-2.5 pt-space-xs font-body-sm text-body-sm text-on-surface">
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-tertiary text-[18px]">
                      check_circle
                    </span>
                    <span>Integrated Web IDE supporting Java, C++, Python, TypeScript, and Go</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-tertiary text-[18px]">
                      check_circle
                    </span>
                    <span>Push alerts for exclusive on-campus and virtual hiring drives</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-tertiary text-[18px]">
                      check_circle
                    </span>
                    <span>
                      Personalized DSA weakness diagnosis with curated leetcode-grade drills
                    </span>
                  </li>
                </ul>

                {/* App Store Download Badges */}
                <div className="flex flex-wrap items-center gap-space-sm pt-space-md">
                  <a
                    className="inline-flex items-center gap-3 px-space-md py-2.5 rounded-xl bg-inverse-surface text-inverse-on-surface shadow hover:opacity-90 transition-opacity cursor-pointer"
                    href="#lms-preview"
                  >
                    <span className="material-symbols-outlined text-[28px]">android</span>
                    <div className="text-left">
                      <div className="font-label-sm text-[10px] uppercase opacity-75">
                        Get it on
                      </div>
                      <div className="font-label-lg text-label-lg font-bold leading-tight">
                        Google Play
                      </div>
                    </div>
                  </a>
                  <a
                    className="inline-flex items-center gap-3 px-space-md py-2.5 rounded-xl bg-inverse-surface text-inverse-on-surface shadow hover:opacity-90 transition-opacity cursor-pointer"
                    href="#lms-preview"
                  >
                    <span className="material-symbols-outlined text-[28px]">phone_iphone</span>
                    <div className="text-left">
                      <div className="font-label-sm text-[10px] uppercase opacity-75">
                        Download on the
                      </div>
                      <div className="font-label-lg text-label-lg font-bold leading-tight">
                        Apple App Store
                      </div>
                    </div>
                  </a>
                </div>
              </div>

              {/* Visual LMS Mockup Dashboard */}
              <div className="lg:col-span-6 relative">
                <div className="bg-surface-container-lowest p-space-md rounded-2xl shadow-xl flex flex-col gap-3 border border-surface-container">
                  <div className="flex items-center justify-between pb-3 border-b border-surface-container">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold font-headline-sm">
                        D
                      </span>
                      <span className="font-label-lg text-label-lg text-on-surface font-bold">
                        Student Portal Dashboard
                      </span>
                    </div>
                    <span className="font-label-sm text-label-sm text-tertiary bg-surface-container px-2 py-1 rounded-full font-bold">
                      ● 14 Streak Days
                    </span>
                  </div>

                  {/* Dashboard Mini Widgets */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-surface-container-low p-3 rounded-xl border border-surface-container">
                      <span className="font-label-sm text-label-sm text-outline">Upcoming Drive</span>
                      <div className="font-label-lg text-label-lg text-on-surface mt-1 font-bold">
                        Amazon SDET Round 2
                      </div>
                      <div className="font-body-sm text-[11px] text-tertiary mt-0.5 font-semibold">
                        Tomorrow, 10:00 AM IST
                      </div>
                    </div>
                    <div className="bg-surface-container-low p-3 rounded-xl border border-surface-container">
                      <span className="font-label-sm text-label-sm text-outline">
                        Algorithm Mastery
                      </span>
                      <div className="font-label-lg text-label-lg text-primary mt-1 font-bold">
                        Tier: Diamond (Top 4%)
                      </div>
                      <div className="font-body-sm text-[11px] text-outline mt-0.5">
                        342 Problems Solved
                      </div>
                    </div>
                  </div>

                  {/* Mini Daily Task List */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low text-body-sm text-on-surface">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-tertiary text-[18px]">
                          task_alt
                        </span>
                        <span>System Design: Distributed Rate Limiter</span>
                      </div>
                      <span className="font-label-sm text-label-sm text-outline">Submitted</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low text-body-sm text-on-surface">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[18px]">
                          play_circle
                        </span>
                        <span>Live Masterclass: Concurrency in Go</span>
                      </div>
                      <span className="font-label-sm text-label-sm text-primary font-bold">
                        7:00 PM
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 6: DETAILED HEADQUARTERS & ACCREDITATION FOOTER SECTION */}
        <section className="bg-surface-container-lowest pt-space-xl pb-space-lg px-margin border-t border-surface-container-low">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-space-lg pb-space-lg">
            {/* Col 1: Brand & Certification */}
            <div className="lg:col-span-2 flex flex-col gap-space-sm">
              <div className="flex items-center gap-2">
                <img
                  alt="Kaizentrix Global Solutions"
                  className="h-8 w-auto"
                  src={logo}
                />
                <span className="font-headline-sm text-headline-sm text-primary font-bold">
                  Kaizentrix Global Solutions
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm mt-1 leading-relaxed">
                India's leading specialized accelerator for algorithmic mastery, full-stack systems
                engineering, and Tier-1 product placement training.
              </p>

              {/* Certifications */}
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2.5 py-1 rounded-md bg-surface-container text-on-surface-variant font-label-sm text-label-sm font-semibold">
                  ISO 9001:2015 Certified
                </span>
              </div>

              {/* Social Channels */}
              <div className="flex items-center gap-space-xs mt-3 text-on-surface-variant">
                <a
                  aria-label="LinkedIn"
                  className="p-2 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors"
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noreferrer"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V8.98h3.42v1.57h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.29ZM5.32 7.41a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13ZM7.1 20.45H3.54V8.98H7.1v11.47Z" />
                  </svg>
                </a>
                <a
                  aria-label="GitHub"
                  className="p-2 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors"
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.48 2 2 6.58 2 12.23c0 4.52 2.87 8.35 6.84 9.71.5.1.68-.22.68-.49 0-.24-.01-1.05-.01-1.9-2.78.62-3.37-1.2-3.37-1.2-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.35 1.12 2.92.85.09-.66.35-1.12.64-1.37-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05A9.35 9.35 0 0 1 12 6.96a9.3 9.3 0 0 1 2.5.35c1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.35 4.8-4.58 5.05.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.59.69.49A10.23 10.23 0 0 0 22 12.23C22 6.58 17.52 2 12 2Z" clipRule="evenodd" />
                  </svg>
                </a>
                <a
                  aria-label="YouTube"
                  className="p-2 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors"
                  href="https://youtube.com"
                  target="_blank"
                  rel="noreferrer"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M23.5 6.2a3 3 0 0 0-2.1-2.12C19.55 3.57 12 3.57 12 3.57s-7.55 0-9.4.51A3 3 0 0 0 .5 6.2 31.2 31.2 0 0 0 0 12a31.2 31.2 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.12c1.85.51 9.4.51 9.4.51s7.55 0 9.4-.51a3 3 0 0 0 2.1-2.12A31.2 31.2 0 0 0 24 12a31.2 31.2 0 0 0-.5-5.8ZM9.6 15.57V8.43L15.82 12 9.6 15.57Z" />
                  </svg>
                </a>
                <a
                  aria-label="Discord"
                  className="p-2 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors"
                  href="https://discord.com"
                  target="_blank"
                  rel="noreferrer"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M20.32 4.37A19.8 19.8 0 0 0 15.44 2.9l-.6 1.22a18.3 18.3 0 0 0-5.67 0L8.56 2.9A19.7 19.7 0 0 0 3.68 4.38C.6 8.96-.23 13.42.18 17.82a19.9 19.9 0 0 0 5.99 3.03l1.46-1.98a12.8 12.8 0 0 1-2.3-1.1l.57-.45c3.96 1.84 8.26 1.84 12.17 0l.58.45c-.74.43-1.5.8-2.3 1.1l1.46 1.98a19.8 19.8 0 0 0 6-3.03c.48-5.1-.83-9.51-3.49-13.45ZM8.02 15.13c-1.2 0-2.18-1.1-2.18-2.45s.96-2.45 2.18-2.45c1.21 0 2.2 1.1 2.18 2.45 0 1.35-.96 2.45-2.18 2.45Zm7.96 0c-1.2 0-2.18-1.1-2.18-2.45s.96-2.45 2.18-2.45c1.22 0 2.2 1.1 2.18 2.45 0 1.35-.96 2.45-2.18 2.45Z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Col 2: Programs */}
            <div className="flex flex-col gap-2">
              <span className="font-label-lg text-label-lg text-on-surface font-bold">
                Curriculum
              </span>
              <a
                className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors"
                href="#batches"
              >
                Full-Stack MERN Track
              </a>
              <a
                className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors"
                href="#batches"
              >
                Enterprise Java &amp; Spring Cloud
              </a>
              <a
                className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors"
                href="#batches"
              >
                Data Engineering &amp; AI/LLMs
              </a>
              <a
                className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors"
                href="#batches"
              >
                Cloud Architecture &amp; DevOps
              </a>
              <a
                className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors"
                href="#batches"
              >
                DSA &amp; Problem Solving Clinic
              </a>
            </div>

            {/* Col 3: Portal Gateways */}
            <div className="flex flex-col gap-2">
              <span className="font-label-lg text-label-lg text-on-surface font-bold">Portals</span>
              <button
                onClick={onLogin}
                className="text-left font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
              >
                Student LMS Gateway
              </button>
              <a
                className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors"
                href="#batches"
              >
                Placement Requisition Board
              </a>
              <button
                onClick={onAdminLogin}
                className="text-left font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
              >
                University Campus Portal
              </button>
              <button
                onClick={onAdminLogin}
                className="text-left font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
              >
                Hiring Partner Console
              </button>
              <a
                className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors"
                href="#achievers"
              >
                Verify Alumni Credentials
              </a>
            </div>

            {/* Col 4: KGS Headquarters & Direct Line */}
            <div className="flex flex-col gap-2">
              <span className="font-label-lg text-label-lg text-on-surface font-bold">
                Headquarters
              </span>
              <div className="font-body-sm text-body-sm text-on-surface-variant flex items-start gap-2">
                <span className="material-symbols-outlined text-outline text-[18px] mt-0.5">
                  location_on
                </span>
                <span>
                  SVG100 DC Complex, Chandra Layout, Vijayanagar, Bengaluru, Karnataka 560056
                </span>
              </div>
              <div className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-2 mt-1">
                <span className="material-symbols-outlined text-outline text-[18px]">call</span>
                <span>SVG080-23143355 / +91 91879 80031</span>
              </div>
              <div className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-2">
                <span className="material-symbols-outlined text-outline text-[18px]">mail</span>
                <span>enquiry@kaizentrixglobal.com</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* GLOBAL FOOTER */}
      <footer className="w-full bg-surface-container-low py-space-lg border-t border-surface-container">
        <div className="max-w-7xl mx-auto px-margin flex flex-col gap-space-md font-body-sm text-body-sm text-on-surface-variant">
          <div className="flex w-full flex-col items-center justify-between gap-space-sm md:flex-row">
            <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
              Kaizentrix Global Solutions
            </span>
            <span className="hidden sm:inline">•</span>
          </div>
          <div className="flex items-center gap-space-lg">
            <a className="hover:text-on-surface transition-colors" href="mailto:admissions@kaizentrixglobal.com">
              Campus Assistance
            </a>
            <a className="hover:text-on-surface transition-colors" href="/placement-policy">
              Placement Policy
            </a>
          </div>
          <div className="w-full border-t border-surface-container pt-space-md text-center text-xs text-on-surface-variant">
            © 2026 Kaizentrix Global Solutions Private Limited. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
