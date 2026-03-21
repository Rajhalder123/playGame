import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: "#0a0f0a",
          darker: "#060906",
          green: "#1b5e20",
          "green-light": "#2e7d32",
          lime: "#c6ff00",
          accent: "#4caf50",
          teal: "#0d3d2e",
          card: "#0f2b1a",
          "card-hover": "#143a22",
          gold: "#ffd700",
          yellow: "#ffeb3b",
          surface: "#111b11",
          border: "#1e4d2b",
          muted: "#8a9a8a",
          nav: "#0d1f12",
          sidebar: "#0b1a0e",
        },
      },
    },
  },
  plugins: [],
};
export default config;
