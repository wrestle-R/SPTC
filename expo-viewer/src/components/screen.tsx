import type { PropsWithChildren, ReactNode } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/lib/theme";

export function Screen({ title, subtitle, children }: PropsWithChildren<{ title: string; subtitle?: string }>) {
  return <SafeAreaView style={styles.safe} edges={["top"]}><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}><View style={styles.brand}><View style={styles.mark}><Text style={styles.markText}>S9</Text></View><Text style={styles.brandText}>SPORTS FIESTA</Text></View><View><Text style={styles.title}>{title}</Text>{subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}</View>{children}</ScrollView></SafeAreaView>;
}

export function Section({ title, children }: PropsWithChildren<{ title: string }>) { return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>; }
export function Card({ children }: PropsWithChildren) { return <View style={styles.card}>{children}</View>; }
export function StateView({ loading, error, empty }: { loading?: boolean; error?: string | null; empty?: ReactNode }) { if (loading) return <View style={styles.state}><ActivityIndicator color={colors.primary} /><Text style={styles.muted}>Loading live tournament data</Text></View>; if (error) return <View style={styles.state}><Text style={styles.error}>Live data is unavailable</Text><Text style={styles.muted}>{error}</Text></View>; return empty ? <View style={styles.state}>{empty}</View> : null; }

export const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.background }, content: { padding: 18, paddingBottom: 36, gap: 24 }, brand: { flexDirection: "row", alignItems: "center", gap: 10 }, mark: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 8, backgroundColor: colors.primary }, markText: { color: colors.background, fontSize: 14, fontWeight: "900" }, brandText: { color: colors.muted, fontSize: 12, fontWeight: "800" }, title: { color: colors.text, fontSize: 30, lineHeight: 36, fontWeight: "800" }, subtitle: { color: colors.muted, fontSize: 16, lineHeight: 23, marginTop: 6 }, section: { gap: 12 }, sectionTitle: { color: colors.text, fontSize: 20, fontWeight: "700" }, card: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: 8, padding: 16 }, state: { minHeight: 150, borderWidth: 1, borderColor: colors.border, borderRadius: 8, alignItems: "center", justifyContent: "center", padding: 20, gap: 8 }, muted: { color: colors.muted, textAlign: "center", fontSize: 14, lineHeight: 20 }, error: { color: colors.danger, fontSize: 16, fontWeight: "700" } });
