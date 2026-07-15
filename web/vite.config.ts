import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    // Docker en Windows: los eventos de archivo no cruzan al contenedor,
    // el polling fuerza a Vite a detectar los cambios.
    watch: {
      usePolling: true,
      interval: 300,
    },
  },
});
