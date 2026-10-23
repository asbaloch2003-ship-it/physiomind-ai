import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Menu, X, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStudentSession } from "@/components/student-session";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const nav = [
  { to: "/curriculum", label: "Curriculum" },
  { to: "/subjects", label: "Subjects" },
  { to: "/special-tests", label: "Special Tests" },
  { to: "/ai-assistant", label: "AI Assistant" },
  { to: "/case-simulator", label: "Case Simulator" },
  { to: "/quizzes", label: "BCQs" },
  { to: "/notes", label: "Notes" },
  { to: "/resources", label: "Resources" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/about", label: "About" },
] as const;

import logoMark from "@/assets/logo-mark.png.asset.json";

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <img src={logoMark.url} alt="PhysioSmart AI logo" className="h-12 w-12" />
      <span className="font-display leading-tight">
        <span className="block text-xl font-bold">PhysioSmart <span className="text-accent">AI</span></span>
        <span className="hidden text-[11px] font-medium tracking-wide text-muted-foreground sm:block">Learn to think like a physiotherapist.</span>
      </span>
    </Link>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  const { user, loading } = useStudentSession();
  const client = useQueryClient();
  const navigate = useNavigate();
  async function signOut() {
    await client.cancelQueries(); client.clear();
    const { error } = await supabase.auth.signOut();
    if (error) { setSignOutError("Could not sign out. Please try again."); return; }
    setOpen(false); await navigate({ to: "/auth", replace: true });
  }
  return (
    <header className="sticky top-0 z-40 border-b bg-card/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Logo />
        <nav className="hidden gap-1 xl:flex">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground" activeProps={{ className: "bg-primary-soft !text-primary font-medium" }}>{n.label}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {!loading && (user ? <Button variant="ghost" size="sm" onClick={signOut}>Sign out</Button> : <Button asChild size="sm"><Link to="/auth">Sign in</Link></Button>)}
          <Button variant="ghost" size="icon" aria-label="Toggle menu" className="xl:hidden" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</Button>
        </div>
      </div>
      {signOutError && <p role="alert" className="px-4 text-sm text-destructive">{signOutError}</p>}
      {open && (
        <nav className="grid gap-1 border-t bg-card p-4 xl:hidden">
          {nav.map((n) => <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm hover:bg-secondary">{n.label}</Link>)}
        </nav>
      )}
    </header>
  );
}

export function Disclaimer() {
  return (
    <div className="flex gap-3 rounded-xl border border-warning/30 bg-warning-soft p-4 text-sm">
      <ShieldAlert className="h-5 w-5 shrink-0 text-warning" />
      <p><strong>Educational use only.</strong> AI-generated clinical reasoning is a learning aid and does not replace assessment, diagnosis or treatment by a qualified healthcare professional.</p>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="mt-20 border-t bg-card">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 md:grid-cols-2">
        <div><Logo /><p className="mt-3 max-w-sm text-sm text-muted-foreground">An educational platform for DPT students in Pakistan. Content is for learning purposes only and is not medical advice.</p></div>
        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground sm:grid-cols-3">
          {nav.map((n) => <Link key={n.to} to={n.to} className="hover:text-primary">{n.label}</Link>)}
        </div>
      </div>
      <p className="border-t py-4 text-center text-xs text-muted-foreground">© 2026 PhysioSmart AI · For educational purposes only</p>
    </footer>
  );
}

export function PageHeader({ eyebrow, title, desc }: { eyebrow: string; title: string; desc: string }) {
  return (
    <section className="bg-hero border-b">
      <div className="mx-auto max-w-7xl px-4 py-14">
        <p className="text-sm font-semibold uppercase tracking-wider text-accent">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-bold md:text-5xl">{title}</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">{desc}</p>
      </div>
    </section>
  );
}

export function Container({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-7xl px-4 py-12">{children}</div>;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border bg-card p-6 transition hover:shadow-soft ${className}`}>{children}</div>;
}

export function Tag({ children }: { children: ReactNode }) {
  return <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary">{children}</span>;
}

export const meta = (title: string, description: string) => ({
  meta: [
    { title: `${title} | PhysioSmart AI` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} | PhysioSmart AI` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ],
});
