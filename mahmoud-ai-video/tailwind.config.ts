import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: { extend: { colors: { ink: "#111827", panel: "#171d2b", accent: "#7c6cff" } } },
  plugins: []
};
export default config;
