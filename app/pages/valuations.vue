<script setup lang="ts">
import UraValuationSearch from '~/components/UraValuationSearch.vue'
import type { VehicleValuation } from '@/types'

useSeoMeta({
  title: 'Vehicle Valuations | EzzyRide Uganda',
  description: 'Look up URA-approved CIF valuations for Japanese import vehicles and view historical price trends across batches.',
})

const { $api } = useNuxtApp()

const selectedVehicle = ref<VehicleValuation | null>(null)

// ── Trend chart state ──────────────────────────────────────────────────────
interface HistoryPoint { batch_id: number; batch_title: string; review_date: string; cif: number }
const history      = ref<HistoryPoint[]>([])
const loadingChart = ref(false)
const chartFilter  = ref<'all' | '5' | '3'>('all')

const filteredHistory = computed(() => {
  if (chartFilter.value === 'all') return history.value
  const n = parseInt(chartFilter.value)
  return history.value.slice(-n)
})

const chartSeries = computed(() => [{
  name: 'CIF Value (USD)',
  data: filteredHistory.value.map(h => parseFloat(h.cif.toFixed(2))),
}])

const chartCategories = computed(() =>
  filteredHistory.value.map(h => {
    if (!h.review_date) return h.batch_title ?? `Batch ${h.batch_id}`
    return new Date(h.review_date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
  })
)

const chartOptions = computed(() => ({
  chart: { type: 'area', toolbar: { show: false }, fontFamily: 'inherit', background: 'transparent' },
  dataLabels: { enabled: false },
  stroke: { curve: 'smooth', width: 3 },
  fill: {
    type: 'gradient',
    gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 95, 100] },
  },
  colors: ['#e63946'],
  xaxis: {
    categories: chartCategories.value,
    labels: { style: { colors: '#6b7280', fontSize: '12px' } },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: {
    labels: {
      style: { colors: '#6b7280', fontSize: '12px' },
      formatter: (v: number) => `$${v.toLocaleString()}`,
    },
  },
  grid: { borderColor: '#f3f4f6', strokeDashArray: 4 },
  tooltip: {
    y: { formatter: (v: number) => `USD ${v.toLocaleString()}` },
  },
  markers: { size: 5, colors: ['#e63946'], strokeColors: '#fff', strokeWidth: 2 },
}))

const fetchHistory = async (name: string) => {
  loadingChart.value = true
  try {
    const { data } = await $api.get('/web/valuation/history', { params: { name } })
    history.value = data.data ?? []
  } catch {
    history.value = []
  } finally {
    loadingChart.value = false
  }
}

const onVehicleSelected = (v: VehicleValuation) => {
  selectedVehicle.value = v
  fetchHistory(v.name)
}

const cifChange = computed(() => {
  if (filteredHistory.value.length < 2) return null
  const first = filteredHistory.value[0].cif
  const last  = filteredHistory.value[filteredHistory.value.length - 1].cif
  return ((last - first) / first) * 100
})
</script>

