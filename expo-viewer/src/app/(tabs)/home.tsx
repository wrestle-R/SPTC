import { S9_PLAYERS, S9_TEAMS } from "@sports-fiesta/domain";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { MatchList } from "@/components/match-list";
import { Choice } from "@/components/ui/choice";
import { Button, Card, Screen, Section, StateView } from "@/components/ui/primitives";
import { usePublicCollection } from "@/hooks/use-public-data";
import { useAppTheme } from "@/lib/theme";
import type { PublicMatch, PublicTeam } from "@/lib/types";

const API_URL = (process.env.EXPO_PUBLIC_API_URL || "https://sptc-fiesta.vercel.app").replace(/\/+$/, "");
const sports = [{ value: "cricket", label: "Cricket" }, { value: "football", label: "Football" }, { value: "handball", label: "Handball" }];
const stages = [{ value: "league", label: "League" }, { value: "semifinal", label: "Semi-final" }, { value: "final", label: "Final" }];

export default function HomeScreen() {
  const { colors } = useAppTheme(); const matches = usePublicCollection<PublicMatch>("matches"); const teams = usePublicCollection<PublicTeam>("teams");
  const [sport, setSport] = useState("cricket"); const [home, setHome] = useState(""); const [away, setAway] = useState(""); const [stage, setStage] = useState("league"); const [pending, setPending] = useState(false);
  const teamRows = teams.data.length ? teams.data : S9_TEAMS;
  const live = matches.data.filter((match) => ["live", "innings-break", "super-over"].includes(match.status)).length;
  async function createFixture() { setPending(true); try { const response = await fetch(`${API_URL}/api/organizer/command`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ command: "createMatch", data: { sport, homeTeamId: home, awayTeamId: away, stage } }) }); const body = await response.json() as { result?: { id: string }; error?: { message: string } }; if (!response.ok || body.error) throw new Error(body.error?.message || "Fixture creation failed."); Alert.alert("Fixture created", "The match number was generated automatically."); } catch (cause) { Alert.alert("Could not create fixture", cause instanceof Error ? cause.message : "Please try again."); } finally { setPending(false); } }
  if (matches.loading || teams.loading) return <Screen title="Home"><StateView loading /></Screen>;
  return <Screen title="Home" subtitle="Tournament overview and match centre.">
    {matches.error || teams.error ? <StateView error={matches.error || teams.error} /> : null}
    <View style={styles.stats}>{[["Live", live], ["Matches", matches.data.length], ["Teams", teamRows.length], ["Players", S9_PLAYERS.length]].map(([label, value]) => <Card key={label as string} style={styles.stat}><Text style={[styles.statValue, { color: colors.text }]}>{value}</Text><Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text></Card>)}</View>
    <Section title="Create fixture"><Card><View style={styles.form}><Text style={[styles.label, { color: colors.text }]}>Sport</Text><Choice value={sport} onChange={setSport} items={sports} /><Text style={[styles.label, { color: colors.text }]}>Home team</Text><Choice value={home} onChange={setHome} items={teamRows.map((team) => ({ value: team.id, label: team.shortName }))} /><Text style={[styles.label, { color: colors.text }]}>Away team</Text><Choice value={away} onChange={setAway} items={teamRows.filter((team) => team.id !== home).map((team) => ({ value: team.id, label: team.shortName }))} /><Text style={[styles.label, { color: colors.text }]}>Stage</Text><Choice value={stage} onChange={setStage} items={stages} /><Button label={pending ? "Creating fixture" : "Create fixture"} disabled={pending || !home || !away || home === away} onPress={createFixture} /></View></Card></Section>
    <Section title="All matches"><MatchList /></Section>
  </Screen>;
}
const styles = StyleSheet.create({ stats: { flexDirection: "row", gap: 7 }, stat: { flex: 1, paddingHorizontal: 6, paddingVertical: 12, alignItems: "center" }, statValue: { fontSize: 20, fontWeight: "900" }, statLabel: { marginTop: 4, fontSize: 10, fontWeight: "700", textAlign: "center" }, form: { gap: 13 }, label: { fontSize: 13, fontWeight: "800" } });
