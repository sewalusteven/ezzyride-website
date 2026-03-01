<script setup lang="ts">
const { $api } = useNuxtApp()
const { storageUrl } = useStorage()

useSeoMeta({
  title: 'Vehicles for Sale | EzzyRide Uganda',
  description: 'Browse our selection of quality Japanese import vehicles available in Uganda. Filter by brand, transmission, fuel type, and more.',
})

interface Vehicle {
  id: number; reference: string; model: string; year: number
  sellingPrice: string | null; transmission: string; fuelType: string
  mileage: number | null; engineCc: number | null; colour: string | null
  brand: { id: number; name: string } | null
  category: { id: number; name: string } | null
  primaryImage: string | null; status: string
}
interface Brand { id: number; name: string }
interface Meta { current_page: number; last_page: number; total: number; per_page: number }

const vehicles   = ref<Vehicle[]>([])
const brands     = ref<Brand[]>([])
const loading    = ref(true)
const meta       = ref<Meta>({ current_page: 1, last_page: 1, total: 0, per_page: 12 })

// Filters
const search       = ref('')
const filterBrand  = ref('')
const filterFuel   = ref('')
const filterTrans  = ref('')
const filterYearF  = ref('')
const filterYearT  = ref('')
const showFilters  = ref(false)
const searchTimer  = ref<ReturnType<typeof setTimeout> | null>(null)

const fuelOptions  = ['Petrol', 'Diesel', 'Hybrid', 'Electric']
const transOptions = ['Automatic', 'Manual', 'CVT', 'Semi-Automatic']

const fmtPrice = (v: string | null) => v ? 'UGX ' + Number(v).toLocaleString() : 'Price on request'
const fmtMileage = (n: number | null) => n ? n.toLocaleString() + ' km' : '—'
const fmtCC = (n: number | null) => n ? n.toLocaleString() + ' cc' : '—'

const statusColor = (s: string) => s === 'available'
  ? 'bg-green-100 text-green-700'
  : s === 'reserved' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'

const fetchVehicles = async (page = 1) => {
  loading.value = true
  try {
    const params: Record<string, any> = { page }
    if (search.value.trim())    params.search       = search.value.trim()
    if (filterBrand.value)      params.brand_id     = filterBrand.value
    if (filterFuel.value)       params.fuel_type    = filterFuel.value.toLowerCase()
    if (filterTrans.value)      params.transmission = filterTrans.value.toLowerCase()
    if (filterYearF.value)      params.year_from    = filterYearF.value
    if (filterYearT.value)      params.year_to      = filterYearT.value
    const { data } = await $api.get('/web/vehicles', { params })
    vehicles.value = data.data
    meta.value     = data.meta
  } finally {
    loading.value = false
  }
}

const fetchBrands = async () => {
  try {
    const { data } = await $api.get('/v1/config/vehicle-brands', { params: { per_page: 100 } })
    brands.value = data.data.filter((b: any) => b.is_active)
  } catch {}
}

const onSearch = () => {
  if (searchTimer.value) clearTimeout(searchTimer.value)
  searchTimer.value = setTimeout(() => fetchVehicles(1), 400)
}

const applyFilters = () => {
  showFilters.value = false
  fetchVehicles(1)
}

const resetFilters = () => {
  filterBrand.value = ''; filterFuel.value = ''; filterTrans.value = ''
  filterYearF.value = ''; filterYearT.value = ''; search.value = ''
  fetchVehicles(1)
}

const hasFilters = computed(() =>
  !!(filterBrand.value || filterFuel.value || filterTrans.value || filterYearF.value || filterYearT.value)
)

const yearOptions = computed(() => {
  const yr = new Date().getFullYear()
  return Array.from({ length: 20 }, (_, i) => yr - i)
})

onMounted(() => {
  fetchVehicles(1)
  fetchBrands()
})
</script>

