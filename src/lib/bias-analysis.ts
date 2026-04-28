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

export type DataQualityReport = {
  totalRows: number;
  totalColumns: number;
  sensitiveMissing: number;
  targetMissing: number;
  usablePct: number;
  groupCount: number;
  smallestGroupSize: number;
  smallestGroupName: string | null;
  targetIsBinary: boolean;
  warnings: string[];
};

export type SignificanceResult = {
  zScore: number;
  pValue: number;
  significant: boolean;
  sentence: string;
};

export type WilsonInterval = { lower: number; upper: number };

export type GroupResultWithCI = GroupResult & { ci: WilsonInterval };

export type FairnessMetrics = {
  disparateImpactRatio: number | null;
  disparateImpactPass: boolean | null;
  statisticalParityDifference: number | null;
  demographicParityPass: boolean | null;
};

function pct(n: number, digits = 1) {
  return `${(n * 100).toFixed(digits)}%`;
}

// Wilson score interval for a binomial proportion
export function wilsonInterval(selected: number, total: number, z = 1.96): WilsonInterval {
  if (total === 0) return { lower: 0, upper: 0 };
  const p = selected / total;
  const denom = 1 + (z * z) / total;
  const center = (p + (z * z) / (2 * total)) / denom;
  const margin = (z * Math.sqrt((p * (1 - p)) / total + (z * z) / (4 * total * total))) / denom;
  return {
    lower: Math.max(0, center - margin),
    upper: Math.min(1, center + margin),
  };
}

