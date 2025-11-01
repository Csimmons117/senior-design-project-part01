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
      // Keep this if your backend runs on 3001 and exposes /api/*
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        // If your backend exposes /chat (without /api), uncomment:
        // rewrite: (p) => p.replace(/^\/api/, '')
      }
    }
  }
})
