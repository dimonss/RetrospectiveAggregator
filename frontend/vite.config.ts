import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Default base path to '/dev/' for local development.
  // Default to '/retrospective/' for production build (override via VITE_BASE_PATH if needed).
  const basePath = env.VITE_BASE_PATH || (command === 'build' ? '/retrospective/' : '/dev/');

  return {
    plugins: [react()],
    base: basePath,
    server: {
      port: 8090,
      host: '127.0.0.1',
      allowedHosts: true,
      proxy: {
        '/dev/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/dev\/api/, '/api'),
        },
        '/retrospective/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/retrospective\/api/, '/api'),
        },
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
  }
})


