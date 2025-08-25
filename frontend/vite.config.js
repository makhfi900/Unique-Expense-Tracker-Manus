import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // PWA optimizations
  build: {
    // Generate manifest and service worker
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
    // Optimize for PWA
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
  },
  server: {
    // Enable HTTPS for PWA development
    https: false, // Set to true if you have SSL certs for development
    port: 3000,
    host: true,
  },
  preview: {
    port: 3000,
    host: true,
  },
  // PWA manifest handling
  publicDir: 'public',
})
