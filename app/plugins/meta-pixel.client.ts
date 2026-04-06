export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const pixelId = config.public.metaPixelId

  if (!pixelId || typeof window === 'undefined') return

  // Load Meta Pixel script
  const f = window as any
  if (f.fbq) return // Already loaded

  const n = (f.fbq = function (...args: any[]) {
    n.callMethod ? n.callMethod.apply(n, args) : n.queue.push(args)
  }) as any
  if (!f._fbq) f._fbq = n
  n.push = n
  n.loaded = true
  n.version = '2.0'
  n.queue = [] as any[]

  const script = document.createElement('script')
  script.async = true
  script.src = 'https://connect.facebook.net/en_US/fbevents.js'
  document.head.appendChild(script)

  f.fbq('init', pixelId)
  f.fbq('track', 'PageView')

  // Track route changes
  const router = useRouter()
  router.afterEach(() => {
    f.fbq('track', 'PageView')
  })

  // Expose tracking helper
  return {
    provide: {
      fbTrack: (event: string, params?: Record<string, any>) => {
        if (f.fbq) f.fbq('track', event, params)
      },
    },
  }
})
