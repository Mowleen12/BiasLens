import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  PieChart,
  MessageSquare,
  Lightbulb,
  Download,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BiasLens — Detect Bias. Promote Fairness. Build Better Decisions." },
      { name: "description", content: "Upload a dataset and instantly see whether outcomes differ across groups. Plain-English fairness reports for hiring, lending, admissions and AI models." },
      { property: "og:title", content: "BiasLens — Fairness auditing for your data" },
      { property: "og:description", content: "Upload a dataset and get a clear fairness report in seconds." },
    ],
  }),
  component: Index,
});

const FEATURES = [
  { icon: BarChart3, title: "Detect bias", desc: "Identify unfair differences in outcomes across groups.", bg: "bg-accent", color: "text-primary" },
  { icon: PieChart, title: "Visualize results", desc: "Understand bias through clear charts and tables.", bg: "bg-info/10", color: "text-info" },
  { icon: MessageSquare, title: "Get insights", desc: "Receive simple explanations in plain English.", bg: "bg-success/10", color: "text-success" },
  { icon: Lightbulb, title: "Improve fairness", desc: "Get actionable suggestions to reduce bias.", bg: "bg-warning/10", color: "text-warning-foreground" },
  { icon: Download, title: "Export ready", desc: "Bring your analysis into reports your team trusts.", bg: "bg-destructive/10", color: "text-destructive" },
];

function Index() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section id="home" className="relative overflow-hidden scroll-mt-20">
          <div className="absolute inset-0 -z-10 bg-[image:var(--gradient-hero)]" />
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_oklch(0.62_0.21_285_/_0.18),_transparent_60%)]" />
          <div className="mx-auto max-w-5xl px-6 pb-20 pt-20 text-center sm:pt-28">
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card/60 px-4 py-1.5 text-xs font-medium text-primary shadow-[var(--shadow-sm)] backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Fairness auditing made simple
            </div>
            <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Detect bias. Promote fairness.{" "}
              <span className="bg-[image:var(--gradient-primary)] bg-clip-text text-transparent">Build better decisions.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">
              Upload your dataset and let BiasLens analyze it for potential bias across different groups in a simple, interactive way.
            </p>

            <div className="mx-auto mt-10 max-w-xl">
              <div className="rounded-2xl border border-border bg-card/80 p-8 shadow-[var(--shadow-lg)] backdrop-blur">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]">
                  <Zap className="h-7 w-7 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Upload your dataset</h3>
                <p className="mt-1 text-sm text-muted-foreground">Drag and drop a CSV, or jump into the analysis workspace.</p>
                <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Button asChild size="lg" className="bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-glow)] hover:opacity-95">
                    <Link to="/analyze">
                      Choose CSV file <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link to="/analyze" search={{ sample: 1 }}>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Try sample dataset
                    </Link>
                  </Button>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">Only CSV files are supported · Your data stays private</p>
              </div>
            </div>

            <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-accent/40 px-4 py-2 text-xs text-primary">
              <ShieldCheck className="h-3.5 w-3.5" />
              Your data is secure and private. We don't store any files you upload.
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="how-it-works" className="border-t border-border/60 bg-background py-20 scroll-mt-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground">What you can do with BiasLens</h2>
              <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-[image:var(--gradient-primary)]" />
            </div>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
              {FEATURES.map(({ icon: Icon, title, desc, bg, color }) => (
                <div key={title} className="group rounded-2xl border border-border bg-card p-6 text-center shadow-[var(--shadow-sm)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]">
                  <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-xl ${bg} transition-transform group-hover:scale-110`}>
                    <Icon className={`h-6 w-6 ${color}`} />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-foreground">{title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Storytelling: explanation */}
        <section id="about" className="bg-muted/40 py-20 scroll-mt-20">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-info/10 px-3 py-1 text-xs font-medium text-info">
                <MessageSquare className="h-3.5 w-3.5" /> Actionable explanations
              </span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground">Understand your data without a PhD in statistics.</h2>
              <p className="mt-4 text-muted-foreground">
                BiasLens automatically translates complex demographic disparities and selection rates into simple, plain English summaries. Know exactly what the numbers mean for your hiring, lending, or AI models.
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                {[
                  "Clear comparison of selection rates between groups",
                  "Contextual insights outlining what the data suggests",
                  "Severity labels so you can prioritise what matters",
                ].map((s) => (
                  <li key={s} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <span className="text-foreground">{s}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-lg)]">
              <div className="rounded-xl border border-info/20 bg-info/5 p-4">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-info">
                  <MessageSquare className="h-4 w-4" /> Plain English explanation
                </h4>
                <p className="mt-2 text-sm text-foreground">
                  Males have a selection rate of <span className="font-semibold">80.0%</span> while females have a selection rate of <span className="font-semibold">40.0%</span>. This means females are <span className="font-semibold">40.0%</span> less likely to be selected.
                </p>
              </div>
              <div className="mt-3 rounded-xl border border-warning/20 bg-warning/5 p-4">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-warning-foreground">
                  <Lightbulb className="h-4 w-4" /> What does this mean?
                </h4>
                <p className="mt-2 text-sm text-foreground">
                  The dataset shows a significant difference in outcomes between groups, which could indicate potential bias. Consider reviewing your data collection and labeling process.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section id="analyze" className="px-6 py-20 scroll-mt-20">
          <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-[image:var(--gradient-cta)] px-8 py-14 text-center shadow-[var(--shadow-lg)]">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl">Ready to make fairer decisions?</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-white/70">
              Join data professionals, hiring managers, and AI researchers using BiasLens to build trust, ensure compliance, and promote equity.
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="bg-white text-foreground hover:bg-white/90">
                <Link to="/analyze">Get started free <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                <Link to="/how-it-works">See how it works</Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-white/50">No credit card required. Cancel anytime.</p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
