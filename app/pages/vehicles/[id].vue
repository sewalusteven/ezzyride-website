<script setup lang="ts">
import { Loading, Notify } from 'notiflix'
import type { VehicleValuation, TaxCalculatorPayload, TaxCalculatorResponse } from '~/types'
import { useTaxUtilities } from '~/composables/taxUtilities'

const { $api } = useNuxtApp()
const { storageUrl } = useStorage()
const { search: searchValuation, fetchTaxes, formatCurrency } = useTaxUtilities()
const route = useRoute()

const id = route.params.id as string

interface Vehicle {
  id: number; reference: string; model: string; year: number
  sellingPrice: string | null; transmission: string; fuelType: string; driveType: string
  mileage: number | null; engineCc: number | null; colour: string | null
  seatingCapacity: number | null; description: string | null; youtubeUrl: string | null
  cifUsd: string | null
  brand: { id: number; name: string } | null
  category: { id: number; name: string } | null
  partner: {
    id: number; name: string; isLocal: boolean
    defaultCurrency: string | null
    depositPercentage: number | null; depositNotes: string | null
  } | null
  primaryImage: string | null
  images: { id: number; path: string; isPrimary: boolean; sortOrder: number }[]
  features: { id: number; name: string; icon: string | null; category: string }[]
  attributes: { id: number; attributeName: string; unit: string | null; value: string }[]
  status: string
}

const notFound   = ref(false)
const activeImg  = ref<string | null>(null)
const lightbox   = ref(false)

// Fetch vehicle + settings during SSR so OG meta tags render in initial HTML
// (essential for WhatsApp/Facebook/Twitter link previews)
const { data: vehicleData, pending: loading, error: vehicleError } = await useAsyncData(
  `vehicle-${id}`,
  async () => {
    try {
      const [vRes, sRes] = await Promise.all([
        $api.get(`/web/vehicles/${id}`),
        $api.get('/web/settings'),
      ])
      return { vehicle: vRes.data.data as Vehicle, settings: (sRes.data.data ?? {}) as Record<string, string> }
    } catch {
      return null
    }
  },
)

const vehicle = computed<Vehicle | null>(() => vehicleData.value?.vehicle ?? null)

// Mark not found if no data came back
watchEffect(() => {
  notFound.value = !loading.value && (!vehicleData.value?.vehicle || !!vehicleError.value)
})

// Inquiry form
const inqForm    = ref({ name: '', email: '', phone: '', message: '' })
const sendingInq = ref(false)
const inqSuccess = ref(false)

// Purchase modal
const showPurchaseModal = ref(false)
const purchaseForm      = ref({ name: '', email: '', phone: '', reservation_deposit: '', agreed_terms: false })
const purchasing        = ref(false)
const purchaseResult    = ref<{ type: string; reference: string; message: string; partner?: string } | null>(null)

// Settings (pricing) — pulled from the same SSR fetch
const settings = computed<Record<string, string>>(() => vehicleData.value?.settings ?? {})

// USD→UGX rate for deposit conversion
const usdRate = computed(() => parseFloat(settings.value.cif_usd_rate) || 0)

// Tax calculator modal
const showTaxModal         = ref(false)
const taxSearchQuery       = ref('')
const taxSearchResults     = ref<VehicleValuation[]>([])
const taxSearchLoading     = ref(false)
const selectedValuation    = ref<VehicleValuation | null>(null)
const taxResult            = ref<TaxCalculatorResponse | null>(null)
const taxCalculating       = ref(false)

const vehicleTitle = computed(() => vehicle.value ? `${vehicle.value.brand?.name} ${vehicle.value.model} ${vehicle.value.year}` : '')

const vehicleDescription = computed(() => {
  if (!vehicle.value) return 'Vehicle details and specifications — EzzyRide Uganda.'
  const v = vehicle.value
  const price = v.sellingPrice ? `UGX ${Number(v.sellingPrice).toLocaleString()}` : 'Price on request'
  const specs = [
    v.transmission ? v.transmission.charAt(0).toUpperCase() + v.transmission.slice(1) : null,
    v.fuelType ? v.fuelType.charAt(0).toUpperCase() + v.fuelType.slice(1) : null,
    v.mileage ? v.mileage.toLocaleString() + ' km' : null,
  ].filter(Boolean).join(' · ')
  return `${vehicleTitle.value} — ${price}. ${specs}. Available at EzzyRide Uganda.`
})

const vehicleImageUrl = computed(() => {
  if (!vehicle.value) return undefined
  // Try the dedicated primaryImage field first; fallback to scanning the images array
  if (vehicle.value.primaryImage) return storageUrl(vehicle.value.primaryImage)
  const imgs = vehicle.value.images ?? []
  const primary = imgs.find(i => i.isPrimary) ?? imgs[0]
  return primary?.path ? storageUrl(primary.path) : undefined
})

const vehicleUrl = computed(() => `https://ezzyride.ug/vehicles/${id}`)

useSeoMeta({
  title: computed(() => vehicleTitle.value ? `${vehicleTitle.value} | EzzyRide Uganda` : 'Vehicle Details | EzzyRide Uganda'),
  description: vehicleDescription,

  // Open Graph (Facebook, WhatsApp, LinkedIn, iMessage, Slack, etc.)
  ogTitle: computed(() => vehicleTitle.value ? `${vehicleTitle.value} for Sale` : 'Vehicle | EzzyRide Uganda'),
  ogDescription: vehicleDescription,
  ogImage: vehicleImageUrl,
  ogImageAlt: computed(() => vehicleImageUrl.value ? (vehicleTitle.value || 'EzzyRide vehicle') : undefined),
  ogImageWidth: computed(() => vehicleImageUrl.value ? 1200 : undefined),
  ogImageHeight: computed(() => vehicleImageUrl.value ? 630 : undefined),
  ogType: 'website',
  ogUrl: vehicleUrl,
  ogSiteName: 'EzzyRide Uganda',

  // Twitter / X cards
  twitterCard: 'summary_large_image',
  twitterTitle: computed(() => vehicleTitle.value ? `${vehicleTitle.value} for Sale` : 'EzzyRide Uganda'),
  twitterDescription: vehicleDescription,
  twitterImage: vehicleImageUrl,
})

