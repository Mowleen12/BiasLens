import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ErrorBar,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Scale,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  FileSpreadsheet,
  X,
  MessageSquare,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  BookOpen,
  Sparkles,
  Loader2,
  Download,
  Printer,
  Copy,
  Layers,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import type { ParsedDataset } from "./UploadCard";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Slider } from "./ui/slider";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Skeleton } from "./ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  analyzeBias,
  analyzeDataQuality,
  buildIntersectionalRows,
  buildNarrative,
  computeFairnessMetrics,
  computeSignificance,
  inferSensitiveColumns,
  inferTargetColumns,
  suggestColumnPairs,
  withConfidenceIntervals,
  type AnalysisResult,
} from "@/lib/bias-analysis";
import { Link } from "@tanstack/react-router";

const SEVERITY_STYLES: Record<string, { label: string; cls: string; chipCls: string }> = {
  none: { label: "No bias detected", cls: "text-success", chipCls: "bg-success/10 text-success border-success/20" },
  low: { label: "Low", cls: "text-warning", chipCls: "bg-warning/10 text-warning-foreground border-warning/30" },
  moderate: { label: "Moderate", cls: "text-warning", chipCls: "bg-warning/10 text-warning-foreground border-warning/30" },
  high: { label: "High", cls: "text-destructive", chipCls: "bg-destructive/10 text-destructive border-destructive/20" },
};

const CHART_COLORS = [
  "oklch(0.62 0.21 285)",
  "oklch(0.62 0.18 240)",
  "oklch(0.65 0.17 155)",
  "oklch(0.78 0.16 75)",
  "oklch(0.62 0.23 25)",
  "oklch(0.55 0.18 320)",
];

const ANALYSIS_STEPS = [
  "Reading rows",
  "Grouping records",
  "Computing selection rates",
  "Checking fairness rules",
];

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  iconBg,
  iconColor,
  valueClass,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  iconBg: string;
  iconColor: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-md)] print:break-inside-avoid print:shadow-none">
      <div className="flex items-start gap-4">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
          <div className={`mt-1 text-2xl font-semibold tracking-tight ${valueClass ?? "text-foreground"}`}>{value}</div>
          {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
        </div>
      </div>
    </div>
  );
}

