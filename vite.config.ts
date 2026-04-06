import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'Mazda Maintenance Kenya',
        short_name: 'MazdaCare',
        description: 'Track your Mazda service history',
        orientation: 'portrait',
        theme_color: '#111010',
        background_color: '#111010',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable any',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        navigateFallback: '/index.html',
        additionalManifestEntries: [
          { url: '/', revision: null },
          { url: '/add-car', revision: null },
          { url: '/map', revision: null },
          { url: '/auth', revision: null },
        ],
        runtimeCaching: [
          // Queue service-log submissions while offline and replay when back online.
          {
            urlPattern: ({ url, request }) =>
              request.method === 'POST' &&
              url.hostname.endsWith('supabase.co') &&
              url.pathname.includes('/rest/v1/service_logs'),
            handler: 'NetworkOnly',
            options: {
              backgroundSync: {
                name: 'service-log-queue',
                options: {
                  maxRetentionTime: 24 * 60,
                },
              },
            },
          },
          {
            urlPattern: ({ request }) =>
              request.destination === 'script' ||
              request.destination === 'style' ||
              request.destination === 'image' ||
              request.destination === 'font',
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-assets',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
          {
            urlPattern: ({ url, request }) =>
              request.method === 'GET' &&
              (url.pathname.startsWith('/api') ||
                (url.hostname.endsWith('supabase.co') && url.pathname.includes('/rest/v1/'))),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24,
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          maps: ['@googlemaps/js-api-loader'],
        },
      },
    },
  },
})
