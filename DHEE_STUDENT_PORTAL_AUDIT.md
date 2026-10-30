# Dhee Coding Lab Student Portal — Functional and UI Audit

**Application:** `https://student.dheecodinglab.com`  
**Audit date:** 29 October 2026 (Asia/Calcutta)  
**Scope:** Authenticated, read-only inspection of the supplied student account plus public frontend assets.  
**Method:** Real-browser navigation through visible controls. No form submissions, applications, assessments, KYC uploads, purchases, wallet encashment, profile edits, or authorization/security bypass attempts were performed.

## 1. Executive summary

The product is a responsive student placement and learning portal delivered as a client-side single-page application. It combines placement opportunities, applications and interviews, academic performance, assessments, class scheduling, announcements, referrals, rewards, KYC, purchases, mentorship, and profile management.

The inspected account successfully followed this authentication path:

1. Student email and password.
2. Six-digit email OTP.
3. Redirect to the authenticated student dashboard.

The frontend appears to be a React-style SPA built into hashed JavaScript and CSS assets. Public assets reference separate gateway services for authentication, campus, and placement functions, suggesting API/service separation behind gateway endpoints. The actual backend implementation, database engine, private schemas, deployment platform, and internal service topology cannot be verified from UI inspection alone.

Notable quality issues observed across the application:

- Many successfully rendered pages reported HTTP status `404` to browser tooling.
- Several routes retained a stale title from the previously visited page.
- Console errors accumulated during normal navigation.
- Some icon-only or generic interactive elements lacked meaningful accessible names.
- Personal and financial workflows require stronger visible privacy and security explanations.
- Data states can appear inconsistent, such as an interview marked both pending/available although its date was long past.

## 2. Verified frontend characteristics

### 2.1 Delivery model

- Client-side single-page application with route-based views.
- Hashed production assets, for example an `index-<hash>.js` bundle and `index-<hash>.css` stylesheet.
- Persistent application shell:
  - top header with product identity, a numeric indicator, and profile menu;
  - main content outlet;
  - fixed bottom navigation for Home, Careers, Applications, Performance, and More.
- Route changes generally occur without a full-page visual reload.

### 2.2 Typography

Public CSS explicitly includes:

- `Outfit`
- `Poppins`
- system sans-serif fallbacks
- system monospace fallbacks

The exact font assignment for every component was not mapped, but Outfit and Poppins are verified in the production stylesheet.

### 2.3 Animation and feedback primitives

The production stylesheet contains keyframes or animation rules for:

- dropdown and menu transitions;
- toast entrance/feedback;
- skeleton and skeleton-loading placeholders;
- progress animation;
- spin, pulse, ping, and bounce utilities;
- radio and rating transitions.

Observed UI feedback patterns include toast/status messages, disabled controls, empty states, modal confirmation, carousels, dropdown menus, and loading-more indicators.

### 2.4 Visual design system

The UI consistently uses:

- rounded cards and grouped information panels;
- status badges such as Open, Scheduled, Pending, Matched, Not Matched, Eligible, and Active;
- icon-led metadata rows;
- large section headings with supporting descriptions;
- horizontally scrollable carousels;
- mobile-first bottom navigation;
- drawers/dropdowns for secondary navigation;
- forms with labels, placeholders, required markers, helper text, and disabled dependent fields;
- empty-state illustrations/messages with recovery actions.

## 3. Public and authentication flows

### 3.1 Landing page

The public landing page contains:

- Dhee Coding Lab brand header;
- DCL Portal and Campus Login links;
- hero message and calls to action;
- mobile-app download links;
- impact statistics;
- student success stories carousel;
- upcoming batches carousel;
- career-journey explanation;
- office and contact information;
- social links and footer.

### 3.2 Student sign-in

Route: `/auth/student/signin`

Controls:

- Email Address field.
- Password field and visibility control.
- Forgot password action.
- Sign In button.
- Back To Home action.
- Contact Support link.

