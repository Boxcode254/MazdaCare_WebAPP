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
        mz: {
          red:          '#9B1B30',
          'red-mid':    '#B82234',
          'red-dark':   '#6B0D1C',
          'red-light':  '#F5E8EA',
          'red-pale':   '#FDF3F4',
          black:        '#111010',
          'gray-900':   '#1E1A1B',
          'gray-700':   '#3D3536',
          'gray-500':   '#6B6163',
          'gray-300':   '#C4BABB',
          'gray-100':   '#F0ECEC',
          white:        '#FDFBFB',
          gold:         '#C49A3C',
          'gold-light': '#F5EDD6',
        },
      },
      fontFamily: {
        sans:    ['Outfit', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body:    ['Outfit', 'sans-serif'],
        display: ['Cormorant Garamond', 'serif'],
      },
      borderRadius: {
        sm:   '6px',
        md:   '8px',
        lg:   '12px',
        xl:   '16px',
        '2xl': '24px',
      },
    },
  },
  plugins: [forms],
}

