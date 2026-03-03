import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['Logo.svg'],
      manifest: {
        name: 'ProQuiniela App',
        short_name: 'Quiniela',
        description: 'Gestor y pronosticador de quinielas deportivas',
        theme_color: '#09090b',
        background_color: '#09090b',
        display: 'standalone',
        icons: [
          {
            src: '/Logo.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: '/Logo.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
