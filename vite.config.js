import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(async ({ command }) => {
  const plugins = [vue()]

  if (command === 'serve') {
    const { default: vueDevTools } = await import('vite-plugin-vue-devtools')
    plugins.push(vueDevTools())
  }

  return {
    plugins,
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
    base:'./',
    server: {
      // proxy: {
      //   '/ig-neo4j': {
      //     target: '36.111.156.150:8080',
      //     changeOrigin: true,
      //     rewrite: path => path.replace(/^\/ig-neo4j/, '/ig-neo4j')
      //   }
      // }
    }
  }
})
