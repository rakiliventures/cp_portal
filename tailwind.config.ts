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
        primary: { DEFAULT: "#1e3a5f", light: "#2c5282", dark: "#0f2744" },
        accent: { DEFAULT: "#c9a227", light: "#e6c04a", dark: "#9a7b1a" },
      },
    },
  },
  plugins: [],
};
export default config;
