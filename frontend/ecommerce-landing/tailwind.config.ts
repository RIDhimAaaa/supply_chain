import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}", // Keep this if it's necessary for your project structure
  ],
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
      fontFamily: {
        sf: ["-apple-system", "BlinkMacSystemFont", "SF Pro Display", "SF Pro Text", "system-ui", "sans-serif"],
      },
      colors: {
        // Existing colors, referring to HSL CSS variables
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

        // ADDED: Chart colors directly, will be converted to CSS vars by addVariablesForColors
        'chart-1': "hsl(var(--chart-1))",
        'chart-2': "hsl(var(--chart-2))",
        'chart-3': "hsl(var(--chart-3))",
        'chart-4': "hsl(var(--chart-4))",
        'chart-5': "hsl(var(--chart-5))",

        // ADDED: Sidebar colors directly, will be converted to CSS vars by addVariablesForColors
        'sidebar-background': "hsl(var(--sidebar-background))",
        'sidebar-foreground': "hsl(var(--sidebar-foreground))",
        'sidebar-primary': "hsl(var(--sidebar-primary))",
        'sidebar-primary-foreground': "hsl(var(--sidebar-primary-foreground))",
        'sidebar-accent': "hsl(var(--sidebar-accent))",
        'sidebar-accent-foreground': "hsl(var(--sidebar-accent-foreground))",
        'sidebar-border': "hsl(var(--sidebar-border))",
        'sidebar-ring': "hsl(var(--sidebar-ring))",

        // ADDED: The "supply" aliases for your vendor dashboard
        // These will refer to the HSL values defined in global.css
        'supply-dark': 'hsl(var(--background))', // Maps to current background in vendor theme
        'supply-card': 'hsl(var(--card))',       // Maps to current card in vendor theme
        'supply-border': 'hsl(var(--border))',   // Maps to current border in vendor theme
        'supply-purple': 'hsl(var(--primary))',  // Maps to current primary in vendor theme
        'supply-orange': 'hsl(var(--accent))',   // Maps to current accent in vendor theme
        'supply-green': 'hsl(var(--chart-2))',   // Maps to current chart-2 in vendor theme
        'supply-teal': 'hsl(var(--chart-4))',    // Maps to current chart-4 in vendor theme
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        aurora: {
          from: {
            backgroundPosition: "50% 50%, 50% 50%",
          },
          to: {
            backgroundPosition: "350% 50%, 350% 50%",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        aurora: "aurora 60s linear infinite",
      },
    },
  },
  // Keep your plugins as they are
  plugins: [require("tailwindcss-animate"), addVariablesForColors],
} satisfies Config

// Keep your existing addVariablesForColors plugin as is
// This plugin adds each Tailwind color as a global CSS variable, e.g. var(--gray-200).
function addVariablesForColors({ addBase, theme }: any) {
  try {
    // Try to import flattenColorPalette
    const flattenColorPalette = require("tailwindcss/lib/util/flattenColorPalette").default
    const allColors = flattenColorPalette(theme("colors"))
    const newVars = Object.fromEntries(Object.entries(allColors).map(([key, val]) => [`--${key}`, val]))

    addBase({
      ":root": newVars,
    })
  } catch (error) {
    // Fallback: manually add essential color variables
    addBase({
      ":root": {
        "--white": "#ffffff",
        "--black": "#000000",
        "--transparent": "transparent",
        "--teal-300": "#5eead4",
        "--teal-400": "#2dd4bf",
        "--teal-500": "#14b8a6",
        "--teal-600": "#0d9488",
        "--cyan-200": "#a5f3fc",
        "--blue-300": "#93c5fd",
        "--blue-400": "#60a5fa",
        "--blue-500": "#3b82f6",
        "--indigo-300": "#a5b4fc",
        "--violet-200": "#ddd6fe",
        "--purple-300": "#d8b4fe",
        "--pink-300": "#f9a8d4",
        "--emerald-300": "#6ee7b7",
        "--lime-300": "#bef264",
        "--yellow-300": "#fde047",
        "--orange-300": "#fdba74",
      },
    })
  }
}

export default config