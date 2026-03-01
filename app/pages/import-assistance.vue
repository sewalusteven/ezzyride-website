<script setup lang="ts">
import { Loading, Notify } from 'notiflix'

useSeoMeta({
  title: 'Import Assistance | EzzyRide Uganda',
  description: 'End-to-end vehicle import services from Japan to Uganda. Full import, sourcing, Mombasa clearance, and consultation packages available.',
})

const { $api } = useNuxtApp()

const selectedService = ref('full_import')
const submitted       = ref(false)
const submitting      = ref(false)

// Pricing from settings (UGX)
const pricing = ref<Record<string, string>>({})
onMounted(async () => {
  try {
    const { data } = await $api.get('/web/settings')
    pricing.value = data.data ?? {}
  } catch {}
})

const priceLabel = (key: string, fallback: string) => {
  const v = pricing.value[`pricing_${key}`]
  return v ? `From UGX ${v}` : fallback
}

const services = computed(() => [
  {
    key: 'full_import',
    label: 'Full Import',
    icon: 'fa-solid fa-ship',
    description: 'Complete end-to-end service from sourcing in Japan through shipping, Mombasa clearance, and delivery in Uganda.',
    features: ['Vehicle sourcing in Japan', 'Pre-shipment inspection', 'International shipping', 'Mombasa port clearance', 'Customs & URA documentation', 'Delivery to Kampala'],
    price: priceLabel('full_import', 'Contact us for pricing'),
  },
  {
    key: 'mombasa_clearance',
    label: 'Mombasa Clearance',
    icon: 'fa-solid fa-anchor',
    description: 'Your vehicle is already in Mombasa. We handle all customs clearance, URA assessment, and delivery to Uganda.',
    features: ['Customs documentation', 'URA duty assessment', 'Port release handling', 'Transit to Uganda border', 'Delivery to Kampala'],
    price: priceLabel('mombasa_clearance', 'Contact us for pricing'),
  },
  {
    key: 'sourcing_only',
    label: 'Sourcing Only',
    icon: 'fa-solid fa-magnifying-glass',
    description: 'We find and purchase your vehicle in Japan and get it to Mombasa port. You handle the rest.',
    features: ['Japanese auction access', 'Vehicle inspection report', 'Purchase & documentation', 'International shipping to Mombasa'],
    price: priceLabel('sourcing_only', 'Contact us for pricing'),
  },
  {
    key: 'consultation',
    label: 'Consultation',
    icon: 'fa-solid fa-comments',
    description: 'Expert advisory on the import process, tax planning, budget guidance, and vehicle selection.',
    features: ['Import process guidance', 'Tax estimate & planning', 'Budget optimisation', 'Vehicle recommendation'],
    price: priceLabel('consultation', 'Free initial consultation'),
  },
])

const form = ref({
  name: '', email: '', phone: '',
  budget_usd: '', timeline: 'flexible',
  vehicle_description: '', vehicle_link: '', notes: '',
})

// ── Valuation search typeahead ─────────────────────────────────────────────
interface ValuationResult { id: number; name: string; cif: string; cc: string; originCode: string }
const vehicleQuery     = ref('')
const vehicleResults   = ref<ValuationResult[]>([])
const vehicleSearching = ref(false)
const vehicleTimer     = ref<ReturnType<typeof setTimeout> | null>(null)
const selectedValuation = ref<ValuationResult | null>(null)

const onVehicleInput = () => {
  if (vehicleTimer.value) clearTimeout(vehicleTimer.value)
  vehicleResults.value = []
  if (vehicleQuery.value.length < 2) return
  vehicleTimer.value = setTimeout(searchVehicles, 300)
}

const searchVehicles = async () => {
  vehicleSearching.value = true
  try {
    const { data } = await $api.post('/web/valuation/search', { name: vehicleQuery.value })
    vehicleResults.value = (data.data ?? []).map((v: any) => ({
      id: v.id, name: v.name, cif: v.cif, cc: v.cc, originCode: v.originCode,
    }))
  } catch {
    vehicleResults.value = []
  } finally {
    vehicleSearching.value = false
  }
}

const pickVehicle = (v: ValuationResult) => {
  selectedValuation.value = v
  vehicleQuery.value = ''
  vehicleResults.value = []
}

