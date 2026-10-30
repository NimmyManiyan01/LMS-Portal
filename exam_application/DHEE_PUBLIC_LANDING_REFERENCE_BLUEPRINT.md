# Public Landing Page Reference Study and KGS Implementation Blueprint

**Reference reviewed:** `https://dheecodinglab.com/`  
**Review date:** 29 October 2026  
**Purpose:** Document the complete public-page experience and translate its structural strengths into an original KGS landing page.  
**Important:** Reuse the interaction principles and information architecture, not Dhee Coding Lab’s brand, copy, artwork, student stories, company marks, photographs, or source code.

## 1. Executive summary

The reference page is a long-form, highly visual education-and-career marketing page. Its core narrative is:

`Confused student → guided learning journey → skills and projects → interview readiness → placement → career growth`

It uses a bright white canvas, orange highlights, oversized hero artwork, a compact sticky navigation bar, alternating marketing sections, card grids, horizontally moving content, office galleries, partner logos, and a dark information-rich footer. The most distinctive interaction is the hero “journey clock”: multiple milestone buttons switch the hero illustration and copy while an animated path visually connects learning to employment.

The KGS version should preserve this narrative clarity but reposition it around secure assessment and career readiness:

`Register → verify → prepare → take secure assessment → receive results → improve → reach opportunities`

## 2. Verified technical characteristics

- Framework: Next.js production application, evidenced by `/_next/static/...` assets.
- Client-side interactive sections.
- Animation techniques found in the public production bundle:
  - GSAP;
  - `IntersectionObserver` for viewport-triggered behavior;
  - `requestAnimationFrame`;
  - timed intervals and autoplay behavior.
- CSS animation utilities include bounce, ping, and pulse.
- Verified font stack: `Outfit, Inter, Manrope, sans-serif`.
- Images are primarily optimized WebP assets, with PNG/SVG used for logos and some illustrations.
- The page includes floating WhatsApp and help controls.
- The page uses skeleton placeholders for delayed success-story and partner content.

## 3. Complete page anatomy

### 3.1 Global header

#### Structure

- Thin white navigation bar across the viewport.
- Brand mark and name aligned left.
- Center/right navigation links:
  - Home
  - Programs
  - About Us
  - Student Portal
  - Online Learning
  - Success Stories
  - New Batches
- High-emphasis orange “Enroll Now” button on the far right.

#### Behavior

- Header remains visually compact so the hero retains maximum height.
- Active Home item uses orange text/underline emphasis.
- Programs and Online Learning use same-page anchors.
- Other destinations use dedicated routes or an external student portal.
- Primary CTA has stronger contrast and rounded corners.

#### KGS translation

- Brand: KGS Exam Portal.
- Navigation: Home, How It Works, Security, For Institutions, Candidate Journey, Policies.
- Actions: Candidate Login, Admin Login, Request Demo.
- On mobile, collapse navigation into an accessible drawer with focus trapping.

### 3.2 Hero journey experience

#### Layout

- Near full-width hero occupying roughly one desktop viewport below the header.
- Large illustrated environment fills the entire section.
- Left-aligned copy block sits in open negative space.
- A simulated placement dashboard appears inside the artwork on the right.
- A horizontal journey controller floats near the bottom.
- Floating “Apply for Jobs” pill appears near the upper-right edge.

#### Copy hierarchy

- Small uppercase eyebrow: “Learn • Practice • Build • Grow.”
- Large three-line headline with one orange accent word.
- One short explanatory paragraph.
- Orange primary CTA.

#### Journey controller

Twelve milestone buttons form a progression:

1. Confused
2. Discover DCL
3. Counselling
4. Learn Skills
5. Practice Coding
6. Build Projects
7. Clarify Doubts
8. Communication
9. Apply for Jobs
10. Face Interviews
11. Placed
12. Build a Career

Each milestone is represented by a circular icon, short label, connecting line/path, and active state. Selecting a milestone changes the hero content/illustration. The production bundle contains many layered journey images and overlays, confirming that stages are composed from separate artwork rather than a single static background.

