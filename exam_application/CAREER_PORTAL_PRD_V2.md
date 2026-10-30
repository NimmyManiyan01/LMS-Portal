# Product Requirements Document — CareerOS Student Success Portal

**Version:** 2.0  
**Status:** Build-ready expansion of the existing EXAM-PORTAL  
**Reference basis:** Functional patterns observed in the Dhee student portal, redesigned as an original product  
**Primary users:** Students, Trainers, Placement Coordinators, Finance/KYC Reviewers, Administrators, Super Administrators

## 1. Product vision

Build one secure portal through which a student can manage learning, assessments, employability, placement applications, interviews, mentorship, attendance, referrals, rewards, purchases, and profile readiness. Staff receive role-specific tools to operate those workflows. The existing secure examination platform remains the authoritative assessment engine and is expanded into a broader student-success product.

The product must not reproduce another portal's branding, copy, private data, or proprietary implementation. The reference application informs information architecture and workflow coverage only.

## 2. Product outcomes

- Give students one dashboard for learning and placement activity.
- Make profile completeness and job eligibility transparent.
- Track every application from discovery through selection or rejection.
- Preserve the existing secure, auditable assessment lifecycle.
- Provide schedules, announcements, attendance, mentorship, and feedback.
- Support referral rewards through an auditable wallet ledger.
- Handle KYC and uploaded documents with privacy-by-design controls.
- Give staff operational dashboards without weakening resource authorization.
- Provide accurate state transitions, notifications, reporting, and audit history.

## 3. Scope

### 3.1 Release 1 — Core student success

- Public landing page and student authentication.
- Student dashboard and notification center.
- Profile, education, skills, resume, links, and completion score.
- Careers, eligibility comparison, applications, rounds, and interviews.
- Existing assessments, attempts, scoring, integrity, and results.
- Performance dashboard.
- Announcements and class schedules.
- Role-based administration and audit history.

### 3.2 Release 2 — Engagement and operations

- Mentorship batches, attendance, and feedback.
- Complementary/special classes.
- Referral program and wallet ledger.
- KYC review and encashment requests.
- Course catalog, purchases, invoices, and payment integration.
- LMS and activity-platform integrations.

### 3.3 Explicit non-goals for initial production

- Cloning the reference site's visual identity or text.
- Automated misconduct verdicts based only on browser signals.
- Storing raw card data.
- Unreviewed automatic KYC approval.
- Cryptocurrency or transferable wallet balances.
- Public access to student, application, interview, or assessment data.
- Direct modification of historical scores, attempts, wallet transactions, or audit records.

## 4. Users and roles

### Student

Manages their own profile; views announcements, classes, careers, eligibility, applications, interviews, assessments, results, performance, referrals, wallet, purchases, mentorship, and feedback. A student can never read or alter another student's records.

### Trainer

Views assigned batches/classes, records attendance, creates permitted class notes, enters mock-test remarks, and reviews assigned student performance. No placement, finance, or global-admin access.

### Placement Coordinator

Manages job descriptions, requirements, eligible candidates, applications, interview rounds, statuses, and placement reports. Cannot inspect KYC banking data unless separately authorized.

### Assessment Administrator

Retains the current exam-management capabilities: exams, questions, papers, candidates, attempts, incidents, results, exports, and assessment audit records.

### Finance/KYC Reviewer

Reviews KYC submissions and encashment requests, with masked bank details by default, dual-control approval for payouts, and immutable review history.

### Administrator

Manages branches, batches, programs, users, announcements, schedules, staff assignments, configurations, and operational reports within their organization scope.

### Super Administrator

Controls organizations, elevated roles, security policy, integrations, feature flags, retention, system health, and platform-wide audit. Sensitive support operations require a reason and re-authentication.

## 5. Information architecture

### Public

- Landing
- Student sign-in
- Account activation / registration by invitation
- Forgot/reset password
- OTP verification
- Support and policy pages

### Student shell

- Home
- Careers
- Applications
- Performance
- More
  - Assessments
  - Announcements
  - Classes
  - Mentorship
  - Referrals
  - Wallet
  - Purchases
- Profile menu
  - Profile
  - Documents
  - KYC
  - Security sessions
  - Logout

### Staff shell

- Operational dashboard
- Students
- Programs, branches, and batches
- Careers and application pipeline
- Assessments
- Classes and attendance
- Mentorship
- Announcements and notifications
- Referrals, wallet, KYC, payouts
- Purchases and catalog
- Reports
- Audit log
- Settings

## 6. Functional requirements

### 6.1 Authentication and account security

- Invite-only or administrator-created student accounts.
- Email/password login with optional student email OTP.
- Mandatory MFA for privileged staff.
- Generic forgot-password responses.
- Short-lived access token and rotating, hashed refresh-token session.
- Secure, HTTP-only, SameSite refresh cookie.
- Session list with device, approximate location, last active time, and revoke action.
- Rate limiting, progressive lockout, security-event logging, and suspicious-login alerts.
- Logout revokes the active session; logout-all revokes all refresh sessions.

