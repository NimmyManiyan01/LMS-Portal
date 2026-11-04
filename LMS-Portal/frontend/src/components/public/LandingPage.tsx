import { useEffect, useRef, useState } from "react";
import logo from "../../assets/Logo.png";
import logoRevealVideo from "../../assets/KGS_logo_reveal_animation_3b0e3d6c_1080p.mp4";
import { TransparentLogoVideo } from "./TransparentLogoVideo";
import { ContactModal } from "./ContactModal";

const HERO_VIDEO_URL =
  "https://res.cloudinary.com/dujdjt4l7/video/upload/v1793776799/EXAM_aphxzg.mp4";

interface LandingPageProps {
  onLogin: () => void;
  onAdminLogin: () => void;
  onRegister: () => void;
}

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
    id: "python-gen-ai",
    category: "fullstack",
    badge: "Python Full Stack with Gen AI",
    badgeIcon: "terminal",
    badgeColor: "text-primary",
    seatsNotice: "Only 6 Seats Left",
    seatsNoticeColor: "bg-error-container text-on-error-container animate-pulse",
    title: "Python Full Stack with Gen AI",
    description: "Build modern web applications with Python, Django, FastAPI, React, and production-ready generative AI integrations.",
    startDate: "May 15, 2025",
    duration: "24 Weeks",
    format: "Live + Lab",
    actionColor: "bg-primary text-on-primary hover:bg-primary-container",
  },
  {
    id: "java-gen-ai",
    category: "fullstack",
    badge: "Java Full Stack with Gen AI",
    badgeIcon: "coffee",
    badgeColor: "text-secondary",
    seatsNotice: "8 Seats Left",
    seatsNoticeColor: "bg-secondary-fixed text-on-secondary-fixed",
    title: "Java Full Stack with Gen AI",
    description: "Master Java, Spring Boot, React, microservices, and intelligent AI-assisted enterprise application development.",
    startDate: "May 22, 2025",
    duration: "26 Weeks",
    format: "Live + Lab",
    actionColor: "bg-secondary text-on-secondary hover:opacity-90",
  },
  {
    id: "ai-ml-engineer",
    category: "data",
    badge: "AI/ML Engineer",
    badgeIcon: "psychology",
    badgeColor: "text-tertiary",
    seatsNotice: "12 Seats Left",
    seatsNoticeColor: "bg-tertiary-fixed text-on-tertiary-fixed",
    title: "AI/ML Engineer",
    description: "Learn machine learning, deep learning, model deployment, computer vision, NLP, and practical generative AI systems.",
    startDate: "June 02, 2025",
    duration: "22 Weeks",
    format: "Live + Lab",
    actionColor: "bg-tertiary text-on-tertiary hover:opacity-90",
  },
  {
    id: "data-engineer",
    category: "data",
    badge: "Data Engineer",
    badgeIcon: "database",
    badgeColor: "text-secondary",
    seatsNotice: "Filling Fast",
    seatsNoticeColor: "bg-primary-fixed text-on-primary-fixed",
    title: "Data Engineer",
    description: "Design reliable data pipelines with SQL, Python, cloud data platforms, orchestration, analytics, and warehouse engineering.",
    startDate: "June 10, 2025",
    duration: "20 Weeks",
    format: "Live + Lab",
    actionColor: "bg-primary text-on-primary hover:bg-primary-container",
  },
];

const PROFILE_COMPETENCIES = [
  ["Software / Product Development", "code_blocks", "text-primary"],
  ["Artificial Intelligence & Machine Learning", "psychology", "text-secondary"],
  ["Data Engineering", "database", "text-tertiary"],
  ["Cloud Competencies & DevOps", "cloud_sync", "text-primary"],
  ["Cybersecurity", "security", "text-secondary"],
  ["IT Infrastructure Management", "lan", "text-tertiary"],
  ["IT Consulting Services", "consultant", "text-primary"],
  ["Talent Acquisition & Placement", "groups", "text-secondary"],
  ["Corporate Learning & Development", "school", "text-tertiary"],
] as const;

const ACTIVE_PRODUCTS = [
  ["Kaizen Defense", "AI-assisted cybersecurity management for multi-cloud environments.", "shield_lock"],
  ["Cloud Posture Management", "Multi-cloud strategy, smart assessment, cloud readiness, and compliance security.", "cloud_done"],
  ["AI Gateway", "One gateway for unified model access, smart routing, guardrails, and cost visibility.", "hub"],
  ["WMS Application", "Every item tracked, every move connected, with inventory visibility and workflow control.", "inventory_2"],
] as const;

