import { defineConfig } from 'vitest/config'
import path from 'path'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    environment: 'node',
    environmentMatchGlobs: [
      ['**/lib/hooks/**', 'happy-dom'],
      ['**/lib/utils/**', 'happy-dom'],
    ],
    setupFiles: ['lib/hooks/__tests__/setup.ts'],
    include: ['lib/**/__tests__/**/*.test.ts', 'lib/**/__tests__/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      include: ['lib/converters/**/*.ts'],
    },
  },
})
