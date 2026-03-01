<script setup lang="ts">
import { Loading, Notify } from 'notiflix'
const { $api } = useNuxtApp()
const { storageUrl } = useStorage()
const route = useRoute()

const id = route.params.id as string

interface Vehicle {
  id: number; reference: string; model: string; year: number
  sellingPrice: string | null; transmission: string; fuelType: string; driveType: string
  mileage: number | null; engineCc: number | null; colour: string | null
  seatingCapacity: number | null; description: string | null; youtubeUrl: string | null
  brand: { id: number; name: string } | null
  category: { id: number; name: string } | null
  primaryImage: string | null
  images: { id: number; path: string; isPrimary: boolean; sortOrder: number }[]
  features: { id: number; name: string; icon: string | null; category: string }[]
  attributes: { id: number; attributeName: string; unit: string | null; value: string }[]
  status: string
}

const vehicle    = ref<Vehicle | null>(null)
const loading    = ref(true)
const notFound   = ref(false)
const activeImg  = ref<string | null>(null)
const lightbox   = ref(false)

// Inquiry form
const inqForm    = ref({ name: '', email: '', phone: '', message: '' })
const sendingInq = ref(false)
const inqSuccess = ref(false)

useSeoMeta({
  title: computed(() => vehicle.value ? `${vehicle.value.brand?.name} ${vehicle.value.model} ${vehicle.value.year} | EzzyRide Uganda` : 'Vehicle Details | EzzyRide Uganda'),
  description: computed(() => vehicle.value?.description ?? 'Vehicle details and specifications — EzzyRide Uganda.'),
})

onMounted(async () => {
  try {
    const { data } = await $api.get(`/web/vehicles/${id}`)
    vehicle.value = data.data
    // primaryImage relation is not loaded on show(); derive from images array
    const imgs: { path: string; isPrimary: boolean; sortOrder: number }[] = data.data.images ?? []
    const primary = imgs.find(i => i.isPrimary) ?? imgs[0]
    activeImg.value = primary?.path ?? null
  } catch {
    notFound.value = true
  } finally {
    loading.value = false
  }
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
const fmtMileage = (n: number | null) => n ? n.toLocaleString() + ' km' : '—'
const fmtCC = (n: number | null) => n ? n.toLocaleString() + ' cc' : '—'

const statusColor = (s: string) => s === 'available'
  ? 'bg-green-100 text-green-700'
  : s === 'reserved' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'

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
                    <i :class="feat.icon ?? 'fa-solid fa-check'" class="text-primary text-xs w-4 shrink-0"></i>
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
                  {{ vehicle.status }}
                </span>
              </div>
              <p class="text-gray-400 text-sm mb-4">{{ vehicle.reference }}</p>
              <div class="text-3xl font-bold text-primary mb-5">{{ fmtPrice(vehicle.sellingPrice) }}</div>

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
                    <i class="fa-solid fa-engine text-primary text-xs"></i>
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
                <NuxtLink
                  :to="`/tax-calculator`"
                  class="w-full flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/90 text-white font-medium py-3 px-5 rounded-lg transition-colors text-sm"
                >
                  <i class="fa-solid fa-calculator"></i> Calculate Import Tax
                </NuxtLink>
                <NuxtLink
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
                  <input
                    v-model="inqForm.phone"
                    type="tel"
                    placeholder="Phone / WhatsApp"
                    class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
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

  </div>
</template>