Flow:

1. Submit valid email/password.
2. Navigate to verification route with role and email query parameters.
3. Enter six individual OTP characters.
4. Verify Code.
5. On success, redirect to `/student` with a success status notification.

### 3.3 OTP verification

Controls and behavior:

- six separate character inputs;
- masked destination email;
- resend countdown;
- Verify Code action;
- Back to Home action;
- success status notification after verification.

### 3.4 Campus login

Route: `/auth/campus/student/public/signin`

It provides email/password sign-in, forgot password, registration, Back To Home, and Contact Support. It is separate from the regular DCL student sign-in.

### 3.5 Logout

Flow:

1. Open profile menu.
2. Select Logout.
3. Confirm in a modal with Cancel and Logout actions.
4. Redirect to the student sign-in page.
5. Show an account-logged-out success notification.

## 4. Global authenticated navigation

### Header

- Brand/logo: visually identifies the portal and appears interactive.
- Numeric indicator: displayed as `0` during inspection; its purpose was not labelled clearly.
- Profile button: opens account information and account actions.

### Bottom navigation

- Home
- Careers
- Applications
- Performance
- More

The active destination is visually identified.

### More drawer

Contains:

- Home
- Careers
- Applications
- Performance
- Refer & Earn
- Tests
- Complementary Classes
- Mentorship

The drawer has an “All Menu” heading and an icon-only close button.

## 5. Home dashboard

Route: `/student`

### Welcome panel

- Personalized welcome heading.
- “Hours In DCL” metric.
- View Announcements action.

### Latest Career Opportunities

- Horizontal carousel.
- Previous/next controls with disabled state at the start.
- Cards show recency, company/logo, role, salary/package, and technology stacks.
- Clicking a card opens its job-detail page.

### LMS promotion

Describes:

- course modules;
- live coding labs;
- progress synchronization.

`Launch LMS` is intended to open the learning system. It was not activated because it can leave the inspected application and may create an external authenticated session.

### Dhee-Fun promotion

Describes activities, hackathons, and leaderboards. `Explore Dhee-Fun` was not activated because it may transfer the session to another product.

### Upcoming Interviews

- Shows upcoming interview cards when available.
- Inspected state displayed “No Upcoming Interviews.”
- Browse Opportunities redirects toward career listings.

### Scheduled Classes

Cards contain:

- class/topic;
- trainer;
- time;
- room;
- location/branch;
- status;
- View action.

A clock visualization shows the scheduled interval and live local date/time.

### Achiever stories

- Horizontal testimonial carousel.
- Placement role, package, college, branch/stack, and excerpt.
- Read more actions reveal longer testimonials.
- Left/right carousel controls.

## 6. Announcements

Route: `/student/announcement`

Features:

- total announcement count;
- cards with title, preview, author area, and posted time;
- Expand action per announcement;
- rich-text content with emphasis and external links;
- Load More pagination/infinite-load behavior;
- loading state.

Content categories observed include holidays, class cancellations, learning resources, LMS instructions, and hiring alerts.

## 7. Careers and job descriptions

### 7.1 Opportunity list

Route: `/student/v2/jd-list`

Features:

- View My Applications action.
- Open JDs filter/action.
- opportunity cards showing status, recency, role, company identifier, location, salary, and eligible stacks;
- continued loading at the bottom;
- card click opens full details.

### 7.2 Job detail

Observed route pattern: `/student/jd/v2/details?id=<job-id>`

Sections:

- registration status;
- role and company;
- location and compensation;
- tentative interview window;
- registration deadline;
- required skills;
- qualification, stack, stream, passing year, gender, academic percentages, backlog/gap rules, salary, and bond details;
- interview rounds;
- roles and responsibilities;
- disclaimer/important note;
- Profile vs Job Requirement Match.

### 7.3 Eligibility engine behavior

