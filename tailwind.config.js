/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Brand ────────────────────────────────────
        primary: {
          DEFAULT: '#e84545',
          dark:    '#c73333',
          light:   '#ef6666',
          50:      '#fff5f5',   // icon bg (Figma light-red)
          100:     '#ffeded',
          200:     '#ffd5d5',
        },
        // ── Figma palette ─────────────────────────────
        cream: {
          DEFAULT: '#f5edd6',   // warm section bg (Figma "How it Works")
          50:      '#faf7ee',
          100:     '#f5edd6',
          200:     '#ede0bc',
        },
        brand: {
          dark:    '#1a1a1a',   // headings
          body:    '#444444',   // body text
          muted:   '#888888',   // muted text
          border:  '#d8d8d8',   // card borders (visible on off-white bg)
          bg:      '#efefef',   // page bg (off-white)
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        sm:  '6px',
        DEFAULT: '10px',
        lg:  '14px',
        xl:  '20px',
        '2xl': '24px',
      },
      boxShadow: {
        card:  '0 1px 4px 0 rgb(0 0 0 / 0.07)',
        hover: '0 4px 16px 0 rgb(0 0 0 / 0.10)',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        fadeIn:  'fadeIn 0.3s ease-out',
        shimmer: 'shimmer 1.5s infinite',
      },
    },
  },
  plugins: [],
};
