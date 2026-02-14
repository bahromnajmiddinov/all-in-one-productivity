import type { Config } from 'tailwindcss'

const config = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        'border-subtle': 'hsl(var(--border-subtle))',
        input: 'hsl(var(--border))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--bg))',
        foreground: 'hsl(var(--fg))',
        'fg-muted': 'hsl(var(--fg-muted))',
        'fg-subtle': 'hsl(var(--fg-subtle))',
        'bg-elevated': 'hsl(var(--bg-elevated))',
        'bg-subtle': 'hsl(var(--bg-subtle))',
        primary: {
          DEFAULT: 'hsl(var(--fg))',
          foreground: 'hsl(var(--bg))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--bg-subtle))',
          foreground: 'hsl(var(--fg))',
        },
        destructive: {
          DEFAULT: 'hsl(0 72% 51%)',
          foreground: 'hsl(0 0% 98%)',
        },
        muted: {
          DEFAULT: 'hsl(var(--bg-subtle))',
          foreground: 'hsl(var(--fg-muted))',
        },
        accent: {
          DEFAULT: 'hsl(var(--bg-elevated))',
          foreground: 'hsl(var(--fg))',
        },
        popover: {
          DEFAULT: 'hsl(var(--bg-elevated))',
          foreground: 'hsl(var(--fg))',
        },
        card: {
          DEFAULT: 'hsl(var(--bg-elevated))',
          foreground: 'hsl(var(--fg))',
        },
      },
      borderRadius: {
        lg: 'var(--radius-lg)',
        md: 'var(--radius)',
        sm: 'calc(var(--radius) - 4px)',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      boxShadow: {
        'soft': 'var(--shadow)',
        'soft-md': 'var(--shadow-md)',
        'soft-lg': 'var(--shadow-lg)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      maxWidth: {
        'content': '960px',
      },
    },
  },
  plugins: [],
} satisfies Config

export default config
