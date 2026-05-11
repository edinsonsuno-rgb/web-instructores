/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        df: {
          bg:       '#080612',
          surface:  '#120d22',
          card:     '#130f24',
          border:   '#2d1f50',
          purple:   '#7c3aed',
          violet:   '#a855f7',
          pink:     '#c084fc',
          muted:    '#6b5b8a',
          text:     '#e2d9f3',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      backgroundImage: {
        'circuit': "linear-gradient(rgba(168,85,247,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(168,85,247,.06) 1px,transparent 1px)",
      },
      backgroundSize: {
        'circuit': '32px 32px',
      }
    }
  },
  plugins: []
}
