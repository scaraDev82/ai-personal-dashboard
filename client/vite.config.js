import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Primary port, will fallback to others if busy
    proxy: {
      '/api': 'http://localhost:3001'
    }
  }
})
