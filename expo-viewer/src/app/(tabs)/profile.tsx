import { Moon, Sun } from "lucide-react-native";
import { StyleSheet, Switch, Text, View } from "react-native";
import { Card, Screen } from "@/components/ui/primitives";
import { useAppTheme } from "@/lib/theme";

export default function ProfileScreen() {
  const { mode, setMode, colors } = useAppTheme(); const dark = mode === "dark";
  return <Screen title="Profile" subtitle="Choose how Sports Fiesta looks on this device."><Card><View style={styles.row}><View style={[styles.icon, { backgroundColor: colors.surfaceMuted }]}>{dark ? <Moon color={colors.primary} /> : <Sun color={colors.primary} />}</View><View style={styles.text}><Text style={[styles.title, { color: colors.text }]}>{dark ? "Dark mode" : "Light mode"}</Text><Text style={[styles.description, { color: colors.muted }]}>Your preference is saved automatically.</Text></View><Switch accessibilityLabel="Toggle dark mode" value={dark} onValueChange={(value) => setMode(value ? "dark" : "light")} trackColor={{ false: colors.border, true: colors.primary }} thumbColor={colors.surface} /></View></Card></Screen>;
}
const styles = StyleSheet.create({ row: { flexDirection: "row", alignItems: "center", gap: 12 }, icon: { width: 42, height: 42, borderRadius: 9, alignItems: "center", justifyContent: "center" }, text: { flex: 1 }, title: { fontSize: 16, fontWeight: "800" }, description: { fontSize: 12, lineHeight: 17, marginTop: 3 } });