// JSON-LD structured data for Google rich results
useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: computed(() => {
        if (!vehicle.value) return '{}'
        const v = vehicle.value
        return JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Car',
          name: `${v.brand?.name} ${v.model} ${v.year}`,
          brand: { '@type': 'Brand', name: v.brand?.name },
          model: v.model,
          modelDate: String(v.year),
          vehicleTransmission: v.transmission === 'automatic' ? 'AutomaticTransmission' : 'ManualTransmission',
          fuelType: v.fuelType === 'petrol' ? 'Gasoline' : v.fuelType === 'diesel' ? 'Diesel' : v.fuelType,
          mileageFromOdometer: v.mileage ? { '@type': 'QuantitativeValue', value: v.mileage, unitCode: 'KMT' } : undefined,
          vehicleEngine: v.engineCc ? { '@type': 'EngineSpecification', engineDisplacement: { '@type': 'QuantitativeValue', value: v.engineCc, unitCode: 'CMQ' } } : undefined,
          color: v.colour,
          image: v.primaryImage ? storageUrl(v.primaryImage) : undefined,
          offers: {
            '@type': 'Offer',
            price: v.sellingPrice || undefined,
            priceCurrency: 'UGX',
            availability: v.status === 'available' || v.status === 'in_transit' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            seller: { '@type': 'Organization', name: 'EzzyRide Uganda', url: 'https://ezzyride.ug' },
          },
          url: `https://ezzyride.ug/vehicles/${v.id}`,
        })
      }),
    },
  ],
})

// Initialize active image when vehicle data is available
watchEffect(() => {
  if (!vehicle.value) return
  const imgs = vehicle.value.images ?? []
  const primary = imgs.find(i => i.isPrimary) ?? imgs[0]
  activeImg.value = primary?.path ?? null
})

const allImages = computed(() => vehicle.value?.images ?? [])
const sortedImages = computed(() =>
  [...allImages.value].sort((a, b) => {
    if (a.isPrimary) return -1
    if (b.isPrimary) return 1
    return a.sortOrder - b.sortOrder
  })
)

const youtubeEmbedUrl = computed(() => {
  const url = vehicle.value?.youtubeUrl
  if (!url) return null
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?\s]+)/)
  return m ? `https://www.youtube.com/embed/${m[1]}` : null
})

const fmtPrice = (v: string | null) => v ? 'UGX ' + Number(v).toLocaleString() : 'Price on request'
const fmtUsd   = (v: number) => 'USD ' + v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })
const fmtUgx   = (v: number) => 'UGX ' + v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })
const fmtCurrency = (v: number, cur: string) => cur.toUpperCase() + ' ' + v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })
const fmtMileage = (n: number | null) => n ? n.toLocaleString() + ' km' : '—'
const fmtCC = (n: number | null) => n ? n.toLocaleString() + ' cc' : '—'

const statusColor = (s: string) => ({
  available:  'bg-green-100 text-green-700',
  reserved:   'bg-yellow-100 text-yellow-700',
  in_transit: 'bg-blue-100 text-blue-700',
}[s] ?? 'bg-gray-100 text-gray-500')

// Partner & deposit info
const isPartnerVehicle = computed(() => !!vehicle.value?.partner)
const isInternational  = computed(() => vehicle.value?.partner && !vehicle.value.partner.isLocal)
// If partner has deposit_percentage, use it; otherwise 100% of CIF upfront
const depositPercentage = computed(() => {
  if (!vehicle.value?.partner) return null
  return vehicle.value.partner.depositPercentage ?? 100
})
const partnerCurrency = computed(() => vehicle.value?.partner?.defaultCurrency || 'USD')
const depositAmount = computed(() => {
  if (depositPercentage.value === null || !vehicle.value?.cifUsd) return null
  return Math.round(Number(vehicle.value.cifUsd) * (depositPercentage.value / 100))
})
const depositAmountUgx = computed(() => {
  if (!depositAmount.value || !usdRate.value) return null
  return Math.round(depositAmount.value * usdRate.value)
})
const canPurchase = computed(() => ['available', 'in_transit'].includes(vehicle.value?.status ?? ''))

const featuresByCategory = computed(() => {
  const cats: Record<string, typeof vehicle.value.features> = {}
  vehicle.value?.features.forEach(f => {
    if (!cats[f.category]) cats[f.category] = []
    cats[f.category].push(f)
  })
  return cats
})

const sendInquiry = async () => {
  if (!inqForm.value.name || !inqForm.value.message || (!inqForm.value.email && !inqForm.value.phone)) {
    Notify.failure('Please fill in your name, message, and at least one contact method.')
    return
  }
  sendingInq.value = true
  try {
    await $api.post('/web/inquiries', {
      name: inqForm.value.name,
      email: inqForm.value.email || undefined,
      phone: inqForm.value.phone || undefined,
      subject: `Enquiry about ${vehicle.value?.brand?.name} ${vehicle.value?.model} ${vehicle.value?.year} (${vehicle.value?.reference})`,
      message: inqForm.value.message,
    })
    inqSuccess.value = true
    inqForm.value = { name: '', email: '', phone: '', message: '' }
  } catch {
    Notify.failure('Failed to send enquiry. Please try again or contact us directly.')
  } finally {
    sendingInq.value = false
  }
}

