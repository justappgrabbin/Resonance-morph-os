/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        body: {
          void: '#030408',
          deep: '#060912',
          surface: '#0a0f1a',
          raised: '#101620',
          edge: '#1a2235',
          glow: '#2a3a55',
        },
        vitality: {
          dormant: '#1a1206',
          observant: '#1f1606',
          active: '#3a2800',
          dreaming: '#533483',
          growing: '#e94560',
          resonant: '#10d474',
        },
        accent: {
          neural: '#f5c518',
          assembly: '#10d474',
          runbox: '#ff6b6b',
          agent: '#a855f7',
          body: '#e0e0e0',
        }
      },
      fontFamily: {
        mono: ['SF Mono', 'Monaco', 'Cascadia Code', 'monospace'],
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'pulse-ring': 'pulse-ring 2s ease-in-out infinite',
        'window-birth': 'windowBirth 0.3s ease',
        'fade-in': 'fadeIn 0.3s ease',
        'toast-in': 'toastIn 0.3s ease',
        'resonate': 'resonate 4s ease-in-out infinite',
      },
      keyframes: {
        'pulse-ring': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.3' },
          '50%': { transform: 'scale(1.5)', opacity: '0' },
        },
        windowBirth: {
          from: { opacity: '0', transform: 'scale(0.9) translateY(10px)' },
          to: { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        toastIn: {
          from: { opacity: '0', transform: 'translateX(-50%) translateY(10px)' },
          to: { opacity: '1', transform: 'translateX(-50%) translateY(0)' },
        },
        resonate: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.95' },
        },
      },
    },
  },
  plugins: [],
}
