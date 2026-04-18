import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // Force everything to be prefixed with /ai-trainer/
  base: '/ai-trainer/', 
  
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'AI Fitness Helper',
        short_name: 'Fitness',
        start_url: '/ai-trainer/', 
        display: 'standalone',
        background_color: '#ffffff',
        icons: [{ src: 'pwa-192.png', sizes: '192x192', type: 'image/png' }]
      }
    })
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: ['studentrecreationcenter.com', '192.168.8.218'],
    hmr: {
      host: 'studentrecreationcenter.com',
      clientPort: 443,
      protocol: 'wss'
    },
    proxy: {
      '/api': {
        target: 'http://192.168.8.218:4000',
        changeOrigin: true
      }
    }
  }
})

