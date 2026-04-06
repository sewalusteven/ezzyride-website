export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const baseUrl = 'https://ezzyride.ug'
  const apiUrl = config.public.beUrl

  // Static pages
  const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/vehicles', priority: '0.9', changefreq: 'daily' },
    { url: '/tax-calculator', priority: '0.9', changefreq: 'weekly' },
    { url: '/valuations', priority: '0.7', changefreq: 'weekly' },
    { url: '/import-assistance', priority: '0.8', changefreq: 'monthly' },
    { url: '/partner-integrations', priority: '0.6', changefreq: 'monthly' },
    { url: '/about', priority: '0.5', changefreq: 'monthly' },
    { url: '/contact', priority: '0.5', changefreq: 'monthly' },
    { url: '/terms', priority: '0.3', changefreq: 'yearly' },
    { url: '/privacy', priority: '0.3', changefreq: 'yearly' },
  ]

  // Fetch published vehicles for dynamic URLs
  let vehicleUrls: { url: string; priority: string; changefreq: string }[] = []
  try {
    const res = await $fetch<any>(`${apiUrl}/web/vehicles?per_page=500`)
    const vehicles = res.data ?? []
    vehicleUrls = vehicles.map((v: any) => ({
      url: `/vehicles/${v.id}`,
      priority: '0.8',
      changefreq: 'weekly',
    }))
  } catch {
    // API unavailable — skip dynamic URLs
  }

  const allUrls = [...staticPages, ...vehicleUrls]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(p => `  <url>
    <loc>${baseUrl}${p.url}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n')}
</urlset>`

  setResponseHeader(event, 'content-type', 'application/xml')
  return xml
})
