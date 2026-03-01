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
  // SSR enabled globally so public pages get proper meta tags in initial HTML (SEO).
  // Admin and auth routes stay client-side only via routeRules below.
  ssr: true,
  routeRules: {
    // Admin panel — CSR only (auth-gated, no SEO needed)
    '/backoffice/**': { ssr: false },
    // Auth pages — CSR only
    '/auth/**': { ssr: false },
    // Truly static pages — prerender at build time for fastest possible load + full SEO
    '/about': { prerender: true },
    '/contact': { prerender: true },
    '/import-assistance': { prerender: true },
  },
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [
      tailwindcss(),
    ],
    build: {
      minify: 'esbuild',
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-charts':    ['apexcharts', 'vue3-apexcharts'],
            'vendor-ui':        ['@headlessui/vue'],
            'vendor-http':      ['axios'],
            'vendor-notify':    ['notiflix'],
          }
        }
      }
    },
  }
})


