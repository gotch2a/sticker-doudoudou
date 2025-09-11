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
        // Redéfinition de 'stone' pour notre palette primary
        stone: {
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
        // Redéfinition de 'emerald' pour notre palette sage
        emerald: {
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
        // Redéfinition de 'amber' pour notre palette warm  
        amber: {
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
        // 🌈 PALETTE JOYEUSE synchronisée avec le CSS !
        primary: {
          50: '#fef7f7',   // Rose très clair
          100: '#fce8e8',  // Rose clair  
          200: '#fbd4d4',  // Rose doux
          300: '#faadad',  // 👈 VOTRE COULEUR (Maths)
          400: '#f87c7c',  // Rose vif
          500: '#f56565',  // Rose principal
          600: '#e53e3e',  // Rose intense ⭐ PRINCIPAL
          700: '#c53030',  // Rose foncé (hover)
          800: '#9c2626',  // Rose très foncé
          900: '#742a2a',  // Rose presque noir
        },
        sage: {
          50: '#f0fdf9',   // Vert très clair
          100: '#d1fae5',  // Vert clair
          200: '#aaf1cb',  // 👈 VOTRE COULEUR (Music)
          300: '#7dd3ac',  // Vert menthe
          400: '#4ade80',  // Vert vif
          500: '#22c55e',  // Vert principal
          600: '#16a34a',  // Vert intense
          700: '#15803d',  // Vert foncé
          800: '#166534',  // Vert très foncé
          900: '#14532d',  // Vert presque noir
        },
        warm: {
          50: '#fffbeb',   // Jaune très clair
          100: '#fef3c7',  // Jaune clair
          200: '#ffe99d',  // 👈 VOTRE COULEUR (Painting)
          300: '#fcd34d',  // Jaune doux
          400: '#fbbf24',  // Jaune vif
          500: '#f59e0b',  // Jaune principal
          600: '#d97706',  // Jaune intense
          700: '#b45309',  // Jaune foncé
          800: '#92400e',  // Jaune très foncé
          900: '#78350f',  // Jaune presque noir
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
