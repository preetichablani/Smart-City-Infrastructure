import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: 'autoUpdate',

      manifest: {
        name: 'NEXORA - Self-Healing Smart City',
        short_name: 'NEXORA',
        description:
          'Smart city service monitoring and self-healing simulation dashboard.',
        theme_color: '#101e33',
        background_color: '#101e33',
        display: 'standalone',
        scope: '/',
        start_url: '/',
      },

      workbox: {
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,woff2}',
        ],

        runtimeCaching: [
  {
    urlPattern: ({ url }) => url.pathname === '/api/health',
    handler: 'NetworkOnly',
  },
  {
    urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
    handler: 'NetworkFirst',
    options: {
      cacheName: 'nexora-api-cache',
      networkTimeoutSeconds: 3,
      expiration: {
        maxEntries: 50,
        maxAgeSeconds: 86400,
      },
    },
  },
],
      },

      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
})