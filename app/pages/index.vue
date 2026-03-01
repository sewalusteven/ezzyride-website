<script setup lang="ts">
import type { VehicleValuation } from '@/types'
const { $api } = useNuxtApp()
const { storageUrl } = useStorage()

useSeoMeta({
  title: 'EzzyRide Uganda | Premium Japanese Vehicle Imports',
  description: 'Your trusted partner for importing high-quality Japanese vehicles to Uganda. Tax calculator, import assistance, vehicle sales.',
})

// ── Featured Vehicles ─────────────────────────────────────────────────────
interface Vehicle {
  id: number; reference: string; model: string; year: number
  sellingPrice: string | null; transmission: string; fuelType: string; mileage: number | null
  brand: { id: number; name: string } | null
  primaryImage: string | null; status: string
}
const featuredVehicles = ref<Vehicle[]>([])
const vehiclesLoaded   = ref(false)

onMounted(async () => {
  try {
    const { data } = await $api.get('/web/vehicles', { params: { limit: 6 } })
    featuredVehicles.value = data.data
  } catch {}
  finally {
    vehiclesLoaded.value = true
  }
})

const fmtPrice = (v: string | null) => v ? 'UGX ' + Number(v).toLocaleString() : 'Contact for price'

// ── Mailing list ──────────────────────────────────────────────────────────
const mailingEmail = ref('')
const mailingMsg   = ref('')
const submitEmail  = async () => {
  if (!mailingEmail.value) return
  try {
    await $api.post('/web/mailing-list', { email: mailingEmail.value })
    mailingEmail.value = ''
    mailingMsg.value   = "You're on the list!"
    setTimeout(() => { mailingMsg.value = '' }, 4000)
  } catch {}
}

// ── FAQ ───────────────────────────────────────────────────────────────────
const openFaq = ref<number | null>(null)
const faqs = [
  { q: 'How long does the import process take?', a: 'A typical full import from Japan takes 6–10 weeks from vehicle sourcing to delivery in Uganda, depending on shipping schedules and customs clearance.' },
  { q: 'What is the CIF value?', a: 'CIF (Cost, Insurance, Freight) is the total value of the vehicle including its purchase price, insurance and shipping costs to the Mombasa port. URA uses this as the base for tax calculation.' },
  { q: 'Do you help with customs clearance?', a: 'Yes — for our Full Import and Mombasa Clearance packages we handle all customs documentation, URA assessment, and port releases.' },
  { q: 'Can I choose the specific car I want?', a: 'Absolutely. You can share a link from any Japanese auction site and we will source that exact vehicle, or give us your specs and budget and we will find the best match.' },
]
</script>

