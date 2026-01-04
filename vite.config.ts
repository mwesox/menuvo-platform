import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

const config = defineConfig({
  server: {
    // Bind to all interfaces for LAN access (Synology proxy, etc.)
    host: true,
    // Allow ngrok and other tunnel hosts for OAuth testing
    allowedHosts: true,
    proxy: {
      // Forward webhook endpoints to worker (mimics Caddy in production)
      // Note: /api/images/upload uses VITE_WORKER_URL env var to bypass proxy
      // due to Vite proxy issues with multipart/form-data
      '/webhooks': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  plugins: [
    nitro({
      // Default to bun preset (required for Bun-native S3Client/RedisClient)
      preset: process.env.NITRO_PRESET || 'bun',
    }),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    tanstackStart({
      prerender: {
        enabled: false,
      },
    }),
    viteReact(),
  ],
  // Externalize Bun-specific modules from client bundle
  build: {
    rollupOptions: {
      external: ['bun', 'bun:test'],
    },
  },
  // Also configure SSR externalization
  ssr: {
    external: ['bun'],
  },
})

export default config
