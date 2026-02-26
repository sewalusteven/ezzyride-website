// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";
export default defineNuxtConfig({
  app: {
    head: {
      title: "EzzyRide Uganda",
      htmlAttrs: {
        lang: 'en',
      },
      script: [
        {
          src: 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2236769161033149',
          async: true,
          crossorigin: 'anonymous',
        },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/fav.png' },
        { rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@7.0.1/css/all.min.css' },
      ]
    }
  },
  runtimeConfig: {
    public: {
      beUrl: 'http://localhost/api',
      storageUrl: 'http://localhost/storage',
    }
  },
  ssr: false,
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [
      tailwindcss(),
    ],
    build: {
      minify: 'esbuild',
    },
  }
})
