import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/transcribe': 'http://localhost:8000',
      '/transcripts': 'http://localhost:8000',
    },
  },
})
