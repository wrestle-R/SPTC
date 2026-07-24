import { HomeView } from "@/components/home-view";
import { PublicShell } from "@/components/public-shell";
import { SptcIntroAnimation } from "@/components/sptc-intro-animation";

export default function HomePage() {
  return (
    <PublicShell>
      <SptcIntroAnimation />
      <HomeView />
    </PublicShell>
  );
}
