"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Menu, Moon, Sun, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useState, useSyncExternalStore } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/teams", label: "Teams" },
  { href: "/hall-of-fame", label: "Hall of Fame" },
];

const subscribeToHydration = () => () => undefined;

export function PublicNavbar() {
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useMotionValueEvent(scrollY, "change", (latest) => setScrolled(latest > 24));

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-0 pt-0 sm:px-5 sm:pt-3">
      <motion.div
        animate={{ y: scrolled ? 4 : 0 }}
        className={cn(
          "flex h-14 w-full items-center justify-between border border-transparent px-3 transition-colors sm:mx-auto sm:max-w-6xl sm:px-4",
          scrolled && "bg-background/92 shadow-sm backdrop-blur-xl sm:rounded-full sm:border-border/70",
        )}
      >
        <Link href="/" aria-label="Sports Fiesta home" onClick={() => setOpen(false)}>
          <BrandLogo />
        </Link>
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center md:flex" aria-label="Tournament">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                pathname.startsWith(link.href) && "bg-muted text-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Toggle color theme"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          >
            {mounted && resolvedTheme === "dark" ? <Sun /> : <Moon />}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </motion.div>
      <AnimatePresence>
        {open ? (
          <motion.nav
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-1 grid w-full gap-1 border-t bg-background/95 p-2 shadow-lg backdrop-blur-xl sm:mx-auto sm:mt-2 sm:max-w-6xl sm:rounded-lg sm:border"
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-md px-4 py-3 text-base font-medium text-muted-foreground",
                  pathname.startsWith(link.href) && "bg-muted text-foreground",
                )}
              >
                {link.label}
              </Link>
            ))}
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
