import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

// Resolve the `@/*` -> `src/*` alias from tsconfig for tests. The string find
// `@` only matches `@/...` (not scoped packages like `@anthropic-ai/sdk`), so
// this is additive and leaves relative-import tests untouched.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
