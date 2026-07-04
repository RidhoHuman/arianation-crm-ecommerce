const colors = require('tailwindcss/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'aria-black': '#000000',
        'aria-white': '#FFFFFF',
        'aria-red': '#FF0000',
        'aria-charcoal': '#1A1A1A',
        'aria-cream': '#FAF9F6',
        'aria-lightgray': '#F5F5F5',
        'aria-maroon': '#8B0000',
        // High contrast colors for colorblind accessibility
        'aria-cb-warning': '#E67E22', // Orange for warning/pending instead of yellow/red
        'aria-cb-success': '#2980B9', // Blue for success instead of green
        'aria-cb-error': '#C0392B', // Darker high-contrast red for errors
        // Override gray with neutral to remove the blue/navy tint globally
        gray: colors.neutral,
      },
      fontFamily: {
        sans: ['"Outfit"', 'sans-serif'],
        display: ['"Space Grotesk"', 'sans-serif'],
      },
      maxWidth: {
        container: '1440px',
      },
      animation: {
        'marquee': 'marquee 25s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' },
        }
      }
    },
  },
  plugins: [],
};
