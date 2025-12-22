import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use root path for custom domain, but still support GitHub Pages subdirectory
  base: process.env.VITE_BASE_PATH || '/',
  server: {
    port: 5173,
    strictPort: true, // Fail if port is already in use
  },
})

