import React, { createContext, useContext, useEffect, useMemo } from "react";
import { Appearance, useColorScheme, type ColorSchemeName as RNScheme } from "react-native";
import { getThemeColors, type ThemeColors, type ColorSchemeName } from "./tokens";
import { useThemeStore, type ThemeMode } from "./useThemeStore";

type ThemeContextValue = {
  mode: ThemeMode;
  scheme: ColorSchemeName;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export type ThemeProviderProps = {
  children: React.ReactNode;
  /** Sync NativeWind `dark:` classes when available */
  onSchemeChange?: (scheme: ColorSchemeName) => void;
};

function mapSystem(scheme: RNScheme): ColorSchemeName {
  return scheme === "dark" ? "dark" : "light";
}

export function ThemeProvider({ children, onSchemeChange }: ThemeProviderProps) {
  const system = useColorScheme();
  const mode = useThemeStore((s) => s.mode);
  const scheme = useThemeStore((s) => s.scheme);
  const setMode = useThemeStore((s) => s.setMode);
  const setSystemScheme = useThemeStore((s) => s.setSystemScheme);
  const toggle = useThemeStore((s) => s.toggle);

  useEffect(() => {
    setSystemScheme(mapSystem(system));
  }, [system, setSystemScheme]);

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(mapSystem(colorScheme));
    });
    return () => sub.remove();
  }, [setSystemScheme]);

  useEffect(() => {
    onSchemeChange?.(scheme);
  }, [scheme, onSchemeChange]);

  const colors = useMemo(() => getThemeColors(scheme), [scheme]);

  const value = useMemo(
    () => ({ mode, scheme, colors, setMode, toggle }),
    [mode, scheme, colors, setMode, toggle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}

/** Safe colors when outside provider (defaults to light). */
export function useThemeColors(): ThemeColors {
  const ctx = useContext(ThemeContext);
  return ctx?.colors ?? getThemeColors("light");
}