#### Motion

- Stage switching is animated with GSAP.
- Layered images enter/exit or reveal progressively.
- Active milestone is emphasized.
- Some supporting assets use pulse/ping/bounce animation.
- Auto-advance behavior is present, with user selection overriding the current state.

#### Responsive behavior

- Desktop uses a wide illustrated scene and horizontal controller.
- Mobile should not squeeze twelve labels into one row. Use a horizontally scrollable stepper, condensed progress indicator, or swipeable stage cards.
- Respect reduced-motion preferences by replacing transitions with immediate state changes.

#### KGS translation

Use an original seven-stage assessment journey:

1. Create Profile
2. Verify Identity
3. Check System
4. Read Instructions
5. Take Assessment
6. Submit Securely
7. View Published Results

The illustration can show a candidate desk, system-check panel, exam navigator, monitoring indicators, and results card. Do not copy the reference artwork.

### 3.3 Motto band

- Large centered uppercase phrase: “Dream Believe Achieve.”
- Generous white space above and below.
- Orange text with wide tracking.
- Acts as a visual pause after the busy hero.

#### KGS translation

Use a concise original line such as:

> Prepare Fairly. Perform Confidently. Progress Clearly.

### 3.4 Corporate-reality feature

#### Layout

- Wide image card with rounded top corners.
- Warm translucent overlay on a city/corporate visual.
- Left-aligned section title with highlighted keyword.
- Four numeric metrics in a row.
- Circular play-video control below the metrics.
- Human silhouettes provide an aspirational career direction.

#### Motion and data

- Metrics are designed as animated counters; the accessibility snapshot briefly captured zero values before animation/data completion.
- Video button suggests a modal or embedded story.
- Section likely reveals on intersection.

#### KGS translation

Use “From Assessment to Opportunity” with verified, non-inflated metrics:

- assessments delivered;
- active institutions;
- candidates evaluated;
- reports generated.

If no real metrics are approved, use product capabilities instead of fabricated numbers.

### 3.5 Success stories

#### Layout

- Centered title with decorative braces.
- “View More” link aligned to the right.
- Three large cards on desktop.
- Cards include portrait, name, role, salary/package, technology, college, testimonial excerpt, and class year when data has loaded.
- Skeleton placeholders are shown while content is requested.

#### Motion

- Horizontal carousel or controlled slider.
- Skeleton shimmer/loading state.
- Story cards likely animate into view.

#### KGS translation

Use “Candidate Outcomes” only with permission and verified claims. Alternative: display anonymized institutional case studies such as completion-rate improvement, reduced administration time, or successful large-batch delivery.

### 3.6 Programs section

#### Layout

- Centered section title with short decorative lines.
- Five equal cards on desktop.
- Each card contains:
  - program icon/illustration;
  - program name;
  - duration;
  - difficulty range;
  - outlined Explore button.
- Very light borders and shadows keep the section airy.

#### Programs observed

- Java Development
- Python with Data Science
- Python Full Stack with GenAI
- MERN Full Stack with Cloud & DevOps
- Software Testing

#### KGS translation

Replace Programs with “Assessment Solutions”:

- Campus Hiring Tests
- Technical Screening
- Academic Examinations
- Certification Assessments
- Custom Question Banks

Each card should link to an original solution detail page or reveal additional information.

### 3.7 Development centers

#### Layout

- Centered coded/braced title.
- Compact meta line: branch count, mission, and online contact.
- Three equal branch cards.
- Each card contains:
  - large office image;
  - branch name/location pin;
  - postal address;
  - five-image thumbnail gallery;
  - phone and email actions.
- Clicking the branch title opens Google Maps.
- Clicking thumbnails opens an image gallery/lightbox.

#### KGS translation

If KGS has physical centers, build Institution/Center cards with original photography. Otherwise use:

- deployment regions;
- support coverage;
- remote/on-site delivery modes;
- contact and demo scheduling.

