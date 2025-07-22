/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./index.html",
    "../components.json"
  ],

  theme: {
    extend: {
      colors: {
        'sentinel-blue': {
          DEFAULT: '#0079F2',
          50: '#f0f8ff',
          100: '#e1f1fe',
          200: '#c8e4fd',
          300: '#a2d1fb',
          400: '#76b6f7',
          500: '#4e96f2',
          600: '#0079F2',
          700: '#0062c2',
          800: '#004d99',
          900: '#003a73',
        },
        'sentinel-green': {
          DEFAULT: '#06d6a0',
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#06d6a0',
          700: '#0891b2',
          800: '#0e7490',
          900: '#155e75',
        },
        'sentinel-amber': {
          DEFAULT: '#ffd60a',
          50: '#fffdf0',
          100: '#fffbeb',
          200: '#fef3c7',
          300: '#fde68a',
          400: '#fcd34d',
          500: '#fbbf24',
          600: '#ffd60a',
          700: '#d97706',
          800: '#92400e',
          900: '#78350f',
        },
        'sentinel-red': {
          DEFAULT: '#ef476f',
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef476f',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        'sentinel-slate': '#2d3748',
        'sentinel-slate-light': '#718096',
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
}