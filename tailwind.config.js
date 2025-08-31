/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f7f6f4',
          100: '#ede9e4',
          200: '#dbd2c9',
          300: '#c4b5a0',
          400: '#b5a082',
          500: '#a0956b',
          600: '#8b7355',
          700: '#735f47',
          800: '#5d4e37',
          900: '#4a3f2a',
        },
        sage: {
          50: '#f6f7f4',
          100: '#eef1ea',
          200: '#dde3d5',
          300: '#c5cfb8',
          400: '#a8b896',
          500: '#9caf88',
          600: '#7d9069',
          700: '#627254',
          800: '#4f5c44',
          900: '#424d39',
        },
        warm: {
          50: '#faf9f7',
          100: '#f4f1ec',
          200: '#e8e0d6',
          300: '#d6c7b7',
          400: '#c2a991',
          500: '#b08968',
          600: '#9e7356',
          700: '#845f49',
          800: '#6b4e3d',
          900: '#574133',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-light': 'bounceLight 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceLight: {
          '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
          '40%': { transform: 'translateY(-10px)' },
          '60%': { transform: 'translateY(-5px)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
