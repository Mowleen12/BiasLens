# Plan: More functionality + loading screens for BiasLens

Focused upgrade on three fronts: **loading/feedback states**, **deeper analysis features**, and **export/share**. No new dependencies — everything uses already-installed libs (Papa Parse, Recharts, shadcn, lucide).

## 1. Loading & feedback states

Right now upload + analysis are instant/synchronous with zero feedback. Add visible states so the app feels real on bigger files.

**Upload progress (`UploadCard.tsx`)**
- New local state: `status: "idle" | "reading" | "parsing" | "done" | "error"` + `progress` (0–100).
- Use `FileReader`'s `onprogress` to drive a progress bar while reading bytes.
- Switch Papa Parse to streaming mode (`step` callback) so we can update a "Parsing row X…" counter for large CSVs, then call `onLoaded` in `complete`.
- Replace the static dropzone contents with an animated state when busy: spinner + filename + `<Progress />` bar + row counter. Disable the buttons and dropzone while busy.
- Sample dataset button also shows a brief (~300 ms) simulated loading state so the transition feels consistent.

**Analysis running state (`AnalysisDashboard.tsx`)**
- New state: `analyzing: boolean`. On "Analyze dataset": set `analyzing=true`, defer the real work with `setTimeout(..., 600)` + `requestIdleCallback` fallback so the UI paints a loading view first (the computation itself is fast, but the reveal should feel considered).
- Full-width **skeleton results panel** while analyzing: shimmering verdict banner, 4 stat-card skeletons, chart skeleton, table skeleton (reuse existing `ui/skeleton.tsx`).
- Animated progress steps strip: "Reading rows → Grouping by {sensitive} → Computing selection rates → Checking fairness rules" with each step lighting up in sequence.
- Analyze button shows a spinner + "Analyzing…" label and is disabled during the run.

**Route-level transitions**
- Brief fade-in on the dashboard when `result` first appears (Tailwind `animate-in fade-in slide-in-from-bottom-2 duration-500`).

## 2. More analysis functionality

**Data quality panel (new, shown on dataset preview before running)**
- Compute: total rows, total columns, missing values in sensitive col, missing values in target col, % usable rows, distinct group count, min group size.
- Warn inline if: target column isn't binary-ish, a group has <30 rows (low confidence), >20% missing in sensitive/target.
- Lives above the existing dataset preview table.

**Intersectional analysis (optional second sensitive attribute)**
- New multi-select in the sidebar: "Add secondary attribute (optional)" (e.g. gender × age bucket).
- When set, `analyzeBias` is called on a synthetic combined key (`"Female · 30-40"`). Results render in the same charts/tables. Narrative labels intersectional groups correctly.

**Statistical significance check**
- Extend `bias-analysis.ts` with a two-proportion z-test between the favored and disadvantaged groups. Return `{ zScore, pValue, significant: pValue < 0.05 }`.
- Show as a small badge in the verdict card: "Statistically significant (p < 0.05)" vs "Not statistically significant — small sample".
- Explained in plain English in the narrative ("With {n} records, this gap is unlikely to be random chance.").

**Per-group confidence intervals on the bar chart**
- Wilson score interval per group, rendered as error bars on each bar via Recharts `ErrorBar`. Helps a judge see small groups have wide uncertainty.

**Additional fairness metrics card**
- New card alongside "What we measured":
  - Disparate Impact Ratio (disadvantaged / favored rate) with PASS/FAIL vs 0.80.
  - Statistical Parity Difference (rate_disadvantaged − rate_favored).
  - Demographic Parity status.
- Each with a 1-sentence plain-English gloss.

**Automatic column inference improvements**
- Detect binary target columns by value distribution, not just by header name (e.g. a `status` column containing only `accepted/rejected`).
- Detect low-cardinality categorical columns as candidate sensitive attributes.
- Surface the top 3 suggested (sensitive, target) pairs as clickable chips above the selectors ("Try: gender × hired").

## 3. Export & share

**Download report as PDF** (print-based, no deps)
- "Download report" button in the dashboard header. Adds a `print:` stylesheet block (hides sidebar/nav, forces full-width, keeps charts) and triggers `window.print()`. Users can save as PDF from the browser dialog.

**Download results as CSV**
- "Export CSV" button generates a per-group summary CSV (`group,selected,total,selection_rate,is_favored,is_disadvantaged`) via a Blob + object URL. Includes run metadata rows at the top (file, sensitive, target, threshold, timestamp).

**Copy shareable summary**
- "Copy summary" button writes the narrative headline + per-group sentences + four-fifths verdict to the clipboard as plain text for pasting into Slack/email.

## 4. Small UX wins

- **Threshold presets**: chips for 5% / 10% / 20% next to the slider.
- **Keyboard shortcut**: `Enter` on the sidebar runs analysis when both selects are filled.
- **Toast notifications** (via existing `sonner`): on analysis complete ("Analysis ready — gap 22.3%"), on CSV parse errors, on successful export.
- **Empty-state polish** on the landing upload card: "Try sample dataset" on the home page now actually loads the sample and navigates to `/analyze?sample=1`, which auto-loads it on mount.

## Files touched

- `src/components/UploadCard.tsx` — streaming parse, progress UI, loading/error states.
- `src/components/AnalysisDashboard.tsx` — analyzing skeleton, progress steps, data-quality panel, intersectional selector, extra metrics card, threshold presets, export buttons, print styles, toasts.
- `src/lib/bias-analysis.ts` — add `dataQualityReport()`, `analyzeIntersectional()`, two-proportion z-test, Wilson CI, disparate-impact/SPD helpers.
- `src/routes/analyze.tsx` — read `?sample=1` query and preload sample dataset; render a lightweight mount-time skeleton.
- `src/routes/index.tsx` — wire "Try sample dataset" CTA to `/analyze?sample=1`.
- `src/styles.css` — `@media print` rules for report export.

## Out of scope

- Server-side analysis, auth, persistence, account history.
- Model-level fairness auditing (predictions + labels) — mentioned as future extension in the original brief.
- Real PDF generation with a headless renderer (print-to-PDF is enough for MVP).
