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
        'aria-black': '#000000',
        'aria-white': '#FFFFFF',
        'aria-red': '#FF0000',
        'aria-charcoal': '#2A2A2A',
        'aria-cream': '#FAF9F6',
        'aria-lightgray': '#F5F5F5',
        'aria-maroon': '#8B0000',
        'aria-darkgray': '#1A1A1A',
      },
      fontFamily: {
        sans: ['var(--font-poppins)', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      maxWidth: {
        container: '1440px',
      },
    },
  },
  plugins: [],
};
