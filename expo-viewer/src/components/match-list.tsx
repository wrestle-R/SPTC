import { useRouter } from "expo-router";
import { CalendarDays, ChevronRight, MapPin } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Card, Section, StateView } from "@/components/screen";
import { usePublicCollection } from "@/hooks/use-public-data";
import { colors } from "@/lib/theme";
import type { PublicMatch, PublicTeam, Sport } from "@/lib/types";

export function MatchList({ sport }: { sport: Sport }) {
  const matches = usePublicCollection<PublicMatch>("matches");
  const teams = usePublicCollection<PublicTeam>("teams");
  const filtered = matches.data.filter((match) => match.sport === sport).sort((a, b) => new Date(a.startsAt).valueOf() - new Date(b.startsAt).valueOf());
  const groups = [{ title: "Live now", rows: filtered.filter((match) => ["live", "innings-break", "super-over"].includes(match.status)) }, { title: "Upcoming", rows: filtered.filter((match) => ["scheduled", "lineup"].includes(match.status)) }, { title: "Results", rows: filtered.filter((match) => match.status === "completed") }];
  if (matches.loading || teams.loading) return <StateView loading />;
  if (matches.error || teams.error) return <StateView error={matches.error || teams.error} />;
  if (!filtered.length) return <StateView empty={<><CalendarDays color={colors.muted} /><Text style={styles.emptyTitle}>No fixtures yet</Text><Text style={styles.muted}>Organizer-created matches will appear automatically.</Text></>} />;
  return <View style={styles.groups}>{groups.filter((group) => group.rows.length).map((group) => <Section key={group.title} title={group.title}><View style={styles.list}>{group.rows.map((match) => <MatchItem key={match.id} match={match} teams={teams.data} />)}</View></Section>)}</View>;
}

function MatchItem({ match, teams }: { match: PublicMatch; teams: PublicTeam[] }) {
  const router = useRouter(); const home = teams.find((team) => team.id === match.homeTeamId); const away = teams.find((team) => team.id === match.awayTeamId);
  const innings = match.scoreSummary?.innings ?? [];
  const score = (teamId: string) => match.sport === "cricket" ? (() => { const row = innings.find((item) => item.battingTeamId === teamId); return row ? `${row.score}/${row.wickets}` : "-"; })() : String(match.scoreSummary?.[teamId] ?? 0);
  return <Pressable onPress={() => router.push({ pathname: "/match/[matchId]", params: { matchId: match.id } })} accessibilityRole="button" style={({ pressed }) => [pressed && { opacity: 0.75 }]}><Card><View style={styles.top}><Text style={styles.stage}>{match.stage.toUpperCase()}</Text><Text style={[styles.status, match.status === "live" && styles.live]}>{match.status.toUpperCase()}</Text></View><View style={styles.scoreRow}><View style={styles.team}><Text style={styles.teamName} numberOfLines={2}>{home?.shortName ?? "Home"}</Text><Text style={styles.score}>{score(match.homeTeamId)}</Text></View><Text style={styles.vs}>VS</Text><View style={[styles.team, { alignItems: "flex-end" }]}><Text style={[styles.teamName, { textAlign: "right" }]} numberOfLines={2}>{away?.shortName ?? "Away"}</Text><Text style={styles.score}>{score(match.awayTeamId)}</Text></View></View><View style={styles.meta}><View style={styles.metaText}><MapPin color={colors.muted} size={16} /><Text style={styles.muted} numberOfLines={1}>{match.venue || "Venue pending"}</Text></View><ChevronRight color={colors.muted} size={20} /></View></Card></Pressable>;
}

const styles = StyleSheet.create({ groups: { gap: 24 }, list: { gap: 10 }, top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }, stage: { color: colors.muted, fontSize: 11, fontWeight: "800" }, status: { color: colors.muted, fontSize: 11, fontWeight: "800" }, live: { color: colors.danger }, scoreRow: { flexDirection: "row", alignItems: "center", marginTop: 18, gap: 10 }, team: { flex: 1, gap: 6 }, teamName: { color: colors.text, fontSize: 16, lineHeight: 20, fontWeight: "700" }, score: { color: colors.text, fontSize: 30, fontWeight: "800" }, vs: { color: colors.muted, fontSize: 11, fontWeight: "800" }, meta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: colors.border, marginTop: 16, paddingTop: 12 }, metaText: { flex: 1, flexDirection: "row", alignItems: "center", gap: 7 }, muted: { color: colors.muted, fontSize: 13, flexShrink: 1 }, emptyTitle: { color: colors.text, fontSize: 17, fontWeight: "700" } });
