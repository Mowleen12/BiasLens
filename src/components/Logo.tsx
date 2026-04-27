import { Scale } from "lucide-react";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]">
        <Scale className="h-5 w-5 text-primary-foreground" strokeWidth={2.25} />
      </div>
      <div className="leading-tight">
        <div className="text-base font-semibold tracking-tight text-foreground">BiasLens</div>
        <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Detect · Explain · Improve</div>
      </div>
    </div>
  );
}