/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#ffffff",
        paper: "#f6f5f4",
        ink: "#000000",
        "ink-2": "#31302e",
        "ink-3": "#615d59",
        "ink-4": "#a39e98",
        hairline: "#e6e6e6",
        primary: "#0075de",
        "primary-active": "#005bab",
        sky: "#62aef0",
        teal: "#2a9d99",
        green: "#1aae39",
        orange: "#dd5b00",
        pink: "#ff64c8",
        purple: "#d6b6f6",
      },
      fontFamily: {
        display: ['Manrope', "DM Sans", "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "monospace"],
      },
      boxShadow: {
        soft: "rgba(0,0,0,0.01) 0 0.175px 1.041px, rgba(0,0,0,0.02) 0 0.8px 2.925px, rgba(0,0,0,0.027) 0 2.025px 7.847px",
        lift: "rgba(0,0,0,0.04) 0 4px 18px, rgba(0,0,0,0.05) 0 23px 52px",
      },
    },
  },
  plugins: [],
};
