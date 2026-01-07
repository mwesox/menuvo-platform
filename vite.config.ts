import { fileURLToPath, URL } from 'node:url'
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
  },
  plugins: [
    {
      name: 'debug-db-imports',
      enforce: 'pre',
      apply: 'build',
      resolveId(source, importer) {
        if (!process.env.DEBUG_DB_IMPORTS) return null
        if (this.environment?.name !== 'client') return null
        if (process.env.DEBUG_SERVER_IMPORTS) {
          const serverImport =
            source.includes('/server/') ||
            source.includes('\\server\\') ||
            source.includes('/server.')
          if (serverImport) {
            this.warn(
              `[debug-server-imports] ${source} <- ${importer ?? 'entry'}`
            )
          }
        }
        if (
          source === '@/db' ||
          source === '@/db/schema' ||
          source.endsWith('/db/index.ts') ||
          source.endsWith('/db/schema.ts')
        ) {
          this.warn(
            `[debug-db-imports] ${source} <- ${importer ?? 'entry'}`
          )
        }
        return null
      },
    },
    {
      name: 'db-client-alias',
      resolveId: {
        order: 'pre',
        handler(source) {
          if (source === '@/db') {
            const isClient = this.environment?.name === 'client'
            return {
              id: isClient
                ? fileURLToPath(new URL('./src/db/index.client.ts', import.meta.url))
                : fileURLToPath(new URL('./src/db/index.ts', import.meta.url)),
            }
          }
          return null
        },
      },
    },
    nitro({
      // Default to bun preset (required for Bun-native S3Client/RedisClient)
      preset: 'bun',
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
  // Externalize Bun-specific and server-only modules from client bundle
  build: {
    rollupOptions: {
      external: ['bun', 'bun:test', 'postgres', 'drizzle-orm/postgres-js', 'sharp'],
    },
  },
  // Also configure SSR externalization
  ssr: {
    external: ['bun', 'postgres', 'drizzle-orm/postgres-js', 'sharp'],
    noExternal: [],
  },
  // Exclude server-only packages from client bundle optimization
  optimizeDeps: {
    exclude: ['postgres', 'drizzle-orm/postgres-js', 'sharp'],
  },
})

export default config
