/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Split heavy vendors out of the main entry chunk so initial paint
        // ships less JS and downloads can parallelize.
        manualChunks: {
          motion: ['framer-motion'],
          charts: ['recharts'],
          icons: ['lucide-react'],
          xlsx: ['xlsx'],
        },
      },
    },
  },
  test: {
    // happy-dom is lighter than jsdom and runs noticeably faster — the
    // surface we test (badges, inputs, file pickers) doesn't need jsdom's
    // edge-case fidelity.
    environment: 'happy-dom',
    include: ['src/**/*.test.{js,jsx}'],
    setupFiles: ['./src/test/setup.js'],
  },
})
