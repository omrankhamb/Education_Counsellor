// Color palette & design tokens for Hybrid College Recommendation
export const theme = {
  colors: {
    primary: "#1A237E",        // Deep Blue
    primaryLight: "#3949AB",   // Medium Blue
    primaryDark: "#0D1457",    // Dark Blue
    accent: "#FFB300",         // Amber Gold
    accentLight: "#FFD54F",    // Light Gold
    success: "#2E7D32",        // Green (eligible)
    warning: "#E65100",        // Orange (borderline)
    error: "#C62828",          // Red (not eligible)
    background: "#F5F7FA",     // Light Gray bg
    surface: "#FFFFFF",        // White cards
    surfaceGlass: "rgba(255,255,255,0.85)", // Glass effect
    text: "#1A1A2E",           // Dark text
    textSecondary: "#546E7A",  // Gray text
    border: "#E0E7FF",         // Light border
    gradient: "linear-gradient(135deg, #1A237E 0%, #3949AB 50%, #1565C0 100%)",
    gradientGold: "linear-gradient(135deg, #FFB300 0%, #FF8F00 100%)",
  },
  fonts: {
    heading: "'Poppins', sans-serif",
    body: "'Inter', sans-serif",
  },
  shadows: {
    card: "0 4px 24px rgba(26, 35, 126, 0.10)",
    cardHover: "0 8px 40px rgba(26, 35, 126, 0.18)",
    button: "0 4px 16px rgba(26, 35, 126, 0.25)",
  },
  borderRadius: {
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
    full: "9999px",
  },
};

export default theme;