<template>
  <div class="font-roboto text-gray-800 bg-gray-50">

    <!-- ── Page Header ────────────────────────────────────────────────────── -->
    <section class="relative pt-24 pb-12 bg-secondary overflow-hidden">
      <div class="absolute inset-0 opacity-10" style="background-image:url('https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1600&auto=format&fit=crop'); background-size:cover; background-position:center;"></div>
      <div class="absolute inset-0 bg-gradient-to-b from-secondary/80 to-secondary/95"></div>
      <div class="container mx-auto px-4 relative z-10 text-center text-white">
        <h1 class="text-4xl md:text-5xl font-bold font-montserrat mb-4">
          Our <span class="text-primary">Vehicle</span> Inventory
        </h1>
        <p class="text-gray-300 text-lg max-w-2xl mx-auto">
          Quality Japanese import vehicles — inspected, cleared, and ready for Uganda roads.
        </p>
      </div>
    </section>

    <!-- ── Main Content ───────────────────────────────────────────────────── -->
    <section class="py-10">
      <div class="container mx-auto px-4">

        <!-- Search bar + Filter toggle -->
        <div class="flex flex-col sm:flex-row gap-3 mb-6">
          <div class="relative flex-1">
            <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            <input
              v-model="search"
              type="text"
              placeholder="Search by make or model…"
              class="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
              @input="onSearch"
            />
          </div>
          <button
            class="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-sm font-medium transition-colors shrink-0"
            :class="hasFilters ? 'border-primary text-primary' : 'text-gray-600'"
            @click="showFilters = !showFilters"
          >
            <i class="fa-solid fa-sliders"></i>
            Filters
            <span v-if="hasFilters" class="w-2 h-2 bg-primary rounded-full"></span>
          </button>
          <button
            v-if="hasFilters"
            class="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-500 hover:text-primary transition-colors"
            @click="resetFilters"
          >
            <i class="fa-solid fa-xmark"></i> Clear
          </button>
        </div>

        <!-- Filter panel -->
        <div v-if="showFilters" class="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm">
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <!-- Brand -->
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1.5">Brand</label>
              <select v-model="filterBrand" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="">All Brands</option>
                <option v-for="b in brands" :key="b.id" :value="b.id">{{ b.name }}</option>
              </select>
            </div>
            <!-- Fuel Type -->
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1.5">Fuel Type</label>
              <select v-model="filterFuel" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="">Any</option>
                <option v-for="f in fuelOptions" :key="f" :value="f">{{ f }}</option>
              </select>
            </div>
            <!-- Transmission -->
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1.5">Transmission</label>
              <select v-model="filterTrans" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="">Any</option>
                <option v-for="t in transOptions" :key="t" :value="t">{{ t }}</option>
              </select>
            </div>
            <!-- Year From -->
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1.5">Year From</label>
              <select v-model="filterYearF" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="">Any</option>
                <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
              </select>
            </div>
            <!-- Year To -->
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1.5">Year To</label>
              <select v-model="filterYearT" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="">Any</option>
                <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
              </select>
            </div>
          </div>
          <div class="flex gap-3 mt-4 pt-4 border-t border-gray-100">
            <button @click="applyFilters" class="bg-primary hover:bg-red-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors">
              Apply Filters
            </button>
            <button @click="resetFilters" class="text-gray-500 hover:text-primary text-sm px-4 py-2 transition-colors">
              Reset
            </button>
          </div>
        </div>

        <!-- Results count -->
        <div class="flex items-center justify-between mb-5">
          <p class="text-sm text-gray-500">
            <span v-if="!loading">{{ meta.total }} vehicle{{ meta.total !== 1 ? 's' : '' }} found</span>
            <span v-else>Loading…</span>
          </p>
          <p v-if="meta.last_page > 1" class="text-sm text-gray-400">
            Page {{ meta.current_page }} of {{ meta.last_page }}
          </p>
        </div>

        <!-- Loading skeleton -->
        <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <div v-for="i in 8" :key="i" class="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
            <div class="h-48 bg-gray-200"></div>
            <div class="p-4 space-y-3">
              <div class="h-4 bg-gray-200 rounded w-3/4"></div>
              <div class="h-3 bg-gray-200 rounded w-1/2"></div>
              <div class="h-6 bg-gray-200 rounded w-2/3 mt-2"></div>
            </div>
          </div>
        </div>

        <!-- Vehicle grid -->
        <div v-else-if="vehicles.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <NuxtLink
            v-for="v in vehicles"
            :key="v.id"
            :to="`/vehicles/${v.id}`"
            class="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group block"
          >
            <!-- Image -->
            <div class="relative h-48 bg-gray-100 overflow-hidden">
              <img
                v-if="v.primaryImage"
                :src="storageUrl(v.primaryImage)"
                :alt="`${v.brand?.name} ${v.model}`"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-gray-300">
                <i class="fa-solid fa-car text-5xl"></i>
              </div>
              <span class="absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full capitalize" :class="statusColor(v.status)">
                {{ v.status }}
              </span>
            </div>

            <!-- Card body -->
            <div class="p-4">
              <div class="text-xs text-gray-400 mb-1">{{ v.brand?.name ?? '—' }} · {{ v.year }}</div>
              <h3 class="font-semibold text-secondary text-base leading-tight mb-3 group-hover:text-primary transition-colors">
                {{ v.brand?.name }} {{ v.model }}
              </h3>

              <!-- Specs chips -->
              <div class="flex flex-wrap gap-1.5 mb-4">
                <span v-if="v.transmission" class="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  <i class="fa-solid fa-gears text-gray-400"></i> {{ v.transmission }}
                </span>
                <span v-if="v.fuelType" class="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  <i class="fa-solid fa-gas-pump text-gray-400"></i> {{ v.fuelType }}
                </span>
                <span v-if="v.mileage" class="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  <i class="fa-solid fa-road text-gray-400"></i> {{ fmtMileage(v.mileage) }}
                </span>
                <span v-if="v.engineCc" class="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  <i class="fa-solid fa-engine text-gray-400"></i> {{ fmtCC(v.engineCc) }}
                </span>
              </div>

              <div class="flex items-center justify-between">
                <span class="text-primary font-bold text-base">{{ fmtPrice(v.sellingPrice) }}</span>
                <span class="text-xs text-accent font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                  View <i class="fa-solid fa-arrow-right text-[10px]"></i>
                </span>
              </div>
            </div>
          </NuxtLink>
        </div>

        <!-- Empty state -->
        <div v-else class="text-center py-20">
          <i class="fa-solid fa-car-side text-5xl text-gray-200 mb-4"></i>
          <p class="text-gray-500 font-medium mb-2">No vehicles found</p>
          <p class="text-gray-400 text-sm mb-6">Try adjusting your filters or search terms.</p>
          <button @click="resetFilters" class="bg-primary hover:bg-red-700 text-white px-6 py-2.5 rounded-full text-sm font-medium transition-colors">
            Clear All Filters
          </button>
        </div>

        <!-- Pagination -->
        <div v-if="meta.last_page > 1" class="flex items-center justify-center gap-2 mt-10">
          <button
            :disabled="meta.current_page === 1"
            @click="fetchVehicles(meta.current_page - 1)"
            class="w-9 h-9 rounded-lg border flex items-center justify-center text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            <i class="fa-solid fa-chevron-left text-xs"></i>
          </button>
          <template v-for="page in meta.last_page" :key="page">
            <button
              v-if="page === 1 || page === meta.last_page || (page >= meta.current_page - 1 && page <= meta.current_page + 1)"
              @click="fetchVehicles(page)"
              class="w-9 h-9 rounded-lg border text-sm font-medium transition-colors"
              :class="page === meta.current_page ? 'bg-primary border-primary text-white' : 'hover:bg-gray-50 text-gray-700'"
            >
              {{ page }}
            </button>
            <span
              v-else-if="page === meta.current_page - 2 || page === meta.current_page + 2"
              class="text-gray-400 text-sm px-1"
            >…</span>
          </template>
          <button
            :disabled="meta.current_page === meta.last_page"
            @click="fetchVehicles(meta.current_page + 1)"
            class="w-9 h-9 rounded-lg border flex items-center justify-center text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            <i class="fa-solid fa-chevron-right text-xs"></i>
          </button>
        </div>

      </div>
    </section>

    <!-- ── CTA ────────────────────────────────────────────────────────────── -->
    <section class="py-16 bg-secondary text-white">
      <div class="container mx-auto px-4 text-center">
        <h2 class="text-3xl font-bold font-montserrat mb-4">Can't find what you're looking for?</h2>
        <p class="text-gray-300 mb-8 max-w-xl mx-auto">
          We source vehicles directly from Japan. Tell us your specs, budget, and timeline — we'll find it for you.
        </p>
        <NuxtLink to="/import-assistance" class="bg-primary hover:bg-red-700 text-white font-semibold py-3.5 px-8 rounded-full transition duration-300 inline-flex items-center gap-2">
          <i class="fa-solid fa-ship"></i> Request Import Assistance
        </NuxtLink>
      </div>
    </section>

  </div>
</template>