The detail page compares the student profile with the job requirements and reports individual states for:

- gender;
- stack;
- qualification;
- stream;
- passing year;
- 10th, 12th, and graduation percentages;
- skills matched;
- academic gap;
- backlogs.

The result controls whether the student can apply. In the inspected example, the page displayed “Not Eligible to Apply” and explained the failed skill match. It also stated that placement administrators control selection for skill-based jobs.

No application was submitted during this audit.

## 8. Applications and interviews

### 8.1 My Applications

Route: `/student/applications`

Features:

- submitted-application count;
- Interviews shortcut;
- summary cards for total, ongoing, rejected, schedule pending, and selected;
- search by role, company, or ID;
- application cards containing role, company, state, application ID, company JD ID, applied date, current round, and round status;
- View Details affordance.

### 8.2 My Interviews

Route: `/student/interviews`

Features:

- scheduled-interview count;
- round name;
- company and role;
- status/availability badges;
- date and relative time;
- time;
- location;
- interview mode;
- company ID.

Observed inconsistency: the inspected interview was dated far in the past but still appeared as Pending and Available. The product should define and enforce expiry/state-transition rules.

## 9. Performance

Route: `/student/v2/myperformance`

Purpose: tracks progress and test results.

Observed organization:

- results grouped by technology/topic;
- number of tests per topic;
- test type and title;
- score;
- test date;
- test name;
- attendance status;
- trainer remarks or an explicit no-remarks state.

The inspected account showed mock-test results for Front-End and React JS.

## 10. Assessments / Tests

Route: `/student/tests`

Features:

- My Assessments heading and assigned-test count/state;
- All Tests filter menu;
- status filters:
  - All Tests
  - Invited
  - In Progress
  - Submitted
  - Auto Submitted
  - Disqualified
- empty state when no assessments are assigned.

No assessment was started. Consequently, question navigation, timers, autosave, proctoring, submission, and scoring flows were not inspected.

## 11. Refer & Earn

Route: `/student/referral`

### Reward dashboard

- current Dhee Coin value and live/update label;
- reward per successful referral;
- referred friend discount;
- total referrals;
- coins earned;
- coins per referral and approximate currency value.

### Process explanation

1. Fill referral form.
2. Referred student completes enrollment/admission.
3. Referrer receives coins and friend receives a discount.

### Encashment explanation

1. Complete KYC.
2. Open Dhee Wallet.
3. Request encashment.
4. Team verifies and credits the bank account, advertised as within 48 hours.

### Referral form

Fields:

- friend name;
- friend email;
- friend mobile;
- branch;
- interested program, disabled until branch is selected;
- college/university;
- Submit Referral.

The page also presents terms on proportional reward credit, duplicate/self-referral exclusion, KYC, and program changes. No referral was submitted.

## 12. Dhee Wallet

Route: `/student/wallet`

Features:

- available coin balance;
- approximate currency value;
- active-status badge;
- conversion rate;
- Encash Coins action, disabled when unavailable;
- Go to Refer & Earn link;
- explanation of earning and using coins;
- transaction count and history;
- empty state and Start Earning Coins link.

The inspected account had no wallet transactions. No encashment was attempted.

## 13. KYC

Route: `/student/complete-kyc`

Purpose: bank-detail verification for wallet/cash functions.

Fields and controls:

- bank account number;
- account-holder name;
- phone number;
- IFSC code;
- bank branch;
- passbook/cancelled-cheque upload;
- accepted JPEG, PNG, or PDF with a displayed 1 MB limit;
- Cancel;
- Submit KYC.

The page says details must match bank records and verification takes approximately 24–48 hours. No values or documents were entered.

## 14. Profile

Route: `/student/profile`

The profile page contains:

- profile image and completion percentage;
- student identifier, primary stack, and batch;
- My QR action;
- editable Personal Information;
- editable Bio;
- Professional Profile links for GitHub, LinkedIn, and resume;
- editable General Information;
- editable Key Skills;
- Education Information;
- additional academic information.

