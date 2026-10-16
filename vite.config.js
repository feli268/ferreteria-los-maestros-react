import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Vite (app) + Vitest (pruebas unitarias: npm test / npm run coverage).
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true, // describe, it, expect, vi... disponibles sin importarlos
    environment: 'jsdom', // navegador simulado
    setupFiles: './src/setupTests.js',
    include: ['src/**/*.test.{js,jsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      reportsDirectory: 'coverage',
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/main.jsx', 'src/test/**', 'src/setupTests.js', 'src/**/*.test.{js,jsx}'],
    },
  },
})
