import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // ponytail: relative base = works on any GitHub Pages repo subpath, no per-repo config
  base: './',
})