const submitPurchase = async () => {
  if (!purchaseForm.value.name || (!purchaseForm.value.email && !purchaseForm.value.phone)) {
    Notify.failure('Please provide your name and at least one contact method.')
    return
  }
  purchasing.value = true
  try {
    const payload: Record<string, any> = {
      name: purchaseForm.value.name,
      email: purchaseForm.value.email || undefined,
      phone: purchaseForm.value.phone || undefined,
    }
    if (!isInternational.value && purchaseForm.value.reservation_deposit) {
      payload.reservation_deposit = Number(purchaseForm.value.reservation_deposit)
    }
    const { data } = await $api.post(`/web/vehicles/${id}/purchase`, payload)
    purchaseResult.value = data.data
    // Update local vehicle status (mutate the underlying SSR data)
    if (vehicleData.value?.vehicle) vehicleData.value.vehicle.status = 'reserved'
  } catch (e: any) {
    const msg = e?.response?.data?.message || 'Failed to submit purchase request. Please try again.'
    Notify.failure(msg)
  } finally {
    purchasing.value = false
  }
}

const closePurchaseModal = () => {
  showPurchaseModal.value = false
  purchaseResult.value = null
  purchaseForm.value = { name: '', email: '', phone: '', reservation_deposit: '', agreed_terms: false }
}

// ── Tax Calculator Modal ──────────────────────────────────────────────────
const serviceFeeLabel = computed(() => {
  if (!vehicle.value?.partner) return null
  return vehicle.value.partner.isLocal ? 'Sourcing Fee' : 'Full Import Fee'
})
const serviceFee = computed(() => {
  if (!vehicle.value?.partner) return 0
  const key = vehicle.value.partner.isLocal ? 'pricing_sourcing_only' : 'pricing_full_import'
  return parseFloat(settings.value[key]?.replace(',', '') || '0') || 0
})
const vehicleCifUgx = computed(() => {
  return vehicle.value?.sellingPrice ? Number(vehicle.value.sellingPrice) : 0
})
const feeNumberPlate = computed(() => parseFloat(settings.value.fee_number_plate || '0') || 0)
const feeThirdPartyIns = computed(() => parseFloat(settings.value.fee_third_party_insurance || '0') || 0)
const additionalFees = computed(() => feeNumberPlate.value + feeThirdPartyIns.value)
const taxEstimatedTotal = computed(() => {
  if (!taxResult.value) return 0
  return vehicleCifUgx.value + taxResult.value.totalTax + serviceFee.value + additionalFees.value
})

const openTaxModal = () => {
  showTaxModal.value = true
  selectedValuation.value = null
  taxResult.value = null
  taxSearchResults.value = []
  // Prefill search with brand + model + year
  const v = vehicle.value
  if (v) {
    taxSearchQuery.value = [v.brand?.name, v.model, v.year].filter(Boolean).join(' ')
    // Auto-search
    doTaxSearch()
  }
}

const closeTaxModal = () => {
  showTaxModal.value = false
  selectedValuation.value = null
  taxResult.value = null
  taxSearchResults.value = []
  taxSearchQuery.value = ''
}

let taxSearchTimeout: ReturnType<typeof setTimeout> | null = null
const onTaxSearchInput = () => {
  if (taxSearchTimeout) clearTimeout(taxSearchTimeout)
  taxSearchTimeout = setTimeout(() => {
    if (taxSearchQuery.value.length > 2) doTaxSearch()
  }, 400)
}

const doTaxSearch = async () => {
  if (!taxSearchQuery.value.trim()) return
  taxSearchLoading.value = true
  try {
    taxSearchResults.value = await searchValuation(taxSearchQuery.value)
  } catch {
    taxSearchResults.value = []
  } finally {
    taxSearchLoading.value = false
  }
}

const selectTaxValuation = (val: VehicleValuation) => {
  selectedValuation.value = val
  taxSearchResults.value = []
  calculateTax(val)
}

const clearTaxSelection = () => {
  selectedValuation.value = null
  taxResult.value = null
}

const calculateTax = async (val: VehicleValuation) => {
  taxCalculating.value = true
  try {
    const payload: TaxCalculatorPayload = {
      cif: parseFloat(val.cif),
      year: vehicle.value?.year ?? val.year,
      isLuxury: false,
      isEV: false,
      make: val.name,
    }
    taxResult.value = await fetchTaxes(payload)
  } catch {
    Notify.failure('Failed to calculate taxes. Please try again.')
  } finally {
    taxCalculating.value = false
  }
}
</script>

