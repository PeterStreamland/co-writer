import preact from '@preact/preset-vite'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves the app from https://<user>.github.io/co-writer/
  base: '/co-writer/',
  plugins: [preact()],
  test: {
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
  },
})
