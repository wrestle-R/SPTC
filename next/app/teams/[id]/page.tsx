import { S9_TEAMS } from "@sports-fiesta/domain";
import { notFound } from "next/navigation";
import { PublicShell } from "@/components/public-shell";
import { TeamDetail } from "@/components/team-detail";

export function generateStaticParams() {
  return S9_TEAMS.map((t) => ({ id: t.id }));
}

export default async function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const team = S9_TEAMS.find((t) => t.id === id);
  
  if (!team) {
    notFound();
  }
  
  return (
    <PublicShell>
      <TeamDetail team={team} />
    </PublicShell>
  );
}
