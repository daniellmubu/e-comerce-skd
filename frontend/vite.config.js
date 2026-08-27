import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // sockjs-client (usado por el WebSocket STOMP) referencia `global`, que no
  // existe en el navegador con módulos ESM. Lo mapeamos a globalThis (aplica
  // tanto al código de la app como a las dependencias optimizadas).
  define: {
    global: 'globalThis',
  },
})