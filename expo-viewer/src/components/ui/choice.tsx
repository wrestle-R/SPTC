import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { useAppTheme } from "@/lib/theme";

export function Choice({ value, onChange, items }: { value: string; onChange: (value: string) => void; items: { value: string; label: string }[] }) {
  const { colors } = useAppTheme();
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>{items.map((item) => { const active = value === item.value; return <Pressable key={item.value} accessibilityRole="button" accessibilityState={{ selected: active }} onPress={() => onChange(item.value)} style={[styles.choice, { backgroundColor: active ? colors.primary : colors.surfaceMuted, borderColor: active ? colors.primary : colors.border }]}><Text style={[styles.label, { color: active ? colors.background : colors.text }]}>{item.label}</Text></Pressable>; })}</ScrollView>;
}
const styles = StyleSheet.create({ row: { gap: 8 }, choice: { minHeight: 42, borderWidth: 1, borderRadius: 8, paddingHorizontal: 13, alignItems: "center", justifyContent: "center" }, label: { fontSize: 13, fontWeight: "800" } });