### 6.2 Home dashboard

- Personalized greeting and profile-completion prompt.
- Actionable notification count.
- Latest announcements.
- Upcoming classes and interviews.
- Assigned assessments and deadlines.
- Career opportunity carousel/list personalized by stack and eligibility.
- Performance summary.
- Integration cards for LMS and activities.
- Empty, loading, error, stale-data, and offline states.

### 6.3 Profile and employability record

- Personal information, address, contact and emergency contact.
- Bio, work experience, preferred locations, work mode, and availability.
- Education history with controlled correction workflow.
- Skills with proficiency and evidence/source.
- Primary/secondary technology stack.
- Resume versions, portfolio, GitHub, LinkedIn, and certificates.
- Profile-completion calculation driven by configurable rules.
- QR identity card that exposes only a short-lived signed identifier.
- Every sensitive field change audited.

### 6.4 Careers and eligibility

- Search, filter, sort, pagination/infinite loading, saved jobs, and open/closed states.
- Job data: title, organization, description, responsibilities, skills, location, work mode, salary, dates, rounds, qualifications, streams, graduation years, percentage rules, backlogs, gaps, gender rule where legally permitted, bond, and disclaimers.
- Server-side eligibility engine produces criterion-by-criterion output.
- Rule outcomes: matched, not matched, unknown/missing data, overridden.
- Authorized coordinator override requires reason, actor, and timestamp.
- Application submission is idempotent and blocked after deadline/closure.
- Student receives a submission receipt and current pipeline stage.

### 6.5 Applications and interviews

- Application states: `SUBMITTED`, `SCREENING`, `SHORTLISTED`, `ASSESSMENT`, `INTERVIEW`, `OFFERED`, `SELECTED`, `REJECTED`, `WITHDRAWN`, `CLOSED`.
- Round states: `PENDING`, `SCHEDULED`, `AVAILABLE`, `COMPLETED`, `MISSED`, `CANCELLED`, `RESCHEDULED`.
- Timeline showing every state transition visible to the student when permitted.
- Interview date, time, timezone, mode, location/link, instructions, contact, and calendar export.
- Automated expiry reconciles stale availability.
- Staff can bulk transition candidates with validation and notification preview.
- Student withdrawal is allowed only before a configured lock point and requires confirmation.

### 6.6 Assessments

- Preserve requirements from the existing assessment PRD and implementation.
- Assigned-test filters: invited, in progress, submitted, auto-submitted, disqualified.
- Instructions, system readiness, server-authoritative timer, autosave, resume, heartbeat, incident logging, idempotent submit, server scoring, and publication controls.
- Assessment results feed the broader performance and placement modules through stable domain events.

### 6.7 Performance

- Aggregate mock tests, formal assessments, attendance, assignments, trainer remarks, and employability readiness.
- Filters by date, course, topic, trainer, and assessment type.
- Score trend, topic strength, attendance trend, attempts, completion, and recommendations.
- Students see only their data; trainers see assigned cohorts; admins see authorized aggregates.
- Export is access-controlled and audited.

### 6.8 Announcements and notifications

- Audience targeting by organization, branch, batch, program, role, and individual.
- Rich content, attachments, external links, publish/schedule/expiry, priority, and acknowledgment requirement.
- Notification channels: in-app; optional email/SMS/push integrations.
- Read/unread and acknowledgment states.
- Cursor pagination and searchable archive.

### 6.9 Classes and attendance

- Recurring and one-off class schedules.
- Trainer, topic, room, branch/online link, time, capacity, status, and notes.
- States: scheduled, live, completed, cancelled, rescheduled.
- Attendance via staff marking or signed rotating QR code.
- Duplicate, expired, cross-student, and location-policy checks.
- Corrections require staff reason and audit entry.

### 6.10 Mentorship

- Mentor and cohort assignment.
- Session schedules, objectives, attendance, notes visible by policy, and feedback.
- Student feedback uses configurable rating/questions and optional anonymity.
- Escalation route when no mentor is assigned or a session is missed.

### 6.11 Complementary classes

- Administrator-assigned special cohorts.
- Independent schedules, trainers, attendance, materials, and completion.
- Students cannot self-enroll unless a future catalog policy explicitly permits it.

### 6.12 Referrals

- Configurable reward program with effective dates and versioned terms.
- Referral form with consent confirmation for third-party contact data.
- Duplicate and self-referral detection.
- Lifecycle: `SUBMITTED`, `CONTACTED`, `QUALIFIED`, `ENROLLED`, `PARTIALLY_PAID`, `COMPLETED`, `REJECTED`, `CANCELLED`.
- Rewards accrue proportionally only from verified events.
- Student dashboard shows referral state without exposing internal staff notes.

### 6.13 Wallet

