/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gy: {
          bg: 'var(--gy-bg)',
          surface: 'var(--gy-surface)',
          elevated: 'var(--gy-elevated)',
          border: 'var(--gy-border)',
          ink: 'var(--gy-ink)',
          muted: 'var(--gy-muted)',
          accent: 'var(--gy-accent)',
          'accent-ink': 'var(--gy-accent-ink)',
          warning: 'var(--gy-warning)',
        },
      },
      fontFamily: {
        display: ['Poppins', 'Inter', 'sans-serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Liberation Mono', 'Consolas', 'monospace'],
      },
      borderRadius: {
        gySm: '4px',
        gyMd: '6px',
        gyLg: '8px',
      },
    },
  },
  plugins: [],
};
