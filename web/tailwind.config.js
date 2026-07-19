/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        body: '#080b12', // fondo de pagina (navy muy oscuro)
        surface: '#111725', // tarjetas
        'surface-2': '#1a2231', // inputs / superficies elevadas
        line: '#232d42', // bordes
        neon: {
          // Acento personalizable por gimnasio: lee la variable CSS --accent
          // (definida en index.css y actualizada en runtime segun Settings).
          cyan: 'rgb(var(--accent) / <alpha-value>)',
          magenta: '#FF2E97',
          lime: '#39FF14',
        },
        // Texto/iconos que van ENCIMA del acento (negro o blanco automatico).
        'on-accent': 'rgb(var(--accent-contrast) / <alpha-value>)',
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.4)',
        'neon-cyan': '0 0 18px rgb(var(--accent) / 0.30)',
        'neon-magenta': '0 0 18px rgba(255,46,151,0.30)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        // Web publica: titulos condensados y etiquetas monoespaciadas.
        display: ['Anybody', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
      },
    },
  },
  plugins: [],
};
