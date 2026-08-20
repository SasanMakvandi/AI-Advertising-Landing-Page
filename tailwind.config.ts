import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        "background-elevated": "var(--background-elevated)",
        foreground: "var(--foreground)",
        muted: "var(--muted)",
        "muted-2": "var(--muted-2)",
        border: "var(--border)",
        "border-strong": "var(--border-strong)",
        "accent-violet": "var(--accent-violet)",
        "accent-cyan": "var(--accent-cyan)",
        "accent-pink": "var(--accent-pink)",
        card: "var(--card)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Arial", "Helvetica", "sans-serif"],
        display: ["var(--font-space-grotesk)", "var(--font-inter)", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
