import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Firebase Hosting serve na raiz. Para GitHub Pages (/fatto/), rode com VITE_BASE=/fatto/
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE || '/',
})