const clearVehicle = () => {
  selectedValuation.value = null
  vehicleQuery.value = ''
  vehicleResults.value = []
}

const timelines = [
  { value: 'asap',       label: 'As Soon As Possible' },
  { value: '1month',     label: 'Within 1 Month' },
  { value: '2_3months',  label: '2–3 Months' },
  { value: '6months',    label: '6 Months' },
  { value: 'flexible',   label: 'Flexible / No Rush' },
]

const selectService = (key: string) => {
  selectedService.value = key
  const el = document.getElementById('request-form')
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const submitForm = async () => {
  if (!form.value.name || (!form.value.email && !form.value.phone)) {
    Notify.failure('Please provide your name and at least one contact method.')
    return
  }
  submitting.value = true
  try {
    await $api.post('/web/import-applications', {
      applicant_name:        form.value.name,
      applicant_email:       form.value.email || undefined,
      applicant_phone:       form.value.phone || undefined,
      service_type:          selectedService.value,
      vehicle_valuation_id:  selectedValuation.value?.id || undefined,
      vehicle_description:   form.value.vehicle_description || undefined,
      vehicle_link:          form.value.vehicle_link || undefined,
      budget_usd:            form.value.budget_usd || undefined,
      timeline:              form.value.timeline || undefined,
      notes:                 form.value.notes || undefined,
    })
    submitted.value = true
  } catch {
    Notify.failure('Failed to submit your request. Please try again or contact us directly.')
  } finally {
    submitting.value = false
  }
}

const openFaq = ref<number | null>(null)
const faqs = [
  { q: 'How long does a full import from Japan take?', a: 'Typically 6–10 weeks from vehicle sourcing to delivery in Kampala, depending on auction availability, shipping schedules, and customs clearance timelines.' },
  { q: 'What documents do I need to provide?', a: 'A valid National ID or passport. For business imports, we also need your TIN and company registration documents. We handle all the import paperwork on your behalf.' },
  { q: 'Can I specify the exact vehicle I want?', a: 'Yes. Share a link from any Japanese auction platform (e.g., SBI Motor Japan, Be Forward) and we will bid on that specific vehicle, or give us your specs and budget.' },
  { q: 'How are service fees structured?', a: 'Service fees are paid separately from the vehicle cost. Advance payments to cover port fees, duty, and shipping are tracked transparently — you see every expense.' },
  { q: 'What happens if my vehicle gets stalled at port?', a: 'We communicate proactively before any critical payment deadline. If circumstances change, we offer buyout, consignment, or other flexible resolution options.' },
]
</script>

<template>
  <div class="font-roboto text-gray-800">

    <!-- ── Hero ──────────────────────────────────────────────────────────── -->
    <section class="relative pt-24 pb-16 bg-secondary overflow-hidden">
      <div class="absolute inset-0 opacity-10" style="background-image:url('https://images.unsplash.com/photo-1577416412292-747c6607f055?w=1600&auto=format&fit=crop'); background-size:cover; background-position:center;"></div>
      <div class="absolute inset-0 bg-gradient-to-r from-secondary via-secondary/95 to-accent/60"></div>
      <div class="container mx-auto px-4 relative z-10">
        <div class="max-w-2xl text-white">
          <div class="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 text-primary text-sm px-4 py-1.5 rounded-full mb-5">
            <i class="fa-solid fa-shield-halved text-xs"></i> Trusted Import Partner
          </div>
          <h1 class="text-4xl md:text-5xl font-bold font-montserrat leading-tight mb-5">
            Vehicle Import <span class="text-primary">Made Simple</span>
          </h1>
          <p class="text-gray-300 text-lg mb-8">
            From Japanese auctions to your driveway in Uganda — we manage every step so you don't have to worry.
          </p>
          <a href="#services" class="bg-primary hover:bg-red-700 text-white font-semibold py-3.5 px-8 rounded-full transition duration-300 inline-flex items-center gap-2">
            <i class="fa-solid fa-ship"></i> Explore Our Services
          </a>
        </div>
      </div>
    </section>

    <!-- ── Services ───────────────────────────────────────────────────────── -->
    <section id="services" class="py-16 bg-gray-50">
      <div class="container mx-auto px-4">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold font-montserrat text-secondary mb-3">Our Import Services</h2>
          <p class="text-gray-500 max-w-xl mx-auto">Choose the service that fits your needs. All packages include transparent cost tracking and regular status updates.</p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            v-for="s in services"
            :key="s.key"
            @click="selectService(s.key)"
            class="rounded-xl p-6 border-2 cursor-pointer transition-all hover:shadow-lg"
            :class="selectedService === s.key
              ? 'border-primary bg-primary/5 shadow-md'
              : 'border-gray-200 bg-white hover:border-gray-300'"
          >
            <div class="w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-colors"
              :class="selectedService === s.key ? 'bg-primary text-white' : 'bg-gray-100 text-secondary'">
              <i :class="s.icon" class="text-xl"></i>
            </div>
            <h3 class="font-bold text-secondary text-lg mb-2">{{ s.label }}</h3>
            <p class="text-gray-500 text-sm mb-4">{{ s.description }}</p>
            <ul class="space-y-1.5 mb-4">
              <li v-for="f in s.features" :key="f" class="flex items-center gap-2 text-sm text-gray-700">
                <i class="fa-solid fa-check text-primary text-xs shrink-0"></i>
                {{ f }}
              </li>
            </ul>
            <div class="text-sm font-semibold text-primary mt-auto">{{ s.price }}</div>
            <div class="mt-3">
              <span
                v-if="selectedService === s.key"
                class="text-xs bg-primary text-white px-2.5 py-1 rounded-full"
              >Selected</span>
              <span
                v-else
                class="text-xs border border-gray-300 text-gray-500 px-2.5 py-1 rounded-full hover:border-primary hover:text-primary transition-colors"
              >Select</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Process ────────────────────────────────────────────────────────── -->
    <section class="py-16 bg-white">
      <div class="container mx-auto px-4">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold font-montserrat text-secondary mb-3">How It Works</h2>
          <p class="text-gray-500 max-w-xl mx-auto">Our streamlined 4-step process from enquiry to delivery</p>
        </div>
        <div class="relative">
          <!-- Connecting line (desktop) -->
          <div class="hidden lg:block absolute top-10 left-1/4 right-1/4 h-0.5 bg-gray-200 z-0"></div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
            <div v-for="(step, i) in [
              { num: 1, icon: 'fa-solid fa-comments', title: 'Submit Your Request', desc: 'Fill in our form below with your vehicle preference, budget, and timeline.' },
              { num: 2, icon: 'fa-solid fa-magnifying-glass-dollar', title: 'We Source & Quote', desc: 'We search Japanese auctions and send you a detailed quote within 48 hours.' },
              { num: 3, icon: 'fa-solid fa-ship', title: 'Import & Ship', desc: 'Once approved, we purchase, inspect, and ship your vehicle to Mombasa.' },
              { num: 4, icon: 'fa-solid fa-flag-checkered', title: 'Delivery to Uganda', desc: 'We clear customs, pay all duties, and deliver your vehicle to Kampala.' },
            ]" :key="i" class="text-center">
              <div class="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white mx-auto mb-4 shadow-lg">
                <i :class="step.icon" class="text-xl"></i>
              </div>
              <div class="w-7 h-7 bg-secondary text-white text-xs font-bold rounded-full flex items-center justify-center mx-auto -mt-1 mb-3">{{ step.num }}</div>
              <h3 class="font-semibold text-secondary mb-2">{{ step.title }}</h3>
              <p class="text-gray-500 text-sm">{{ step.desc }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Request Form ───────────────────────────────────────────────────── -->
    <section id="request-form" class="py-16 bg-gray-50">
      <div class="container mx-auto px-4">
        <div class="max-w-2xl mx-auto">
          <div class="text-center mb-10">
            <h2 class="text-3xl font-bold font-montserrat text-secondary mb-3">Request Import Assistance</h2>
            <p class="text-gray-500">Fill in your details and we'll get back to you within 24 hours with a personalised plan.</p>
          </div>

          <!-- Success state -->
          <div v-if="submitted" class="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
            <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <i class="fa-solid fa-circle-check text-green-500 text-4xl"></i>
            </div>
            <h3 class="text-2xl font-bold text-secondary mb-2">Request Received!</h3>
            <p class="text-gray-500 mb-6">Thank you. Our team will review your request and contact you within 24 business hours.</p>
            <div class="flex flex-wrap justify-center gap-3">
              <button @click="submitted = false" class="bg-primary hover:bg-red-700 text-white px-6 py-2.5 rounded-full font-medium transition-colors">
                Submit Another
              </button>
              <NuxtLink to="/vehicles" class="border border-secondary text-secondary hover:bg-secondary hover:text-white px-6 py-2.5 rounded-full font-medium transition-colors">
                Browse Vehicles
              </NuxtLink>
            </div>
          </div>

          <!-- Form -->
          <form v-else @submit.prevent="submitForm" class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-5">
            <!-- Selected service indicator -->
            <div class="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <i :class="services.find(s => s.key === selectedService)?.icon" class="text-primary text-lg"></i>
                <div>
                  <div class="text-xs text-gray-400">Selected Service</div>
                  <div class="font-semibold text-secondary text-sm">{{ services.find(s => s.key === selectedService)?.label }}</div>
                </div>
              </div>
              <button type="button" @click="document.getElementById('services')?.scrollIntoView({ behavior: 'smooth', block: 'start' })" class="text-xs text-primary underline">Change</button>
            </div>

            <!-- Contact info -->
            <div>
              <h3 class="font-semibold text-secondary text-sm mb-3">Your Contact Information</h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="sm:col-span-2">
                  <input v-model="form.name" type="text" placeholder="Full Name *" required
                    class="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <input v-model="form.email" type="email" placeholder="Email Address"
                    class="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <input v-model="form.phone" type="tel" placeholder="Phone / WhatsApp"
                    class="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>
              <p class="text-xs text-gray-400 mt-1">* At least one of email or phone is required</p>
            </div>

            <!-- Vehicle details -->
            <div>
              <h3 class="font-semibold text-secondary text-sm mb-3">Vehicle Details</h3>
              <div class="space-y-3">

                <!-- Valuation search / selected chip -->
                <div class="relative">
                  <!-- Selected vehicle chip -->
                  <div v-if="selectedValuation"
                    class="flex items-center gap-3 border border-green-300 bg-green-50 rounded-lg px-4 py-2.5">
                    <i class="fa-solid fa-circle-check text-green-500 shrink-0"></i>
                    <div class="flex-1 min-w-0">
                      <div class="text-sm font-medium text-secondary truncate">{{ selectedValuation.name }}</div>
                      <div class="text-xs text-gray-400">CIF USD {{ selectedValuation.cif }} · {{ selectedValuation.cc }}cc</div>
                    </div>
                    <button type="button" @click="clearVehicle"
                      class="text-gray-400 hover:text-primary shrink-0 text-xs">
                      <i class="fa-solid fa-xmark"></i> Change
                    </button>
                  </div>

                  <!-- Search input -->
                  <div v-else class="relative">
                    <input
                      v-model="vehicleQuery"
                      @input="onVehicleInput"
                      type="text"
                      placeholder="Search vehicle by name (e.g. Toyota Land Cruiser Prado)"
                      class="w-full border border-gray-200 rounded-lg px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <span class="absolute right-3 top-2.5 text-gray-400 pointer-events-none">
                      <i v-if="vehicleSearching" class="fa-solid fa-spinner fa-spin text-xs"></i>
                      <i v-else class="fa-solid fa-magnifying-glass text-xs"></i>
                    </span>

                    <!-- Dropdown results -->
                    <div v-if="vehicleResults.length > 0"
                      class="absolute z-20 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-52 overflow-y-auto">
                      <button
                        v-for="v in vehicleResults"
                        :key="v.id"
                        type="button"
                        @click="pickVehicle(v)"
                        class="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm border-b border-gray-100 last:border-0 transition-colors"
                      >
                        <div class="font-medium text-secondary">{{ v.name }}</div>
                        <div class="text-xs text-gray-400">CIF USD {{ v.cif }} &middot; {{ v.cc }}cc &middot; {{ v.originCode }}</div>
                      </button>
                      <div class="px-4 py-2 text-xs text-gray-400 text-center border-t border-gray-100">
                        Not your vehicle? Use the field below to describe it.
                      </div>
                    </div>

                    <p v-else-if="vehicleQuery.length >= 2 && !vehicleSearching"
                      class="text-xs text-gray-400 mt-1">
                      No match found in our valuation list — describe your vehicle in the field below.
                    </p>
                  </div>
                </div>

                <!-- Fallback / additional description -->
                <input v-model="form.vehicle_description" type="text"
                  :placeholder="selectedValuation
                    ? 'Additional details (e.g. colour, sunroof, low mileage) — optional'
                    : 'Describe your vehicle manually (e.g. 2019 Toyota Land Cruiser Prado 3.0L diesel)'"
                  class="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />

                <input v-model="form.vehicle_link" type="url"
                  placeholder="Auction / listing link (if you have one)"
                  class="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>

            <!-- Budget + Timeline -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-gray-500 mb-1.5">Budget (USD)</label>
                <input v-model="form.budget_usd" type="number" min="0" placeholder="e.g. 15000"
                  class="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-500 mb-1.5">Timeline</label>
                <select v-model="form.timeline"
                  class="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option v-for="t in timelines" :key="t.value" :value="t.value">{{ t.label }}</option>
                </select>
              </div>
            </div>

            <!-- Notes -->
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1.5">Additional Notes</label>
              <textarea v-model="form.notes" rows="3" placeholder="Any other requirements, questions, or preferences…"
                class="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"></textarea>
            </div>

            <button type="submit" :disabled="submitting"
              class="w-full bg-primary hover:bg-red-700 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2">
              <i v-if="submitting" class="fa-solid fa-spinner fa-spin"></i>
              <i v-else class="fa-solid fa-paper-plane"></i>
              {{ submitting ? 'Submitting…' : 'Submit Import Request' }}
            </button>
          </form>
        </div>
      </div>
    </section>

    <!-- ── Why Choose Us ──────────────────────────────────────────────────── -->
    <section class="py-16 bg-secondary text-white">
      <div class="container mx-auto px-4">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold font-montserrat mb-3">Why Choose EzzyRide?</h2>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div v-for="item in [
            { icon: 'fa-solid fa-magnifying-glass-dollar', title: 'Transparent Pricing', desc: 'Every cost tracked and reported. No hidden charges.' },
            { icon: 'fa-solid fa-clock', title: 'Regular Updates', desc: 'You get status updates at every stage of the import.' },
            { icon: 'fa-solid fa-headset', title: 'Dedicated Support', desc: 'A dedicated agent handles your application from start to finish.' },
            { icon: 'fa-solid fa-star', title: '5-Star Experience', desc: 'Hundreds of successful imports and satisfied customers.' },
          ]" :key="item.title" class="bg-white/10 rounded-xl p-6 hover:bg-white/15 transition-colors">
            <div class="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
              <i :class="item.icon" class="text-primary text-xl"></i>
            </div>
            <h3 class="font-semibold mb-2">{{ item.title }}</h3>
            <p class="text-gray-300 text-sm">{{ item.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ── FAQ ────────────────────────────────────────────────────────────── -->
    <section class="py-16 bg-white">
      <div class="container mx-auto px-4 max-w-3xl">
        <div class="text-center mb-10">
          <h2 class="text-3xl font-bold font-montserrat text-secondary mb-3">Frequently Asked Questions</h2>
        </div>
        <div class="space-y-3">
          <div
            v-for="(faq, i) in faqs"
            :key="i"
            class="border border-gray-200 rounded-xl overflow-hidden"
          >
            <button
              @click="openFaq = openFaq === i ? null : i"
              class="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
            >
              <span class="font-medium text-secondary text-sm pr-4">{{ faq.q }}</span>
              <i class="fa-solid shrink-0 text-gray-400 transition-transform" :class="openFaq === i ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
            </button>
            <div v-if="openFaq === i" class="px-5 pb-5">
              <p class="text-gray-600 text-sm leading-relaxed">{{ faq.a }}</p>
            </div>
          </div>
        </div>
        <div class="text-center mt-10">
          <NuxtLink to="/contact" class="text-primary hover:underline text-sm font-medium">
            Have more questions? Contact us →
          </NuxtLink>
        </div>
      </div>
    </section>

  </div>
</template>
