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
      ]
    }
  },
  runtimeConfig: {
    public: {
      beUrl: 'http://localhost/api'
    }
  },
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [
        tailwindcss()
    ]
  }
})
