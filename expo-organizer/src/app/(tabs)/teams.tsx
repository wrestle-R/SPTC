import { S9_PLAYERS, S9_TEAMS } from "@sports-fiesta/domain";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Choice } from "@/components/choice";
import { Card, Screen, Section, StateView } from "@/components/ui";
import { usePrivateCollection } from "@/hooks/use-private-data";
import { colors } from "@/lib/theme";
import type { Team } from "@/lib/types";

export default function TeamsScreen() {
  const teams = usePrivateCollection<Team>("teams");
  const [teamId, setTeamId] = useState("");
  const finalizedTeams = S9_TEAMS.map((seededTeam) => teams.data.find((team) => team.id === seededTeam.id) ?? seededTeam);
  const activeTeamId = teamId || finalizedTeams[0]?.id || "";
  const team = finalizedTeams.find((item) => item.id === activeTeamId);
  const roster = S9_PLAYERS.filter((player) => player.teamId === activeTeamId && player.active);
  if (teams.loading) return <Screen title="Teams"><StateView loading /></Screen>;
  return <Screen title="Teams" subtitle="Finalized rosters are read-only.">
    {teams.error ? <StateView error={teams.error} /> : null}
    <Choice value={activeTeamId} onChange={setTeamId} items={finalizedTeams.map((item) => ({ value: item.id, label: item.name }))} />
    <Section title={`${team?.name ?? "Team"} (${roster.length})`}><View style={styles.list}>{roster.map((player, index) => <Card key={player.id}><View style={styles.row}><View style={styles.index}><Text style={styles.indexText}>{index + 1}</Text></View><View style={styles.player}><Text style={styles.playerName}>{player.name}</Text><Text style={styles.meta}>{player.role === "unassigned" ? "Player" : player.role.replaceAll("-", " ")}{player.jerseyNumber !== null ? ` · #${player.jerseyNumber}` : ""}</Text></View></View></Card>)}</View></Section>
  </Screen>;
}

const styles = StyleSheet.create({ list: { gap: 9 }, row: { flexDirection: "row", alignItems: "center", gap: 12 }, index: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceMuted }, indexText: { color: colors.muted, fontSize: 12, fontWeight: "800" }, player: { flex: 1 }, playerName: { color: colors.text, fontSize: 16, fontWeight: "800" }, meta: { color: colors.muted, fontSize: 12, marginTop: 4, textTransform: "capitalize" } });
