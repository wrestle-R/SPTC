import { Tabs } from "expo-router";
import { CircleUserRound, House, Medal, Trophy } from "lucide-react-native";
import { useAppTheme } from "@/lib/theme";

export default function TabsLayout() {
  const { colors } = useAppTheme();
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.muted, tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, height: 70, paddingTop: 7, paddingBottom: 9 }, tabBarLabelStyle: { fontSize: 11, fontWeight: "700" } }}><Tabs.Screen name="home" options={{ title: "Home", tabBarIcon: ({ color, size }) => <House color={color} size={size} /> }} /><Tabs.Screen name="matches" options={{ title: "Matches", tabBarIcon: ({ color, size }) => <Trophy color={color} size={size} /> }} /><Tabs.Screen name="sports" options={{ title: "Sports", tabBarIcon: ({ color, size }) => <Medal color={color} size={size} /> }} /><Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color, size }) => <CircleUserRound color={color} size={size} /> }} /></Tabs>;
}
