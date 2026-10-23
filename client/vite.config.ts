
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
            // Never cache the health check: it must reflect the live backend.
            urlPattern: /^https?:\/\/(localhost|127\.0\.0\.1):5000\/api\/health$/,
            handler: 'NetworkOnly',
          },
          {
            // Other GET API responses may be shown as cached data offline.
            urlPattern: /^https?:\/\/(localhost|127\.0\.0\.1):5000\/api\/.*$/,
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
