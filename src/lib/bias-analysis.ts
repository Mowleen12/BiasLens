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