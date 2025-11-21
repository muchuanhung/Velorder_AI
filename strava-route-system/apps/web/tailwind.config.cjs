/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,tsx}",
    "./components/**/*.{js,ts,tsx}",
    "./app/**/*.{js,ts,tsx}",
    "./src/**/*.{js,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        black: "rgba(0,0,0,<alpha-value>)",
        white: "#ffffff",
        primary: "rgba(var(--tw-primary),<alpha-value>)",
        secondary: "rgba(var(--tw-secondary),<alpha-value>)",
        info: "rgba(var(--tw-info),<alpha-value>)",
      },
      screens: {
        lg: "992px",
        xl: "1200px",
        "2xl": "1600px",
      },
      spacing: {
        2: "1rem",
        4: "2rem",
        6: "3rem",
        8: "4rem",
        10: "5rem",
        12: "6rem",
        14: "7rem",
        16: "8rem",
        18: "9rem",
        20: "10rem",
      },
    },
  },
  plugins: [],
};

