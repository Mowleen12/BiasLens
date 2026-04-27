export type GroupResult = {
  group: string;
  selected: number;
  total: number;
  rate: number;
};

export type Severity = "none" | "low" | "moderate" | "high";

export type AnalysisResult = {
  groups: GroupResult[];
  overall: { selected: number; total: number; rate: number };
  gap: number;
  thresholdPct: number;
  biased: boolean;
  severity: Severity;
  favored: GroupResult | null;
  disadvantaged: GroupResult | null;
  sensitive: string;
  target: string;
};

const TRUTHY = new Set(["1", "true", "yes", "y", "hired", "approved", "selected", "passed", "admitted", "accepted", "positive", "pass"]);

export function isPositive(v: unknown): boolean {
  if (v === true || v === 1) return true;
  if (v === false || v === 0 || v == null) return false;
  return TRUTHY.has(String(v).trim().toLowerCase());
}

export function analyzeBias(
  rows: Record<string, unknown>[],
  sensitive: string,
  target: string,
  thresholdPct: number,
): AnalysisResult {
  const buckets = new Map<string, { selected: number; total: number }>();
  let overallSel = 0;
  let overallTot = 0;

  for (const row of rows) {
    const rawGroup = row[sensitive];
    if (rawGroup == null || String(rawGroup).trim() === "") continue;
    const group = String(rawGroup).trim();
    const positive = isPositive(row[target]);
    const b = buckets.get(group) ?? { selected: 0, total: 0 };
    b.total += 1;
    if (positive) b.selected += 1;
    buckets.set(group, b);
    overallTot += 1;
    if (positive) overallSel += 1;
  }

  const groups: GroupResult[] = Array.from(buckets.entries())
    .map(([group, v]) => ({
      group,
      selected: v.selected,
      total: v.total,
      rate: v.total > 0 ? v.selected / v.total : 0,
    }))
    .sort((a, b) => b.rate - a.rate);

  const rates = groups.map((g) => g.rate);
  const max = rates.length ? Math.max(...rates) : 0;
  const min = rates.length ? Math.min(...rates) : 0;
  const gap = max - min;
  const gapPct = gap * 100;
  const biased = gapPct > thresholdPct;

  let severity: Severity = "none";
  if (biased) {
    if (gapPct > 30) severity = "high";
    else if (gapPct > 15) severity = "moderate";
    else severity = "low";
  }

  const favored = groups.length ? groups[0] : null;
  const disadvantaged = groups.length ? groups[groups.length - 1] : null;

  return {
    groups,
    overall: {
      selected: overallSel,
      total: overallTot,
      rate: overallTot > 0 ? overallSel / overallTot : 0,
    },
    gap,
    thresholdPct,
    biased,
    severity,
    favored,
    disadvantaged,
    sensitive,
    target,
  };
}

export function inferSensitiveColumns(headers: string[]): string[] {
  const keywords = ["gender", "sex", "race", "ethnicity", "age", "nationality", "religion", "disability", "marital"];
  return headers.filter((h) => keywords.some((k) => h.toLowerCase().includes(k)));
}

export function inferTargetColumns(headers: string[]): string[] {
  const keywords = ["hired", "approved", "selected", "passed", "admitted", "accepted", "outcome", "result", "label", "target", "decision"];
  return headers.filter((h) => keywords.some((k) => h.toLowerCase().includes(k)));
}

export type GroupSentence = {
  group: string;
  text: string;
  rate: number;
  role: "highest" | "lowest" | "middle";
};

export type Narrative = {
  headline: string;
  verdict: "biased" | "fair";
  summary: string;
  perGroup: GroupSentence[];
  ratioSentence: string | null;
  fourFifths: { ratio: number; pass: boolean; sentence: string } | null;
  contextParagraph: string;
  suggestions: string[];
};

function pct(n: number, digits = 1) {
  return `${(n * 100).toFixed(digits)}%`;
}

