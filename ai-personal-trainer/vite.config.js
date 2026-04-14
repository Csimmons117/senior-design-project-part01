import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
base:'/',
plugins: [
react(),
VitePWA({
registerType: 'autoUpdate',
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
host: true, 
port: 5173,


allowedHosts: [
  "studentrecreationcenter.com"
],

proxy: {
  '/api': {
    target: 'http://192.168.8.218:4000',
    changeOrigin: true
  }
}


}
})