<template>
  <div class="font-roboto text-gray-800">
    <!-- ── Hero ─────────────────────────────────────────────────────────── -->
    <section class="relative min-h-[85vh] flex items-center overflow-hidden bg-secondary">
      <!-- Background gradient (replace with actual photo via CSS or img) -->
      <div class="absolute inset-0 bg-gradient-to-r from-secondary via-secondary/90 to-accent/60 z-10"></div>
      <div class="absolute inset-0 opacity-20" style="background-image:url('https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1600&auto=format&fit=crop'); background-size:cover; background-position:center;"></div>

      <div class="container mx-auto px-4 relative z-20 pt-24 pb-20">
        <div class="max-w-3xl text-white">
          <div class="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <i class="fa-solid fa-star text-xs"></i> Uganda's Trusted Import Partner
          </div>
          <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold font-montserrat leading-tight mb-6">
            Premium Japanese Imports <span class="text-primary">Delivered to Uganda</span>
          </h1>
          <p class="text-xl mb-10 text-gray-200 max-w-2xl">
            End-to-end vehicle importation, transparent tax calculation, and expert guidance — making your dream car a reality.
          </p>
          <div class="flex flex-wrap gap-4">
            <NuxtLink to="/vehicles" class="bg-primary hover:bg-red-700 text-white font-semibold py-3.5 px-8 rounded-full transition duration-300 flex items-center gap-2">
              <i class="fa-solid fa-car"></i> Browse Vehicles
            </NuxtLink>
            <NuxtLink to="/tax-calculator" class="bg-transparent border-2 border-white hover:bg-white hover:text-secondary text-white font-semibold py-3.5 px-8 rounded-full transition duration-300 flex items-center gap-2">
              <i class="fa-solid fa-calculator"></i> Tax Calculator
            </NuxtLink>
            <NuxtLink to="/import-assistance" class="bg-accent hover:bg-blue-600 text-white font-semibold py-3.5 px-8 rounded-full transition duration-300 flex items-center gap-2">
              <i class="fa-solid fa-ship"></i> Import Assistance
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Scroll indicator -->
      <div class="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 text-white/60 animate-bounce">
        <i class="fa-solid fa-chevron-down text-xl"></i>
      </div>
    </section>

    <!-- ── Stats Bar ─────────────────────────────────────────────────────── -->
    <section class="bg-primary text-white py-6">
      <div class="container mx-auto px-4">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <p class="text-3xl font-bold font-montserrat">New</p>
            <p class="text-sm text-red-100 mt-1">Just Getting Started</p>
          </div>
          <div>
            <p class="text-3xl font-bold font-montserrat">100%</p>
            <p class="text-sm text-red-100 mt-1">Client Focused</p>
          </div>
          <div>
            <p class="text-3xl font-bold font-montserrat">6–10</p>
            <p class="text-sm text-red-100 mt-1">Weeks Average Import</p>
          </div>
          <div>
            <p class="text-3xl font-bold font-montserrat">0</p>
            <p class="text-sm text-red-100 mt-1">Hidden Fees</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Services ──────────────────────────────────────────────────────── -->
    <section class="py-20 bg-white">
      <div class="container mx-auto px-4">
        <div class="text-center mb-14">
          <h2 class="text-3xl md:text-4xl font-bold font-montserrat text-secondary mb-4">Our Services</h2>
          <p class="text-gray-600 max-w-2xl mx-auto">Everything you need to get your ideal vehicle from Japan to your driveway in Uganda.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <NuxtLink to="/vehicles" class="group bg-light rounded-2xl p-7 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-transparent hover:border-primary/20">
            <div class="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-5 group-hover:bg-primary transition-colors">
              <i class="fa-solid fa-car text-primary group-hover:text-white text-2xl transition-colors"></i>
            </div>
            <h3 class="text-lg font-semibold text-secondary mb-2 font-montserrat">Vehicle Sales</h3>
            <p class="text-gray-600 text-sm">Browse our curated selection of premium Japanese imports ready for purchase.</p>
          </NuxtLink>

          <NuxtLink to="/tax-calculator" class="group bg-light rounded-2xl p-7 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-transparent hover:border-primary/20">
            <div class="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center mb-5 group-hover:bg-accent transition-colors">
              <i class="fa-solid fa-calculator text-accent group-hover:text-white text-2xl transition-colors"></i>
            </div>
            <h3 class="text-lg font-semibold text-secondary mb-2 font-montserrat">Tax Calculator</h3>
            <p class="text-gray-600 text-sm">Calculate exact URA import duties and taxes for any vehicle before you commit.</p>
          </NuxtLink>

          <NuxtLink to="/import-assistance" class="group bg-light rounded-2xl p-7 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-transparent hover:border-primary/20">
            <div class="w-14 h-14 bg-secondary/10 rounded-xl flex items-center justify-center mb-5 group-hover:bg-secondary transition-colors">
              <i class="fa-solid fa-ship text-secondary group-hover:text-white text-2xl transition-colors"></i>
            </div>
            <h3 class="text-lg font-semibold text-secondary mb-2 font-montserrat">Import Assistance</h3>
            <p class="text-gray-600 text-sm">Full end-to-end import service — sourcing, shipping, clearance, delivery.</p>
          </NuxtLink>

          <NuxtLink to="/valuations" class="group bg-light rounded-2xl p-7 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-transparent hover:border-primary/20">
            <div class="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-5 group-hover:bg-green-600 transition-colors">
              <i class="fa-solid fa-chart-line text-green-600 group-hover:text-white text-2xl transition-colors"></i>
            </div>
            <h3 class="text-lg font-semibold text-secondary mb-2 font-montserrat">Valuations</h3>
            <p class="text-gray-600 text-sm">Real-time URA market valuations sourced directly from official batch data.</p>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- ── Featured Vehicles — hidden entirely when none are listed ──────── -->
    <section v-if="!vehiclesLoaded || featuredVehicles.length > 0" class="py-20 bg-gray-50">
      <div class="container mx-auto px-4">
        <div class="flex items-end justify-between mb-12">
          <div>
            <h2 class="text-3xl md:text-4xl font-bold font-montserrat text-secondary mb-2">Featured Vehicles</h2>
            <p class="text-gray-600">Our latest available imports</p>
          </div>
          <NuxtLink to="/vehicles" class="hidden md:flex items-center gap-2 text-primary font-medium hover:underline">
            View All <i class="fa-solid fa-arrow-right text-sm"></i>
          </NuxtLink>
        </div>

        <!-- Skeleton shown only while loading -->
        <div v-if="!vehiclesLoaded" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div v-for="i in 3" :key="i" class="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
            <div class="h-52 bg-gray-200"></div>
            <div class="p-5 space-y-3">
              <div class="h-4 bg-gray-200 rounded w-3/4"></div>
              <div class="h-3 bg-gray-100 rounded w-1/2"></div>
            </div>
          </div>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <NuxtLink
            v-for="v in featuredVehicles"
            :key="v.id"
            :to="`/vehicles/${v.id}`"
            class="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
          >
            <!-- Image -->
            <div class="relative h-52 bg-gray-100 overflow-hidden">
              <img
                v-if="v.primaryImage"
                :src="storageUrl(v.primaryImage)"
                :alt="`${v.brand?.name} ${v.model}`"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div v-else class="h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                <i class="fa-solid fa-car text-gray-300 text-5xl"></i>
              </div>
              <div class="absolute top-3 left-3">
                <span class="bg-green-500 text-white text-xs font-medium px-2.5 py-1 rounded-full capitalize">{{ v.status }}</span>
              </div>
            </div>
            <!-- Info -->
            <div class="p-5">
              <p class="text-xs text-gray-400 mb-1">{{ v.brand?.name }}</p>
              <h3 class="text-lg font-semibold text-secondary font-montserrat">{{ v.year }} {{ v.model }}</h3>
              <div class="flex gap-3 mt-2 text-xs text-gray-500">
                <span><i class="fa-solid fa-gear mr-1"></i>{{ v.transmission }}</span>
                <span><i class="fa-solid fa-gas-pump mr-1"></i>{{ v.fuelType }}</span>
                <span v-if="v.mileage"><i class="fa-solid fa-road mr-1"></i>{{ Number(v.mileage).toLocaleString() }} km</span>
              </div>
              <div class="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <p class="text-primary font-bold text-lg">{{ fmtPrice(v.sellingPrice) }}</p>
                <span class="text-xs text-primary font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                  View Details <i class="fa-solid fa-arrow-right text-xs"></i>
                </span>
              </div>
            </div>
          </NuxtLink>
        </div>

        <div v-if="featuredVehicles.length > 0" class="text-center mt-10 md:hidden">
          <NuxtLink to="/vehicles" class="inline-flex items-center gap-2 bg-secondary text-white px-6 py-3 rounded-full font-medium hover:bg-secondary/90 transition-colors">
            View All Vehicles <i class="fa-solid fa-arrow-right"></i>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- ── Why Choose Us ─────────────────────────────────────────────────── -->
    <section class="py-20 bg-secondary text-white">
      <div class="container mx-auto px-4">
        <div class="text-center mb-14">
          <h2 class="text-3xl md:text-4xl font-bold font-montserrat mb-4">Why Choose EzzyRide?</h2>
          <p class="text-blue-100 max-w-2xl mx-auto">With years of experience in Japanese vehicle imports, we've built a reputation for reliability, transparency, and exceptional service.</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div v-for="item in [
            { icon:'fa-shield-halved', title:'Trusted Partner', text:'Every import handled with full documentation, clear communication, and zero hidden charges — from day one.' },
            { icon:'fa-eye', title:'Full Transparency', text:'Complete cost breakdown upfront — taxes, fees, and our service charge — before you pay anything.' },
            { icon:'fa-clock', title:'Fast Processing', text:'Average 6–10 weeks from Japan to your driveway, with live status updates throughout.' },
            { icon:'fa-headset', title:'Dedicated Support', text:'A dedicated consultant handles your case from enquiry to delivery — always reachable.' },
          ]" :key="item.title" class="text-center">
            <div class="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <i :class="`fa-solid ${item.icon} text-primary text-2xl`"></i>
            </div>
            <h3 class="text-lg font-semibold mb-2">{{ item.title }}</h3>
            <p class="text-blue-100 text-sm">{{ item.text }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ── How It Works ──────────────────────────────────────────────────── -->
    <section class="py-20 bg-white">
      <div class="container mx-auto px-4">
        <div class="text-center mb-14">
          <h2 class="text-3xl md:text-4xl font-bold font-montserrat text-secondary mb-4">How It Works</h2>
          <p class="text-gray-600 max-w-2xl mx-auto">Four simple steps from enquiry to driving your new car.</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div v-for="(step, idx) in [
            { n:'01', icon:'fa-comments', title:'Enquiry & Quote', text:'Tell us what you want or use our calculator. We send a transparent quote within 24 hours.' },
            { n:'02', icon:'fa-magnifying-glass', title:'Sourcing', text:'We search Japanese auctions and dealers for your ideal vehicle matching your spec and budget.' },
            { n:'03', icon:'fa-ship', title:'Shipping', text:'Once purchased, we arrange sea freight with full tracking and marine insurance coverage.' },
            { n:'04', icon:'fa-flag-checkered', title:'Clearance & Delivery', text:'We handle all Mombasa customs clearance, URA duties, and deliver the car to you in Uganda.' },
          ]" :key="step.n" class="relative text-center">
            <div class="relative mb-6">
              <div class="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto">
                <i :class="`fa-solid ${step.icon} text-white text-xl`"></i>
              </div>
              <div v-if="idx < 3" class="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gray-200"></div>
            </div>
            <div class="text-xs font-bold text-primary mb-2">STEP {{ step.n }}</div>
            <h3 class="text-lg font-semibold text-secondary mb-2">{{ step.title }}</h3>
            <p class="text-gray-600 text-sm">{{ step.text }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ── FAQ ───────────────────────────────────────────────────────────── -->
    <section class="py-20 bg-gray-50">
      <div class="container mx-auto px-4">
        <div class="text-center mb-12">
          <h2 class="text-3xl md:text-4xl font-bold font-montserrat text-secondary mb-4">Frequently Asked Questions</h2>
        </div>
        <div class="max-w-3xl mx-auto space-y-4">
          <div
            v-for="(faq, idx) in faqs" :key="idx"
            class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
          >
            <button
              class="w-full flex justify-between items-center px-6 py-4 text-left font-semibold text-secondary hover:text-primary transition-colors"
              @click="openFaq = openFaq === idx ? null : idx"
            >
              {{ faq.q }}
              <i class="fa-solid shrink-0 ml-4" :class="openFaq === idx ? 'fa-chevron-up text-primary' : 'fa-chevron-down'"></i>
            </button>
            <div v-if="openFaq === idx" class="px-6 pb-4 text-gray-600 text-sm leading-relaxed">
              {{ faq.a }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── CTA / Newsletter ──────────────────────────────────────────────── -->
    <section class="py-20 bg-gradient-to-r from-secondary to-accent text-white">
      <div class="container mx-auto px-4 text-center">
        <h2 class="text-3xl md:text-4xl font-bold font-montserrat mb-4">Ready to Import Your Dream Car?</h2>
        <p class="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">Get started today with a free import quote, or subscribe for the latest vehicle arrivals and import tips.</p>
        <div class="flex flex-wrap justify-center gap-4 mb-12">
          <NuxtLink to="/import-assistance" class="bg-primary hover:bg-red-700 text-white font-semibold py-3.5 px-8 rounded-full transition duration-300">
            Get Import Quote
          </NuxtLink>
          <NuxtLink to="/contact" class="bg-white text-secondary hover:bg-gray-100 font-semibold py-3.5 px-8 rounded-full transition duration-300">
            Contact Us
          </NuxtLink>
        </div>
        <div class="max-w-md mx-auto">
          <p class="text-blue-100 text-sm mb-3">Or subscribe for updates:</p>
          <form class="flex" @submit.prevent="submitEmail">
            <input
              v-model="mailingEmail" type="email" placeholder="Enter your email address"
              class="flex-1 bg-white px-4 py-3 rounded-l-lg text-gray-800 focus:outline-none text-sm"
            />
            <button type="submit" class="bg-primary hover:bg-red-700 px-5 py-3 rounded-r-lg font-medium transition text-sm">
              Notify Me
            </button>
          </form>
          <p v-if="mailingMsg" class="text-green-300 text-sm mt-2">{{ mailingMsg }}</p>
        </div>
      </div>
    </section>
  </div>
</template>
