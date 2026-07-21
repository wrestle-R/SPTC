import { PublicNavbar } from "@/components/public-navbar";

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh">
      <PublicNavbar />
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-24 sm:px-6">{children}</main>
      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-6 text-sm text-muted-foreground sm:px-6">
          <span>Sports Fiesta S9</span>
          <span>Live tournament view</span>
        </div>
      </footer>
    </div>
  );
}