// Approximation of the standard normal CDF (Abramowitz & Stegun)
function normalCdf(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989422804014327 * Math.exp(-x * x / 2);
  const p =
    d *
    t *
    (0.31938153 +
      t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return x > 0 ? 1 - p : p;
}

export function twoProportionZTest(
  s1: number,
  n1: number,
  s2: number,
  n2: number,
): SignificanceResult {
  if (n1 === 0 || n2 === 0) {
    return { zScore: 0, pValue: 1, significant: false, sentence: "Sample too small for a significance test." };
  }
  const p1 = s1 / n1;
  const p2 = s2 / n2;
  const pPool = (s1 + s2) / (n1 + n2);
  const se = Math.sqrt(pPool * (1 - pPool) * (1 / n1 + 1 / n2));
  if (se === 0) {
    return { zScore: 0, pValue: 1, significant: false, sentence: "No variation between groups — significance test not meaningful." };
  }
  const z = (p1 - p2) / se;
  const pValue = 2 * (1 - normalCdf(Math.abs(z)));
  const significant = pValue < 0.05;
  const sentence = significant
    ? `With ${n1 + n2} records, this gap is unlikely to be random chance (two-proportion z-test, p = ${pValue.toFixed(3)}).`
    : `With ${n1 + n2} records, the gap is not statistically significant (p = ${pValue.toFixed(3)}). It could be random variation.`;
  return { zScore: z, pValue, significant, sentence };
}

export function computeSignificance(result: AnalysisResult): SignificanceResult | null {
  if (!result.favored || !result.disadvantaged || result.favored.group === result.disadvantaged.group) {
    return null;
  }
  return twoProportionZTest(
    result.favored.selected,
    result.favored.total,
    result.disadvantaged.selected,
    result.disadvantaged.total,
  );
}

export function computeFairnessMetrics(result: AnalysisResult): FairnessMetrics {
  if (!result.favored || !result.disadvantaged || result.favored.group === result.disadvantaged.group) {
    return {
      disparateImpactRatio: null,
      disparateImpactPass: null,
      statisticalParityDifference: null,
      demographicParityPass: null,
    };
  }
  const di = result.favored.rate > 0 ? result.disadvantaged.rate / result.favored.rate : 0;
  const spd = result.disadvantaged.rate - result.favored.rate;
  return {
    disparateImpactRatio: di,
    disparateImpactPass: di >= 0.8,
    statisticalParityDifference: spd,
    demographicParityPass: Math.abs(spd) * 100 <= result.thresholdPct,
  };
}

export function withConfidenceIntervals(result: AnalysisResult): GroupResultWithCI[] {
  return result.groups.map((g) => ({ ...g, ci: wilsonInterval(g.selected, g.total) }));
}

function looksBinary(values: unknown[]): boolean {
  const distinct = new Set<string>();
  for (const v of values) {
    if (v == null || String(v).trim() === "") continue;
    distinct.add(String(v).trim().toLowerCase());
    if (distinct.size > 4) return false;
  }
  if (distinct.size === 0 || distinct.size > 2) return false;
  // Either it's truly 2 distinct, or 1 distinct that's truthy/falsy-shaped
  return true;
}

export function analyzeDataQuality(
  rows: Record<string, unknown>[],
  headers: string[],
  sensitive: string,
  target: string,
): DataQualityReport {
  const totalRows = rows.length;
  let sensMissing = 0;
  let targetMissing = 0;
  const groupSizes = new Map<string, number>();
  const targetValues: unknown[] = [];

  for (const r of rows) {
    const sv = r[sensitive];
    const tv = r[target];
    if (sv == null || String(sv).trim() === "") sensMissing++;
    else {
      const key = String(sv).trim();
      groupSizes.set(key, (groupSizes.get(key) ?? 0) + 1);
    }
    if (tv == null || String(tv).trim() === "") targetMissing++;
    else targetValues.push(tv);
  }

  const usable = rows.filter(
    (r) =>
      r[sensitive] != null &&
      String(r[sensitive]).trim() !== "" &&
      r[target] != null &&
      String(r[target]).trim() !== "",
  ).length;
  const usablePct = totalRows > 0 ? (usable / totalRows) * 100 : 0;

  let smallestGroupSize = Infinity;
  let smallestGroupName: string | null = null;
  for (const [k, v] of groupSizes) {
    if (v < smallestGroupSize) {
      smallestGroupSize = v;
      smallestGroupName = k;
    }
  }
  if (!isFinite(smallestGroupSize)) smallestGroupSize = 0;

  const targetIsBinary = looksBinary(targetValues);

  const warnings: string[] = [];
  if (!targetIsBinary)
    warnings.push(
      `"${target}" doesn't look binary. BiasLens treats values like 1/yes/hired/approved as positive — verify this matches your data.`,
    );
  if (smallestGroupName && smallestGroupSize < 30 && smallestGroupSize > 0)
    warnings.push(
      `Group "${smallestGroupName}" has only ${smallestGroupSize} records — results for it will have wide uncertainty.`,
    );
  if (totalRows > 0 && sensMissing / totalRows > 0.2)
    warnings.push(`Over 20% of rows are missing a value in "${sensitive}" — consider cleaning the data.`);
  if (totalRows > 0 && targetMissing / totalRows > 0.2)
    warnings.push(`Over 20% of rows are missing a value in "${target}" — these rows are excluded.`);

  return {
    totalRows,
    totalColumns: headers.length,
    sensitiveMissing: sensMissing,
    targetMissing: targetMissing,
    usablePct,
    groupCount: groupSizes.size,
    smallestGroupSize,
    smallestGroupName,
    targetIsBinary,
    warnings,
  };
}

// Build a synthetic combined column for intersectional analysis
export function buildIntersectionalRows(
  rows: Record<string, unknown>[],
  primary: string,
  secondary: string,
): { rows: Record<string, unknown>[]; key: string } {
  const key = `${primary} · ${secondary}`;
  const out = rows.map((r) => {
    const a = r[primary];
    const b = r[secondary];
    const aOk = a != null && String(a).trim() !== "";
    const bOk = b != null && String(b).trim() !== "";
    return {
      ...r,
      [key]: aOk && bOk ? `${String(a).trim()} · ${String(b).trim()}` : "",
    };
  });
  return { rows: out, key };
}

// Suggest top (sensitive, target) pairs based on header names AND value distributions
export function suggestColumnPairs(
  rows: Record<string, unknown>[],
  headers: string[],
): { sensitive: string; target: string }[] {
  if (rows.length === 0 || headers.length < 2) return [];
  const sensitivesByName = new Set(inferSensitiveColumns(headers));
  const targetsByName = new Set(inferTargetColumns(headers));

  const lowCardinality: string[] = [];
  const binaryCols: string[] = [];
  for (const h of headers) {
    const values = rows.map((r) => r[h]);
    const distinct = new Set<string>();
    for (const v of values) {
      if (v == null || String(v).trim() === "") continue;
      distinct.add(String(v).trim().toLowerCase());
      if (distinct.size > 8) break;
    }
    if (distinct.size >= 2 && distinct.size <= 6) lowCardinality.push(h);
    if (looksBinary(values)) binaryCols.push(h);
  }

  const sensitiveCandidates = Array.from(new Set([...sensitivesByName, ...lowCardinality]));
  const targetCandidates = Array.from(new Set([...targetsByName, ...binaryCols]));

  const pairs: { sensitive: string; target: string }[] = [];
  for (const s of sensitiveCandidates) {
    for (const t of targetCandidates) {
      if (s === t) continue;
      // Score: prefer name-matched on both sides
      const score =
        (sensitivesByName.has(s) ? 2 : 0) + (targetsByName.has(t) ? 2 : 0);
      pairs.push({ sensitive: s, target: t, ...({ score } as object) });
    }
  }
  pairs.sort((a: any, b: any) => (b.score ?? 0) - (a.score ?? 0));
  return pairs.slice(0, 3).map(({ sensitive, target }) => ({ sensitive, target }));
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