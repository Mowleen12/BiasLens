import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Upload, Columns3, SlidersHorizontal, BarChart3, MessageSquare, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How it works — BiasLens" },
      { name: "description", content: "Five simple steps from CSV to a clear, plain-English fairness report." },
      { property: "og:title", content: "How BiasLens works" },
      { property: "og:description", content: "Upload, select columns, set a threshold, analyze, and read the report." },
    ],
  }),
  component: HowItWorks,
});

const STEPS = [
  { icon: Upload, title: "Upload your dataset", desc: "Drop in a CSV file from hiring, lending, admissions or any decision system." },
  { icon: Columns3, title: "Select sensitive & target columns", desc: "Pick the attribute to audit (gender, race, age) and the outcome (hired, approved...)." },
  { icon: SlidersHorizontal, title: "Set a threshold", desc: "Choose how big a gap between groups counts as bias for your context." },
  { icon: BarChart3, title: "Run the analysis", desc: "We compute selection rates per group, the gap, and a severity label." },
  { icon: MessageSquare, title: "Read the plain-English report", desc: "See which group is favored or disadvantaged and what to do next." },
];

function HowItWorks() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <section className="bg-[image:var(--gradient-hero)] px-6 pb-16 pt-20 text-center">
          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl">How BiasLens works</h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">A transparent, explainable workflow — five steps from raw CSV to a fairness report.</p>
        </section>
        <section className="mx-auto max-w-4xl px-6 py-16">
          <ol className="space-y-5">
            {STEPS.map(({ icon: Icon, title, desc }, i) => (
              <li key={title} className="flex items-start gap-5 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-sm)]">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-glow)]">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-primary">Step {i + 1}</div>
                  <h3 className="mt-1 text-lg font-semibold text-foreground">{title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-12 text-center">
            <Button asChild size="lg" className="bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-glow)] hover:opacity-95">
              <Link to="/analyze">Try it now <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}