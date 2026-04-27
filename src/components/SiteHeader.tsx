import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { Button } from "./ui/button";
import { ArrowRight } from "lucide-react";

type NavItem = { label: string; route: "/" | "/how-it-works" | "/about" | "/analyze"; sectionId: string };

const NAV_ITEMS: NavItem[] = [
  { label: "Home", route: "/", sectionId: "home" },
  { label: "How it works", route: "/how-it-works", sectionId: "how-it-works" },
  { label: "About", route: "/about", sectionId: "about" },
  { label: "Analyze", route: "/analyze", sectionId: "analyze" },
];

function smoothScrollTo(id: string) {
  const el = document.getElementById(id);
  if (!el) return false;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  if (typeof history !== "undefined") {
    history.replaceState(null, "", `#${id}`);
  }
  return true;
}

export function SiteHeader() {
  const location = useLocation();
  const onHome = location.pathname === "/";
  const [activeSection, setActiveSection] = useState<string>("home");

  // On landing: scroll to hash on mount, observe sections for active state.
  useEffect(() => {
    if (!onHome) return;
    const hash = window.location.hash.replace("#", "");
    if (hash) {
      // Wait a tick for layout
      requestAnimationFrame(() => smoothScrollTo(hash));
    }
    const ids = NAV_ITEMS.map((n) => n.sectionId);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActiveSection(visible.target.id);
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [onHome]);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center" onClick={() => onHome && smoothScrollTo("home")}>
          <Logo />
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {NAV_ITEMS.map((item) => {
            const isActive = onHome
              ? activeSection === item.sectionId
              : location.pathname === item.route;
            const cls = `text-sm font-medium transition-colors hover:text-foreground ${isActive ? "text-foreground" : "text-muted-foreground"}`;
            if (onHome) {
              return (
                <a
                  key={item.label}
                  href={`#${item.sectionId}`}
                  className={cls}
                  onClick={(e) => {
                    if (smoothScrollTo(item.sectionId)) e.preventDefault();
                  }}
                >
                  {item.label}
                </a>
              );
            }
            return (
              <Link key={item.label} to={item.route} className={cls}>
                {item.label}
              </Link>
            );
          })}
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