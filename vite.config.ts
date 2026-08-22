import { defineConfig } from 'vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [tailwindcss(), viteReact()],
  preview: {
    allowedHosts: ['statementflow-ihq9.onrender.com', 'statementflow.onrender.com', 'localhost'],
  },
})

export default config