const PRODUCT_DETAILS: Record<string, string> = {
  "Kaizen Defense":
    "Kaizen Defense is an AI-assisted, multi-cloud cybersecurity management platform that integrates security monitoring, asset discovery, vulnerability assessment, compliance evaluation, threat intelligence, and remediation management into one centralized system. It is designed to help organizations understand cloud security risks and manage them through evidence-based analysis, specialized security agents, and approval-controlled operational workflows.",
  "Cloud Posture Management":
    "Cloud Posture Management is a centralized cybersecurity solution that helps organizations monitor and secure their multi-cloud infrastructure. The system connects to Azure, AWS, and Google Cloud, discovers cloud resources, evaluates security configurations, identifies vulnerabilities and misconfigurations, and prioritizes risks based on severity and business impact. It also supports compliance monitoring, AI-assisted security analysis, and remediation management, enabling security teams to maintain better visibility and control over their cloud environments.",
  "AI Gateway":
    "AI Gateway provides a centralized integration layer for AI-assisted cybersecurity operations. It connects the platform's security analysis capabilities with AI models to generate contextual explanations, prioritize vulnerabilities, assess business impact, and recommend remediation actions. Through authenticated APIs, structured security context, configurable model settings, and response validation, the system supports more efficient security investigation while keeping operational decisions under human control.",
  "WMS Application":
    "KaizenX is an enterprise Warehouse and Asset Management System designed to digitize and connect warehouse operations, from supplier shipment notification and vehicle arrival through goods receiving, quality inspection, inventory management, assembly, finished-goods handling, dispatch, and gate exit. The platform provides role-based web dashboards, mobile operations, QR-enabled material identification, transactional traceability, and an event-driven backend architecture. By integrating operational processes into one centralized system, KaizenX aims to improve material visibility, reduce manual coordination, maintain accurate inventory records, and provide end-to-end accountability for warehouse transactions.",
};

const TALENT_SERVICES = [
  ["Contract Employment", "Work on customer assignments while employed under KGS payroll."],
  ["Contract-to-Hire", "Start on contract with the opportunity to transition to permanent employment."],
  ["Permanent Hiring & Referrals", "Access suitable permanent opportunities through customer hiring and referrals."],
] as const;

const LANDING_LOADER_SESSION_KEY = "kgs-landing-loader-played";

