import { Redirect, Tabs } from "expo-router";
import { House, Settings, Users } from "lucide-react-native";
import { colors } from "@/lib/theme";
import { StateView } from "@/components/ui";
import { useOrganizerAuth } from "@/providers/auth-provider";
export default function TabsLayout() { const { user, loading } = useOrganizerAuth(); if (loading) return <StateView loading />; if (!user) return <Redirect href="/login" />; return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.muted, tabBarStyle: { height: 66, paddingTop: 6, paddingBottom: 8, backgroundColor: colors.surface, borderTopColor: colors.border }, tabBarLabelStyle: { fontSize: 11, fontWeight: "700" } }}><Tabs.Screen name="home" options={{ title: "Home", tabBarIcon: ({ color, size }) => <House color={color} size={size} /> }} /><Tabs.Screen name="teams" options={{ title: "Teams", tabBarIcon: ({ color, size }) => <Users color={color} size={size} /> }} /><Tabs.Screen name="settings" options={{ title: "Settings", tabBarIcon: ({ color, size }) => <Settings color={color} size={size} /> }} /></Tabs>; }
