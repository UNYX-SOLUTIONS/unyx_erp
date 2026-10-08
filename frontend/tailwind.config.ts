import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        unyx: {
          DEFAULT: '#1e40af',
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1e40af',
          800: '#1e3a8a',
          900: '#172554',
        },
        surface: {
          DEFAULT: '#f8fafc',
          dim: '#f1f5f9',
          light: '#ffffff',
          muted: '#f8fafc',
          border: '#e2e8f0',
          subtle: '#cbd5e1',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        indeterminate: {
          '0%': { transform: 'translateX(-100%) scaleX(0.2)' },
          '50%': { transform: 'translateX(20%) scaleX(0.5)' },
          '100%': { transform: 'translateX(100%) scaleX(0.2)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        splashFade: {
          '0%': { opacity: '0', transform: 'translateY(28px)', filter: 'blur(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)', filter: 'blur(0)' },
        },
        splashLogo: {
          '0%': { opacity: '0', transform: 'scale(0.82)', filter: 'blur(12px)' },
          '60%': { opacity: '1', filter: 'blur(0)' },
          '100%': { opacity: '1', transform: 'scale(1)', filter: 'blur(0)' },
        },
        splashRipple: {
          '0%': { opacity: '0.35', transform: 'scale(0.6)' },
          '100%': { opacity: '0', transform: 'scale(1.7)' },
        },
        splashTracking: {
          '0%': { opacity: '0', letterSpacing: '0.5em' },
          '100%': { opacity: '1', letterSpacing: '-0.025em' },
        },
        splashFloat: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        splashDrift: {
          '0%': { transform: 'translate(0, 0)' },
          '100%': { transform: 'translate(24px, 24px)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        indeterminate: 'indeterminate 1.8s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite',
        pulseSubtle: 'pulseSubtle 2s ease-in-out infinite',
        'splash-in': 'splashFade 1.4s cubic-bezier(0.16, 1, 0.3, 1) both',
        'splash-logo': 'splashLogo 1.6s cubic-bezier(0.16, 1, 0.3, 1) both',
        'splash-ripple': 'splashRipple 2.4s cubic-bezier(0.16, 1, 0.3, 1) both',
        'splash-tracking': 'splashTracking 1.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        'splash-float': 'splashFloat 6s ease-in-out infinite',
        'splash-drift': 'splashDrift 22s linear infinite alternate',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
