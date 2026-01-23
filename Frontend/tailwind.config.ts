import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(30, 25%, 88%)",
        input: "hsl(30, 25%, 88%)",
        ring: "hsl(30, 55%, 55%)",
        background: "hsl(30, 50%, 97%)",
        foreground: "hsl(25, 30%, 20%)",
        primary: {
          DEFAULT: "hsl(30, 55%, 55%)",
          foreground: "hsl(0, 0%, 100%)",
        },
        secondary: {
          DEFAULT: "hsl(30, 30%, 90%)",
          foreground: "hsl(25, 30%, 25%)",
        },
        destructive: {
          DEFAULT: "hsl(0, 70%, 55%)",
          foreground: "hsl(0, 0%, 100%)",
        },
        success: {
          DEFAULT: "hsl(145, 60%, 45%)",
          foreground: "hsl(0, 0%, 100%)",
        },
        warning: {
          DEFAULT: "hsl(35, 95%, 55%)",
          foreground: "hsl(0, 0%, 100%)",
        },
        clockIn: "hsl(35, 90%, 55%)",
        clockOut: "hsl(0, 75%, 55%)",
        muted: {
          DEFAULT: "hsl(30, 20%, 92%)",
          foreground: "hsl(25, 15%, 50%)",
        },
        accent: {
          DEFAULT: "hsl(30, 45%, 85%)",
          foreground: "hsl(25, 30%, 20%)",
        },
        popover: {
          DEFAULT: "hsl(0, 0%, 100%)",
          foreground: "hsl(25, 30%, 20%)",
        },
        card: {
          DEFAULT: "hsl(30, 40%, 95%)",
          foreground: "hsl(25, 30%, 20%)",
        },
      },
      borderRadius: {
        lg: "1rem",
        md: "0.875rem",
        sm: "0.75rem",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [],
} satisfies Config;

