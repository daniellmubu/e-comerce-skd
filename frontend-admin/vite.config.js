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
  server: {
    port: 3000,
  },
})
