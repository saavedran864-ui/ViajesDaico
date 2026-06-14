import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50:  '#E8ECFA',
          100: '#C5CEF2',
          200: '#9AACE8',
          300: '#6F89DE',
          400: '#4D6DD6',
          500: '#2B51CE',
          600: '#1B2B6B',
          700: '#152258',
          800: '#0F1A44',
          900: '#0A1130',
        },
        cream: {
          50:  '#FFFDF7',
          100: '#FDF8EC',
          200: '#F9EED3',
          300: '#F5E6C8',
          400: '#EDD8A8',
          500: '#E4C87E',
          600: '#D4A84B',
          700: '#A67D2E',
          800: '#7A5A1E',
          900: '#4E390F',
        },
        coral: {
          DEFAULT: '#E8453C',
          light: '#FFEDEC',
          dark: '#C42E26',
        },
        sky: {
          brand: '#4ABDE8',
          light: '#E8F7FD',
        },
      },
      fontFamily: {
        display: ['Impact', 'Arial Black', 'sans-serif'],
        sans: ['system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
