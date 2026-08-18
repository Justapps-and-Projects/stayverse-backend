/**
 * Stayverse design tokens — ported from Flutter AppStyle / LightThemeColors / DarkThemeColors.
 */

export const palette = {
  primary: "#FBC036",
  navy: "#011369",
  foreground: "#232C33",
  text: "#2C2C2C",
  background: "#FFFFFF",
  secondary: "#E1E1E1",
  white: "#FFFFFF",
  black: "#000000",
  border: "#AAADB7",
  borderFocus: "#FBC036",
  mutedIcon: "#ACACAC",
  error: "#EF4444",
  success: "#22C55E",
  destructive: "#DC2626",
  // Neutrals (AppColors)
  offWhite: "#F8ECE5",
  caption: "#7D7873",
  body: "#514F4D",
  greyStrong: "#272625",
  greyMedium: "#9D9995",
  lightGrey: "#F2F2F2",
  greyF7: "#F7F7F7",
  greyF4: "#F4F4F4",
  grey8F: "#8F8F8F",
  // Agent accent tints
  yellowD7: "#FEF2D7",
  yellowB7: "#FDE8B7",
  yellowC9: "#FDEDC9",
  yellow95: "#FFDF95",
  blue50: "#263F50",
  // Dark theme
  darkBackground: "#232C33",
  darkForeground: "#E1E1E1",
  darkSecondary: "#FF5303",
  darkPrimary: "#011369",
  darkAppBar: "#4B5E6D",
} as const;

export type ColorSchemeName = "light" | "dark";

export type ThemeColors = {
  background: string;
  foreground: string;
  text: string;
  primary: string;
  primaryContent: string;
  secondary: string;
  onSecondary: string;
  border: string;
  borderFocus: string;
  surface: string;
  surfaceContent: string;
  appBar: string;
  appBarContent: string;
  buttonBg: string;
  buttonContent: string;
  muted: string;
  error: string;
  success: string;
  destructive: string;
  card: string;
  overlay: string;
};

export const lightColors: ThemeColors = {
  background: palette.background,
  foreground: palette.foreground,
  text: palette.text,
  primary: palette.primary,
  primaryContent: palette.white,
  secondary: palette.secondary,
  onSecondary: palette.foreground,
  border: palette.border,
  borderFocus: palette.borderFocus,
  surface: palette.white,
  surfaceContent: palette.black,
  appBar: palette.foreground,
  appBarContent: palette.white,
  buttonBg: palette.navy,
  buttonContent: palette.white,
  muted: palette.greyMedium,
  error: palette.error,
  success: palette.success,
  destructive: palette.destructive,
  card: palette.white,
  overlay: "rgba(0,0,0,0.4)",
};

export const darkColors: ThemeColors = {
  background: palette.darkBackground,
  foreground: palette.darkForeground,
  text: palette.white,
  primary: palette.darkPrimary,
  primaryContent: palette.darkForeground,
  secondary: palette.darkSecondary,
  onSecondary: palette.darkForeground,
  border: "#4B5E6D",
  borderFocus: palette.primary,
  surface: "#2C3640",
  surfaceContent: palette.darkForeground,
  appBar: palette.darkAppBar,
  appBarContent: palette.white,
  buttonBg: "rgba(255,255,255,0.6)",
  buttonContent: palette.foreground,
  muted: "rgba(255,255,255,0.6)",
  error: palette.error,
  success: palette.success,
  destructive: palette.destructive,
  card: "#2C3640",
  overlay: "rgba(0,0,0,0.6)",
};

export const fontFamily = {
  sans: "NeueMontreal-Regular",
  light: "NeueMontreal-Light",
  medium: "NeueMontreal-Medium",
  bold: "NeueMontreal-Bold",
  italic: "NeueMontreal-Italic",
} as const;

export const typography = {
  dropCase: { fontSize: 56, lineHeight: 20, fontFamily: fontFamily.sans },
  h1: { fontSize: 64, lineHeight: 62, fontFamily: fontFamily.sans },
  h2: { fontSize: 32, lineHeight: 46, fontFamily: fontFamily.sans },
  h3: { fontSize: 24, lineHeight: 36, fontFamily: fontFamily.medium, fontWeight: "600" as const },
  h4: { fontSize: 14, lineHeight: 23, fontFamily: fontFamily.medium, fontWeight: "600" as const, letterSpacing: 0.7 },
  title1: { fontSize: 16, lineHeight: 26, fontFamily: fontFamily.sans, letterSpacing: 0.8 },
  title2: { fontSize: 14, lineHeight: 16, fontFamily: fontFamily.sans },
  body: { fontSize: 16, lineHeight: 26, fontFamily: fontFamily.sans },
  bodyBold: { fontSize: 16, lineHeight: 26, fontFamily: fontFamily.medium, fontWeight: "600" as const },
  bodySmall: { fontSize: 14, lineHeight: 23, fontFamily: fontFamily.sans },
  bodySmallBold: { fontSize: 14, lineHeight: 23, fontFamily: fontFamily.medium, fontWeight: "600" as const },
  quote1: { fontSize: 32, lineHeight: 40, fontFamily: fontFamily.medium, fontWeight: "600" as const, letterSpacing: -0.96 },
  quote2: { fontSize: 21, lineHeight: 32, fontFamily: fontFamily.sans, fontWeight: "400" as const },
  caption: { fontSize: 14, lineHeight: 20, fontFamily: fontFamily.medium, fontWeight: "500" as const, fontStyle: "italic" as const },
  callout: { fontSize: 16, lineHeight: 26, fontFamily: fontFamily.medium, fontWeight: "600" as const, fontStyle: "italic" as const },
  btn: { fontSize: 14, lineHeight: 14, fontFamily: fontFamily.medium, fontWeight: "500" as const, letterSpacing: 0.28 },
} as const;

export type TypographyKey = keyof typeof typography;

/** Flutter $styles.insets (unscaled phone baseline) + design-doc 12 */
export const spacing = {
  0: 0,
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 48,
  "3xl": 56,
  offset: 80,
} as const;

export const radius = {
  zero: 1,
  sm: 4,
  md: 8,
  input: 10,
  sheet: 20,
  lg: 32,
  full: 9999,
} as const;

export const shadows = {
  textSoft: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  text: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 2,
    elevation: 3,
  },
  textStrong: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 6,
  },
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 12, height: 12 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 2,
  },
  mapBottom: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.19,
    shadowRadius: 3.5,
    elevation: 4,
  },
} as const;

export const duration = {
  fast: 300,
  med: 600,
  slow: 900,
  page: 200,
} as const;

export function getThemeColors(scheme: ColorSchemeName): ThemeColors {
  return scheme === "dark" ? darkColors : lightColors;
}
