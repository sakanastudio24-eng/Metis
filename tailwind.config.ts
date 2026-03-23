import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        metis: {
          navy: "var(--metis-color-navy)",
          orange: "var(--metis-color-orange)",
          white: "var(--metis-color-white)"
        }
      },
      boxShadow: {
        panel: "var(--metis-shadow-panel)"
      }
    }
  },
  plugins: []
} satisfies Config;
