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
        crusoe: {
          50: '#F2FCF1',
          100: '#E1F9DF',
          200: '#C4F1C1',
          300: '#95E590',
          400: '#5FD058',
          500: '#39B532',
          600: '#2A9524',
          700: '#23761F',
          800: '#205D1E',
          900: '#184417',
          950: '#092A09',
        },
        brand: {
          primary: '#2A9524',    // Crusoe 600
          strong: '#23761F',     // Crusoe 700
          cta: '#39B532',        // Crusoe 500
          bg: '#F2FCF1',         // Crusoe 50
          text: '#092A09',       // Crusoe 950
          border: '#C4F1C1',     // Crusoe 200
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
