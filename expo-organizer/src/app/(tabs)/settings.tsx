import { Save } from "lucide-react-native";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Action, Card, Field, Screen, Section, StateView } from "@/components/ui";
import { command, useTournament } from "@/hooks/use-private-data";
import { colors } from "@/lib/theme";

type Settings = { name?: string; organizer?: string; venues?: string[]; placementPoints?: Record<string, number[]> };
export default function SettingsScreen() {
  const settings = useTournament<Settings>();
  const [name, setName] = useState(""); const [organizer, setOrganizer] = useState(""); const [venues, setVenues] = useState(""); const [pending, setPending] = useState(false);
  const tournamentName = name || settings.data?.name || "Sports Fiesta"; const tournamentOrganizer = organizer || settings.data?.organizer || "SPTC"; const tournamentVenues = venues || settings.data?.venues?.join(", ") || "";
  async function save() { setPending(true); try { await command("saveTournamentSettings", { name: tournamentName, organizer: tournamentOrganizer, venues: tournamentVenues.split(",").map((item) => item.trim()).filter(Boolean) }); Alert.alert("Saved", "Tournament settings updated."); } catch (cause) { Alert.alert("Update failed", cause instanceof Error ? cause.message : "Please try again."); } finally { setPending(false); } }
  if (settings.loading) return <Screen title="Settings"><StateView loading /></Screen>;
  return <Screen title="Settings" subtitle="Tournament information and placement points.">{settings.error ? <StateView error={settings.error} /> : null}<Section title="Tournament"><Card><View style={styles.form}><Field label="Tournament name" value={tournamentName} onChangeText={setName} /><Field label="Organizer" value={tournamentOrganizer} onChangeText={setOrganizer} /><Field label="Venues, comma separated" value={tournamentVenues} onChangeText={setVenues} /><View style={styles.rule}><Text style={styles.ruleLabel}>Cricket format</Text><Text style={styles.ruleValue}>5 overs per innings</Text></View><Action label="Save tournament" disabled={pending} onPress={save} icon={<Save color={colors.background} size={18} />} /></View></Card></Section><Section title="Placement points"><View style={styles.list}>{["football", "handball", "cricket"].map((sport) => <Card key={sport}><Text style={styles.sport}>{sport}</Text><Text style={styles.points}>{(settings.data?.placementPoints?.[sport] ?? [10, 5, 3, 1]).join(" · ")}</Text><Text style={styles.help}>1st · 2nd · 3rd · 4th</Text></Card>)}</View></Section></Screen>;
}
const styles = StyleSheet.create({ form: { gap: 14 }, rule: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12, paddingVertical: 5 }, ruleLabel: { color: colors.muted, fontSize: 14 }, ruleValue: { color: colors.text, fontWeight: "800" }, list: { gap: 9 }, sport: { color: colors.primary, fontWeight: "900", textTransform: "uppercase", fontSize: 11 }, points: { color: colors.text, fontSize: 23, fontWeight: "900", marginTop: 7 }, help: { color: colors.muted, fontSize: 12, marginTop: 4 } });