Do not add fictional offices.

### 3.8 Online-learning promotion

#### Layout

- Full-width light section with substantial vertical spacing.
- Large centered headline with orange accent phrase.
- Short explanatory paragraph.
- Outlined “View Courses” CTA.
- Four benefits arranged horizontally beneath it.
- Pale city skyline illustration anchors the bottom edge.

#### Benefit pattern

- Circular line icon.
- Two-line short label.
- Orange accent word.

#### KGS translation

Use “One Connected Assessment Workspace” with four benefits:

- Secure candidate identity
- Configurable exam delivery
- Real-time operational visibility
- Auditable results and reports

Use an original abstract campus/data illustration rather than the same skyline.

### 3.9 Hiring partners marquee

#### Layout

- Centered heading and subheading.
- Multiple horizontal rows of employer logos.
- Logos sit inside pale cards with consistent size and spacing.
- Rows extend past the viewport, creating a marquee effect.

#### Motion

- Continuous horizontal movement in alternating directions.
- Duplicate logo arrays create a seamless loop.
- Movement should pause on hover/focus and stop under reduced-motion preference.

#### Legal/content requirement

Only display partner logos with permission. The KGS page should use approved institution/client logos or generic anonymized cards until permissions exist.

### 3.10 Closing statement

- Large centered motivational statement.
- Two-line hierarchy.
- Neutral dark text with orange-highlighted second phrase.
- Large amount of surrounding whitespace before the footer.

#### KGS translation

Suggested original statement:

> Build Trust Into Every Assessment. Turn Results Into Better Decisions.

### 3.11 Footer

#### Layout

- Dark navy background with orange accents.
- Multi-column desktop grid.
- Left column: logo, portal descriptor, short mission, social buttons, quick links.
- Middle/right columns: three branch/contact groups and working hours.
- Divider line.
- App-download strip with App Store and Google Play badges.
- Bottom legal row with copyright and short brand statement.

#### KGS translation

Recommended footer columns:

- Product: features, workflow, security, assessment types.
- Resources: documentation, support, system status.
- Legal: privacy, terms, monitoring policy, accessibility.
- Contact: email, support hours, institution inquiry.
- Candidate/Admin login links.

Exclude app-store badges unless native applications actually exist.

### 3.12 Floating utilities

- WhatsApp contact control floats near the right edge.
- Branded help assistant button floats at the lower right.
- Both remain available across scroll positions.

#### KGS translation

- Use one consolidated help control to avoid clutter.
- Provide accessible name, keyboard activation, focus style, close/minimize behavior, and privacy notice before starting third-party chat.

### 3.13 Welcome modal

The homepage initially opens a branded welcome dialog containing:

- close action;
- aspirational headline;
- five emphasized qualities;
- explanatory copy;
- invitation to explore the site.

#### KGS recommendation

Avoid an automatic marketing modal unless analytics prove it helps. It obstructs the hero and creates accessibility/focus complexity. Prefer a dismissible announcement banner. If a modal is used:

- show once per campaign;
- store dismissal consent appropriately;
- trap focus;
- close with Escape;
- restore focus to the triggering context;
- never block urgent exam access.

## 4. Visual design language

### Color

- Dominant canvas: white/off-white.
- Primary accent: vivid orange/coral.
- Secondary text: charcoal and muted gray.
- Footer: very dark navy.
- Status/communication accents: green for WhatsApp/success.

### Typography

- Verified stack: Outfit, Inter, Manrope, sans-serif.
- Headings are bold, compact, and rounded/geometric.
- Body copy uses lighter weights and short line lengths.
- Uppercase labels use wide tracking.

### Spacing

- Desktop content is centered in a wide max-width container.
- Hero is nearly edge-to-edge.
- Sections alternate dense card grids with large breathing spaces.
- Major section separation is approximately 80–140 CSS pixels on desktop.
- Cards generally use 16–28 pixel padding and moderate corner radii.

