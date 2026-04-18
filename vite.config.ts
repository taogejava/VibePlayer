import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import electron from "vite-plugin-electron"
import renderer from "vite-plugin-electron-renderer"

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    electron([
      {
        // Main process entry
        entry: 'electron/main.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['electron'],
            },
          },
        },
      },
      {
        // Preload script entry
        entry: 'electron/preload.ts',
        onstart(args) {
          // Reload renderer when preload scripts change
          args.reload()
        },
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['electron'],
            },
          },
        },
      },
    ]),
    renderer(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Ensure the build output is compatible with Electron file:// protocol
  build: {
    target: 'esnext',
    minify: 'esbuild',
  },
})
