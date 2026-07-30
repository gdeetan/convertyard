import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
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
    include: ['lib/**/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['lib/converters/**/*.ts'],
    },
  },
})
