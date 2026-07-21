import { HomeView } from "@/components/home-view";
import { PublicShell } from "@/components/public-shell";

export default function HomePage() {
  return (
    <PublicShell>
      <HomeView />
    </PublicShell>
  );
}
