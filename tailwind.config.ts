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
        // CP logo: primary green #367C00, accent gold #C4A634 (vibrant variants)
        primary: { DEFAULT: "#367C00", light: "#429a0a", dark: "#2a5d00", glow: "#4a9e0f" },
        accent: { DEFAULT: "#C4A634", light: "#e5c755", bright: "#f0d878", dark: "#a68a2b" },
      },
      boxShadow: {
        "accent-glow": "0 0 20px rgba(196, 166, 52, 0.35)",
        "accent-soft": "0 4px 14px rgba(196, 166, 52, 0.25)",
        "green-soft": "0 4px 20px rgba(54, 124, 0, 0.2)",
      },
    },
  },
  plugins: [],
};
export default config;
