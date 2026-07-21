import { useNetworkState } from "expo-network";
import { useRouter } from "expo-router";
import { CalendarPlus, ChevronRight, DatabaseZap, WifiOff } from "lucide-react-native";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Choice } from "@/components/choice";
import { Action, Card, Screen, Section, StateView } from "@/components/ui";
import { command, usePrivateCollection } from "@/hooks/use-private-data";
import { colors } from "@/lib/theme";
import type { Match, Team } from "@/lib/types";

const stages = [{ value: "league", label: "League" }, { value: "semifinal", label: "Semi-final" }, { value: "final", label: "Final" }];
const sports = [{ value: "football", label: "Football" }, { value: "handball", label: "Handball" }, { value: "cricket", label: "Cricket" }];

export default function HomeScreen() {
  const network = useNetworkState();
  const router = useRouter();
  const matches = usePrivateCollection<Match>("matches");
  const teams = usePrivateCollection<Team>("teams");
  const [sport, setSport] = useState("football");
  const [home, setHome] = useState("");
  const [away, setAway] = useState("");
  const [stage, setStage] = useState("league");
  const [pending, setPending] = useState(false);
  const online = network.isConnected !== false;
  async function run(action: () => Promise<unknown>, success: string) {
    if (!online) return Alert.alert("Offline", "Reconnect before updating tournament data.");
    setPending(true);
    try { await action(); Alert.alert("Saved", success); }
    catch (cause) { Alert.alert("Update failed", cause instanceof Error ? cause.message : "Please try again."); }
    finally { setPending(false); }
  }
  if (matches.loading || teams.loading) return <Screen title="Organizer home"><StateView loading /></Screen>;
  return <Screen title="Organizer home" subtitle="Create fixtures and open live scoring.">
    {!online ? <Card><View style={styles.offline}><WifiOff color={colors.danger} /><Text style={styles.offlineText}>Offline. Cached data is readable; scoring is disabled.</Text></View></Card> : null}
    {teams.error || matches.error ? <StateView error={teams.error || matches.error} /> : null}
    {!teams.data.length ? <Card><Text style={styles.cardTitle}>Set up Sports Fiesta</Text><Text style={styles.muted}>Adds the four approved teams and finalized rosters.</Text><View style={styles.gap}><Action label="Add teams and rosters" disabled={pending || !online} onPress={() => run(() => command("bootstrapTournament"), "Tournament setup complete.")} icon={<DatabaseZap color={colors.background} size={18} />} /></View></Card> : <>
      <Section title="Create fixture"><Card><View style={styles.form}>
        <Text style={styles.label}>Sport</Text><Choice value={sport} onChange={setSport} items={sports} />
        <Text style={styles.label}>Home team</Text><Choice value={home} onChange={setHome} items={teams.data.map((team) => ({ value: team.id, label: team.name }))} />
        <Text style={styles.label}>Away team</Text><Choice value={away} onChange={setAway} items={teams.data.filter((team) => team.id !== home).map((team) => ({ value: team.id, label: team.name }))} />
        <Text style={styles.label}>Stage</Text><Choice value={stage} onChange={setStage} items={stages} />
        <Action label={pending ? "Creating" : "Create fixture"} disabled={pending || !online || !home || !away || home === away} onPress={() => run(() => command("createMatch", { sport, homeTeamId: home, awayTeamId: away, stage }), "Fixture created with its match number.")} icon={<CalendarPlus color={colors.background} size={18} />} />
      </View></Card></Section>
      <Section title="Matches">{matches.data.length ? <View style={styles.list}>{[...matches.data].sort((a, b) => (a.matchNumber ?? a.id).localeCompare(b.matchNumber ?? b.id)).map((match) => { const homeTeam = teams.data.find((team) => team.id === match.homeTeamId); const awayTeam = teams.data.find((team) => team.id === match.awayTeamId); return <Pressable key={match.id} accessibilityRole="button" onPress={() => router.push({ pathname: "/match/[matchId]", params: { matchId: match.id } })}><Card><View style={styles.match}><View style={styles.matchText}><View style={styles.statusRow}><Text style={styles.number}>{match.matchNumber ?? "MATCH"}</Text><StatusBadge status={match.status} /></View><Text style={styles.cardTitle}>{homeTeam?.name ?? "Home"} vs {awayTeam?.name ?? "Away"}</Text><Text style={styles.muted}>{match.sport} · {match.stage}</Text></View><ChevronRight color={colors.muted} /></View></Card></Pressable>; })}</View> : <StateView text="No fixtures created." />}</Section>
    </>}
  </Screen>;
}

function StatusBadge({ status }: { status: Match["status"] }) {
  const live = ["live", "innings-break", "super-over"].includes(status);
  const completed = status === "completed";
  return <View style={[styles.badge, live ? styles.live : completed ? styles.completed : styles.upcoming]}><View style={[styles.dot, { backgroundColor: live ? "#22c55e" : completed ? colors.muted : "#3b82f6" }]} /><Text style={[styles.badgeText, live ? styles.liveText : completed ? styles.completedText : styles.upcomingText]}>{live ? "LIVE" : completed ? "COMPLETED" : "UPCOMING"}</Text></View>;
}

const styles = StyleSheet.create({ offline: { flexDirection: "row", alignItems: "center", gap: 10 }, offlineText: { color: colors.text, flex: 1, lineHeight: 20 }, cardTitle: { color: colors.text, fontSize: 17, fontWeight: "800" }, muted: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 4, textTransform: "capitalize" }, gap: { marginTop: 16 }, form: { gap: 14 }, label: { color: colors.text, fontSize: 13, fontWeight: "700" }, list: { gap: 9 }, match: { flexDirection: "row", alignItems: "center", gap: 10 }, matchText: { flex: 1, gap: 5 }, statusRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }, number: { color: colors.primary, fontSize: 11, fontWeight: "900" }, badge: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 }, dot: { width: 6, height: 6, borderRadius: 3 }, live: { backgroundColor: "#15351f", borderColor: "#277a41" }, upcoming: { backgroundColor: "#152a45", borderColor: "#285e9d" }, completed: { backgroundColor: colors.surfaceMuted, borderColor: colors.border }, badgeText: { fontSize: 9, fontWeight: "900" }, liveText: { color: "#86efac" }, upcomingText: { color: "#93c5fd" }, completedText: { color: colors.muted } });
