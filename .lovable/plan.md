# Plan: Functional Analyze + Smooth-Scroll Landing Nav

## 1. Richer human-readable analysis (Analyze page)

Upgrade `AnalysisDashboard.tsx` so the results read like a written report, not just charts and stat cards. Keep all existing functionality and add a narrative layer driven by the actual computed numbers.

**New "Key findings" summary panel** (top of results, full width)
- One-line verdict: "Bias detected" / "No significant bias" with severity chip.
- 2–3 sentence written summary using real numbers, e.g. "Across 500 records, the selection rate for Male applicants is 80.0% compared to 40.0% for Female applicants — a gap of 40 percentage points, well above your 10% threshold."
- Highlights the favored group, the disadvantaged group, the gap, the threshold, and total rows.

**Expanded "Plain English explanation" card**
- Per-group sentences generated from `result.groups` (not just favored vs disadvantaged), e.g. "Group A: 80.0% selected (160 / 200) — highest rate." for each group.
- Comparative ratio sentence: "{disadvantaged} is X.Xx less likely to be selected than {favored}."
- Four-fifths / 80% rule check: compare `disadvantaged.rate / favored.rate` against 0.8 and state pass/fail in plain English (a recognized fairness benchmark).
- Contextual paragraph that adapts wording based on severity (none/low/moderate/high).

**Smarter, dataset-aware suggestions**
- Replace the static 5-bullet list with suggestions that reference the actual sensitive column, target column, favored group, and disadvantaged group by name.
- Examples: "Collect more positive-outcome examples for {disadvantaged.group} in the '{target}' column." / "Audit how '{target}' decisions were originally labeled to ensure they don't encode historical bias against {disadvantaged.group}."
- Always show 5–6 actionable items, mixed: data collection, labeling review, modeling guidance, monitoring.

**"What we measured" methodology card** (collapsible/inline)
- Short explainer: definition of selection rate, definition of bias gap, what the threshold means, link out to `/how-it-works`. Helps it feel like a real tool.

**Implementation details**
- All new copy is computed in a small helper inside `bias-analysis.ts` (e.g. `buildNarrative(result)` returning `{ headline, summary, perGroupSentences[], ratio, fourFifthsPass, contextParagraph, suggestions[] }`) so the dashboard stays presentational.
- No new dependencies. Pure functions over the existing `AnalysisResult`.

## 2. Landing page nav: smooth-scroll to sections

Make the top-bar links on the landing page scroll the user to the relevant section on the same page (the requested "slide towards the area" behavior), while still working as real routes elsewhere.

**Section anchors on `/`**
- Add `id="home"`, `id="how-it-works"`, `id="about"`, `id="analyze"` to the existing landing sections (hero, features/storytelling, CTA). Add a lightweight new "About" blurb section if needed so the About link has a target.
- Add `scroll-mt-20` (or equivalent) to offset the sticky header.

**SiteHeader becomes context-aware**
- Detect current route via `useLocation()`.
- When on `/`: render nav items as `<a href="#how-it-works">` etc. with an `onClick` that calls `element.scrollIntoView({ behavior: "smooth", block: "start" })` and updates the hash without a route change.
- When on any other route: keep the current `<Link to="/how-it-works">` behavior so deep pages still work.
- "Analyze" stays a real `<Link to="/analyze">` everywhere (it's a separate workspace, not a landing section) — but we can also accept hash `/#analyze` to scroll to the upload card on the home page. Decision: on the landing page, "Analyze" scrolls to the hero upload card; the "Get started" CTA button still routes to `/analyze`.
- On initial load of `/` with a hash (e.g. `/#how-it-works`), scroll to that section after mount.

**Active section highlighting (nice-to-have, included)**
- Use an IntersectionObserver in the header to mark the currently-visible section's link as active on the landing page only.

## Files touched

- `src/lib/bias-analysis.ts` — add `buildNarrative()` helper and types.
- `src/components/AnalysisDashboard.tsx` — add Key Findings panel, expand Plain English card, swap static suggestions for dynamic ones, add methodology card.
- `src/routes/index.tsx` — add section `id`s and `scroll-mt-*` offsets; add small About section if missing.
- `src/components/SiteHeader.tsx` — route-aware nav: smooth-scroll anchors on `/`, normal links elsewhere; hash-on-mount scroll; active-section highlighting.

## Out of scope

- PDF/CSV export of the report (mentioned as a feature card but not requested now).
- Auth, persistence, server-side analysis.
- Mobile hamburger menu redesign (current md+ nav stays as-is).