<template>
  <div class="font-roboto text-gray-800">

    <!-- ── Page header ────────────────────────────────────────────────────── -->
    <section class="relative pt-24 pb-16 bg-secondary overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-br from-secondary via-secondary/90 to-accent/50"></div>
      <div class="container mx-auto px-4 relative z-10 text-center text-white">
        <div class="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-sm px-4 py-1.5 rounded-full mb-5">
          <i class="fa-solid fa-database text-primary text-xs"></i> URA Official Valuations
        </div>
        <h1 class="text-4xl md:text-5xl font-bold font-montserrat mb-4">
          Vehicle <span class="text-primary">Valuation</span> Search
        </h1>
        <p class="text-gray-300 text-lg max-w-2xl mx-auto">
          Search URA-approved CIF values for any Japanese import vehicle, then see how prices have shifted across every gazette batch.
        </p>
      </div>
    </section>

    <!-- ── Search ─────────────────────────────────────────────────────────── -->
    <section class="py-12 bg-white border-b border-gray-100">
      <div class="container mx-auto px-4 max-w-2xl">
        <UraValuationSearch @vehicle-selected="onVehicleSelected" />
        <p class="text-center text-sm text-gray-400 mt-4">
          Type at least 3 characters — make, model, or variant name
        </p>
      </div>
    </section>

    <!-- ── Results (shown after selection) ───────────────────────────────── -->
    <section v-if="selectedVehicle" class="py-12 bg-gray-50">
      <div class="container mx-auto px-4">

        <!-- Vehicle summary bar -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <i class="fa-solid fa-circle-check text-green-500"></i>
                <span class="text-xs font-semibold text-green-600 uppercase tracking-wide">Vehicle Found</span>
              </div>
              <h2 class="text-2xl font-bold font-montserrat text-secondary leading-tight">{{ selectedVehicle.name }}</h2>
              <p class="text-gray-500 text-sm mt-0.5">
                {{ selectedVehicle.model }}
                <span v-if="selectedVehicle.year"> · {{ selectedVehicle.year }}</span>
                <span v-if="selectedVehicle.cc"> · {{ selectedVehicle.cc }} cc</span>
                <span v-if="selectedVehicle.origin"> · Origin: {{ selectedVehicle.origin }}</span>
              </p>
            </div>
            <div class="flex gap-3 shrink-0">
              <NuxtLink
                to="/tax-calculator"
                class="flex items-center gap-2 bg-primary hover:bg-red-700 text-white font-medium py-2.5 px-5 rounded-lg text-sm transition-colors"
              >
                <i class="fa-solid fa-calculator"></i> Calculate Tax
              </NuxtLink>
              <NuxtLink
                to="/import-assistance"
                class="flex items-center gap-2 border border-secondary text-secondary hover:bg-secondary hover:text-white font-medium py-2.5 px-5 rounded-lg text-sm transition-colors"
              >
                <i class="fa-solid fa-ship"></i> Import
              </NuxtLink>
            </div>
          </div>

          <!-- Stats row -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
            <div class="text-center">
              <div class="text-xs text-gray-400 mb-1">Latest CIF (USD)</div>
              <div class="text-2xl font-bold text-primary">${{ Number(selectedVehicle.cif).toLocaleString('en-US', { maximumFractionDigits: 0 }) }}</div>
            </div>
            <div class="text-center">
              <div class="text-xs text-gray-400 mb-1">Batches Tracked</div>
              <div class="text-2xl font-bold text-secondary">{{ history.length || '—' }}</div>
            </div>
            <div class="text-center">
              <div class="text-xs text-gray-400 mb-1">Earliest CIF</div>
              <div class="text-2xl font-bold text-gray-700">
                {{ history.length ? '$' + Number(history[0]?.cif).toLocaleString('en-US', { maximumFractionDigits: 0 }) : '—' }}
              </div>
            </div>
            <div class="text-center">
              <div class="text-xs text-gray-400 mb-1">Trend</div>
              <div v-if="cifChange !== null" class="text-2xl font-bold" :class="cifChange >= 0 ? 'text-red-500' : 'text-green-600'">
                {{ cifChange >= 0 ? '+' : '' }}{{ cifChange.toFixed(1) }}%
              </div>
              <div v-else class="text-2xl font-bold text-gray-400">—</div>
            </div>
          </div>
        </div>

        <!-- CIF Trend Chart -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h3 class="font-bold font-montserrat text-secondary text-lg">CIF Value Trend</h3>
              <p class="text-gray-500 text-sm mt-0.5">How this vehicle's import value has changed across URA gazette batches</p>
            </div>
            <!-- Filter pills -->
            <div v-if="history.length > 1" class="flex gap-2">
              <button
                v-for="f in [{ v: 'all', l: 'All Batches' }, { v: '5', l: 'Last 5' }, { v: '3', l: 'Last 3' }]"
                :key="f.v"
                @click="chartFilter = f.v as any"
                class="px-3 py-1.5 rounded-full text-xs font-medium transition-colors border"
                :class="chartFilter === f.v
                  ? 'bg-primary border-primary text-white'
                  : 'border-gray-200 text-gray-500 hover:border-primary hover:text-primary'"
              >
                {{ f.l }}
              </button>
            </div>
          </div>

          <!-- Loading -->
          <div v-if="loadingChart" class="h-64 flex items-center justify-center text-gray-400">
            <i class="fa-solid fa-spinner fa-spin text-2xl mr-3"></i> Loading trend data…
          </div>

          <!-- Not enough data -->
          <div v-else-if="history.length < 2" class="h-64 flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-xl">
            <i class="fa-solid fa-chart-line text-4xl mb-3 text-gray-200"></i>
            <p class="font-medium text-gray-500">Not enough batch history</p>
            <p class="text-sm text-gray-400 mt-1">This vehicle appears in only {{ history.length }} batch. Trend data requires 2 or more.</p>
          </div>

          <!-- Chart -->
          <div v-else>
            <ClientOnly>
              <apexchart
                type="area"
                height="300"
                :options="chartOptions"
                :series="chartSeries"
              />
            </ClientOnly>

            <!-- Batch table below chart -->
            <div class="mt-6 overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-gray-100">
                    <th class="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Batch</th>
                    <th class="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Review Date</th>
                    <th class="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">CIF (USD)</th>
                    <th class="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Change</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(h, i) in filteredHistory"
                    :key="h.batch_id"
                    class="border-b border-gray-50 hover:bg-gray-50/50"
                    :class="i === filteredHistory.length - 1 ? 'bg-primary/5 font-semibold' : ''"
                  >
                    <td class="py-2.5 px-3 text-gray-700">{{ h.batch_title ?? `Batch ${h.batch_id}` }}</td>
                    <td class="py-2.5 px-3 text-gray-500">
                      {{ h.review_date ? new Date(h.review_date).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '—' }}
                    </td>
                    <td class="py-2.5 px-3 text-right font-mono">${{ h.cif.toLocaleString() }}</td>
                    <td class="py-2.5 px-3 text-right">
                      <span v-if="i === 0" class="text-gray-400 text-xs">—</span>
                      <span v-else :class="h.cif >= filteredHistory[i-1].cif ? 'text-red-500' : 'text-green-600'" class="text-xs font-semibold">
                        {{ h.cif >= filteredHistory[i-1].cif ? '▲' : '▼' }}
                        {{ Math.abs(((h.cif - filteredHistory[i-1].cif) / filteredHistory[i-1].cif) * 100).toFixed(1) }}%
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </section>

    <!-- ── How it works (shown before any selection) ──────────────────────── -->
    <section v-if="!selectedVehicle" class="py-16 bg-white">
      <div class="container mx-auto px-4">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold font-montserrat text-secondary mb-3">How to Use Valuations</h2>
          <p class="text-gray-500 max-w-xl mx-auto">Three simple steps from search to a complete tax estimate</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
          <div class="text-center">
            <div class="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-4">1</div>
            <h3 class="font-semibold text-secondary mb-2">Search Your Vehicle</h3>
            <p class="text-gray-500 text-sm">Type the make and model above to find the URA-approved CIF value in the latest gazette.</p>
          </div>
          <div class="text-center">
            <div class="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-4">2</div>
            <h3 class="font-semibold text-secondary mb-2">View Price Trend</h3>
            <p class="text-gray-500 text-sm">See how the vehicle's CIF value has changed across every URA batch — useful for timing your import.</p>
          </div>
          <div class="text-center">
            <div class="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-4">3</div>
            <h3 class="font-semibold text-secondary mb-2">Calculate Your Taxes</h3>
            <p class="text-gray-500 text-sm">Go to the Tax Calculator — the CIF value pre-fills automatically so you get an instant full breakdown.</p>
          </div>
        </div>

        <!-- Quick info cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mt-12">
          <div v-for="item in [
            { icon: 'fa-solid fa-file-invoice', title: 'What is CIF?', desc: 'Cost + Insurance + Freight. The total value at Mombasa port — the base URA uses to calculate all import duties.' },
            { icon: 'fa-solid fa-database', title: 'URA Database', desc: 'Sourced from official URA gazette publications. Updated whenever a new batch is released.' },
            { icon: 'fa-solid fa-chart-line', title: 'Price Trends', desc: 'Track valuation changes over time to understand market direction and plan your import.' },
          ]" :key="item.title" class="text-center">
            <div class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <i :class="item.icon" class="text-primary text-lg"></i>
            </div>
            <h3 class="font-semibold text-secondary mb-1 text-sm">{{ item.title }}</h3>
            <p class="text-gray-500 text-xs">{{ item.desc }}</p>
          </div>
        </div>
      </div>
    </section>

  </div>
</template>
