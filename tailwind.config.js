/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{html,js}"],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        'xs': '475px', // Extra small devices
      },
      colors: {
        // Everforest theme colors
        everforest: {
          bg: {
            light: '#fdf6e3',
            dark: '#2f383e',
          },
          fg: {
            light: '#5c6a72',
            dark: '#d3c6aa',
          },
          primary: '#a7c080',
          secondary: '#83c092',
          accent: '#e69875',
          surface: {
            light: '#f4f0d9',
            dark: '#374247',
          },
          border: {
            light: '#93b259',
            dark: '#4f5b58',
          },
          button: {
            green: '#a7c080',
            blue: '#7fbbb3',
            orange: '#e69875',
            red: '#e67e80',
            purple: '#d699b6'
          }
        }
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
        'nunito': ['Nunito', 'sans-serif'],
        'jetbrains': ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'elevated': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 -2px 0 0 rgba(0, 0, 0, 0.1) inset',
        'elevated-dark': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.18), 0 -2px 0 0 rgba(255, 255, 255, 0.1) inset',
      },
      transformOrigin: {
        'top-center': 'top center',
      },
      transform: {
        'pressed': 'translateY(4px)',
      }
    },
  },
  plugins: [],
}