import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={cn("glass rounded-lg p-4 sm:p-5", className)}>{children}</section>;
}

export function SectionHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">{eyebrow}</p> : null}
        <h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">{title}</h1>
      </div>
      {action}
    </div>
  );
}

export function Pill({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "live" | "ready" | "soon" | "good" | "bad";
}) {
  const tones = {
    default: "border-white/15 bg-white/8 text-muted-strong",
    live: "border-red/40 bg-red/15 text-red",
    ready: "border-primary/35 bg-primary/15 text-primary",
    soon: "border-white/12 bg-white/6 text-muted",
    good: "border-green/35 bg-green/15 text-green",
    bad: "border-red/35 bg-red/15 text-red",
  };

  return (
    <span className={cn("inline-flex min-h-8 items-center rounded-md border px-2.5 text-xs font-black", tones[tone])}>
      {children}
    </span>
  );
}

export function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <Card>
      <p className="text-sm font-semibold text-muted">{label}</p>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-muted-strong">{detail}</p>
    </Card>
  );
}

export function RouteButton({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-black transition",
        variant === "primary"
          ? "bg-primary text-primary-foreground shadow-lg shadow-black/25 hover:brightness-110"
          : "border border-white/15 bg-white/8 text-white hover:bg-white/12",
      )}
    >
      {children}
      <ArrowRight className="size-4" aria-hidden="true" />
    </Link>
  );
}
