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
        nude: {
          50:  '#FAF8F5',
          100: '#F7F3EE',
          200: '#EDE8E0',
          300: '#E0D9CF',
          400: '#D6CFC4',
          500: '#C9BFB0',
          600: '#9C8E82',
          700: '#6B5F54',
          800: '#3D3028',
          900: '#2C2420',
        },
        accent: {
          DEFAULT: '#B8956A',
          light:   '#F0E8DC',
          dark:    '#8A6A45',
        },
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', 'serif'],
      },
    },
  },
  plugins: [],
}

export default config
