import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@wangke/shared-types': path.resolve(__dirname, '../../packages/shared-types/src'),
    },
  },
  server: { port: 5175, proxy: { '/api': { target: 'http://localhost:3000', changeOrigin: true } } },
})
