import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // /api/fetch-news へのリクエストを http://localhost:5173/api/fetch-news に転送
      '/api': {
        // target: 'http://localhost:5001',
        target: 'https://news-backend-926524146817.us-central1.run.app',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    },
  },
})
