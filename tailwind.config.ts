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
        // Pierce Business Integrations brand palette
        charcoal: {
          DEFAULT: "#1F1F1D",
          soft: "#3a3a37",
        },
        ivory: {
          DEFAULT: "#F7F3ED",
          deep: "#efe8dc",
        },
        brass: {
          DEFAULT: "#B89456",
          deep: "#9c7a3f",
          light: "#d3b986",
        },
        taupe: "#8E8578",
        foothill: {
          DEFAULT: "#5D6E5E",
          deep: "#495847",
          light: "#A8B6A6",
        },
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        eyebrow: "0.24em",
      },
      boxShadow: {
        soft: "0 24px 70px rgba(31, 31, 29, 0.12)",
        brass: "0 14px 34px rgba(184, 148, 86, 0.32)",
        panel: "0 40px 120px rgba(31, 31, 29, 0.18)",
      },
      keyframes: {
        "slow-zoom": {
          from: { transform: "scale(1.08)" },
          to: { transform: "scale(1)" },
        },
        "scroll-dot": {
          "0%, 100%": { opacity: "0", transform: "translateY(0)" },
          "50%": { opacity: "1", transform: "translateY(10px)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        "slow-zoom": "slow-zoom 24s ease-out forwards",
        "scroll-dot": "scroll-dot 1.8s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
