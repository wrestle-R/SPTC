"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Plus, Trophy, X } from "lucide-react";
import { useState } from "react";
import { navigation } from "@/lib/tournament-data";
import { cn, pageTitleFromPath } from "@/lib/utils";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-white/10 bg-[#090e16]/95 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl transition-transform duration-200 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-3" onClick={() => setOpen(false)}>
            <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Trophy className="size-5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-base font-black text-white">Sports Fiesta S9</span>
              <span className="block truncate text-xs font-semibold text-muted">Tournament command center</span>
            </span>
          </Link>
          <button
            type="button"
            className="grid size-10 place-items-center rounded-lg border border-white/10 bg-white/6 lg:hidden"
            aria-label="Close sidebar"
            onClick={() => setOpen(false)}
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto pr-1">
          {navigation.map((group) => (
            <div key={group.label} className="mb-6">
              <p className="mb-2 px-2 text-xs font-black uppercase tracking-[0.16em] text-muted">{group.label}</p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = pathname === item.href;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={`${group.label}-${item.title}`}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-bold transition",
                        active ? "bg-primary text-primary-foreground shadow-lg shadow-black/20" : "text-muted-strong hover:bg-white/8 hover:text-white",
                      )}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate">{item.title}</span>
                      {item.badge ? (
                        <span className={cn("rounded-md px-2 py-0.5 text-[0.68rem] font-black", active ? "bg-black/15" : "bg-red/15 text-red")}>
                          {item.badge}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="rounded-lg border border-primary/25 bg-primary/10 p-3">
          <p className="text-sm font-black text-primary">Prototype mode</p>
          <p className="mt-1 text-xs leading-5 text-muted-strong">Seeded data only. Organizer controls are visual previews.</p>
        </div>
      </aside>

      {open ? <button type="button" aria-label="Close sidebar overlay" className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setOpen(false)} /> : null}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-white/10 bg-background/80 backdrop-blur-xl">
          <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className="grid size-11 place-items-center rounded-lg border border-white/10 bg-white/6 lg:hidden"
                aria-label="Open sidebar"
                onClick={() => setOpen(true)}
              >
                <Menu className="size-5" aria-hidden="true" />
              </button>
              <div className="min-w-0">
                <p className="text-xs font-bold text-muted">Dashboard / {pageTitleFromPath(pathname)}</p>
                <h1 className="truncate text-lg font-black text-white sm:text-xl">{pageTitleFromPath(pathname)}</h1>
              </div>
            </div>
            <Link
              href="/"
              className="hidden min-h-10 items-center rounded-lg border border-white/10 bg-white/6 px-3 text-sm font-bold text-muted-strong hover:bg-white/10 sm:inline-flex"
            >
              Landing
            </Link>
          </div>
        </header>

        <main className="p-4 sm:p-6">
          {children}
          <button
            type="button"
            className="fixed bottom-5 right-5 z-20 inline-flex min-h-12 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-black text-primary-foreground shadow-2xl shadow-black/40"
            aria-label="Open discipline points prototype"
          >
            <Plus className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Discipline Points</span>
          </button>
        </main>
      </div>
    </div>
  );
}