Education is presented as a restricted-update area: the UI warns that it can only be updated once and further changes require administrator help.

This report intentionally omits personal phone numbers, date of birth, family contact details, full education records, and other private values encountered during inspection.

## 15. Purchases

Route: `/student/purchase`

Features:

- purchase-history heading;
- empty state when no purchases exist;
- Browse Courses action.

Browse Courses was not activated because it could start an external or commercial purchase flow.

## 16. Complementary Classes

Route: `/student/complementary-classes`

Purpose: special cohorts and customized sessions.

The inspected account was not enrolled. The empty state explains that a Student Admin assigns these classes when scheduled.

## 17. Mentorship

Route: `/student/mentorship-batch`

Features:

- Back action;
- Scan QR action;
- mentorship-batch assignment state;
- Attendance Schedules section and count;
- Your Feedbacks section and count.

The inspected account had no assigned mentorship batch, attendance records, or feedback. QR scanning was not activated because it may request camera access or record attendance.

## 18. Observed architecture

### 18.1 Frontend

Verified or strongly supported by public assets and behavior:

- component-oriented SPA;
- client-side routing;
- shared authenticated shell;
- reusable cards, badges, drawers, dropdowns, forms, empty states, carousels, and status feedback;
- role-specific authentication routes;
- asynchronous API-driven data loading;
- public production bundles and CSS.

### 18.2 API/service organization

Public frontend assets reference gateway services for:

- general API/authentication;
- campus functions;
- placement functions.

This is consistent with a gateway plus domain-service architecture, but it does **not** prove that the backend is implemented as independent microservices. Source code or architecture documentation is required for confirmation.

### 18.3 Authentication and authorization

Observed controls:

- email/password authentication;
- email OTP second step;
- protected student routes;
- logout with confirmation;
- role parameter in verification flow;
- server-driven eligibility and access states;
- disabled controls for unavailable actions.

Not verifiable from UI alone:

- password hashing algorithm;
- session/token storage strategy;
- cookie flags;
- token expiry/rotation;
- CSRF controls;
- OTP hashing, expiry, attempt limit, or replay protection;
- server-side authorization enforcement;
- encryption at rest;
- audit logs and administrative monitoring.

### 18.4 Database

No database engine or private schema was exposed by the inspected UI. A likely **domain model**, not a verified database schema, includes:

- Student
- Batch / Branch / Course or Stack
- Profile / Skills / Education / Resume
- Job Description / Eligibility Rules
- Application / Application Round
- Interview Schedule
- Assessment / Invitation / Attempt / Result
- Mock Test / Trainer Remark
- Class Schedule / Attendance
- Announcement
- Referral / Reward Rule
- Wallet / Wallet Transaction / Encashment Request
- KYC / Bank Details / Verification Status
- Purchase / Course Offering
- Mentorship Batch / Feedback

Exact tables or collections, keys, indexes, constraints, tenancy rules, retention policies, and relations require backend source, migrations, or approved database documentation.

## 19. UX, accessibility, and quality findings

### High priority

1. **Incorrect HTTP status behavior**  
   Authenticated and public pages rendered successfully while browser tooling reported HTTP `404`. This can harm SEO, monitoring, caching, link previews, and automated testing. Configure SPA fallback so valid routes return `200`, while unknown routes return a genuine `404`.

2. **Stale document titles**  
   Several routes retained a title belonging to a previous page. Every route should set a correct, stable title.

3. **Console errors during normal use**  
   Errors increased while navigating ordinary pages. Investigate runtime errors, failed requests, missing assets, and noisy exception handling.

4. **Sensitive-data workflows need explicit safeguards**  
   KYC collects bank details and identity evidence. The UI should visibly provide privacy purpose, controller/contact, retention period, consent/legal basis, encryption/upload handling, and deletion/correction paths.

