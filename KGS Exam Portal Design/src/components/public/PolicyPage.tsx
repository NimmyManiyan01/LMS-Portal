type PolicySection = {
  title: string
  paragraphs?: string[]
  items?: string[]
}

interface PolicyPageProps {
  eyebrow: string
  title: string
  summary: string
  sections: PolicySection[]
  onBack: () => void
}

export function PolicyPage({
  eyebrow,
  title,
  summary,
  sections,
  onBack,
}: PolicyPageProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 w-[calc(100%-32px)] max-w-5xl items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            className="flex cursor-pointer items-center gap-3 border-0 bg-transparent p-0 text-left"
            aria-label="Back to student registration"
          >
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 font-black text-white shadow-md shadow-blue-500/20">
              K
            </span>
            <span>
              <strong className="block text-sm tracking-wide text-slate-900">KGS EXAM PORTAL</strong>
              <span className="block text-[10px] font-bold tracking-[0.16em] text-blue-600">POLICY CENTRE</span>
            </span>
          </button>
          <button
            type="button"
            onClick={onBack}
            className="h-9 cursor-pointer rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            Back to registration
          </button>
        </div>
      </header>

      <main className="mx-auto w-[calc(100%-32px)] max-w-5xl py-10 sm:py-14">
        <section className="mb-7 overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-violet-50 p-6 shadow-sm sm:p-10">
          <span className="text-xs font-extrabold tracking-[0.18em] text-blue-600">{eyebrow}</span>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">{summary}</p>
          <p className="mt-5 text-xs font-semibold text-slate-500">Effective date: 28 October 2026</p>
        </section>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="space-y-9">
            {sections.map((section, index) => (
              <section key={section.title}>
                <div className="mb-3 flex items-start gap-3">
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-50 text-xs font-extrabold text-blue-700">
                    {index + 1}
                  </span>
                  <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">{section.title}</h2>
                </div>
                <div className="ml-10 space-y-3 text-sm leading-7 text-slate-600">
                  {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                  {section.items && (
                    <ul className="list-disc space-y-2 pl-5 marker:text-blue-500">
                      {section.items.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  )}
                </div>
              </section>
            ))}
          </div>

          <footer className="mt-10 border-t border-slate-100 pt-6 text-sm text-slate-600">
            Questions about this policy can be sent to{" "}
            <a className="font-semibold text-blue-600 hover:underline" href="mailto:exams@kgs.edu">
              exams@kgs.edu
            </a>
            .
          </footer>
        </article>
      </main>
    </div>
  )
}

export const privacySections: PolicySection[] = [
  {
    title: "Information we collect",
    paragraphs: ["We collect information needed to create, secure, and operate your examination account."],
    items: [
      "Identity and contact details, including your name, email address, phone number, college, branch, pass-out year, and assigned Student ID.",
      "Account and verification records, including authentication events, email verification status, and security logs.",
      "Examination records, including eligibility, attempts, answers, submission times, scores, and published results.",
      "Technical and integrity signals described in the Examination Monitoring Policy when you participate in a monitored assessment.",
    ],
  },
  {
    title: "How we use information",
    items: [
      "Create and administer your student account and verify your identity.",
      "Determine examination eligibility, deliver assessments, save responses, and publish results.",
      "Protect candidates, institutions, and the platform from misuse, fraud, and examination-integrity violations.",
      "Provide support, operational notices, security alerts, and essential examination communications.",
      "Maintain auditable records and improve platform reliability and accessibility.",
    ],
  },
  {
    title: "Sharing and disclosure",
    paragraphs: [
      "Information may be shared with the institution or organization administering your examination, authorized KGS personnel, and service providers that support hosting, email delivery, security, and platform operations. We do not sell student personal information.",
      "We may disclose information when required by law, to protect legal rights or safety, or to investigate suspected misconduct or security incidents.",
    ],
  },
  {
    title: "Retention and security",
    paragraphs: [
      "Records are retained only as long as needed for examination administration, institutional requirements, dispute handling, audits, security, and applicable law. Retention periods may differ by institution and record type.",
      "We use access controls, encryption in transit, logging, and operational safeguards designed to protect information. No online system can guarantee absolute security.",
    ],
  },
  {
    title: "Your choices and rights",
    items: [
      "Request access to or correction of inaccurate account information.",
      "Ask questions about retention, institutional access, or deletion where applicable.",
      "Withdraw optional permissions; required examination permissions may affect your ability to participate.",
      "Contact your administering institution for decisions relating to eligibility, scoring, and academic records.",
    ],
  },
  {
    title: "Updates to this policy",
    paragraphs: ["We may update this policy as the platform, legal requirements, or institutional practices change. Material updates will be presented through the portal or communicated through an appropriate channel."],
  },
]

export const monitoringSections: PolicySection[] = [
  {
    title: "Purpose of examination monitoring",
    paragraphs: ["Monitoring helps verify candidate identity, protect examination integrity, detect prohibited activity, support incident review, and provide defensible audit records to authorized administrators."],
  },
  {
    title: "Signals that may be collected",
    items: [
      "Camera access and related visual presence signals when the examination requires a camera.",
      "Microphone access and audio-availability signals when the examination requires a microphone.",
      "Fullscreen state, tab or window changes, focus loss, page visibility, and attempts to leave the examination interface.",
      "Device, browser, network, session, authentication, and timing information necessary to operate and secure the assessment.",
      "Examination events such as start, resume, answer changes, warnings, disconnections, and submission.",
    ],
  },
  {
    title: "Candidate responsibilities",
    items: [
      "Use your own account and complete all identity or system checks honestly.",
      "Remain visible and present when camera monitoring is required.",
      "Keep required permissions enabled and remain in fullscreen mode unless instructed otherwise.",
      "Do not use unauthorized devices, applications, communication tools, materials, or assistance.",
      "Report genuine technical problems promptly and follow administrator instructions.",
    ],
  },
  {
    title: "Warnings and integrity review",
    paragraphs: [
      "The platform may display warnings when configured thresholds are reached. A signal or warning does not by itself prove misconduct. Authorized reviewers may consider the event history, technical context, institutional rules, and other available evidence.",
      "Depending on institutional policy, confirmed violations may result in review, invalidation, disciplinary action, or another outcome determined by the administering institution.",
    ],
  },
  {
    title: "Access, retention, and safeguards",
    paragraphs: ["Monitoring records are restricted to authorized personnel and service providers with an operational need. They are retained according to institutional, audit, security, dispute, and legal requirements, then deleted or de-identified when no longer required."],
  },
  {
    title: "Technical issues and accommodations",
    paragraphs: ["If you cannot meet a monitoring requirement because of accessibility needs, device limitations, connectivity, or another legitimate constraint, contact the administering institution before the examination. Alternative arrangements are subject to institutional approval."],
  },
]
