import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { UploadCard, type ParsedDataset } from "@/components/UploadCard";
import { AnalysisDashboard } from "@/components/AnalysisDashboard";
import { FileSpreadsheet, ShieldCheck, Sparkles } from "lucide-react";

export const Route = createFileRoute("/analyze")({
  head: () => ({
    meta: [
      { title: "Analyze your dataset — BiasLens" },
      { name: "description", content: "Upload a CSV, pick a sensitive attribute and outcome column, then run a fairness analysis with plain-English insights." },
      { property: "og:title", content: "Analyze your dataset — BiasLens" },
      { property: "og:description", content: "Run a fairness analysis on any CSV in seconds." },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    sample: search.sample === "1" || search.sample === 1 ? 1 : undefined,
  }),
  component: AnalyzePage,
});

function AnalyzePage() {
  const [dataset, setDataset] = useState<ParsedDataset | null>(null);
  const { sample } = Route.useSearch();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          {!dataset ? (
            <div className="mx-auto max-w-3xl">
              <div className="text-center">
                <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Analyze your dataset for fairness
                </h1>
                <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
                  Upload a CSV file and start checking whether outcomes differ across groups.
                </p>
              </div>
              <div className="mt-10">
                <UploadCard onLoaded={setDataset} autoLoadSample={sample === 1} />
              </div>

              <div className="mt-10 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-sm)]">
                <div className="flex items-center gap-2 text-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">How it works</h3>
                </div>
                <ol className="mt-3 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-5">
                  <li><span className="font-semibold text-foreground">1.</span> Upload your dataset</li>
                  <li><span className="font-semibold text-foreground">2.</span> Select sensitive &amp; target columns</li>
                  <li><span className="font-semibold text-foreground">3.</span> Set threshold</li>
                  <li><span className="font-semibold text-foreground">4.</span> Click analyze</li>
                  <li><span className="font-semibold text-foreground">5.</span> View results, insights &amp; suggestions</li>
                </ol>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
                  <FileSpreadsheet className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <div className="text-sm font-semibold text-foreground">Works with any CSV</div>
                    <div className="text-xs text-muted-foreground">Hiring, lending, admissions, screening — bring your own data.</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
                  <ShieldCheck className="mt-0.5 h-5 w-5 text-success" />
                  <div>
                    <div className="text-sm font-semibold text-foreground">Private by design</div>
                    <div className="text-xs text-muted-foreground">Files are parsed in your browser. We never store them.</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <AnalysisDashboard dataset={dataset} onClear={() => setDataset(null)} />
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}