function AnalyzingSkeleton({ step }: { step: number }) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="rounded-2xl border border-primary/20 bg-accent/30 p-6">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <div className="text-sm font-semibold text-primary">Running fairness analysis…</div>
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-4">
          {ANALYSIS_STEPS.map((label, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <div
                key={label}
                className={`flex items-center gap-2 rounded-xl border p-3 text-xs transition-all ${
                  done
                    ? "border-success/30 bg-success/10 text-success"
                    : active
                      ? "border-primary/40 bg-card text-foreground"
                      : "border-border bg-card/60 text-muted-foreground"
                }`}
              >
                {done ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : active ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  <span className="inline-block h-4 w-4 rounded-full border border-current opacity-50" />
                )}
                <span className="truncate">{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-start gap-4">
              <Skeleton className="h-11 w-11 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="mt-4 h-64 w-full" />
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <Skeleton className="h-5 w-48" />
          <div className="mt-4 space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AnalysisDashboard({
  dataset,
  onClear,
}: {
  dataset: ParsedDataset;
  onClear: () => void;
}) {
  const headers = useMemo(
    () => dataset.headers.map((h) => (h ?? "").trim()).filter((h) => h.length > 0),
    [dataset.headers],
  );
  const sensitiveSuggestions = useMemo(() => inferSensitiveColumns(headers), [headers]);
  const targetSuggestions = useMemo(() => inferTargetColumns(headers), [headers]);
  const suggestedPairs = useMemo(
    () => suggestColumnPairs(dataset.rows, headers),
    [dataset.rows, headers],
  );

  const [sensitive, setSensitive] = useState<string>(sensitiveSuggestions[0] ?? headers[0] ?? "");
  const [target, setTarget] = useState<string>(targetSuggestions[0] ?? headers[headers.length - 1] ?? "");
  const [secondary, setSecondary] = useState<string>("none");
  const [threshold, setThreshold] = useState<number>(10);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);

  const dataQuality = useMemo(
    () => (sensitive && target ? analyzeDataQuality(dataset.rows, headers, sensitive, target) : null),
    [dataset.rows, headers, sensitive, target],
  );

  const runAnalysis = () => {
    if (!sensitive || !target || analyzing) return;
    setAnalyzing(true);
    setStepIdx(0);
    setResult(null);

    // Animate the steps
    const stepDelays = [200, 450, 700, 950];
    stepDelays.forEach((d, i) => {
      setTimeout(() => setStepIdx(i + 1), d);
    });

    setTimeout(() => {
      try {
        let rowsToAnalyze = dataset.rows;
        let sensitiveCol = sensitive;
        if (secondary && secondary !== "none" && secondary !== sensitive) {
          const built = buildIntersectionalRows(dataset.rows, sensitive, secondary);
          rowsToAnalyze = built.rows;
          sensitiveCol = built.key;
        }
        const r = analyzeBias(rowsToAnalyze, sensitiveCol, target, threshold);
        setResult(r);
        toast.success(
          r.biased
            ? `Bias detected — gap of ${(r.gap * 100).toFixed(1)}%`
            : "No significant bias detected",
        );
      } catch (e) {
        toast.error("Could not run the analysis. Check the columns and try again.");
      } finally {
        setAnalyzing(false);
      }
    }, 1200);
  };

  // Keyboard shortcut: Enter runs analysis
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !analyzing && sensitive && target) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        runAnalysis();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analyzing, sensitive, target, secondary, threshold, dataset.rows]);

  const previewRows = dataset.rows.slice(0, 5);
  const sevStyle = result ? SEVERITY_STYLES[result.severity] : null;
  const narrative = useMemo(() => (result ? buildNarrative(result) : null), [result]);
  const significance = useMemo(() => (result ? computeSignificance(result) : null), [result]);
  const fairnessMetrics = useMemo(() => (result ? computeFairnessMetrics(result) : null), [result]);
  const groupsWithCI = useMemo(() => (result ? withConfidenceIntervals(result) : []), [result]);

  // Exports
  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  const handleExportCsv = () => {
    if (!result) return;
    const lines: string[] = [];
    lines.push(`# BiasLens report`);
    lines.push(`# file,${dataset.fileName}`);
    lines.push(`# sensitive,${result.sensitive}`);
    lines.push(`# target,${result.target}`);
    lines.push(`# threshold_pct,${result.thresholdPct}`);
    lines.push(`# generated_at,${new Date().toISOString()}`);
    lines.push(`group,selected,total,selection_rate,is_favored,is_disadvantaged`);
    for (const g of result.groups) {
      const isFav = result.favored?.group === g.group ? 1 : 0;
      const isDis = result.disadvantaged?.group === g.group && result.favored?.group !== g.group ? 1 : 0;
      lines.push(`"${g.group.replace(/"/g, '""')}",${g.selected},${g.total},${g.rate.toFixed(4)},${isFav},${isDis}`);
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `biaslens_${result.sensitive}_${result.target}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded");
  };

  const handleCopySummary = async () => {
    if (!narrative || !result) return;
    const lines: string[] = [];
    lines.push(narrative.headline);
    lines.push("");
    lines.push(narrative.summary);
    lines.push("");
    for (const g of narrative.perGroup) lines.push(`• ${g.text}`);
    if (narrative.ratioSentence) {
      lines.push("");
      lines.push(narrative.ratioSentence);
    }
    if (narrative.fourFifths) {
      lines.push("");
      lines.push(narrative.fourFifths.sentence);
    }
    if (significance) {
      lines.push("");
      lines.push(significance.sentence);
    }
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      toast.success("Summary copied to clipboard");
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  // Chart data with confidence intervals
  const chartData = groupsWithCI.map((g) => {
    const ratePct = +(g.rate * 100).toFixed(1);
    const lowerErr = +((g.rate - g.ci.lower) * 100).toFixed(1);
    const upperErr = +((g.ci.upper - g.rate) * 100).toFixed(1);
    return { name: g.group, rate: ratePct, errorRange: [lowerErr, upperErr] as [number, number] };
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      {/* Sidebar */}
      <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start print:hidden" data-print-hide>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-sm)]">
          <h4 className="text-sm font-semibold text-primary">1. Dataset</h4>
          <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-border bg-muted/40 p-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-success/10">
                <FileSpreadsheet className="h-4 w-4 text-success" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-foreground">{dataset.fileName}</div>
                <div className="text-xs text-muted-foreground">
                  {dataset.rows.length} rows · {dataset.headers.length} columns
                </div>
              </div>
            </div>
            <button
              onClick={onClear}
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
              aria-label="Remove file"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-sm)]">
          <h4 className="text-sm font-semibold text-primary">2. Select columns</h4>

          {suggestedPairs.length > 0 && (
            <div className="mt-3">
              <div className="text-xs text-muted-foreground">Try a suggested pair:</div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {suggestedPairs.map((p) => (
                  <button
                    key={`${p.sensitive}::${p.target}`}
                    onClick={() => {
                      setSensitive(p.sensitive);
                      setTarget(p.target);
                    }}
                    className="rounded-full border border-primary/20 bg-accent/40 px-2.5 py-1 text-[11px] font-medium text-primary transition hover:bg-accent/60"
                  >
                    {p.sensitive} × {p.target}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-3 space-y-4">
            <div>
              <Label className="text-xs font-medium text-foreground">Sensitive attribute</Label>
              <Select value={sensitive} onValueChange={setSensitive}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  {headers.map((h) => (
                    <SelectItem key={h} value={h}>{h}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium text-foreground">Secondary (intersectional, optional)</Label>
              <Select value={secondary} onValueChange={setSecondary}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {headers
                    .filter((h) => h !== sensitive)
                    .map((h) => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-[11px] text-muted-foreground">Combine two attributes (e.g. gender × age).</p>
            </div>
            <div>
              <Label className="text-xs font-medium text-foreground">Target column (outcome)</Label>
              <Select value={target} onValueChange={setTarget}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  {headers.map((h) => (
                    <SelectItem key={h} value={h}>{h}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-sm)]">
          <h4 className="text-sm font-semibold text-primary">3. Analysis settings</h4>
          <div className="mt-3">
            <Label className="text-xs font-medium text-foreground">Bias threshold (%)</Label>
            <div className="mt-2 flex items-center gap-3">
              <Slider
                value={[threshold]}
                onValueChange={(v) => setThreshold(v[0] ?? 10)}
                min={1}
                max={50}
                step={1}
                className="flex-1"
              />
              <Input
                type="number"
                value={threshold}
                min={1}
                max={50}
                onChange={(e) => setThreshold(Math.max(1, Math.min(50, Number(e.target.value) || 0)))}
                className="w-16"
              />
            </div>
            <div className="mt-2 flex gap-1.5">
              {[5, 10, 20].map((p) => (
                <button
                  key={p}
                  onClick={() => setThreshold(p)}
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition ${
                    threshold === p
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p}%
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              If the difference between groups is more than this, it will be flagged as bias.
            </p>
          </div>
        </div>

        <Button
          onClick={runAnalysis}
          size="lg"
          disabled={!sensitive || !target || analyzing}
          className="w-full bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-glow)] hover:opacity-95"
        >
          {analyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing…
            </>
          ) : (
            <>
              <Scale className="mr-2 h-4 w-4" />
              Analyze dataset
            </>
          )}
        </Button>
      </aside>

      {/* Main */}
      <main className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">BiasLens analysis</h1>
            <p className="mt-1 text-muted-foreground">
              {result
                ? `Reviewing fairness across "${result.sensitive}" with respect to "${result.target}".`
                : analyzing
                  ? "Crunching the numbers…"
                  : "Configure your columns and threshold, then run the analysis."}
            </p>
          </div>
          {result && (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleCopySummary}>
                <Copy className="mr-1.5 h-3.5 w-3.5" />
                Copy summary
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCsv}>
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="mr-1.5 h-3.5 w-3.5" />
                Save as PDF
              </Button>
              <Button variant="outline" size="sm" onClick={() => setResult(null)}>
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                Reset
              </Button>
            </div>
          )}
        </div>

        {analyzing ? (
          <AnalyzingSkeleton step={stepIdx} />
        ) : !result ? (
          <div className="space-y-6">
            {dataQuality && (
              <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-sm)]">
                <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                  <Layers className="h-4 w-4 text-primary" /> Data quality check
                </h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl border border-border bg-muted/30 p-3">
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Total rows</div>
                    <div className="mt-1 text-lg font-semibold tabular-nums">{dataQuality.totalRows.toLocaleString()}</div>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/30 p-3">
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Usable</div>
                    <div className="mt-1 text-lg font-semibold tabular-nums">{dataQuality.usablePct.toFixed(0)}%</div>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/30 p-3">
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Groups</div>
                    <div className="mt-1 text-lg font-semibold tabular-nums">{dataQuality.groupCount}</div>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/30 p-3">
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Smallest group</div>
                    <div className="mt-1 truncate text-lg font-semibold tabular-nums">
                      {dataQuality.smallestGroupName ?? "—"}{" "}
                      <span className="text-xs font-normal text-muted-foreground">({dataQuality.smallestGroupSize})</span>
                    </div>
                  </div>
                </div>
                {dataQuality.warnings.length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {dataQuality.warnings.map((w) => (
                      <li key={w} className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm text-warning-foreground">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-sm)]">
              <h2 className="text-base font-semibold text-foreground">Dataset preview</h2>
              <p className="text-sm text-muted-foreground">First {previewRows.length} of {dataset.rows.length} rows</p>
              <div className="mt-4 overflow-x-auto rounded-xl border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      {headers.map((h) => (
                        <TableHead key={h} className="whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-muted-foreground">{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewRows.map((row, i) => (
                      <TableRow key={i}>
                        {headers.map((h) => (
                          <TableCell key={h} className="whitespace-nowrap text-sm">{String(row[h] ?? "")}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-6 rounded-xl border border-primary/20 bg-accent/40 p-4 text-sm text-foreground">
                <span className="font-semibold text-primary">Ready when you are.</span>{" "}
                Click <span className="font-medium">Analyze dataset</span> (or press <kbd className="rounded border border-border bg-card px-1.5 py-0.5 text-[10px] font-semibold">Enter</kbd>) to compute fairness metrics.
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {narrative && (
              <div className={`rounded-2xl border p-6 shadow-[var(--shadow-sm)] print:break-inside-avoid print:shadow-none ${result.biased ? "border-destructive/20 bg-destructive/5" : "border-success/20 bg-success/5"}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${sevStyle?.chipCls}`}>
                    {result.biased ? <AlertTriangle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                    {result.biased ? `Bias detected · ${sevStyle?.label}` : "No significant bias"}
                  </span>
                  {significance && (
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                      significance.significant
                        ? "border-info/30 bg-info/10 text-info"
                        : "border-muted-foreground/20 bg-muted/40 text-muted-foreground"
                    }`}>
                      <TrendingUp className="h-3.5 w-3.5" />
                      {significance.significant ? `Statistically significant (p = ${significance.pValue.toFixed(3)})` : `Not statistically significant (p = ${significance.pValue.toFixed(3)})`}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">Threshold: {result.thresholdPct}% · Gap: {(result.gap * 100).toFixed(1)}%</span>
                </div>
                <h2 className="mt-3 text-xl font-bold tracking-tight text-foreground">{narrative.headline}</h2>
                <p className="mt-2 text-sm leading-relaxed text-foreground">{narrative.summary}</p>
                {significance && (
                  <p className="mt-2 text-sm text-muted-foreground">{significance.sentence}</p>
                )}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                icon={Scale}
                iconBg={result.biased ? "bg-destructive/10" : "bg-success/10"}
                iconColor={result.biased ? "text-destructive" : "text-success"}
                label="Bias status"
                value={
                  <span className={result.biased ? "text-destructive" : "text-success"}>
                    {result.biased ? "Detected" : "Fair"}
                  </span>
                }
                hint={`Gap: ${(result.gap * 100).toFixed(1)}%`}
              />
              <StatCard
                icon={ShieldCheck}
                iconBg="bg-info/10"
                iconColor="text-info"
                label="Severity"
                value={<span className={sevStyle?.cls}>{sevStyle?.label}</span>}
                hint={result.biased ? "Based on size of gap" : "Within threshold"}
              />
              <StatCard
                icon={SlidersHorizontal}
                iconBg="bg-success/10"
                iconColor="text-success"
                label="Threshold used"
                value={`${result.thresholdPct}%`}
                hint="Custom"
              />
              <StatCard
                icon={Users}
                iconBg="bg-accent"
                iconColor="text-primary"
                label="Groups detected"
                value={result.groups.length}
                hint={result.groups.map((g) => g.group).join(", ")}
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-2 print:grid-cols-1">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-sm)] print:break-inside-avoid print:shadow-none">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-foreground">Selection rate by group</h3>
                  <span className="text-xs text-muted-foreground">{result.sensitive}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Bars show selection rate. Whiskers are 95% confidence intervals.</p>
                <div className="mt-4 h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 16, right: 8, left: -16, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} unit="%" domain={[0, 100]} />
                      <Tooltip
                        cursor={{ fill: "var(--muted)" }}
                        contentStyle={{
                          background: "var(--popover)",
                          border: "1px solid var(--border)",
                          borderRadius: 12,
                          boxShadow: "var(--shadow-md)",
                        }}
                        formatter={(v: number) => [`${v}%`, "Selection rate"]}
                      />
                      <Bar dataKey="rate" radius={[8, 8, 0, 0]}>
                        {chartData.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                        <ErrorBar dataKey="errorRange" width={6} strokeWidth={1.5} stroke="var(--muted-foreground)" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-sm)] print:break-inside-avoid print:shadow-none">
                <h3 className="text-base font-semibold text-foreground">Group-wise summary</h3>
                <div className="mt-4 overflow-hidden rounded-xl border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead>{result.sensitive}</TableHead>
                        <TableHead className="text-right">Positive</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Selection rate</TableHead>
                        <TableHead className="text-right">95% CI</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupsWithCI.map((g, i) => (
                        <TableRow key={g.group}>
                          <TableCell className="font-medium" style={{ color: CHART_COLORS[i % CHART_COLORS.length] }}>{g.group}</TableCell>
                          <TableCell className="text-right tabular-nums">{g.selected}</TableCell>
                          <TableCell className="text-right tabular-nums">{g.total}</TableCell>
                          <TableCell className="text-right font-semibold tabular-nums" style={{ color: CHART_COLORS[i % CHART_COLORS.length] }}>
                            {(g.rate * 100).toFixed(1)}%
                          </TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground tabular-nums">
                            {(g.ci.lower * 100).toFixed(0)}–{(g.ci.upper * 100).toFixed(0)}%
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/30">
                        <TableCell className="font-semibold">Overall</TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">{result.overall.selected}</TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">{result.overall.total}</TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">{(result.overall.rate * 100).toFixed(1)}%</TableCell>
                        <TableCell className="text-right" />
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2 print:grid-cols-1">
              <div className="rounded-2xl border border-info/20 bg-info/5 p-6 print:break-inside-avoid">
                <h3 className="flex items-center gap-2 text-base font-semibold text-info">
                  <MessageSquare className="h-4 w-4" /> Plain English explanation
                </h3>
                {narrative && (
                  <div className="mt-4 space-y-4 text-sm text-foreground">
                    <ul className="space-y-2">
                      {narrative.perGroup.map((s) => (
                        <li key={s.group} className="flex items-start gap-2">
                          <span className={`mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full ${s.role === "highest" ? "bg-success" : s.role === "lowest" ? "bg-destructive" : "bg-muted-foreground/60"}`} />
                          <span>{s.text}</span>
                        </li>
                      ))}
                    </ul>
                    {narrative.ratioSentence && (
                      <p className="rounded-xl bg-background/60 p-3">{narrative.ratioSentence}</p>
                    )}
                    {narrative.fourFifths && (
                      <div className={`flex items-start gap-2 rounded-xl p-3 ${narrative.fourFifths.pass ? "bg-success/10" : "bg-destructive/10"}`}>
                        <ShieldCheck className={`mt-0.5 h-4 w-4 shrink-0 ${narrative.fourFifths.pass ? "text-success" : "text-destructive"}`} />
                        <p>{narrative.fourFifths.sentence}</p>
                      </div>
                    )}
                    <div className="flex items-start gap-2 rounded-xl bg-background/60 p-3">
                      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                      <p className="text-muted-foreground">
                        <span className="font-semibold text-foreground">What does this mean? </span>
                        {narrative.contextParagraph}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-success/20 bg-success/5 p-6 print:break-inside-avoid">
                <h3 className="flex items-center gap-2 text-base font-semibold text-success">
                  <Lightbulb className="h-4 w-4" /> Suggestions to reduce bias
                </h3>
                <ul className="mt-4 space-y-3 text-sm text-foreground">
                  {(narrative?.suggestions ?? []).map((s) => (
                    <li key={s} className="flex items-start gap-2.5">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {fairnessMetrics && fairnessMetrics.disparateImpactRatio !== null && (
              <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-sm)] print:break-inside-avoid print:shadow-none">
                <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
                  <Scale className="h-4 w-4 text-primary" /> Fairness metrics
                </h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-border p-4">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">Disparate Impact</div>
                    <div className={`mt-1 text-2xl font-semibold tabular-nums ${fairnessMetrics.disparateImpactPass ? "text-success" : "text-destructive"}`}>
                      {fairnessMetrics.disparateImpactRatio.toFixed(2)}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {fairnessMetrics.disparateImpactPass ? "PASS — at or above 0.80" : "FAIL — below 0.80 (adverse impact)"}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border p-4">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">Statistical Parity Diff.</div>
                    <div className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                      {((fairnessMetrics.statisticalParityDifference ?? 0) * 100).toFixed(1)}%
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">Lowest minus highest selection rate.</div>
                  </div>
                  <div className="rounded-xl border border-border p-4">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">Demographic Parity</div>
                    <div className={`mt-1 text-2xl font-semibold ${fairnessMetrics.demographicParityPass ? "text-success" : "text-destructive"}`}>
                      {fairnessMetrics.demographicParityPass ? "PASS" : "FAIL"}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">Within your {result.thresholdPct}% threshold.</div>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-sm)] print:break-inside-avoid print:shadow-none">
              <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
                <BookOpen className="h-4 w-4 text-primary" /> What we measured
              </h3>
              <div className="mt-3 grid gap-4 text-sm text-muted-foreground sm:grid-cols-3">
                <div>
                  <div className="font-semibold text-foreground">Selection rate</div>
                  <p className="mt-1">For each group in <span className="font-medium text-foreground">{result.sensitive}</span>, the share of records where <span className="font-medium text-foreground">{result.target}</span> is positive (e.g. hired, approved, accepted).</p>
                </div>
                <div>
                  <div className="font-semibold text-foreground">Bias gap</div>
                  <p className="mt-1">The difference between the highest and lowest selection rate. A larger gap means groups are being treated more differently.</p>
                </div>
                <div>
                  <div className="font-semibold text-foreground">Threshold</div>
                  <p className="mt-1">You flagged anything above <span className="font-medium text-foreground">{result.thresholdPct}%</span> as bias. Lowering it makes the check stricter.</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground print:hidden">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>Want the full methodology?</span>
                <Link to="/how-it-works" className="font-medium text-primary underline-offset-4 hover:underline">Read how BiasLens works →</Link>
              </div>
            </div>

            {result.biased && (
              <div className="flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-4 print:break-inside-avoid">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning-foreground" />
                <p className="text-sm text-warning-foreground">
                  <span className="font-semibold">Heads up: </span>
                  This dataset crosses your fairness threshold of {result.thresholdPct}%. Treat it as a signal to investigate, not a final verdict.
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
