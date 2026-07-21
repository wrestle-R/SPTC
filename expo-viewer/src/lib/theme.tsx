import AsyncStorage from "@react-native-async-storage/async-storage";
import { brand, chartColors } from "@sports-fiesta/theme";
import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";

export type ThemeMode = "dark" | "light";
const palettes = {
  dark: { background: "#111210", surface: "#1a1b18", surfaceMuted: "#22231f", border: "#34352f", text: "#f5f5f0", muted: "#a5a69d", primary: brand.orange, teal: brand.tealBright, danger: "#ef4444", ...chartColors },
  light: { background: "#f8faf7", surface: "#ffffff", surfaceMuted: "#eef1eb", border: "#d8ddd4", text: "#171914", muted: "#667064", primary: brand.orangeStrong, teal: brand.teal, danger: "#dc2626", ...chartColors },
} as const;
export type ThemeColors = typeof palettes.dark | typeof palettes.light;
const ThemeContext = createContext<{ mode: ThemeMode; colors: ThemeColors; setMode: (mode: ThemeMode) => void }>({ mode: "dark", colors: palettes.dark, setMode: () => undefined });

export function AppThemeProvider({ children }: PropsWithChildren) {
  const [mode, setModeState] = useState<ThemeMode>("dark");
  useEffect(() => { AsyncStorage.getItem("viewer-theme").then((saved) => { if (saved === "light" || saved === "dark") setModeState(saved); }); }, []);
  const setMode = (next: ThemeMode) => { setModeState(next); void AsyncStorage.setItem("viewer-theme", next); };
  const value = useMemo(() => ({ mode, colors: palettes[mode], setMode }), [mode]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
export function useAppTheme() { return useContext(ThemeContext); }
export const colors = palettes.dark;
