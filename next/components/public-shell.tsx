import Link from "next/link";
import { PublicNavbar } from "@/components/public-navbar";

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <PublicNavbar />
      <main className="w-full flex-1 px-3 pb-12 pt-20 sm:mx-auto sm:max-w-6xl sm:px-6">{children}</main>
      <footer className="mt-auto border-t bg-muted/40">
        <div className="flex w-full flex-col items-center justify-between gap-4 px-3 py-6 sm:mx-auto sm:max-w-6xl sm:flex-row sm:px-6">
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm" aria-label="Footer sports">
            <Link href="/football" className="font-medium text-muted-foreground transition-colors hover:text-foreground">Football</Link>
            <Link href="/handball" className="font-medium text-muted-foreground transition-colors hover:text-foreground">Handball</Link>
            <Link href="/cricket" className="font-medium text-muted-foreground transition-colors hover:text-foreground">Cricket</Link>
            <Link href="/throwball" className="font-medium text-muted-foreground transition-colors hover:text-foreground">Throwball</Link>
            <Link href="/events/womens-games" className="font-medium text-muted-foreground transition-colors hover:text-foreground">Women’s Games</Link>
            <Link href="/events/senior-kids" className="font-medium text-muted-foreground transition-colors hover:text-foreground">Senior Kids</Link>
            <Link href="/events/junior-kids" className="font-medium text-muted-foreground transition-colors hover:text-foreground">Junior Kids</Link>
            <Link href="/events/relay" className="font-medium text-muted-foreground transition-colors hover:text-foreground">Relay</Link>
            <span className="hidden text-muted-foreground/30 sm:inline">|</span>
            <Link href="/teams" className="font-medium text-muted-foreground transition-colors hover:text-foreground">Standings</Link>
            <Link href="/leaderboards" className="font-medium text-muted-foreground transition-colors hover:text-foreground">Leaders</Link>
          </nav>
          <p className="text-sm text-muted-foreground">
            Made with love by{" "}
            <span className="font-semibold text-blue-400">Daniel</span>{" "}
            and <span className="font-semibold text-pink-400">Patrick</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
