import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#fdfcf8",
        ink: "#1a1a1a",
        graphite: "#2d2d2d",
        stone: "#6b6b6b",
        line: "#e8e3db",
        indigo: {
          50: "#eef0ff",
          100: "#d9ddff",
          500: "#4f46e5",
          600: "#4338ca",
          700: "#3730a3"
        },
        verified: "#166534",
        amber: {
          500: "#d97706",
          50: "#fffbeb"
        },
        failed: "#991b1b"
      },
      fontFamily: {
        mono: ["JetBrains Mono", "monospace"],
        serif: ["Playfair Display", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"]
      }
    },
  },
  plugins: [],
};
export default config;
