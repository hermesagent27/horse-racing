import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-05-29',
  devtools: { enabled: false },
  css: ['~/app/assets/css/main.css'],
  typescript: {
    strict: true
  },
  vite: {
    plugins: [
      tailwindcss()
    ]
  }
})