- Wallet is a rewards ledger, not an editable balance field.
- Entries are immutable debit/credit records with source, idempotency key, effective conversion rate, and audit reference.
- Balance is calculated from posted entries.
- Encashment requires approved KYC, sufficient available balance, minimum threshold, and no duplicate pending request.
- Payout requires maker-checker approval and reconciliation reference.
- Reversal is a new compensating transaction; historical rows are never edited or deleted.

### 6.14 KYC

- Bank account, holder name, phone, IFSC, branch, and evidence upload.
- Client and server file-size/type validation plus malware scanning.
- Encrypted object storage; never expose raw storage URLs.
- Review states: `NOT_STARTED`, `SUBMITTED`, `IN_REVIEW`, `APPROVED`, `REJECTED`, `RESUBMISSION_REQUIRED`, `EXPIRED`.
- Masked display after submission.
- Reviewer reason, timestamps, and immutable audit.
- Published privacy notice, purpose, retention, correction, deletion, and support process.

### 6.15 Catalog and purchases

- Course/product catalog with availability, price, tax, discount, branch/mode, start date, and terms.
- Payment provider hosted checkout; do not store card details.
- Purchase states: initiated, pending, paid, failed, refunded, partially refunded, cancelled.
- Webhook verification, idempotency, invoice generation, and reconciliation.
- Student purchase history and downloadable invoice.

### 6.16 Administration and reporting

- Role-scoped operational dashboards.
- CRUD with soft deletion where historical references exist.
- Bulk imports use preview/validate/commit.
- All list endpoints use bounded pagination and filters.
- Scheduled and downloadable reports are generated asynchronously.
- Immutable audit log records actor, action, resource, before/after summary, reason, request ID, and time.

## 7. Core business rules

- The API is authoritative; hidden buttons do not constitute authorization.
- Every resource query includes organization scope and resource ownership.
- State transitions use explicit server-side state machines.
- Historical attempts, scores, application transitions, wallet entries, KYC reviews, and audit entries are append-only or versioned.
- Dates are stored in UTC and rendered in the user's configured IANA timezone.
- All mutation endpoints accept or generate idempotency keys where retry could duplicate work.
- Sensitive data is minimized, encrypted where appropriate, masked by default, and excluded from logs.
- Jobs, tests, interviews, announcements, and offers expire through background reconciliation jobs.

## 8. Non-functional requirements

- WCAG 2.2 AA target.
- Responsive from 360 px mobile through large desktop.
- Respect `prefers-reduced-motion`.
- p95 read latency below 500 ms and mutation latency below 800 ms under target load.
- 99.9% monthly API availability target after production hardening.
- Structured logs, traces/request IDs, metrics, alerts, and dependency health.
- Automated backup with regularly tested restore.
- Content Security Policy, HSTS, anti-clickjacking, MIME sniffing protection, and strict production CORS.
- RPO of 15 minutes and RTO of 4 hours for core operational data.
- Data retention configured by category; deletion/anonymization jobs are auditable.

## 9. Success metrics

- Weekly active student rate.
- Profile completion rate.
- Opportunity view-to-application conversion.
- Eligible application completion rate.
- Interview attendance rate.
- Assessment completion and autosave failure rates.
- Class attendance and mentorship participation.
- Notification acknowledgment rate.
- Referral conversion and payout reconciliation accuracy.
- Support tickets per 1,000 active students.
- Accessibility and production error budgets.

## 10. Acceptance criteria

### Student release

- Student can authenticate, complete profile, browse eligible careers, submit an allowed application, track status, view interviews, take assigned assessments, see published performance, read announcements, and see class schedules.
- Direct URL/API manipulation cannot access another student's data.
- All pages have correct titles, successful routes return correct HTTP status, and every async view has loading/error/empty states.

### Staff release

- Authorized staff can create and operate their assigned workflows without gaining unrelated permissions.
- Bulk operations preview affected records before commit.
- State transitions reject invalid changes with a conflict response.
- Sensitive actions require confirmation, reason, and audit record.

### Finance release

- KYC documents are private and masked after submission.
- Wallet balance matches the immutable ledger.
- Duplicate rewards and payouts are prevented through unique/idempotency constraints.
- Payment and payout webhooks are authenticated and replay-safe.

### Platform release

- Automated unit, API, security, accessibility, and E2E gates pass.
- Backup restore, incident response, secrets rotation, and load tests are completed.
- Privacy notices and retention policies are approved before collecting KYC data.

## 11. Open product decisions

- Whether student OTP is mandatory at every login or only risk-based.
- Whether organizations are fully multi-tenant in the first release.
- Which LMS/activity products are integrated and whether SSO is required.
- Whether gender may legally be used in eligibility rules in the target jurisdiction.
- Referral reward taxation, expiration, minimum payout, and dispute policy.
- Payment provider and payout provider.
- Exact profile fields that may be edited after verification.
- Assessment proctoring level and evidence retention.

