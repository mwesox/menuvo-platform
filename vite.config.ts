import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

const config = defineConfig({
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
