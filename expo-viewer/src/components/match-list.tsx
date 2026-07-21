import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Badge, Card, StateView } from "@/components/ui/primitives";
import { usePublicCollection } from "@/hooks/use-public-data";
import { useAppTheme } from "@/lib/theme";
import type { PublicMatch, PublicTeam } from "@/lib/types";

export function MatchList({ filter, limit }: { filter?: (match: PublicMatch) => boolean; limit?: number }) {
  const matches = usePublicCollection<PublicMatch>("matches"); const teams = usePublicCollection<PublicTeam>("teams");
  if (matches.loading || teams.loading) return <StateView loading />;
  if (matches.error || teams.error) return <StateView error={matches.error || teams.error} />;
  const rows = matches.data.filter(filter ?? (() => true)).sort((a, b) => (a.matchNumber ?? a.id).localeCompare(b.matchNumber ?? b.id)).slice(0, limit);
  if (!rows.length) return <StateView empty={<Text style={{ color: "#8b9188" }}>No matches in this section.</Text>} />;
  return <View style={styles.list}>{rows.map((match) => <MatchItem key={match.id} match={match} teams={teams.data} />)}</View>;
}

export function MatchItem({ match, teams }: { match: PublicMatch; teams: PublicTeam[] }) {
  const router = useRouter(); const { colors } = useAppTheme(); const home = teams.find((team) => team.id === match.homeTeamId); const away = teams.find((team) => team.id === match.awayTeamId);
  const innings = match.scoreSummary?.innings ?? [];
  const score = (teamId: string) => match.sport === "cricket" ? (() => { const row = innings.find((item) => item.battingTeamId === teamId); return row ? `${row.score}/${row.wickets}` : "-"; })() : String(match.scoreSummary?.[teamId] ?? 0);
  return <Pressable onPress={() => router.push({ pathname: "/match/[matchId]", params: { matchId: match.id } })} accessibilityRole="button" style={({ pressed }) => [pressed && { opacity: 0.75 }]}><Card><View style={styles.top}><Text style={[styles.stage, { color: colors.primary }]}>{match.matchNumber ?? "MATCH"} · {match.sport.toUpperCase()}</Text><Badge status={match.status} /></View><View style={styles.scoreRow}><View style={styles.team}><Text style={[styles.teamName, { color: colors.text }]} numberOfLines={2}>{home?.name ?? "Home"}</Text><Text style={[styles.score, { color: colors.text }]}>{score(match.homeTeamId)}</Text></View><Text style={[styles.vs, { color: colors.muted }]}>VS</Text><View style={[styles.team, { alignItems: "flex-end" }]}><Text style={[styles.teamName, { color: colors.text, textAlign: "right" }]} numberOfLines={2}>{away?.name ?? "Away"}</Text><Text style={[styles.score, { color: colors.text }]}>{score(match.awayTeamId)}</Text></View></View><View style={[styles.meta, { borderTopColor: colors.border }]}><Text style={[styles.muted, { color: colors.muted }]}>{match.stage.replace("semifinal", "semi-final").toUpperCase()}</Text><ChevronRight color={colors.muted} size={20} /></View></Card></Pressable>;
}
const styles = StyleSheet.create({ list: { gap: 10 }, top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }, stage: { fontSize: 11, fontWeight: "900" }, scoreRow: { flexDirection: "row", alignItems: "center", marginTop: 18, gap: 10 }, team: { flex: 1, gap: 6 }, teamName: { fontSize: 15, lineHeight: 20, fontWeight: "700" }, score: { fontSize: 30, fontWeight: "800" }, vs: { fontSize: 11, fontWeight: "800" }, meta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, marginTop: 16, paddingTop: 12 }, muted: { fontSize: 12, fontWeight: "700" } });
