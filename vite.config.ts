import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/sam-fit/', // For GitHub Pages deployment
  server: {
    port: 5173,
    strictPort: true, // Fail if port is already in use
  },
})

