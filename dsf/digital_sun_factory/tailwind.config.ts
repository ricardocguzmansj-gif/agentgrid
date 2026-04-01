import type { Config } from 'tailwindcss';

export default {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        ink: '#0a0f1e',
        brand: '#7c3aed',
        accent: '#06b6d4'
      },
      boxShadow: {
        glow: '0 20px 60px rgba(124,58,237,0.25)'
      }
    },
  },
  plugins: [],
} satisfies Config;
