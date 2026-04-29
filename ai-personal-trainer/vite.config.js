import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const appBase = env.VITE_APP_BASE || '/';
  const apiProxyTarget = env.VITE_DEV_API_PROXY_TARGET || 'http://localhost:4000';

  return {
    base: appBase,
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        // turn SW off in dev to avoid caching while iterating
        devOptions: { enabled: false },
        manifest: {
          name: 'AI Fitness Helper',
          short_name: 'Fitness',
          start_url: appBase,
          display: 'standalone',
          background_color: '#ffffff',
          icons: [{ src: 'pwa-192.png', sizes: '192x192', type: 'image/png' }]
        }
      })
    ],
    server: {
      port: 5173,
      proxy: {
        // Proxy API requests to the backend server running on port 4000 (dev only)
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true
        }
      }
    }
  };
})