export function LandingPage({ onLogin, onAdminLogin, onRegister }: LandingPageProps) {
  const [isLoading, setIsLoading] = useState(
    () => sessionStorage.getItem(LANDING_LOADER_SESSION_KEY) !== "true",
  );
  const [isLoaderExiting, setIsLoaderExiting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<(typeof ACTIVE_PRODUCTS)[number] | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<string>();
  const achieverGridRef = useRef<HTMLDivElement>(null);
  const loaderFinishedRef = useRef(false);
  const loaderExitTimerRef = useRef<number | null>(null);

  const finishLoading = () => {
    if (loaderFinishedRef.current) return;
    loaderFinishedRef.current = true;
    setIsLoaderExiting(true);
    loaderExitTimerRef.current = window.setTimeout(() => setIsLoading(false), 700);
  };

  const openContact = (track?: string) => {
    setSelectedTrack(track);
    setContactOpen(true);
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
      <header className="cinematic-navbar fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
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
            <a
              href="https://www.kaizentrixglobal.com/"
              className="public-nav-link font-label-lg text-label-lg text-on-surface-variant"
            >
              About Us
            </a>
            <button type="button" onClick={() => openContact()} className="public-nav-link border-0 bg-transparent font-label-lg text-label-lg text-on-surface-variant">Contact Us</button>
          </nav>

          {/* Header Action Controls */}
          <div className="flex items-center gap-space-md">
            <a
              href="https://www.linkedin.com/company/kaizentrix-global-solutions-pvt-ltd/posts/"
              target="_blank"
              rel="noreferrer"
              aria-label="Kaizentrix Global Solutions on LinkedIn"
              className="hidden items-center justify-center rounded-xl border border-surface-container-high bg-surface-container-lowest px-space-md py-1.5 font-label-md text-label-md text-primary shadow-sm transition-colors hover:bg-primary hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:inline-flex"
            >
              LinkedIn
            </a>
            {/* Portal Login CTA */}
            <button
              onClick={onLogin}
              className="hero-login-button portal-login-button hidden md:inline-flex items-center px-space-md py-1.5 rounded-xl font-label-md text-label-md shadow-[0_1px_3px_0_rgba(15,23,42,0.05)] cursor-pointer"
            >
              <span>Login</span>
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
              <a
                href="https://www.kaizentrixglobal.com/"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-left text-on-surface-variant font-label-lg"
              >
                About Us
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
                Login
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
      <main className="w-full bg-surface">
        {/* SECTION 1: HERO & LIVE WORKBENCH PREVIEW */}
        <section
          className="relative isolate min-h-[560px] overflow-hidden bg-surface-container-low px-margin py-20 sm:min-h-[600px] lg:min-h-[680px] lg:py-24"
        >
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            aria-label="Students preparing for software engineering careers"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover object-[65%_center] max-lg:object-[70%_center] max-md:object-[72%_center]"
          >
            <source src={HERO_VIDEO_URL} type="video/mp4" />
          </video>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(248,250,255,0.78)_0%,rgba(248,250,255,0.62)_28%,rgba(248,250,255,0.34)_48%,rgba(248,250,255,0.04)_78%,transparent_100%)] max-md:bg-[linear-gradient(180deg,rgba(248,250,255,0.86)_0%,rgba(248,250,255,0.72)_40%,rgba(248,250,255,0.34)_72%,rgba(248,250,255,0.08)_100%)]"
          />
          <div className="absolute -top-32 right-10 w-96 h-96 bg-primary-fixed-dim/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 left-10 w-80 h-80 bg-tertiary-fixed/30 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 mx-auto grid h-full max-w-7xl grid-cols-1 items-center gap-space-xl lg:grid-cols-12">
            {/* Left Copy & Metric Highlights */}
            <div className="flex max-w-[620px] flex-col gap-space-md lg:col-span-7">
              <h1 className="font-headline-xl text-[clamp(2.2rem,3.2vw,3.5rem)] font-bold leading-[1.08] tracking-tight text-black">
                Kaizentrix Global Solutions
              </h1>

              <p className="max-w-[580px] font-body-lg text-body-lg font-bold leading-relaxed text-black">
                Kaizentrix Global Solutions is a technology-driven company focused on building innovative products and digital solutions, with expertise across cloud infrastructure, cybersecurity, artificial intelligence and data engineering.
                <br /><br />
                Inspired by Kaizen, the Japanese philosophy of continuous improvement, we help businesses transform ideas into practical solutions—from enterprise technology and product development to AI-powered platforms and digital assessment solutions.
                <br /><br />
                <strong>Driven by innovation, collaboration and continuous improvement.</strong>
              </p>

              {/* Primary Call to Action Buttons */}
              <div className="flex flex-wrap items-center gap-space-md pt-space-xs">
                <button
                  onClick={onLogin}
                  className="hero-login-button flex cursor-pointer items-center gap-2 rounded-xl border-0 bg-[#155CC0] px-space-lg py-3 font-label-lg text-label-lg text-white shadow-md transition-colors hover:bg-[#104a9b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#155CC0]"
                >
                  <span className="material-symbols-outlined text-white text-[20px]">
                    person
                  </span>
                  <span>Candidate Login</span>
                </button>

              </div>

            </div>

          </div>
        </section>

        <section className="overflow-hidden border-y border-surface-container-low bg-surface-container-lowest py-space-lg">
          <div className="mx-auto mb-space-sm flex max-w-7xl flex-col items-baseline justify-between px-margin md:flex-row">
            <span className="font-label-sm text-label-sm font-bold uppercase tracking-widest text-on-surface-variant">
              Recruiting &amp; Strategic Engineering Partners
            </span>
          </div>
          <div className="relative flex w-full items-center overflow-hidden py-space-sm">
            <div className="flex items-center gap-16 whitespace-nowrap animate-[marquee_25s_linear_infinite]">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="flex items-center gap-16">
                  <img
                    src="https://www.tcs.com/content/dam/global-tcs/en/images/who-we-are/media-kit/tcs-light-logo.png"
                    alt="TCS"
                    className="h-10 w-auto max-w-40 object-contain opacity-80 transition hover:opacity-100"
                  />
                  <img
                    src="https://www.drupal.org/files/infosys-logo-PNG.png"
                    alt="Infosys"
                    className="h-10 w-auto max-w-40 object-contain opacity-80 transition hover:opacity-100"
                  />
                  <img
                    src="https://logos-world.net/wp-content/uploads/2022/07/HCL-Technologies-Symbol.png"
                    alt="HCL Technologies"
                    className="h-10 w-auto max-w-40 object-contain opacity-80 transition hover:opacity-100"
                  />
                  <img
                    src="https://logos-world.net/wp-content/uploads/2020/10/IBM-Logo-1962.png"
                    alt="IBM"
                    className="h-10 w-auto max-w-40 object-contain opacity-80 transition hover:opacity-100"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* COMPANY PROFILE */}
        <section id="company-profile" className="relative overflow-hidden bg-surface-container-low px-margin py-space-xl text-on-surface">
          <div className="pointer-events-none absolute -right-24 top-16 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl animate-[float_8s_ease-in-out_infinite]" />
          <div className="pointer-events-none absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl animate-[float_10s_ease-in-out_infinite_reverse]" />
          <div className="relative z-10 mx-auto max-w-7xl">
            <div className="grid items-end gap-space-lg lg:grid-cols-[1.05fr_.95fr]">
              <div>
                <span className="font-label-sm text-label-sm uppercase tracking-[.2em] text-primary">Company profile · 11+ years of technology expertise</span>
                <h2 className="mt-4 max-w-4xl font-headline-lg text-headline-lg leading-tight">Learn. Build. Innovate. Deploy.</h2>
                <p className="mt-5 max-w-3xl font-body-lg text-body-lg leading-relaxed text-on-surface-variant">
                  Kaizentrix Global Solutions, InfyStrat, and StratNex collaborate with industry partners to develop customer-centric products and innovative solutions globally. Our group also extends into power infrastructure and data-center setup through GTV Power Pvt. Ltd. across India.
                </p>
              </div>
              <div className="rounded-3xl border border-surface-container bg-surface-container-lowest p-6 shadow-2xl shadow-black/10">
                <div className="flex items-center justify-between border-b border-surface-container pb-4">
                  <span className="font-label-sm uppercase tracking-widest text-primary">Our promise</span>
                  <span className="material-symbols-outlined text-amber-500">auto_awesome</span>
                </div>
                <p className="mt-5 text-xl font-semibold leading-relaxed text-on-surface">Driven by collaboration and continuous improvement, we evolve with customer needs to deliver lasting value through technology and engineering excellence.</p>
              </div>
            </div>

            <div className="mt-space-xl grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {PROFILE_COMPETENCIES.map(([name, icon, color], index) => (
                <article key={name} className="group rounded-2xl border border-surface-container bg-surface-container-lowest p-5 transition duration-500 hover:-translate-y-2 hover:border-primary/60 hover:shadow-lg" style={{ animationDelay: `${index * 70}ms` }}>
                  <span className={`material-symbols-outlined ${color} text-[30px] transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6`}>{icon}</span>
                  <h3 className="mt-5 text-base font-bold text-on-surface">{name}</h3>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-surface-container-low px-margin py-space-xl">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary font-bold">Product development</span>
              <h2 className="mt-3 font-headline-lg text-headline-lg text-on-surface">Active products built for real operations.</h2>
              <p className="mt-3 font-body-md text-body-md leading-relaxed text-on-surface-variant">From security and cloud readiness to warehouse visibility and responsible AI access, our products connect complex work into clearer decisions.</p>
            </div>
            <div className="mt-space-lg grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {ACTIVE_PRODUCTS.map((product, index) => {
                const [name, copy, icon] = product;
                return (
                <article key={name} className="group relative overflow-hidden rounded-3xl border border-surface-container bg-surface-container-lowest p-6 shadow-sm transition duration-500 hover:-translate-y-2 hover:shadow-xl">
                  <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary/10 transition duration-500 group-hover:scale-[2.5]" />
                  <span className="relative material-symbols-outlined text-[32px] text-primary transition-transform duration-500 group-hover:rotate-12">{icon}</span>
                  <span className="relative mt-6 block text-[11px] font-extrabold uppercase tracking-widest text-outline">0{index + 1}</span>
                  <h3 className="relative mt-2 text-xl font-bold text-on-surface">{name}</h3>
                  <p className="relative mt-3 text-sm leading-6 text-on-surface-variant">{copy}</p>
                  <button
                    type="button"
                    onClick={() => setSelectedProduct(product)}
                    className="relative mt-5 inline-flex items-center gap-1 border-0 bg-transparent p-0 text-sm font-bold text-primary transition-colors hover:text-primary-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    Read more
                    <span className="material-symbols-outlined text-[17px]">arrow_forward</span>
                  </button>
                </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-surface px-margin py-space-xl">
          <div className="mx-auto max-w-7xl">
            <h2 className="mb-6 text-3xl font-extrabold tracking-tight text-primary sm:text-4xl lg:text-5xl">
              Internship program and development
            </h2>
            <img src="https://chatgpt.com/backend-api/estuary/public_content/enc/eyJpZCI6Im1fNmFlYWI1N2QyYmEwODE5MTlmMDllYTU4ZGY5Yjc2NTE6ZmlsZV8wMDAwMDAwMDMzY2M4MjExOWM4YTQ2YzE4NDRkODY3YSIsImdpem1vX2lkIjpudWxsLCJ3aWQiOm51bGwsIm9pZCI6bnVsbCwic2lkIjpudWxsLCJjcyI6bnVsbCwiZm4iOm51bGwsImNkIjpudWxsLCJ0cyI6IjIwNzYxIiwicCI6InB5aSIsImNpZCI6IjEiLCJzaWciOiJmZWQwYmQ0OTQ5MTQ4MDUwNjVlZDQ2OTYyYzI5ODA2YTEyZjQwZjAwNjQ0ZDU2YTFjMWMxY2FiODUxNjMzNDQ4IiwidiI6IjAiLCJjZG4iOm51bGwsImNwIjpudWxsLCJtYSI6bnVsbH0=" alt="Corporate Learning and Development Program pathway" className="block h-auto w-full rounded-2xl object-cover shadow-xl" />
          </div>
        </section>

        <section className="bg-surface-container-low px-margin py-space-xl">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-space-xl lg:grid-cols-[1fr_1.2fr] lg:items-end">
              <div>
                <span className="font-label-sm text-label-sm uppercase tracking-widest text-tertiary font-bold">Talent acquisition & placement services</span>
                <h2 className="mt-3 font-headline-lg text-headline-lg text-on-surface">Bridging talent and industry needs.</h2>
                <p className="mt-4 font-body-md text-body-md leading-relaxed text-on-surface-variant">Flexible staffing models, customer engagements, and managed technology services that create practical pathways into the teams where people can do their best work.</p>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {TALENT_SERVICES.map(([name, copy]) => (
                  <article key={name} className="rounded-2xl border border-surface-container bg-surface-container-lowest p-5 transition duration-500 hover:-translate-y-1 hover:shadow-lg">
                    <span className="material-symbols-outlined text-tertiary">work_history</span>
                    <h3 className="mt-4 text-base font-bold text-on-surface">{name}</h3>
                    <p className="mt-2 text-sm leading-6 text-on-surface-variant">{copy}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-surface px-margin py-space-xl">
          <div className="mx-auto max-w-7xl">
            <div className="mb-space-lg text-center">
              <span className="font-label-sm text-label-sm font-bold uppercase tracking-widest text-primary">Our people &amp; moments</span>
              <h2 className="mt-2 font-headline-lg text-headline-lg text-on-surface">The Kaizentrix Story in Motion</h2>
            </div>
            <div className="relative left-1/2 w-[calc(100vw-20px)] -translate-x-1/2 overflow-hidden">
            <div className="flex w-max animate-[photoMarquee_28s_linear_infinite] gap-[10px] hover:[animation-play-state:paused]">
                {[1, 2].map((set) => (
                <div key={set} className="flex shrink-0 items-center gap-[10px]" aria-hidden={set === 2}>
                  <img src="https://res.cloudinary.com/dujdjt4l7/image/upload/v1793731145/1663840189570_foad0r.jpg" alt={set === 1 ? "Kaizentrix Global Solutions team" : ""} className="h-64 w-[min(78vw,420px)] rounded-2xl object-cover shadow-lg sm:h-72" />
                  <img src="https://res.cloudinary.com/dujdjt4l7/image/upload/v1793731147/1666640669681_smq5jx.jpg" alt={set === 1 ? "Kaizentrix Global Solutions team gathering" : ""} className="h-64 w-[min(78vw,420px)] rounded-2xl object-cover shadow-lg sm:h-72" />
                  <img src="https://res.cloudinary.com/dujdjt4l7/image/upload/v1793731147/1668439994991_ddavxh.jpg" alt={set === 1 ? "Kaizentrix Global Solutions team event" : ""} className="h-64 w-[min(78vw,420px)] rounded-2xl object-cover shadow-lg sm:h-72" />
                  <img src="https://res.cloudinary.com/dujdjt4l7/image/upload/v1793731146/1666232975402_ohwoo1.jpg" alt={set === 1 ? "Kaizentrix Global Solutions team activity" : ""} className="h-64 w-[min(78vw,420px)] rounded-2xl object-cover shadow-lg sm:h-72" />
                  <img src="https://res.cloudinary.com/dujdjt4l7/image/upload/v1793731148/1668439995034_fmhbez.jpg" alt={set === 1 ? "Kaizentrix Global Solutions team gathering" : ""} className="h-64 w-[min(78vw,420px)] rounded-2xl object-cover shadow-lg sm:h-72" />
                  <img src="https://res.cloudinary.com/dujdjt4l7/image/upload/v1793731149/1686325656185_p8pf8k.jpg" alt={set === 1 ? "Kaizentrix Global Solutions team event" : ""} className="h-64 w-[min(78vw,420px)] rounded-2xl object-cover shadow-lg sm:h-72" />
                  <img src="https://res.cloudinary.com/dujdjt4l7/image/upload/v1793731150/1686325657188_rra4yy.jpg" alt={set === 1 ? "Kaizentrix Global Solutions team" : ""} className="h-64 w-[min(78vw,420px)] rounded-2xl object-cover shadow-lg sm:h-72" />
                  <img src="https://res.cloudinary.com/dujdjt4l7/image/upload/v1793731151/1686325657258_yxzipq.jpg" alt={set === 1 ? "Kaizentrix Global Solutions team" : ""} className="h-64 w-[min(78vw,420px)] rounded-2xl object-cover shadow-lg sm:h-72" />
                  <img src="https://res.cloudinary.com/dujdjt4l7/image/upload/v1793731152/1698096697724_ghvjdv.jpg" alt={set === 1 ? "Kaizentrix Global Solutions team" : ""} className="h-64 w-[min(78vw,420px)] rounded-2xl object-cover shadow-lg sm:h-72" />
                  <img src="https://res.cloudinary.com/dujdjt4l7/image/upload/v1793731153/1710103021935_dv8wi9.jpg" alt={set === 1 ? "Kaizentrix Global Solutions team" : ""} className="h-64 w-[min(78vw,420px)] rounded-2xl object-cover shadow-lg sm:h-72" />
                  <img src="https://res.cloudinary.com/dujdjt4l7/image/upload/v1793731154/1710103023532_schhna.jpg" alt={set === 1 ? "Kaizentrix Global Solutions team" : ""} className="h-64 w-[min(78vw,420px)] rounded-2xl object-cover shadow-lg sm:h-72" />
                </div>
              ))}
            </div>
            </div>
          </div>
        </section>
        {false && (
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
        )}

        {false && (
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
                        Recruitment Drive
                      </div>
                      <div className="font-body-sm text-[11px] text-tertiary mt-0.5 font-semibold">
                        2 November 2026 · 10:30 AM
                      </div>
                      <div className="font-body-sm text-[11px] text-outline mt-0.5">
                        AI/ML Research Engineer · Full-Stack Web Developer
                      </div>
                      <div className="font-body-sm text-[11px] text-outline mt-0.5">
                        BE, B.Tech, BCA, MCA, M.Tech · 3 Days / 4 Rounds
                      </div>
                      <div className="font-body-sm text-[11px] text-outline mt-0.5">
                        Kaizentrix Global Solutions, Bengaluru
                      </div>
                    </div>
                    <div className="bg-surface-container-low p-3 rounded-xl border border-surface-container">
                      <span className="font-label-sm text-label-sm text-outline">
                        Algorithm Mastery
                      </span>
                      <div className="font-label-lg text-label-lg text-primary mt-1 font-bold">
                        Tier: GOLD (Top 35%)
                      </div>
                      <div className="font-body-sm text-[11px] text-outline mt-0.5">
                        132 Problems Solved
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
        )}

        {/* SECTION 6: DETAILED HEADQUARTERS & ACCREDITATION FOOTER SECTION */}
        <section className="bg-surface-container-lowest pt-space-xl pb-space-lg px-margin">
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
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="px-2.5 py-1 rounded-md bg-surface-container text-on-surface-variant font-label-sm text-label-sm font-semibold">
                  ISO 9001 – Quality Management
                </span>
                <span className="px-2.5 py-1 rounded-md bg-surface-container text-on-surface-variant font-label-sm text-label-sm font-semibold">
                  ISO/IEC 27001 – Information Security
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

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 lg:col-span-2">
              <a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors" href="https://www.kaizentrixglobal.com/">About Us</a>
              <button onClick={() => openContact()} className="cursor-pointer border-0 bg-transparent p-0 text-left font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors">Contact Us</button>
              <a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors" href="https://www.linkedin.com/company/kaizentrix-global-solutions-pvt-ltd/posts/" target="_blank" rel="noreferrer">LinkedIn</a>
              <button onClick={onLogin} className="cursor-pointer border-0 bg-transparent p-0 text-left font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors">Portal Login</button>
            </div>

            {/* Col 4: Contact */}
            <div className="flex flex-col gap-4">
              <span className="font-label-lg text-label-lg text-on-surface font-bold">
                Contact
              </span>
              <div className="font-body-sm text-body-sm text-on-surface-variant flex items-start gap-3">
                <span className="material-symbols-outlined text-primary text-[22px] mt-0.5">mail</span>
                <a className="break-all hover:text-primary transition-colors" href="mailto:enquiry@kaizentrixglobal.com">
                  enquiry@kaizentrixglobal.com
                </a>
              </div>
              <div className="font-body-sm text-body-sm text-on-surface-variant flex items-start gap-3">
                <span className="material-symbols-outlined text-primary text-[22px] mt-0.5">call</span>
                <a className="hover:text-primary transition-colors" href="tel:+919187980031">
                  080-23143355 / +91 91879 80031
                </a>
              </div>
              <div className="font-body-sm text-body-sm text-on-surface-variant flex items-start gap-3">
                <span className="material-symbols-outlined text-primary text-[22px] mt-0.5">location_on</span>
                <span className="leading-relaxed">
                  100 DC Complex, Chandra Layout,<br />
                  Vijayanagar, Bengaluru,<br />
                  Karnataka 560056
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* GLOBAL FOOTER */}
      <footer className="w-full bg-surface-container-lowest py-space-lg">
        <div className="max-w-7xl mx-auto px-margin flex flex-col gap-space-md font-body-sm text-body-sm text-on-surface-variant">
          <div className="flex flex-wrap items-center justify-center gap-x-space-lg gap-y-2">
            <a className="hover:text-on-surface transition-colors" href="mailto:enquiry@kaizentrixglobal.com">
              Campus Assistance
            </a>
            <a className="hover:text-on-surface transition-colors" href="/placement-policy">
              Placement Policy
            </a>
          </div>
          <div className="w-full pt-space-md text-center text-xs text-on-surface-variant">
            © 2026 Kaizentrix Global Solutions Private Limited. All rights reserved.
          </div>
        </div>
      </footer>
      {selectedProduct && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-[#14213D]/40 px-4 backdrop-blur-sm animate-[fadeIn_200ms_ease-out]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-dialog-title"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-surface-container-lowest p-7 shadow-2xl animate-[scaleIn_250ms_ease-out]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="font-label-sm text-label-sm font-bold uppercase tracking-widest text-primary">Active product</span>
                <h2 id="product-dialog-title" className="mt-2 text-2xl font-bold text-on-surface">{selectedProduct[0]}</h2>
              </div>
              <button
                type="button"
                aria-label="Close product details"
                onClick={() => setSelectedProduct(null)}
                className="grid h-9 w-9 place-items-center rounded-xl border-0 bg-surface-container text-on-surface transition-colors hover:bg-surface-container-high"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="mt-5 text-base leading-7 text-on-surface-variant">{PRODUCT_DETAILS[selectedProduct[0]] ?? selectedProduct[1]}</p>
            <button
              type="button"
              onClick={() => setSelectedProduct(null)}
              className="mt-7 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-container"
            >
              Close
            </button>
          </div>
        </div>
      )}
      <ContactModal open={contactOpen} track={selectedTrack} onClose={() => setContactOpen(false)} />
    </div>
  );
}
