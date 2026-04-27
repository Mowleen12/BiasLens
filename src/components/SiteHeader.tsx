import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { Button } from "./ui/button";
import { ArrowRight } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          <Link to="/" activeOptions={{ exact: true }} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[status=active]:text-foreground">
            Home
          </Link>
          <Link to="/how-it-works" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[status=active]:text-foreground">
            How it works
          </Link>
          <Link to="/about" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[status=active]:text-foreground">
            About
          </Link>
          <Link to="/analyze" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[status=active]:text-foreground">
            Analyze
          </Link>
        </nav>
        <Button asChild size="sm" className="bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-glow)] hover:opacity-95">
          <Link to="/analyze">
            Get started <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </header>
  );
}