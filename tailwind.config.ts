import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          page: "#1A1C23",
          card: "#252830",
        },
        primary: {
          DEFAULT: "#00AEFF",
        },
        foreground: {
          DEFAULT: "#FFFFFF",
          muted: "#A0A3AC",
        },
      },
    },
  },
  plugins: [],
};

export default config;
