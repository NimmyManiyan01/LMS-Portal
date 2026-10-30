# CareerOS — Architecture and Build Plan

## 1. Existing foundation

The repository already provides:

- React 19 + TypeScript + Vite + Tailwind CSS v4 frontend.
- Express 4 + MongoDB/Mongoose backend.
- Student/admin authentication and email verification.
- Exams, attempts, answers, results, integrity events, reports, audit logs, and expiration worker.
- Playwright E2E foundation and Node test suite.

This plan evolves that codebase incrementally. It does not replace the secure assessment domain.

## 2. Target architecture

Start as a modular monolith with strict domain boundaries. Split services only when operational evidence justifies it.

```text
frontend/
  app-shell
  auth
  dashboard
  profile
  careers
  applications
  assessments
  performance
  announcements
  classes
  mentorship
  referrals
  wallet
  kyc
  purchases
  admin

backend/src/modules/
  identity
  students
  organizations
  academics
  placements
  assessments        # adapt existing domain
  communications
  mentorship
  referrals
  wallet
  kyc
  commerce
  reporting
  audit
```

Cross-cutting services:

- authentication and authorization;
- validation and error envelopes;
- idempotency;
- audit logging;
- notifications/outbox;
- file storage and malware scan;
- background jobs;
- observability.

## 3. Recommended technology decisions

### Keep

- React, TypeScript, Vite, Tailwind.
- Node/Express and Mongoose for current velocity.
- Existing attempt/scoring/finalization logic.

### Add before broad feature development

- Zod request/environment validation.
- Argon2id or bcrypt password hashing if not already present everywhere.
- Secure refresh-session model and cookie flow.
- Redis-backed distributed rate limiting and job queues.
- Object storage abstraction for resumes, KYC evidence and exports.
- Structured logger with request IDs and secret/PII redaction.
- OpenAPI contract generation and typed frontend API client.
- React Router and a query cache such as TanStack Query.
- React Hook Form plus shared validation schemas where appropriate.

### Production infrastructure

- Managed MongoDB replica set.
- Managed Redis.
- Private object storage with signed short-lived downloads.
- Worker queue for email, expiry, exports, reward processing and reconciliation.
- TLS reverse proxy/CDN, WAF/rate controls, centralized logs and alerting.

## 4. Core data model

All mutable entities include `organizationId`, status, created/updated timestamps, actor metadata where relevant, and versioning for optimistic concurrency.

### Identity and organization

- `Organization`
- `Branch`
- `Program`
- `Batch`
- `User`
- `RoleAssignment`
- `Session`
- `EmailOtpChallenge`
- `SecurityEvent`

### Student profile

- `Student`
- `StudentContact`
- `EducationRecord`
- `StudentSkill`
- `StudentDocument`
- `EmploymentPreference`
- `ProfileChangeRequest`

### Placement

- `Employer`
- `JobDescription`
- `JobRequirementSet`
- `EligibilityEvaluation`
- `Application`
- `ApplicationTransition`
- `InterviewRound`
- `InterviewSchedule`
- `Offer`

### Academic and engagement

- `Announcement`
- `AnnouncementAudience`
- `AnnouncementReceipt`
- `ClassSeries`
- `ClassSession`
- `AttendanceRecord`
- `MentorshipCohort`
- `MentorshipSession`
- `MentorshipFeedback`
- `ComplementaryEnrollment`

### Assessment

Reuse and evolve existing:

- `Exam`
- `Question`
- `PaperSet` / immutable paper version
- `PaperAllocation`
- `Attempt`
- `Answer`
- `IntegrityEvent`
- `FinalResult`

### Rewards and commerce

- `ReferralProgramVersion`
- `Referral`
- `ReferralStatusEvent`
- `RewardAccrual`
- `WalletAccount`
- `WalletEntry`
- `EncashmentRequest`
- `KycSubmission`
- `KycReviewEvent`
- `CatalogItem`
- `Purchase`
- `PaymentEvent`
- `Invoice`

### Platform

- `Notification`
- `NotificationDelivery`
- `AuditLog`
- `OutboxEvent`
- `IdempotencyRecord`
- `FileAsset`
- `ReportExport`

## 5. Critical database constraints

- Unique normalized email per organization or globally, per tenancy decision.
- Unique student ID within organization.
- One current application per student/job unless reapplication is explicitly supported.
- Unique attempt constraints matching exam rules.
- Unique wallet idempotency key and source reference.
- One active KYC submission version per student.
- Unique payment-provider event ID.
- Unique attendance record per student/session.
- TTL indexes for OTP challenges, temporary exports, and idempotency records.
- Compound indexes begin with `organizationId` for tenant-scoped queries.

## 6. API surface

Use `/api/v1`, consistent envelopes, request IDs, bounded pagination, and OpenAPI documentation.

