import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// El puerto 3000 ya está permitido en el CORS del backend (SecurityConfig),
// así el admin NO requiere tocar el backend para desarrollarse.
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // sockjs-client (usado por el WebSocket STOMP del hook useKanbanRealtime)
  // referencia `global`, que no existe en el navegador con módulos ESM.
  // Lo mapeamos a globalThis (aplica tanto al código de la app como a las
  // dependencias optimizadas).
  define: {
    global: 'globalThis',
  },
  server: {
    port: 3000,
    // Escucha en todas las interfaces (IPv4 e IPv6) para que el navegador
    // pueda abrir el admin tanto en localhost como en 127.0.0.1.
    host: '0.0.0.0',
    strictPort: true,
  },
})
