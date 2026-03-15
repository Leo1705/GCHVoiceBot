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
        calm: {
          50: '#f0f9f4',
          100: '#dcf3e6',
          200: '#bce6d0',
          300: '#8dd3b0',
          400: '#58b98a',
          500: '#369d6e',
          600: '#277e57',
          700: '#216447',
          800: '#1d513b',
          900: '#1a4332',
        },
        support: {
          warm: '#e8a87c',
          soft: '#c38d9e',
          sage: '#41b3a3',
        },
      },
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'DM Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
