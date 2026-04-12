import forms from '@tailwindcss/forms'

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        /* Canonical brand scale — use mz-* only (no duplicate mazda-* prefix). */
        mz: {
          red:          '#8F1326',
          'red-mid':    '#B31F35',
          'red-dark':   '#5F0A18',
          'red-light':  '#F5DDE2',
          'red-pale':   '#FEF6F8',
          black:        '#151214',
          'gray-900':   '#211A1D',
          'gray-700':   '#403438',
          'gray-600':   '#5E5256',
          'gray-500':   '#7B7073',
          'gray-300':   '#D8CDD0',
          'gray-100':   '#F4EEEF',
          white:        '#FFFDFC',
          gold:         '#B88A37',
          'gold-light': '#F7EEDB',
          navy:         '#253650',
          green:        '#2C6A4A',
        },
      },
      fontFamily: {
        sans:    ['Plus Jakarta Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body:    ['Plus Jakarta Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Instrument Serif', 'ui-serif', 'Georgia', 'serif'],
      },
      borderRadius: {
        sm:   '6px',
        md:   '8px',
        lg:   '12px',
        xl:   '16px',
        '2xl': '24px',
      },
      boxShadow: {
        button: '0 10px 24px rgba(163, 21, 38, 0.18)',
        shell: '0 26px 70px rgba(40, 24, 24, 0.12)',
      },
    },
  },
  plugins: [forms],
}

