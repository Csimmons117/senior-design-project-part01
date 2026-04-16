import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/ai-trainer/',

  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: false },
      manifest: {
        name: 'AI Fitness Helper',
        short_name: 'Fitness',
        start_url: '/ai-trainer/',   // ✅ FIXED
        display: 'standalone',
        background_color: '#ffffff',
        icons: [{ src: 'pwa-192.png', sizes: '192x192', type: 'image/png' }]
      }
    })
  ],

  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: [
      'studentrecreationcenter.com',
      '192.168.8.218'
    ],
    headers: {
      'X-Frame-Options': 'ALLOWALL'
    },
    proxy: {
      '/api': {
        target: 'http://192.168.8.218:4000',
        changeOrigin: true
      }
    }
  }
})
