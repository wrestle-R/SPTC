import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AppThemeProvider, useAppTheme } from "@/lib/theme";

function Navigation() {
  const { colors, mode } = useAppTheme();
  return <><StatusBar style={mode === "dark" ? "light" : "dark"} /><Stack screenOptions={{ headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text, headerShadowVisible: false, contentStyle: { backgroundColor: colors.background } }}><Stack.Screen name="index" options={{ headerShown: false }} /><Stack.Screen name="(tabs)" options={{ headerShown: false }} /><Stack.Screen name="match/[matchId]" options={{ headerShown: false }} /></Stack></>;
}
export default function RootLayout() { return <AppThemeProvider><Navigation /></AppThemeProvider>; }
