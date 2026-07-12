import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { cloudflareTest } from '@cloudflare/vitest-pool-workers'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      {
        plugins: [react(), tailwindcss()],
        test: {
          name: 'frontend',
          exclude: ['**/node_modules/**', '**/dist/**', 'src/server/**'],
        },
      },
      {
        plugins: [
          cloudflareTest({
            wrangler: { configPath: './wrangler.jsonc' },
          }),
        ],
        test: {
          name: 'worker',
          include: ['src/server/**/*.test.ts'],
        },
      },
    ],
  },
})
