import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'AI Personal Trainer',
        short_name: 'Trainer',
        start_url: '.',
        display: 'standalone',
        background_color: '#ffffff',
        icons: [{ src: 'pwa-192.png', sizes: '192x192', type: 'image/png' }]
      }
    })
  ]
})