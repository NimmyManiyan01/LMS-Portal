# CareerOS — End-to-End Product Flows

This document complements `CAREER_PORTAL_PRD_V2.md`. Mermaid diagrams are logical flows; every permission and transition must also be enforced by the API.

## 1. Platform map

```mermaid
flowchart TD
  Public[Public site] --> Auth[Authentication]
  Auth --> Student[Student portal]
  Auth --> Staff[Staff portal]
  Student --> Home[Home and notifications]
  Student --> Careers[Careers and applications]
  Student --> Exams[Assessments]
  Student --> Learning[Classes and performance]
  Student --> Engage[Mentorship and referrals]
  Student --> Account[Profile, KYC, wallet, purchases]
  Staff --> Ops[Operations dashboard]
  Staff --> Placement[Placement operations]
  Staff --> Assessment[Assessment administration]
  Staff --> Academic[Class and mentorship operations]
  Staff --> Finance[Referral, KYC and payout operations]
  Staff --> Governance[Audit, reports and settings]
```

## 2. Authentication

```mermaid
sequenceDiagram
  actor U as User
  participant W as Web app
  participant A as Auth API
  participant E as Email service
  U->>W: Enter email and password
  W->>A: POST /auth/login
  A->>A: Validate, rate-limit, verify password and account
  alt OTP required
    A->>E: Send short-lived OTP
    A-->>W: otp_challenge_id
    U->>W: Enter OTP
    W->>A: POST /auth/otp/verify
    A->>A: Verify expiry, attempts and replay
  end
  A-->>W: Access token + secure refresh cookie
  W->>A: GET /student/dashboard
  A-->>W: Authorized dashboard
```

## 3. Job discovery and application

```mermaid
flowchart TD
  A[Browse open jobs] --> B[Open job detail]
  B --> C[Server evaluates eligibility]
  C -->|Eligible| D[Show matched criteria and Apply]
  C -->|Missing data| E[Show required profile updates]
  C -->|Not eligible| F[Show criterion-level reason]
  D --> G[Confirm application]
  G --> H[Idempotent application creation]
  H --> I[Receipt and timeline]
  I --> J[Coordinator screening]
  J --> K{Outcome}
  K -->|Shortlisted| L[Assessment/interview rounds]
  K -->|Rejected| M[Closed with permitted reason]
  L --> N[Offer or selection]
```

## 4. Assessment lifecycle

```mermaid
flowchart LR
  Draft --> Scheduled
  Scheduled --> Open
  Open --> Paused
  Paused --> Open
  Open --> Closed
  Closed --> Published[Results Published]
```

```mermaid
sequenceDiagram
  actor S as Student
  participant W as Exam UI
  participant API as Assessment API
  participant J as Timeout worker
  S->>W: Open assigned assessment
  W->>API: Request eligibility and instructions
  API-->>W: Server-authoritative availability
  S->>W: Confirm readiness
  W->>API: Idempotent start
  API-->>W: Paper snapshot, server time, deadline
  loop During attempt
    S->>W: Answer or mark for review
    W->>API: Autosave answer
    W->>API: Heartbeat and integrity events
  end
  alt Student submits
    W->>API: Idempotent submit
  else Deadline expires
    J->>API: Finalize expired attempt
  end
  API->>API: Score using immutable paper
  API-->>W: Receipt; result only if visible
```

## 5. Interview scheduling

```mermaid
flowchart TD
  A[Coordinator creates round] --> B[Schedule candidate]
  B --> C[Validate timezone, conflicts and future date]
  C --> D[Notify student]
  D --> E[Student views details / adds calendar event]
  E --> F{Event outcome}
  F -->|Attended| G[Complete and record result]
  F -->|Missed| H[Mark missed]
  F -->|Changed| I[Cancel or reschedule]
  I --> C
  G --> J[Advance, reject, offer or select]
```

## 6. Announcement flow

```mermaid
flowchart LR
  Draft --> Target[Choose audiences]
  Target --> Preview
  Preview --> Schedule[Publish now or schedule]
  Schedule --> Delivery[In-app and configured channels]
  Delivery --> Read[Read tracking]
  Delivery --> Ack[Acknowledgment when required]
  Schedule --> Expired[Automatic expiry/archive]
```

## 7. Class and attendance flow

```mermaid
flowchart TD
  A[Create recurring or one-off class] --> B[Assign batch and trainer]
  B --> C[Publish schedule]
  C --> D[Student sees upcoming class]
  D --> E{Attendance method}
  E -->|Trainer marks| F[Attendance record]
  E -->|Signed QR| G[Validate student, time, nonce and policy]
  G --> F
  F --> H[Trainer review]
  H --> I[Correction only with reason and audit]
```

## 8. Referral, reward and encashment

```mermaid
flowchart TD
  A[Student submits referral with consent] --> B[Duplicate/self-referral checks]
  B --> C[Staff qualification]
  C --> D[Enrollment and verified payments]
  D --> E[Reward rule engine]
  E --> F[Immutable wallet credit]
  F --> G{Student requests encashment}
  G -->|KYC not approved| H[Complete/review KYC]
  H --> G
  G -->|Eligible| I[Reserve balance]
  I --> J[Maker-checker payout approval]
  J --> K[Payout provider]
  K --> L[Reconcile and post debit]
  K -->|Failure| M[Release reservation / retry]
```

## 9. KYC

```mermaid
stateDiagram-v2
  [*] --> NotStarted
  NotStarted --> Submitted
  Submitted --> InReview
  InReview --> Approved
  InReview --> Rejected
  InReview --> ResubmissionRequired
  ResubmissionRequired --> Submitted
  Approved --> Expired
  Expired --> Submitted
```

## 10. Purchase flow

```mermaid
sequenceDiagram
  actor S as Student
  participant W as Portal
  participant P as Payment provider
  participant API as Purchase API
  S->>W: Select course/product
  W->>API: Create idempotent checkout
  API-->>W: Hosted checkout URL
  W->>P: Redirect to provider
  P-->>API: Signed payment webhook
  API->>API: Verify signature, amount and idempotency
  API->>API: Post purchase and invoice
  API-->>W: Paid/pending/failed state
```

## 11. Navigation rules

- Main student navigation is stable across authenticated pages.
- Active route is visually and programmatically identified.
- Secondary destinations live in a labelled More drawer.
- Account, security, KYC, wallet, purchase history and logout live in the profile menu.
- Destination controls use links; mutation controls use buttons.
- Browser back/forward and deep-link refresh must preserve a valid route and correct document title.