### Shape and elevation

- Rounded rectangles for cards and buttons.
- Thin low-contrast borders.
- Soft diffuse shadows rather than hard outlines.
- Circular icon containers and milestone nodes.
- Orange highlight strokes/underlines.

### Image direction

- High-quality aspirational scenes.
- Illustrated or composited career journey hero.
- Large photographic feature image.
- Office photography plus thumbnail galleries.
- Brand/client logos normalized into repeated cards.

KGS must generate or commission original imagery. Do not download or reuse the reference assets.

## 5. Motion specification for KGS

### Principles

- Motion explains progression; it should not be decorative noise.
- Maximum routine transition duration: 150–500 ms.
- Hero stage transition may use 700–1,000 ms when layered.
- Avoid layout shifts while images and dynamic data load.
- All autoplay sections pause on interaction.
- Honor `prefers-reduced-motion`.

### Recommended motion map

| Element | Motion | Trigger |
|---|---|---|
| Header | subtle shadow/background change | scroll |
| Hero copy | fade + 12 px upward motion | initial load |
| Hero illustration layers | masked reveal/parallax | stage change |
| Journey stepper | progress-line interpolation | stage change |
| Metrics | number count-up | first viewport entry |
| Cards | staggered fade/translate | viewport entry |
| Carousels | snap/slide | user controls/autoplay |
| Logo marquee | continuous linear translation | running, pause on hover |
| CTA | 1–2 px lift and shadow increase | hover/focus |
| Skeletons | low-contrast shimmer | loading only |

## 6. Responsive layout specification

### Desktop ≥ 1200 px

- Full navigation visible.
- Hero copy and illustration share the viewport.
- Horizontal journey control.
- Five solution cards per row.
- Three center/location cards.
- Three testimonial cards.
- Multi-column footer.

### Tablet 768–1199 px

- Condensed navigation or drawer.
- Hero becomes a 55/45 or stacked layout depending on artwork.
- Journey stepper becomes horizontally scrollable.
- Cards use two or three columns.
- Footer uses two columns.

### Mobile < 768 px

- Accessible navigation drawer.
- Hero copy first; illustration below or used as a restrained background.
- Primary actions become full-width or two stacked buttons.
- Journey becomes a swipeable single-stage card with progress dots.
- All card grids become one column.
- Disable continuous marquees or make them manually scrollable.
- Footer becomes accordions or stacked sections.
- Floating help control must not cover primary actions.

## 7. Original KGS page structure

Recommended final order:

1. Header
2. Secure assessment journey hero
3. Trust statement band
4. Product impact/capability feature
5. Candidate/institution outcomes
6. Assessment solution cards
7. Interactive candidate journey
8. Security and proctoring demonstration
9. Platform operations workflow
10. Institution/client proof
11. Final CTA
12. Footer

This order works better for KGS than directly reproducing training programs, branches, and online-learning sections.

## 8. Component architecture

```text
LandingPage
├── SiteHeader
│   ├── Brand
│   ├── DesktopNavigation
│   └── MobileNavigationDrawer
├── AssessmentJourneyHero
│   ├── HeroCopy
│   ├── JourneyArtwork
│   ├── JourneyStageStepper
│   └── HeroActions
├── TrustStatement
├── ImpactSection
│   ├── MetricCard[]
│   └── ProductVideoDialog
├── OutcomeStories
│   ├── StoryCarousel
│   └── StoryCard[]
├── SolutionGrid
│   └── SolutionCard[]
├── CandidateJourney
├── SecurityDemo
├── OperationsWorkflow
├── TrustedInstitutionsMarquee
├── FinalCallToAction
├── SiteFooter
└── HelpLauncher
```

Refactor the current large KGS `LandingPage.tsx` into these components rather than adding more code to the existing single file.

## 9. Content requirements

Before implementation, obtain:

- approved KGS logo variants;
- final tagline and value proposition;
- accurate platform metrics or permission to omit metrics;
- original hero illustration/photo;
- approved candidate/institution stories;
- approved institution logos;
- product support email and hours;
- final privacy, terms, monitoring, and accessibility URLs;
- request-demo destination;
- confirmation of whether public registration is allowed.

No placeholder statistic, partner logo, testimonial, or security claim should ship to production.

## 10. Accessibility requirements

- One visible `h1`; logical heading hierarchy thereafter.
- Skip link to main content.
- Semantic links for navigation and buttons for actions.
- Keyboard-operable carousels, galleries, drawers, dialogs, and journey stepper.
- Visible focus styles.
- Alternative text describes the purpose of meaningful images.
- Decorative images use empty alternative text or CSS backgrounds.
- Autoplay movement has pause controls.
- Dialog focus trap, Escape close, and focus restoration.
- Minimum WCAG 2.2 AA contrast.
- Touch targets at least 44 × 44 CSS pixels.
- Reduced-motion mode removes marquee and parallax motion.

## 11. Performance requirements

- Target LCP under 2.5 seconds on a mid-range mobile connection.
- Serve responsive AVIF/WebP with explicit dimensions.
- Preload only the first hero image and critical font subset.
- Lazy-load below-fold images and galleries.
- Use static HTML for primary marketing copy.
- Do not load GSAP or a large animation runtime for simple fades.
- Dynamically load video, gallery, chat, and help widgets.
- Prevent cumulative layout shift with fixed aspect-ratio containers.
- Skeletons must match final content dimensions.

## 12. SEO and metadata

- Original title and description for KGS.
- Canonical URL.
- Open Graph and social preview image.
- Organization, WebSite, FAQ, and Product structured data only where truthful.
- Crawlable static headings and copy.
- Correct `200` responses for valid routes and true `404` for unknown paths.
- Sitemap, robots configuration, favicon set, and manifest.
- Avoid unsupported superlatives such as “best,” “tamper-proof,” or “AI-resistant.”

## 13. Implementation plan

### Phase 1 — Foundations

- Split the current landing page into components.
- Repair encoding issues.
- Define tokens in `index.css` rather than a large embedded style string.
- Implement header, footer, accessibility landmarks, and mobile drawer.

### Phase 2 — Hero journey

- Produce original KGS artwork and seven-stage content.
- Implement stage state, manual controls, keyboard navigation, and reduced motion.
- Add a lightweight progress-line transition.

### Phase 3 — Marketing sections

- Build impact, stories, solution grid, security demo, workflow, and final CTA.
- Connect only approved content and metrics.

### Phase 4 — Motion and polish

- Add intersection-triggered reveals.
- Add metric count-up, optional carousel autoplay, and institution marquee.
- Verify pause/reduced-motion behavior.

### Phase 5 — QA

- Visual testing at mobile, tablet, laptop, and large desktop sizes.
- Keyboard and screen-reader audit.
- Lighthouse performance/accessibility/SEO.
- Cross-browser testing.
- Link, metadata, policy, and analytics verification.

## 14. Acceptance checklist

- [ ] Original KGS branding, copy, and assets are used.
- [ ] Header and mobile drawer work with keyboard and touch.
- [ ] Hero stage control is manual, auto-advance is optional, and motion can be reduced.
- [ ] Every section has loading/error behavior if it depends on remote data.
- [ ] No fabricated metrics, partners, or testimonials.
- [ ] All external logos and stories have documented permission.
- [ ] Policy links resolve to real pages.
- [ ] Page has no encoding corruption.
- [ ] Valid page returns HTTP 200 with correct metadata.
- [ ] LCP, CLS, accessibility, and SEO targets pass.
- [ ] The design remains usable without JavaScript for primary marketing content.
- [ ] The page does not obstruct candidate login with mandatory marketing dialogs.

## 15. Reference artifact

A full-page screenshot captured during this review is stored at:

`output/playwright/dhee-public-landing-full.png`

Use it only as a private layout reference. Do not ship or redistribute it as a KGS asset.
