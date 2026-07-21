import { Tabs } from "expo-router";
import { ChartNoAxesColumnIncreasing, CircleDot, Hand, Trophy } from "lucide-react-native";
import { colors } from "@/lib/theme";

export default function TabsLayout() {
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.muted, tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, height: 66, paddingTop: 6, paddingBottom: 8 }, tabBarLabelStyle: { fontSize: 11, fontWeight: "700" } }}><Tabs.Screen name="teams" options={{ title: "Teams", tabBarIcon: ({ color, size }) => <ChartNoAxesColumnIncreasing color={color} size={size} /> }} /><Tabs.Screen name="football" options={{ title: "Football", tabBarIcon: ({ color, size }) => <CircleDot color={color} size={size} /> }} /><Tabs.Screen name="handball" options={{ title: "Handball", tabBarIcon: ({ color, size }) => <Hand color={color} size={size} /> }} /><Tabs.Screen name="cricket" options={{ title: "Cricket", tabBarIcon: ({ color, size }) => <Trophy color={color} size={size} /> }} /></Tabs>;
}
