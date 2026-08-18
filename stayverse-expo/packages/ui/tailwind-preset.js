/** Shared Tailwind / NativeWind preset — values mirrored from src/theme/tokens.ts */
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: "#FBC036",
        navy: "#011369",
        foreground: "#232C33",
        background: "#FFFFFF",
        secondary: "#E1E1E1",
        border: "#AAADB7",
        muted: "#9D9995",
        error: "#EF4444",
        success: "#22C55E",
        destructive: "#DC2626",
        "dark-bg": "#232C33",
        "dark-fg": "#E1E1E1",
      },
      spacing: {
        xxs: "4px",
        xs: "8px",
        sm: "12px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        "2xl": "48px",
        "3xl": "56px",
        offset: "80px",
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        input: "10px",
        sheet: "20px",
        lg: "32px",
      },
      fontFamily: {
        sans: ["NeueMontreal-Regular"],
        medium: ["NeueMontreal-Medium"],
        bold: ["NeueMontreal-Bold"],
      },
    },
  },
};