<template>
  <div class="font-roboto text-gray-800 bg-gray-50 min-h-screen">

    <!-- Loading -->
    <div v-if="loading" class="pt-24 flex items-center justify-center min-h-[60vh]">
      <div class="text-center">
        <i class="fa-solid fa-spinner fa-spin text-4xl text-primary mb-4"></i>
        <p class="text-gray-500">Loading vehicle details…</p>
      </div>
    </div>

    <!-- Not found -->
    <div v-else-if="notFound" class="pt-24 flex items-center justify-center min-h-[60vh]">
      <div class="text-center">
        <i class="fa-solid fa-car-side text-6xl text-gray-200 mb-4"></i>
        <h2 class="text-2xl font-bold text-secondary mb-2">Vehicle not found</h2>
        <p class="text-gray-500 mb-6">This vehicle may no longer be available.</p>
        <NuxtLink to="/vehicles" class="bg-primary hover:bg-red-700 text-white px-6 py-2.5 rounded-full font-medium transition-colors">
          Browse All Vehicles
        </NuxtLink>
      </div>
    </div>

    <!-- Vehicle Detail -->
    <div v-else-if="vehicle">

      <!-- Breadcrumb -->
      <div class="bg-white border-b border-gray-100 pt-20">
        <div class="container mx-auto px-4 py-3">
          <nav class="flex items-center gap-2 text-sm text-gray-500">
            <NuxtLink to="/" class="hover:text-primary transition-colors">Home</NuxtLink>
            <i class="fa-solid fa-chevron-right text-xs"></i>
            <NuxtLink to="/vehicles" class="hover:text-primary transition-colors">Vehicles</NuxtLink>
            <i class="fa-solid fa-chevron-right text-xs"></i>
            <span class="text-secondary font-medium">{{ vehicle.brand?.name }} {{ vehicle.model }}</span>
          </nav>
        </div>
      </div>

      <div class="container mx-auto px-4 py-10">
        <div class="grid grid-cols-1 lg:grid-cols-5 gap-8">

          <!-- Left: Gallery + Details -->
          <div class="lg:col-span-3 space-y-6">

            <!-- Main image -->
            <div class="bg-white rounded-xl shadow-sm overflow-hidden">
              <div
                class="relative h-80 sm:h-[520px] bg-gray-100 cursor-pointer overflow-hidden"
                @click="lightbox = true"
              >
                <img
                  v-if="activeImg"
                  :src="storageUrl(activeImg)"
                  :alt="`${vehicle.brand?.name} ${vehicle.model}`"
                  class="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
                <div v-else class="w-full h-full flex items-center justify-center text-gray-200">
                  <i class="fa-solid fa-car text-8xl"></i>
                </div>
                <div v-if="activeImg" class="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
                  <i class="fa-solid fa-expand text-xs"></i> View full
                </div>
              </div>

              <!-- Thumbnails -->
              <div v-if="sortedImages.length > 1" class="flex gap-2 p-4 overflow-x-auto">
                <button
                  v-for="img in sortedImages"
                  :key="img.id"
                  @click="activeImg = img.path"
                  class="w-20 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-all"
                  :class="activeImg === img.path ? 'border-primary' : 'border-transparent hover:border-gray-300'"
                >
                  <img :src="storageUrl(img.path)" alt="" class="w-full h-full object-cover" />
                </button>
              </div>
            </div>

            <!-- Description -->
            <div v-if="vehicle.description" class="bg-white rounded-xl shadow-sm p-6">
              <h3 class="font-semibold text-secondary text-lg mb-3">About this vehicle</h3>
              <p class="text-gray-600 leading-relaxed text-sm whitespace-pre-line">{{ vehicle.description }}</p>
            </div>

            <!-- Features -->
            <div v-if="vehicle.features.length" class="bg-white rounded-xl shadow-sm p-6">
              <h3 class="font-semibold text-secondary text-lg mb-4">Features & Equipment</h3>
              <div v-for="(items, category) in featuresByCategory" :key="category" class="mb-4">
                <h4 class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 capitalize">{{ category }}</h4>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-y-2">
                  <div v-for="feat in items" :key="feat.id" class="flex items-center gap-2 text-sm text-gray-700">
                    <i :class="feat.icon ? `fa-solid ${feat.icon}` : 'fa-solid fa-check'" class="text-primary text-xs w-4 shrink-0"></i>
                    {{ feat.name }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Attributes -->
            <div v-if="vehicle.attributes.length" class="bg-white rounded-xl shadow-sm p-6">
              <h3 class="font-semibold text-secondary text-lg mb-4">Additional Specifications</h3>
              <dl class="grid grid-cols-2 gap-x-6 gap-y-3">
                <div v-for="attr in vehicle.attributes" :key="attr.id" class="flex flex-col">
                  <dt class="text-xs text-gray-400">{{ attr.attributeName }}</dt>
                  <dd class="text-sm font-medium text-gray-700">{{ attr.value }}{{ attr.unit ? ' ' + attr.unit : '' }}</dd>
                </div>
              </dl>
            </div>

            <!-- YouTube video -->
            <div v-if="youtubeEmbedUrl" class="bg-white rounded-xl shadow-sm overflow-hidden">
              <div class="aspect-video">
                <iframe
                  :src="youtubeEmbedUrl"
                  class="w-full h-full"
                  frameborder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowfullscreen
                ></iframe>
              </div>
            </div>

          </div>

          <!-- Right: Info sidebar -->
          <div class="lg:col-span-2 space-y-6">

            <!-- Title + Price card -->
            <div class="bg-white rounded-xl shadow-sm p-6">
              <div class="flex items-start justify-between gap-3 mb-2">
                <h1 class="text-2xl font-bold font-montserrat text-secondary leading-tight">
                  {{ vehicle.brand?.name }} {{ vehicle.model }}
                </h1>
                <span class="text-xs font-semibold px-2.5 py-1 rounded-full capitalize shrink-0 mt-1" :class="statusColor(vehicle.status)">
                  {{ vehicle.status === 'in_transit' ? 'In Transit' : vehicle.status }}
                </span>
              </div>
              <p class="text-gray-400 text-sm mb-4">{{ vehicle.reference }}</p>
              <div class="mb-5">
                <div class="text-3xl font-bold text-primary">{{ fmtPrice(vehicle.sellingPrice) }}</div>
                <p v-if="isInternational" class="text-xs text-gray-500 mt-1">
                  <i class="fa-solid fa-info-circle mr-1"></i>
                  CIF Price only — does not include import taxes &amp; duties
                </p>
                <p v-else-if="isPartnerVehicle && !isInternational" class="text-xs text-gray-500 mt-1">
                  <i class="fa-solid fa-info-circle mr-1"></i>
                  Price includes EzzyRide sourcing fee
                </p>
              </div>

              <!-- Partner badge -->
              <div v-if="isPartnerVehicle" class="mb-4">
                <div class="flex items-center gap-2 mb-2">
                  <span class="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
                        :class="isInternational ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'">
                    <i :class="isInternational ? 'fa-solid fa-globe' : 'fa-solid fa-map-pin'" class="text-[10px]"></i>
                    {{ isInternational ? 'International' : 'Local' }} Partner
                  </span>
                  <span class="text-xs text-gray-500">via {{ vehicle.partner!.name }}</span>
                </div>

                <!-- Deposit info -->
                <div v-if="depositPercentage !== null && depositAmount" class="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div class="flex items-center gap-2 mb-1">
                    <i class="fa-solid fa-hand-holding-dollar text-green-600 text-sm"></i>
                    <span class="text-sm font-semibold text-green-800">
                      {{ depositPercentage < 100 ? `Start from ${depositPercentage}% deposit` : 'Full CIF payment required' }}
                    </span>
                  </div>
                  <p class="text-xs text-green-700">
                    {{ depositPercentage < 100 ? 'Pay as little as' : 'Upfront payment of' }}
                    <strong>{{ fmtCurrency(depositAmount, partnerCurrency) }}</strong>
                    <template v-if="depositAmountUgx">
                      (~<strong>{{ fmtUgx(depositAmountUgx) }}</strong>)
                    </template>
                    {{ depositPercentage < 100 ? 'to begin the purchase process.' : 'to start.' }}
                    {{ vehicle.partner!.depositNotes || (depositPercentage < 100 ? 'Balance payable as per agreed terms.' : '') }}
                  </p>
                </div>
              </div>

              <!-- Key specs -->
              <div class="grid grid-cols-2 gap-3 border-t border-gray-100 pt-5">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <i class="fa-solid fa-calendar text-primary text-xs"></i>
                  </div>
                  <div>
                    <div class="text-xs text-gray-400">Year</div>
                    <div class="text-sm font-semibold">{{ vehicle.year }}</div>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <i class="fa-solid fa-road text-primary text-xs"></i>
                  </div>
                  <div>
                    <div class="text-xs text-gray-400">Mileage</div>
                    <div class="text-sm font-semibold">{{ fmtMileage(vehicle.mileage) }}</div>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <i class="fa-solid fa-gears text-primary text-xs"></i>
                  </div>
                  <div>
                    <div class="text-xs text-gray-400">Transmission</div>
                    <div class="text-sm font-semibold capitalize">{{ vehicle.transmission || '—' }}</div>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <i class="fa-solid fa-gas-pump text-primary text-xs"></i>
                  </div>
                  <div>
                    <div class="text-xs text-gray-400">Fuel Type</div>
                    <div class="text-sm font-semibold capitalize">{{ vehicle.fuelType || '—' }}</div>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <i class="fa-solid fa-gauge text-primary text-xs"></i>
                  </div>
                  <div>
                    <div class="text-xs text-gray-400">Engine</div>
                    <div class="text-sm font-semibold">{{ fmtCC(vehicle.engineCc) }}</div>
                  </div>
                </div>
                <div v-if="vehicle.colour" class="flex items-center gap-2">
                  <div class="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <i class="fa-solid fa-palette text-primary text-xs"></i>
                  </div>
                  <div>
                    <div class="text-xs text-gray-400">Colour</div>
                    <div class="text-sm font-semibold capitalize">{{ vehicle.colour }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Quick actions -->
            <div class="bg-white rounded-xl shadow-sm p-6">
              <div class="grid grid-cols-1 gap-3">
                <!-- Start Purchase button — only when available -->
                <button
                  v-if="canPurchase"
                  @click="showPurchaseModal = true"
                  class="w-full flex items-center justify-center gap-2 bg-primary hover:bg-red-700 text-white font-medium py-3 px-5 rounded-lg transition-colors text-sm"
                >
                  <i class="fa-solid fa-cart-shopping"></i> Start Purchase
                </button>
                <!-- In transit notice -->
                <div v-if="vehicle.status === 'in_transit'" class="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                  <i class="fa-solid fa-ship text-blue-600 mb-1"></i>
                  <p class="text-sm font-medium text-blue-800">This vehicle is currently in transit</p>
                  <p class="text-xs text-blue-600 mt-1">You can reserve it now while it's on its way to Uganda</p>
                </div>
                <!-- Reserved notice -->
                <div v-else-if="vehicle.status === 'reserved'" class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                  <i class="fa-solid fa-clock text-yellow-600 mb-1"></i>
                  <p class="text-sm font-medium text-yellow-800">This vehicle is currently reserved</p>
                  <p class="text-xs text-yellow-600 mt-1">You can still send an enquiry below</p>
                </div>

                <button
                  v-if="isInternational"
                  @click="openTaxModal"
                  class="w-full flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/90 text-white font-medium py-3 px-5 rounded-lg transition-colors text-sm"
                >
                  <i class="fa-solid fa-calculator"></i> Calculate Estimated Total
                </button>
                <NuxtLink
                  v-else
                  to="/tax-calculator"
                  class="w-full flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/90 text-white font-medium py-3 px-5 rounded-lg transition-colors text-sm"
                >
                  <i class="fa-solid fa-calculator"></i> Calculate Import Tax
                </NuxtLink>
                <NuxtLink
                  v-if="!isPartnerVehicle || isInternational"
                  to="/import-assistance"
                  class="w-full flex items-center justify-center gap-2 border border-primary text-primary hover:bg-primary hover:text-white font-medium py-3 px-5 rounded-lg transition-colors text-sm"
                >
                  <i class="fa-solid fa-ship"></i> Import Assistance
                </NuxtLink>
              </div>
            </div>

            <!-- Enquiry form -->
            <div class="bg-white rounded-xl shadow-sm p-6">
              <h3 class="font-semibold text-secondary text-lg mb-4 flex items-center gap-2">
                <i class="fa-solid fa-envelope text-primary"></i> Enquire About This Vehicle
              </h3>

              <div v-if="inqSuccess" class="bg-green-50 border border-green-200 text-green-700 rounded-lg p-4 text-sm text-center">
                <i class="fa-solid fa-circle-check text-lg mb-1"></i>
                <p class="font-medium">Enquiry sent!</p>
                <p class="text-xs mt-1 text-green-600">We'll be in touch with you shortly.</p>
                <button @click="inqSuccess = false" class="mt-3 text-xs text-green-600 underline hover:no-underline">Send another</button>
              </div>

              <form v-else @submit.prevent="sendInquiry" class="space-y-3">
                <div>
                  <input
                    v-model="inqForm.name"
                    type="text"
                    placeholder="Your name *"
                    required
                    class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <input
                    v-model="inqForm.email"
                    type="email"
                    placeholder="Email address"
                    class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <PhoneInput v-model="inqForm.phone" placeholder="Phone / WhatsApp" />
                </div>
                <div>
                  <textarea
                    v-model="inqForm.message"
                    rows="3"
                    placeholder="Your message / questions *"
                    required
                    class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  ></textarea>
                </div>
                <button
                  type="submit"
                  :disabled="sendingInq"
                  class="w-full bg-primary hover:bg-red-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <i v-if="sendingInq" class="fa-solid fa-spinner fa-spin"></i>
                  <i v-else class="fa-solid fa-paper-plane"></i>
                  {{ sendingInq ? 'Sending…' : 'Send Enquiry' }}
                </button>
                <p class="text-xs text-gray-400 text-center">Email or phone required</p>
              </form>
            </div>

          </div>
        </div>
      </div>
    </div>

    <!-- Lightbox -->
    <Teleport to="body">
      <div
        v-if="lightbox && activeImg"
        class="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4"
        @click.self="lightbox = false"
      >
        <button
          @click="lightbox = false"
          class="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors"
        >
          <i class="fa-solid fa-xmark text-lg"></i>
        </button>
        <img :src="storageUrl(activeImg)" alt="" class="max-h-[90vh] max-w-full object-contain rounded-lg" />
      </div>
    </Teleport>

    <!-- Purchase Modal -->
    <Teleport to="body">
      <div
        v-if="showPurchaseModal"
        class="fixed inset-0 z-[150] bg-black/50 flex items-center justify-center p-4"
        @click.self="closePurchaseModal"
      >
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
          <!-- Modal header -->
          <div class="bg-secondary px-6 py-4 flex items-center justify-between">
            <h3 class="text-white font-semibold text-lg">Start Purchase</h3>
            <button @click="closePurchaseModal" class="text-white/70 hover:text-white transition-colors">
              <i class="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>

          <!-- Success state -->
          <div v-if="purchaseResult" class="p-6 text-center">
            <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i class="fa-solid fa-circle-check text-green-600 text-3xl"></i>
            </div>
            <h4 class="text-lg font-bold text-secondary mb-2">Request Submitted!</h4>
            <p class="text-sm text-gray-600 mb-4">{{ purchaseResult.message }}</p>
            <div class="bg-gray-50 rounded-lg p-3 mb-4">
              <p class="text-xs text-gray-500">Your reference number</p>
              <p class="text-lg font-bold text-secondary font-mono">{{ purchaseResult.reference }}</p>
            </div>
            <button
              @click="closePurchaseModal"
              class="w-full bg-secondary hover:bg-secondary/90 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
            >
              Done
            </button>
          </div>

          <!-- Form state -->
          <div v-else class="p-6">
            <!-- Vehicle summary -->
            <div v-if="vehicle" class="flex items-center gap-3 bg-gray-50 rounded-lg p-3 mb-5">
              <img
                v-if="activeImg"
                :src="storageUrl(activeImg)"
                alt=""
                class="w-16 h-12 object-cover rounded-lg"
              />
              <div class="min-w-0">
                <p class="text-sm font-semibold text-secondary truncate">{{ vehicle.brand?.name }} {{ vehicle.model }} {{ vehicle.year }}</p>
                <p class="text-primary font-bold text-sm">{{ fmtPrice(vehicle.sellingPrice) }}</p>
              </div>
            </div>

            <!-- Deposit notice for international partner vehicles -->
            <div v-if="isInternational && depositAmount" class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p class="text-xs text-blue-700">
                <i class="fa-solid fa-info-circle mr-1"></i>
                {{ depositPercentage! < 100 ? 'Initial deposit' : 'Full CIF payment' }} of
                <strong>{{ depositPercentage }}% ({{ fmtCurrency(depositAmount, partnerCurrency) }}<template v-if="depositAmountUgx"> / {{ fmtUgx(depositAmountUgx) }}</template>)</strong>
                required to start the process.
              </p>
            </div>

            <p class="text-sm text-gray-600 mb-4">Enter your details and our team will reach out with next steps.</p>

            <form @submit.prevent="submitPurchase" class="space-y-3">
              <div>
                <label class="text-xs text-gray-500 mb-1 block">Full name *</label>
                <input
                  v-model="purchaseForm.name"
                  type="text"
                  required
                  placeholder="Your full name"
                  class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label class="text-xs text-gray-500 mb-1 block">Email address</label>
                <input
                  v-model="purchaseForm.email"
                  type="email"
                  placeholder="you@example.com"
                  class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label class="text-xs text-gray-500 mb-1 block">Phone / WhatsApp</label>
                <PhoneInput v-model="purchaseForm.phone" />
              </div>
              <!-- Reservation deposit for non-partner / local partner (direct sale) -->
              <div v-if="!isInternational">
                <label class="text-xs text-gray-500 mb-1 block">Reservation Deposit (UGX)</label>
                <input
                  v-model="purchaseForm.reservation_deposit"
                  type="number"
                  min="0"
                  placeholder="e.g. 500,000"
                  class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <p class="text-xs text-gray-400 mt-1">How much you'd like to put down to reserve this vehicle.</p>
              </div>
              <p class="text-xs text-gray-400">At least one contact method (email or phone) is required.</p>
              <label class="flex items-start gap-2 text-xs text-gray-500">
                <input v-model="purchaseForm.agreed_terms" type="checkbox" required class="mt-0.5 rounded border-gray-300 text-primary focus:ring-primary" />
                <span>I agree to the <NuxtLink to="/terms" target="_blank" class="text-primary hover:underline">Terms & Conditions</NuxtLink> and <NuxtLink to="/privacy" target="_blank" class="text-primary hover:underline">Privacy Policy</NuxtLink>.</span>
              </label>
              <button
                type="submit"
                :disabled="purchasing || !purchaseForm.agreed_terms"
                class="w-full bg-primary hover:bg-red-700 disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
              >
                <i v-if="purchasing" class="fa-solid fa-spinner fa-spin"></i>
                <i v-else class="fa-solid fa-cart-shopping"></i>
                {{ purchasing ? 'Submitting…' : 'Submit Purchase Request' }}
              </button>
            </form>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Tax Calculator Modal -->
    <Teleport to="body">
      <div
        v-if="showTaxModal"
        class="fixed inset-0 z-[150] bg-black/50 flex items-center justify-center p-4"
        @click.self="closeTaxModal"
      >
        <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
          <!-- Header -->
          <div class="bg-secondary px-6 py-4 flex items-center justify-between sticky top-0 z-10">
            <h3 class="text-white font-semibold text-lg">Import Tax Estimate</h3>
            <button @click="closeTaxModal" class="text-white/70 hover:text-white transition-colors">
              <i class="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>

          <div class="p-6 space-y-5">
            <!-- Vehicle context -->
            <div v-if="vehicle" class="bg-gray-50 rounded-lg p-3 flex items-center gap-3">
              <img
                v-if="activeImg"
                :src="storageUrl(activeImg)"
                alt=""
                class="w-14 h-10 object-cover rounded-lg"
              />
              <div class="min-w-0">
                <p class="text-sm font-semibold text-secondary truncate">{{ vehicle.brand?.name }} {{ vehicle.model }} {{ vehicle.year }}</p>
                <p class="text-xs text-gray-500">CIF: {{ fmtPrice(vehicle.sellingPrice) }}</p>
              </div>
            </div>

            <!-- Search URA valuation -->
            <div v-if="!selectedValuation">
              <label class="block text-sm font-medium text-gray-700 mb-2">Search URA Vehicle Valuation</label>
              <div class="relative">
                <input
                  v-model="taxSearchQuery"
                  @input="onTaxSearchInput"
                  type="text"
                  placeholder="Type vehicle make/model (e.g. Honda Vezel)"
                  class="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary pr-10"
                />
                <div class="absolute right-3 top-1/2 -translate-y-1/2">
                  <i v-if="taxSearchLoading" class="fa-solid fa-spinner fa-spin text-gray-400"></i>
                  <i v-else class="fa-solid fa-search text-gray-400"></i>
                </div>
              </div>
              <p class="text-xs text-gray-500 mt-1">Search from URA's official vehicle valuation database</p>

              <!-- Results dropdown -->
              <div v-if="taxSearchResults.length" class="mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                <div class="text-xs text-gray-500 px-3 py-2 bg-gray-50 font-medium">
                  Found {{ taxSearchResults.length }} matches
                </div>
                <div
                  v-for="val in taxSearchResults"
                  :key="val.id"
                  @click="selectTaxValuation(val)"
                  class="hover:bg-blue-50 p-3 cursor-pointer border-b border-gray-100 transition"
                >
                  <div class="flex justify-between items-start">
                    <div class="flex-1 min-w-0">
                      <h4 class="font-medium text-secondary text-sm mb-1">{{ val.name }}</h4>
                      <div class="grid grid-cols-2 gap-1 text-xs text-gray-600">
                        <span><i class="fa-solid fa-calendar mr-1"></i>{{ val.year }}</span>
                        <span><i class="fa-solid fa-gas-pump mr-1"></i>{{ val.cc }} {{ val.unit }}</span>
                      </div>
                    </div>
                    <div class="text-right ml-3 shrink-0">
                      <div class="text-primary font-bold text-sm">{{ formatCurrency(+val.cif, 'USD') }}</div>
                      <div class="text-xs text-gray-500">CIF Value</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Selected valuation -->
            <div v-if="selectedValuation" class="bg-white p-4 rounded-lg border-2 border-primary">
              <h4 class="font-semibold text-secondary text-sm mb-3 flex items-center">
                <i class="fa-solid fa-check-circle text-primary mr-2"></i>
                Selected URA Valuation
              </h4>
              <div class="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span class="text-gray-500 text-xs">Model</span>
                  <p class="font-medium text-secondary">{{ selectedValuation.name }}</p>
                </div>
                <div>
                  <span class="text-gray-500 text-xs">Engine</span>
                  <p class="font-medium text-secondary">{{ selectedValuation.cc }} {{ selectedValuation.unit }}</p>
                </div>
                <div>
                  <span class="text-gray-500 text-xs">Origin</span>
                  <p class="font-medium text-secondary">{{ selectedValuation.origin }}</p>
                </div>
                <div>
                  <span class="text-gray-500 text-xs">URA CIF Value</span>
                  <p class="font-medium text-primary">{{ formatCurrency(+selectedValuation.cif, 'USD') }}</p>
                </div>
              </div>
              <button @click="clearTaxSelection" class="mt-3 text-xs text-primary hover:text-red-600 transition">
                <i class="fa-solid fa-times mr-1"></i>Change Selection
              </button>
            </div>

            <!-- Calculating spinner -->
            <div v-if="taxCalculating" class="text-center py-6">
              <i class="fa-solid fa-spinner fa-spin text-3xl text-primary mb-3"></i>
              <p class="text-sm text-gray-500">Calculating import taxes...</p>
            </div>

            <!-- Tax results -->
            <div v-if="taxResult && !taxCalculating" class="space-y-4">
              <!-- Vehicle CIF (from listing) -->
              <div class="bg-gray-50 rounded-lg px-4 py-3 text-sm">
                <div class="flex justify-between items-center">
                  <span class="font-semibold text-secondary">Vehicle CIF Price</span>
                  <span class="font-bold text-primary text-base">{{ fmtPrice(vehicle!.sellingPrice) }}</span>
                </div>
                <p v-if="vehicle?.cifUsd" class="text-xs text-gray-500 mt-1">
                  CIF USD {{ fmtUsd(Number(vehicle.cifUsd)) }} converted at market rate
                </p>
              </div>

              <div>
                <h4 class="font-semibold text-secondary text-sm mb-1">Estimated Import Taxes</h4>
                <p class="text-xs text-gray-500 mb-3">
                  Taxes are calculated using URA's gazetted valuation rate ({{ fmtUgx(taxResult.usdRate) }}/USD), which may differ from the market rate used for the CIF price above.
                </p>
              </div>

              <div class="bg-gray-50 rounded-lg divide-y divide-gray-200 text-sm">
                <div class="flex justify-between px-4 py-2.5">
                  <span class="text-gray-600">URA Valuation CIF (UGX)</span>
                  <span class="font-medium text-gray-500">{{ fmtUgx(taxResult.cifUGX) }}</span>
                </div>
                <div class="flex justify-between px-4 py-2.5">
                  <span class="text-gray-600">Import Duty</span>
                  <span class="font-medium">{{ fmtUgx(taxResult.importDuty) }}</span>
                </div>
                <div class="flex justify-between px-4 py-2.5">
                  <span class="text-gray-600">VAT</span>
                  <span class="font-medium">{{ fmtUgx(taxResult.vat) }}</span>
                </div>
                <div class="flex justify-between px-4 py-2.5">
                  <span class="text-gray-600">Withholding Tax</span>
                  <span class="font-medium">{{ fmtUgx(taxResult.withholding) }}</span>
                </div>
                <div v-if="taxResult.envLevy" class="flex justify-between px-4 py-2.5">
                  <span class="text-gray-600">Environmental Levy</span>
                  <span class="font-medium">{{ fmtUgx(taxResult.envLevy) }}</span>
                </div>
                <div class="flex justify-between px-4 py-2.5">
                  <span class="text-gray-600">Infrastructure Tax</span>
                  <span class="font-medium">{{ fmtUgx(taxResult.infrastructureTax) }}</span>
                </div>
                <div class="flex justify-between px-4 py-2.5">
                  <span class="text-gray-600">Import Commission</span>
                  <span class="font-medium">{{ fmtUgx(taxResult.importCommission) }}</span>
                </div>
                <div class="flex justify-between px-4 py-2.5">
                  <span class="text-gray-600">Form Fees + Stamp Duty + Registration</span>
                  <span class="font-medium">{{ fmtUgx(taxResult.formFees + taxResult.stampDuty + taxResult.registrationFees) }}</span>
                </div>
                <div class="flex justify-between px-4 py-3 font-semibold bg-gray-100">
                  <span>Total Taxes</span>
                  <span class="text-secondary">{{ fmtUgx(taxResult.totalTax) }}</span>
                </div>
              </div>

              <!-- Service fee -->
              <div v-if="serviceFee > 0" class="bg-blue-50 rounded-lg px-4 py-3 flex justify-between items-center text-sm">
                <span class="text-blue-700">
                  <i class="fa-solid fa-briefcase mr-1"></i>
                  EzzyRide {{ serviceFeeLabel }}
                </span>
                <span class="font-semibold text-blue-800">{{ fmtUgx(serviceFee) }}</span>
              </div>

              <!-- Other required fees -->
              <div v-if="additionalFees > 0" class="bg-gray-50 rounded-lg overflow-hidden text-sm">
                <div v-if="feeNumberPlate > 0" class="flex justify-between items-center px-4 py-2.5 border-b border-gray-200">
                  <span class="text-gray-600"><i class="fa-solid fa-id-card text-primary mr-1.5"></i>Number Plate Registration</span>
                  <span class="font-semibold text-gray-700">{{ fmtUgx(feeNumberPlate) }}</span>
                </div>
                <div v-if="feeThirdPartyIns > 0" class="flex justify-between items-center px-4 py-2.5">
                  <span class="text-gray-600"><i class="fa-solid fa-shield-halved text-primary mr-1.5"></i>3rd Party Insurance</span>
                  <span class="font-semibold text-gray-700">{{ fmtUgx(feeThirdPartyIns) }}</span>
                </div>
              </div>

              <!-- Estimated total -->
              <div class="bg-primary/10 border border-primary/20 rounded-lg px-4 py-4">
                <div class="flex justify-between items-center">
                  <span class="font-semibold text-secondary">Estimated Total</span>
                  <span class="text-xl font-bold text-primary">{{ fmtUgx(taxEstimatedTotal) }}</span>
                </div>
                <p class="text-xs text-gray-500 mt-2">
                  = CIF Price ({{ fmtPrice(vehicle!.sellingPrice) }}) + Taxes ({{ fmtUgx(taxResult.totalTax) }})
                  <template v-if="serviceFee > 0"> + {{ serviceFeeLabel }} ({{ fmtUgx(serviceFee) }})</template>
                  <template v-if="additionalFees > 0"> + Plate &amp; Insurance ({{ fmtUgx(additionalFees) }})</template>
                </p>
              </div>

              <!-- Exclusions notice -->
              <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p class="text-xs text-yellow-800">
                  <i class="fa-solid fa-triangle-exclamation mr-1"></i>
                  <strong>Note:</strong> This estimate does not include transport costs (Mombasa to Kampala), port clearance charges, or bond fees — these vary depending on vehicle weight, current rates, and clearing agent.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>