```text
/auth/*
/student/dashboard
/student/profile/*
/student/documents/*
/student/careers/*
/student/applications/*
/student/interviews/*
/student/assessments/*
/student/performance
/student/announcements/*
/student/classes/*
/student/mentorship/*
/student/referrals/*
/student/wallet/*
/student/kyc/*
/student/purchases/*

/staff/students/*
/staff/jobs/*
/staff/applications/*
/staff/interviews/*
/staff/assessments/*
/staff/classes/*
/staff/attendance/*
/staff/mentorship/*
/staff/announcements/*
/staff/referrals/*
/staff/kyc/*
/staff/payouts/*
/staff/catalog/*
/staff/reports/*
/staff/audit/*
```

## 7. Frontend component system

### Foundations

- Design tokens for color, spacing, radii, shadow, type scale and motion.
- Outfit/Poppins may be used only if licensing and brand direction permit; otherwise choose an original type system.
- Accessible primitives for Button, Link, Input, Select, Dialog, Drawer, Tabs, Badge, Toast, Tooltip, Table, Pagination, Skeleton, EmptyState and ErrorState.
- Responsive application shell with desktop sidebar option and mobile bottom navigation.

### Domain components

- OpportunityCard and EligibilityMatrix.
- ApplicationTimeline and InterviewCard.
- AssessmentCard, ExamNavigator and SaveStatus.
- PerformanceMetric and TrendChart.
- AnnouncementCard and AudienceBadge.
- ClassCard, AttendanceStatus and QRScanner boundary.
- ReferralSummary and ReferralForm.
- WalletBalance, WalletLedger and EncashmentDialog.
- KycStatus and SecureFileUpload.
- PurchaseCard and InvoiceDownload.

### UX requirements

- Every page has a route-specific title and heading.
- Every data view has loading, empty, error, permission-denied and retry states.
- Focus is restored after dialogs/drawers close.
- Motion is disabled/reduced when requested by the OS.
- Status meaning never relies on color alone.

## 8. Delivery phases

### Phase 0 — Foundation hardening (2–3 weeks)

- Reconcile current documentation with actual code.
- Normalize API envelopes and errors.
- Add validation, request IDs, structured logs and security middleware.
- Finalize session/token strategy and RBAC resource guards.
- Establish OpenAPI, migrations/index management, CI and test gates.

### Phase 1 — Shell, profile and dashboard (3–4 weeks)

- Responsive student/staff shells.
- Dashboard aggregation API.
- Profile, skills, education, documents and completion score.
- Announcements and notification center.

### Phase 2 — Placement lifecycle (4–6 weeks)

- Employers/jobs and eligibility rule engine.
- Opportunity list/details.
- Applications, transitions, interviews and notifications.
- Staff pipeline and reports.

### Phase 3 — Assessment integration and performance (3–4 weeks)

- Adapt existing assessment UI into the new shell.
- Unified assigned-assessment list.
- Performance aggregation and trainer remarks.
- Regression and load testing of existing secure exam behavior.

### Phase 4 — Classes and mentorship (3–4 weeks)

- Class series/sessions, attendance and signed QR.
- Mentorship cohorts, sessions and feedback.
- Complementary classes.

### Phase 5 — Referral, wallet and KYC (4–6 weeks)

- Versioned referral program and lifecycle.
- Immutable wallet ledger.
- Secure KYC upload/review.
- Encashment maker-checker workflow and reconciliation.

### Phase 6 — Commerce and integrations (4–6 weeks)

- Catalog and hosted payment checkout.
- Webhook processing, invoices and refunds.
- LMS/activity integrations and SSO where approved.

### Phase 7 — Production readiness (2–4 weeks)

- Accessibility audit.
- Threat model and authorized security test.
- Load/soak/failure tests.
- Backup restore and disaster-recovery exercise.
- Privacy/legal review, runbooks, monitoring and release rehearsal.

## 9. Testing strategy

- Unit tests for rule engines, state machines, scoring, ledger calculations and validation.
- API integration tests for authorization, ownership, idempotency, concurrency and transactions.
- Contract tests for payment, email, storage and LMS adapters.
- Playwright E2E for all critical student and staff journeys.
- Accessibility automation plus manual keyboard/screen-reader review.
- Load tests for login/OTP, dashboard, autosave, submissions, career listings and announcements.
- Security tests for IDOR, injection, token/session abuse, OTP abuse, file upload, webhook replay, mass assignment and sensitive-data leakage.

## 10. Definition of done

A module is done only when:

- PRD acceptance criteria pass.
- Server authorization and validation are covered by tests.
- Loading, error, empty and permission states exist.
- Mobile and keyboard workflows pass.
- Audit and notification side effects are verified.
- OpenAPI and operational documentation are current.
- Metrics/logs expose meaningful failure signals without PII.
- Migration, rollback and support procedures are documented.

## 11. Immediate next implementation slice

The best first build slice is:

1. Create the shared authenticated student shell and typed route map.
2. Add `/api/v1/student/dashboard` aggregation using existing student/exam data.
3. Build profile-completion and profile sections without changing existing exam contracts.
4. Add announcement models, staff CRUD and student feed.
5. Add route-title, HTTP-status and error-boundary tests.

This produces a coherent portal foundation before adding jobs, financial data, and external integrations.
