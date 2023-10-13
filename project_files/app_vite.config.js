import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const fullReloadAlways = {
  handleHotUpdate({ server }) {
    server.ws.send({ type: "full-reload" })
    return []
  },
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), fullReloadAlways],
  server: {
    port: 8080,
    proxy: {
      '^/api/.*': {
        target: 'http://localhost:9090',
        changeOrigin: true,
        secure: false, 
      }
    },
  },
  base: "./",
});