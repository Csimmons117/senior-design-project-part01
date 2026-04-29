import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // turn SW off in dev to avoid caching while iterating
      devOptions: { enabled: false },
      manifest: {
        name: 'AI Fitness Helper',
        short_name: 'Fitness',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        icons: [{ src: 'pwa-192.png', sizes: '192x192', type: 'image/png' }]
      }
    })
  ],
  server: {
    port: 5173,
    proxy: {
      // Proxy API requests to the backend server running on port 4000
      '/api': {
        target: 'http://192.168.8.218:4000',
        changeOrigin: true
      }
    }
  }
})
