import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        oksid: "#ff8008",
        bayinet: "#ff3c3c",
        denge: "#232526",
        penta: "#d10000",
      },
      container: {
        center: true,
        padding: "2rem",
        screens: { "2xl": "1440px" },
      },
    },
  },
  plugins: [],
} satisfies Config;