export function buildNarrative(result: AnalysisResult): Narrative {
  const { groups, gap, thresholdPct, biased, severity, favored, disadvantaged, sensitive, target, overall } = result;
  const gapPctNum = gap * 100;

  const headline = biased
    ? `Bias detected in "${target}" across "${sensitive}"`
    : `No significant bias detected in "${target}" across "${sensitive}"`;

  const summary = (() => {
    if (groups.length < 2) {
      return `Only one group was found in "${sensitive}", so a fairness comparison can't be made. Try a column with at least two distinct values.`;
    }
    if (favored && disadvantaged && favored.group !== disadvantaged.group) {
      const cmp = biased ? "above" : "within";
      return `Across ${overall.total.toLocaleString()} records, ${favored.group} has the highest selection rate at ${pct(favored.rate)} (${favored.selected}/${favored.total}), while ${disadvantaged.group} has the lowest at ${pct(disadvantaged.rate)} (${disadvantaged.selected}/${disadvantaged.total}). That is a gap of ${gapPctNum.toFixed(1)} percentage points, ${cmp} your ${thresholdPct}% threshold.`;
    }
    return `All groups in "${sensitive}" have similar selection rates, with a gap of just ${gapPctNum.toFixed(1)} percentage points.`;
  })();

  const perGroup: GroupSentence[] = groups.map((g, i) => {
    let role: GroupSentence["role"] = "middle";
    if (i === 0) role = "highest";
    else if (i === groups.length - 1 && groups.length > 1) role = "lowest";
    const tag = role === "highest" ? " — highest rate" : role === "lowest" ? " — lowest rate" : "";
    return {
      group: g.group,
      rate: g.rate,
      role,
      text: `${g.group}: ${pct(g.rate)} selected (${g.selected} of ${g.total})${tag}.`,
    };
  });

  let ratioSentence: string | null = null;
  let fourFifths: Narrative["fourFifths"] = null;
  if (favored && disadvantaged && favored.group !== disadvantaged.group && favored.rate > 0) {
    const ratio = disadvantaged.rate / favored.rate;
    const times = ratio > 0 ? 1 / ratio : Infinity;
    ratioSentence = isFinite(times)
      ? `${disadvantaged.group} is about ${times.toFixed(2)}× less likely to receive a positive outcome than ${favored.group}.`
      : `${disadvantaged.group} received no positive outcomes, while ${favored.group} did.`;
    const pass = ratio >= 0.8;
    fourFifths = {
      ratio,
      pass,
      sentence: pass
        ? `Four-Fifths Rule: PASS. The ratio of selection rates (${ratio.toFixed(2)}) is at or above the 0.80 threshold commonly used by regulators (e.g. US EEOC).`
        : `Four-Fifths Rule: FAIL. The ratio of selection rates is ${ratio.toFixed(2)}, below the 0.80 threshold commonly used by regulators (e.g. US EEOC) to flag adverse impact.`,
    };
  }

  const contextParagraph = (() => {
    switch (severity) {
      case "high":
        return `This is a large disparity. In real-world systems, gaps of this size often translate into meaningful differences in opportunity and should be investigated before the data is used to train a model or drive decisions.`;
      case "moderate":
        return `This is a moderate disparity. It is worth investigating whether the gap reflects a real difference in qualifications or an artifact of how the data was collected, labeled, or filtered.`;
      case "low":
        return `The gap is small but still above your threshold. Treat it as a yellow flag — keep monitoring as more data arrives.`;
      default:
        return `The differences between groups are within your threshold. The dataset looks reasonably balanced for this attribute, though fairness should be re-checked whenever new data is added.`;
    }
  })();

  const suggestions = (() => {
    const base: string[] = [];
    if (biased && disadvantaged && favored) {
      base.push(`Collect more positive-outcome examples for ${disadvantaged.group} in "${target}" to balance representation.`);
      base.push(`Audit how "${target}" was originally labeled — historical decisions may encode bias against ${disadvantaged.group}.`);
      base.push(`Avoid using "${sensitive}" directly as a model input, and check for proxy features that strongly correlate with it.`);
      base.push(`Consider re-sampling or re-weighting so that ${disadvantaged.group} and ${favored.group} contribute more equally during model training.`);
      base.push(`Re-run this analysis after any data change, and track the ${sensitive} gap as a fairness metric over time.`);
      base.push(`Document this finding before deployment so reviewers and stakeholders are aware of the disparity.`);
    } else {
      base.push(`Continue monitoring "${target}" by ${sensitive} as new records are added.`);
      base.push(`Run the same check on other sensitive attributes (e.g. age, race, region) if available.`);
      base.push(`Verify that "${target}" labels are produced consistently across groups.`);
      base.push(`Keep a record of this fairness check alongside your dataset documentation.`);
      base.push(`Re-run the analysis at a stricter threshold to stress-test the result.`);
    }
    return base;
  })();

  return {
    headline,
    verdict: biased ? "biased" : "fair",
    summary,
    perGroup,
    ratioSentence,
    fourFifths,
    contextParagraph,
    suggestions,
  };
}