import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'icons.svg'],
      manifest: {
        name: 'SKD - Creando Sueños',
        short_name: 'SKD',
        description: 'SKD - Creando Sueños - E-commerce de sublimación',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'favicon.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'favicon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
        ],
        screenshots: [
          {
            src: 'screenshots/desktop-1280x720.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide',
            label: 'SKD - Catálogo en escritorio',
          },
          {
            src: 'screenshots/mobile-540x720.png',
            sizes: '540x720',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'SKD en móvil',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
    }),
  ],
  // sockjs-client (usado por el WebSocket STOMP) referencia `global`, que no
  // existe en el navegador con módulos ESM. Lo mapeamos a globalThis (aplica
  // tanto al código de la app como a las dependencias optimizadas).
  define: {
    global: 'globalThis',
  },
})