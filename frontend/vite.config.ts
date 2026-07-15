import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/dev/',
  server: {
    port: 8090,
    host: '127.0.0.1',
    allowedHosts: ['chalysh.pro'],
    proxy: {
      '/dev/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/dev\/api/, '/api'),
      },
    },
  },
})