### Medium priority

5. **Accessible naming**  
   Some icon-only buttons and generic clickable containers lacked descriptive names. Add semantic buttons/links, accessible labels, focus indicators, and keyboard handling.

6. **State consistency**  
   Past interviews should not remain available/pending unless the product intentionally supports late completion. Define a state machine with server-controlled transitions.

7. **Navigation semantics**  
   Several navigation controls are buttons although they represent destinations. Links with real `href` values improve accessibility, browser behavior, and discoverability.

8. **Financial-language consistency**  
   Wallet copy mentions coins being redeemed for certificates, courses, benefits, and cash. Terms, conversion rules, expiry, taxes, fees, approval states, and dispute handling should be centralized and versioned.

9. **Form validation visibility**  
   Required formats should be stated before submission. Bank and referral fields should provide inline validation, error summaries, and server-side validation equivalents.

### Lower priority

10. **Naming consistency**  
    Standardize capitalization and wording such as KYC/Kyc, JD/Jds, Dhee-Fun, and “My Purchase” versus “My Purchases.”

11. **Empty-state next steps**  
    Empty states are generally good, but each should offer a safe, relevant next action or support path.

12. **Large content pages**  
    Long profile, referral, and announcement pages would benefit from section navigation, accordions, or sticky anchors.

## 20. Recommended test plan

### Authentication

- valid and invalid password;
- malformed/unknown email;
- expired, incorrect, reused, and rate-limited OTP;
- resend behavior and countdown;
- session expiry;
- multi-device logout;
- direct access to protected routes while signed out.

### Authorization

- student cannot access another student’s profile, applications, wallet, KYC, tests, or interviews;
- student cannot perform admin-only selection or class assignment;
- route and API checks both enforce the same permissions;
- identifiers in URLs cannot be changed to expose another record.

### Careers and applications

- filters, pagination, and infinite loading;
- eligibility boundary conditions;
- deadline expiry;
- duplicate applications;
- job closure during application;
- round-state transitions;
- search behavior and no-result states.

### Assessments

- invitation and start windows;
- timer behavior and clock synchronization;
- autosave and reconnect;
- submission and auto-submission;
- disqualification rules;
- duplicate tabs/devices;
- accessibility and keyboard-only completion.

### Wallet, referral, and KYC

- duplicate referrals;
- referral status progression;
- reward calculations and rounding;
- conversion-rate changes;
- concurrent encashment requests;
- insufficient balance;
- KYC rejection/resubmission;
- upload type, size, malware scanning, and storage controls;
- immutable transaction ledger and reconciliation.

### UI and accessibility

- mobile, tablet, desktop, zoom, and orientation;
- keyboard navigation and focus order;
- screen-reader labels;
- color contrast and non-color status cues;
- reduced-motion preference;
- loading, offline, timeout, and server-error states;
- route titles, HTTP statuses, and deep-link refreshes.

## 21. Audit limitations

- This was a UI-level, read-only functional review of one student account.
- Destructive, commercial, financial, identity, attendance, assessment, and application actions were intentionally excluded.
- LMS, Dhee-Fun, external links, QR scanning, purchases, and assessment execution were not entered.
- Backend code, infrastructure, private API specifications, administrative portal, database, and logs were unavailable.
- Database and backend internals therefore must not be inferred as facts from this report.
- Values and available modules may differ for other roles, branches, batches, or account states.

## 22. Conclusion

The portal has broad functional coverage and a coherent student-centered navigation model. Its strongest areas are the unified dashboard, job eligibility comparison, placement lifecycle visibility, reusable empty states, and integration of learning, placements, rewards, and student support. The most important engineering improvements are correct HTTP routing/status behavior, route-specific metadata, removal of console errors, stronger accessibility semantics, explicit privacy controls for KYC, and stricter lifecycle consistency for time-sensitive records.
