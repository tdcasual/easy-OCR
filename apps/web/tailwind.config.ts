import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        surface: "hsl(var(--surface))",
        "surface-subtle": "hsl(var(--surface-subtle))",
        border: "hsl(var(--border))",
        muted: "hsl(var(--muted))",
        brand: "hsl(var(--brand))",
        "brand-soft": "hsl(var(--brand-soft))",
        success: "hsl(var(--success))",
        "success-soft": "hsl(var(--success-soft))",
        warning: "hsl(var(--warning))",
        "warning-soft": "hsl(var(--warning-soft))",
        danger: "hsl(var(--danger))",
        "danger-soft": "hsl(var(--danger-soft))",
        info: "hsl(var(--info))",
        "info-soft": "hsl(var(--info-soft))",
      },
      boxShadow: {
        panel: "0 10px 28px hsl(var(--shadow) / 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
