import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Scale, Users, Lightbulb } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About BiasLens" },
      { name: "description", content: "BiasLens is a lightweight fairness auditing tool that helps teams catch unfair patterns in datasets before they become unfair decisions." },
      { property: "og:title", content: "About BiasLens" },
      { property: "og:description", content: "Fairness auditing built for clarity, transparency, and speed." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <section className="bg-[image:var(--gradient-hero)] px-6 pb-16 pt-20 text-center">
          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Fairer data. Fairer decisions.</h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            BiasLens is a lightweight fairness auditing tool. We translate group-level statistics into clear, plain-English insights so anyone — not just data scientists — can spot unfairness in their data.
          </p>
        </section>
        <section className="mx-auto grid max-w-6xl gap-6 px-6 py-16 md:grid-cols-3">
          {[
            { icon: Scale, title: "Transparent by design", desc: "We use simple, explainable selection-rate comparisons — no black boxes." },
            { icon: Users, title: "Built for everyone", desc: "Hiring managers, lenders, admissions teams and AI researchers all benefit." },
            { icon: Lightbulb, title: "Action over theory", desc: "Every report includes practical suggestions to reduce bias right away." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-sm)]">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-foreground">{title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </section>
        <section className="px-6 pb-20 text-center">
          <Button asChild size="lg" className="bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-glow)] hover:opacity-95">
            <Link to="/analyze">Start analyzing <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}