<script setup lang="ts">
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/vue'

definePageMeta({ layout: 'admin-layout' })

const { $api } = useNuxtApp()

// ── Types ──────────────────────────────────────────────────────────────────
interface Valuation { name: string; cif: number; cc: string; origin_code: string | null }
interface TopModel  { model: string; count: number; valuation: Valuation | null }
interface TrendPoint { period: string; count: number }
interface Summary {
  total: number; period: string; period_count: number; prev_count: number | null
  change_pct: number | null; unique_models: number; top_model: string | null; top_model_count: number
}
interface Stats {
  summary: Summary; top_models: TopModel[]; trend: TrendPoint[]
  granularity: string; latest_batch: { id: number; title: string; review_date: string } | null
}
interface CompareModel {
  model: string; total: number; prev_total: number | null; change_pct: number | null
  trend: TrendPoint[]; valuation: Valuation | null
}
interface RequestRow { id: number; model: string | null; created_at: string }
interface Meta { current_page: number; last_page: number; total: number; per_page: number }

// ── State ──────────────────────────────────────────────────────────────────
const tab         = ref<'dashboard' | 'compare' | 'requests'>('dashboard')
const tabKeys     = ['dashboard', 'compare', 'requests'] as const
const tabIndex    = computed(() => tabKeys.indexOf(tab.value))

// Dashboard
const period      = ref('30d')
const stats       = ref<Stats | null>(null)
const statsLoading= ref(true)

// Compare
const comparePeriod  = ref('30d')
const selectedModels = ref<string[]>([])
const compareData    = ref<CompareModel[]>([])
const compareLoading = ref(false)

// All Requests
const requests    = ref<RequestRow[]>([])
const reqMeta     = ref<Meta>({ current_page: 1, last_page: 1, total: 0, per_page: 50 })
const reqLoading  = ref(false)
const reqSearch   = ref('')
const reqDateFrom = ref('')
const reqDateTo   = ref('')
const reqTimer    = ref<ReturnType<typeof setTimeout> | null>(null)

// Chart instances (vanilla ApexCharts)
const trendEl   = ref<HTMLElement | null>(null)
const barEl     = ref<HTMLElement | null>(null)
const compareEl = ref<HTMLElement | null>(null)
let trendChart: any   = null
let barChart: any     = null
let compareChart: any = null

// ── Palette ────────────────────────────────────────────────────────────────
const COLORS = ['#e63946', '#1d3557', '#2a9d8f', '#f4a261', '#6d6875', '#457b9d']

// ── Fetch ──────────────────────────────────────────────────────────────────
const fetchStats = async () => {
  statsLoading.value = true
  try {
    const { data } = await $api.get('/v1/tax-requests/stats', { params: { period: period.value } })
    stats.value = data.data
  } finally {
    statsLoading.value = false
  }
}

const fetchCompare = async () => {
  if (!selectedModels.value.length) { compareData.value = []; return }
  compareLoading.value = true
  try {
    const { data } = await $api.get('/v1/tax-requests/compare', {
      params: { models: selectedModels.value, period: comparePeriod.value },
    })
    compareData.value = data.data
  } finally {
    compareLoading.value = false
  }
}

const fetchRequests = async (page = 1) => {
  reqLoading.value = true
  try {
    const params: Record<string, any> = { page }
    if (reqSearch.value.trim())  params.search    = reqSearch.value.trim()
    if (reqDateFrom.value)       params.date_from = reqDateFrom.value
    if (reqDateTo.value)         params.date_to   = reqDateTo.value
    const { data } = await $api.get('/v1/tax-requests', { params })
    requests.value = data.data
    reqMeta.value  = data.meta
  } finally {
    reqLoading.value = false
  }
}

const onReqSearch = () => {
  if (reqTimer.value) clearTimeout(reqTimer.value)
  reqTimer.value = setTimeout(() => fetchRequests(1), 400)
}

// ── Chart rendering ────────────────────────────────────────────────────────
const renderTrendChart = async () => {
  trendChart?.destroy()
  trendChart = null
  if (!trendEl.value || !stats.value?.trend?.length) return
  const ApexCharts = (await import('apexcharts')).default
  const d = stats.value

  trendChart = new ApexCharts(trendEl.value, {
    chart: { type: 'area', height: 260, toolbar: { show: false }, sparkline: { enabled: false },
      animations: { enabled: true, easing: 'easeinout', speed: 400 } },
    stroke: { curve: 'smooth', width: 2 },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.02, stops: [0, 90, 100] } },
    colors: [COLORS[0]],
    grid: { borderColor: '#f1f1f1', strokeDashArray: 4 },
    dataLabels: { enabled: false },
    xaxis: { categories: d.trend.map(t => t.period),
      labels: { style: { fontSize: '11px', colors: '#9ca3af' }, rotate: -30 },
      axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { min: 0, labels: { style: { fontSize: '11px', colors: '#9ca3af' } } },
    tooltip: { theme: 'light', x: { show: true } },
    series: [{ name: 'Requests', data: d.trend.map(t => t.count) }],
  })
  void trendChart.render()
}

const renderBarChart = async () => {
  barChart?.destroy()
  barChart = null
  if (!barEl.value || !stats.value?.top_models?.length) return
  const ApexCharts = (await import('apexcharts')).default
  const top = stats.value.top_models.slice(0, 15)

  barChart = new ApexCharts(barEl.value, {
    chart: { type: 'bar', height: Math.max(300, top.length * 28 + 60), toolbar: { show: false },
      animations: { enabled: true, easing: 'easeinout', speed: 400 } },
    plotOptions: { bar: { horizontal: true, borderRadius: 3, dataLabels: { position: 'top' } } },
    colors: [COLORS[1]],
    grid: { borderColor: '#f1f1f1', xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } } },
    dataLabels: { enabled: true, offsetX: 4, style: { fontSize: '11px', colors: ['#374151'] } },
    xaxis: { labels: { style: { fontSize: '11px', colors: '#9ca3af' } } },
    yaxis: { labels: { style: { fontSize: '11px', colors: '#374151' }, maxWidth: 180 } },
    tooltip: { theme: 'light' },
    series: [{ name: 'Requests', data: top.map(m => ({ x: m.model, y: m.count })) }],
  })
  void barChart.render()
}

const renderCompareChart = async () => {
  compareChart?.destroy()
  compareChart = null
  if (!compareEl.value || !compareData.value.length) return
  const ApexCharts = (await import('apexcharts')).default

  const allPeriods = [...new Set(
    compareData.value.flatMap(m => m.trend.map(t => t.period))
  )].sort()

  const series = compareData.value.map((m) => {
    const byPeriod = Object.fromEntries(m.trend.map(t => [t.period, t.count]))
    return { name: m.model, data: allPeriods.map(p => byPeriod[p] ?? 0) }
  })

  compareChart = new ApexCharts(compareEl.value, {
    chart: { type: 'line', height: 300, toolbar: { show: false },
      animations: { enabled: true, easing: 'easeinout', speed: 400 } },
    stroke: { curve: 'smooth', width: 2.5 },
    colors: COLORS,
    grid: { borderColor: '#f1f1f1', strokeDashArray: 4 },
    dataLabels: { enabled: false },
    markers: { size: 4, hover: { size: 6 } },
    legend: { position: 'top', horizontalAlign: 'left', fontSize: '12px' },
    xaxis: { categories: allPeriods,
      labels: { style: { fontSize: '11px', colors: '#9ca3af' }, rotate: -30 },
      axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { min: 0, labels: { style: { fontSize: '11px', colors: '#9ca3af' } } },
    tooltip: { shared: true, intersect: false, theme: 'light' },
    series,
  })
  void compareChart.render()
}

// ── Compare model selection ────────────────────────────────────────────────
const toggleModel = (model: string) => {
  const idx = selectedModels.value.indexOf(model)
  if (idx >= 0) {
    selectedModels.value.splice(idx, 1)
  } else if (selectedModels.value.length < 4) {
    selectedModels.value.push(model)
  }
}

// ── Watchers ───────────────────────────────────────────────────────────────
watch(period, () => fetchStats())
watch(comparePeriod, () => fetchCompare())
watch(selectedModels, () => fetchCompare(), { deep: true })

// Render charts after loading finishes — flush:'post' guarantees DOM refs are populated
watch(statsLoading, (loading) => {
  if (!loading && stats.value) {
    renderTrendChart()
    renderBarChart()
  }
}, { flush: 'post' })

watch(compareLoading, (loading) => {
  if (!loading && compareData.value.length) {
    renderCompareChart()
  }
}, { flush: 'post' })

// when user switches to requests tab for the first time
watch(tab, (t) => {
  if (t === 'requests' && requests.value.length === 0 && !reqLoading.value) fetchRequests()
})

// ── Lifecycle ──────────────────────────────────────────────────────────────
onMounted(() => fetchStats())

onBeforeUnmount(() => {
  trendChart?.destroy()
  barChart?.destroy()
  compareChart?.destroy()
})

// ── Helpers ────────────────────────────────────────────────────────────────
const fmtUSD = (n: number | null | undefined) =>
  n != null ? `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '—'

const pages = (m: Meta) => {
  const { last_page: total, current_page: cur } = m
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const arr: (number | '...')[] = [1]
  if (cur > 3) arr.push('...')
  for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) arr.push(i)
  if (cur < total - 2) arr.push('...')
  arr.push(total)
  return arr
}
</script>

<template>
  <div class="p-6 space-y-5">

    <!-- Header -->
    <div class="flex items-center justify-between gap-4 flex-wrap">
      <div>
        <h2 class="text-xl font-semibold text-gray-900">Market Demand</h2>
        <p class="text-sm text-gray-500 mt-0.5">
          Tax calculator requests &mdash; understand what cars people are pricing
          <span v-if="stats?.latest_batch" class="ml-2 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
            Valuations: {{ stats.latest_batch.title }}
          </span>
        </p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="bg-white p-4 shadow rounded">
      <TabGroup :selectedIndex="tabIndex" @change="(i: number) => { const t = tabKeys[i]; if (t) tab = t }">
        <div class="border-b border-gray-200">
          <TabList as="nav" class="flex -mb-px overflow-x-auto">
            <Tab v-for="t in [
            { key: 'dashboard', label: 'Dashboard',   icon: 'fa-chart-area' },
            { key: 'compare',   label: 'Compare',     icon: 'fa-code-compare' },
            { key: 'requests',  label: 'All Requests', icon: 'fa-list' },
          ]" :key="t.key" as="template" v-slot="{ selected }">
              <button class="cursor-pointer flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap"
                      :class="selected ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'">
                <i :class="`fa-solid ${t.icon} text-xs`"></i>
                {{ t.label }}
              </button>
            </Tab>
          </TabList>
        </div>

        <TabPanels>

          <!-- ══════════════════════════════════════════════════════════════════
               TAB 1 — DASHBOARD
          ══════════════════════════════════════════════════════════════════════ -->
          <TabPanel class="space-y-5 pt-4">

            <!-- Period selector -->
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-xs text-gray-500 font-medium">Period:</span>
              <div class="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
                <button v-for="p in [
                { v: '7d', l: '7 days' }, { v: '30d', l: '30 days' },
                { v: '90d', l: '90 days' }, { v: '365d', l: '1 year' }, { v: 'all', l: 'All time' }
              ]" :key="p.v"
                        class="cursor-pointer px-3 py-1.5 transition-colors"
                        :class="period === p.v ? 'bg-secondary text-white font-medium' : 'text-gray-600 hover:bg-gray-50'"
                        @click="period = p.v">
                  {{ p.l }}
                </button>
              </div>
            </div>

            <!-- KPI Cards -->
            <div v-if="statsLoading" class="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div v-for="n in 4" :key="n" class="bg-white rounded-lg border border-gray-200 p-5 animate-pulse">
                <div class="h-3 w-20 bg-gray-200 rounded mb-3"></div>
                <div class="h-8 w-16 bg-gray-200 rounded"></div>
              </div>
            </div>

            <div v-else-if="stats" class="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <!-- Total All Time -->
              <div class="bg-white rounded-lg border border-gray-200 p-5">
                <p class="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Total Requests</p>
                <p class="text-3xl font-bold text-gray-900">{{ stats.summary.total.toLocaleString() }}</p>
                <p class="text-xs text-gray-400 mt-1">All time</p>
              </div>
              <!-- This Period -->
              <div class="bg-white rounded-lg border border-gray-200 p-5">
                <p class="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">In Period</p>
                <p class="text-3xl font-bold text-gray-900">{{ stats.summary.period_count.toLocaleString() }}</p>
                <div class="flex items-center gap-1.5 mt-1">
                <span v-if="stats.summary.change_pct !== null"
                      class="text-xs font-semibold px-1.5 py-0.5 rounded"
                      :class="(stats.summary.change_pct ?? 0) >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'">
                  {{ (stats.summary.change_pct ?? 0) >= 0 ? '+' : '' }}{{ stats.summary.change_pct }}%
                </span>
                  <span class="text-xs text-gray-400">vs prev period</span>
                </div>
              </div>
              <!-- Unique Models -->
              <div class="bg-white rounded-lg border border-gray-200 p-5">
                <p class="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Unique Models</p>
                <p class="text-3xl font-bold text-gray-900">{{ stats.summary.unique_models.toLocaleString() }}</p>
                <p class="text-xs text-gray-400 mt-1">Distinct cars searched</p>
              </div>
              <!-- Top Model -->
              <div class="bg-white rounded-lg border border-gray-200 p-5">
                <p class="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Top Model</p>
                <p class="text-lg font-bold text-gray-900 truncate" :title="stats.summary.top_model ?? ''">
                  {{ stats.summary.top_model ?? '—' }}
                </p>
                <p class="text-xs text-gray-400 mt-1">{{ stats.summary.top_model_count.toLocaleString() }} requests</p>
              </div>
            </div>

            <!-- Trend Chart -->
            <div class="bg-white rounded-lg border border-gray-200">
              <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 class="font-semibold text-gray-900 text-sm">Request Volume Over Time</h3>
                <span class="text-xs text-gray-400">{{ stats?.granularity === 'day' ? 'Daily' : stats?.granularity === 'week' ? 'Weekly' : 'Monthly' }} grouping</span>
              </div>
              <div class="p-4">
                <div v-if="statsLoading" class="h-[260px] bg-gray-50 rounded animate-pulse"></div>
                <div v-else-if="!stats?.trend?.length" class="h-[260px] flex items-center justify-center text-gray-400 text-sm">
                  No data for this period
                </div>
                <div v-else ref="trendEl"></div>
              </div>
            </div>

            <!-- Two-column: Bar chart + Cross-ref table -->
            <div class="grid grid-cols-1 lg:grid-cols-5 gap-5">

              <!-- Horizontal bar — top 15 models (3/5) -->
              <div class="lg:col-span-3 bg-white rounded-lg border border-gray-200">
                <div class="px-5 py-4 border-b border-gray-100">
                  <h3 class="font-semibold text-gray-900 text-sm">Top 15 Most Requested Models</h3>
                  <p class="text-xs text-gray-400 mt-0.5">Click a bar to add to comparison</p>
                </div>
                <div class="p-4">
                  <div v-if="statsLoading" class="h-[360px] bg-gray-50 rounded animate-pulse"></div>
                  <div v-else-if="!stats?.top_models?.length" class="h-[180px] flex items-center justify-center text-gray-400 text-sm">
                    No requests yet
                  </div>
                  <div v-else ref="barEl"></div>
                </div>
              </div>

              <!-- Cross-reference table (2/5) -->
              <div class="lg:col-span-2 bg-white rounded-lg border border-gray-200 flex flex-col">
                <div class="px-5 py-4 border-b border-gray-100">
                  <h3 class="font-semibold text-gray-900 text-sm">Demand × URA Valuation</h3>
                  <p class="text-xs text-gray-400 mt-0.5">Cross-referenced with latest valuation batch</p>
                </div>
                <div class="flex-1 overflow-y-auto">
                  <div v-if="statsLoading" class="p-4 space-y-3">
                    <div v-for="n in 8" :key="n" class="animate-pulse flex gap-2">
                      <div class="h-4 flex-1 bg-gray-200 rounded"></div>
                      <div class="h-4 w-14 bg-gray-200 rounded"></div>
                      <div class="h-4 w-16 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                  <table v-else-if="stats?.top_models?.length" class="w-full text-xs">
                    <thead class="bg-gray-50 border-b border-gray-100 sticky top-0">
                    <tr>
                      <th class="px-3 py-2 text-left text-gray-500 font-semibold uppercase tracking-wide">Model</th>
                      <th class="px-3 py-2 text-right text-gray-500 font-semibold uppercase tracking-wide">Reqs</th>
                      <th class="px-3 py-2 text-right text-gray-500 font-semibold uppercase tracking-wide">CIF (USD)</th>
                    </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-50">
                    <tr v-for="m in stats.top_models.slice(0, 12)" :key="m.model" class="hover:bg-gray-50/50">
                      <td class="px-3 py-2.5">
                        <p class="font-medium text-gray-900 truncate max-w-[130px]" :title="m.model">{{ m.model }}</p>
                        <p v-if="m.valuation" class="text-gray-400 truncate max-w-[130px]" :title="m.valuation.name">{{ m.valuation.name }}</p>
                        <p v-else class="text-gray-300 italic">No match in batch</p>
                      </td>
                      <td class="px-3 py-2.5 text-right font-semibold text-gray-800">{{ m.count }}</td>
                      <td class="px-3 py-2.5 text-right text-gray-600">
                        <span v-if="m.valuation" class="font-mono">{{ fmtUSD(m.valuation.cif) }}</span>
                        <span v-else class="text-gray-300">—</span>
                      </td>
                    </tr>
                    </tbody>
                  </table>
                  <div v-else class="p-6 text-center text-gray-400 text-sm">No data yet</div>
                </div>
              </div>
            </div>

          </TabPanel>

          <!-- ══════════════════════════════════════════════════════════════════
               TAB 2 — COMPARE
          ══════════════════════════════════════════════════════════════════════ -->
          <TabPanel class="space-y-5 pt-4">

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

              <!-- Left: Model selector -->
              <div class="bg-white rounded-lg border border-gray-200">
                <div class="px-4 py-3 border-b border-gray-100">
                  <h3 class="font-semibold text-gray-900 text-sm">Select Models to Compare</h3>
                  <p class="text-xs text-gray-400 mt-0.5">Pick up to 4 from your top requested models</p>
                </div>
                <div class="p-2 max-h-[420px] overflow-y-auto">
                  <div v-if="statsLoading" class="p-3 text-sm text-gray-400 text-center animate-pulse">Loading models…</div>
                  <div v-else-if="!stats?.top_models?.length" class="p-3 text-sm text-gray-400 text-center">No models yet</div>
                  <div v-else class="space-y-0.5">
                    <label
                        v-for="m in stats.top_models"
                        :key="m.model"
                        class="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors"
                        :class="selectedModels.includes(m.model)
                      ? 'bg-secondary/5 border border-secondary/20'
                      : 'hover:bg-gray-50'"
                        @click.prevent="toggleModel(m.model)"
                    >
                      <span class="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors"
                           :class="selectedModels.includes(m.model) ? 'bg-secondary border-secondary' : 'border-gray-300'">
                        <i v-if="selectedModels.includes(m.model)" class="fa-solid fa-check text-white text-[9px]"></i>
                      </span>
                      <span class="w-4 h-4 rounded-full shrink-0" :style="`background:${COLORS[selectedModels.indexOf(m.model)] ?? '#e5e7eb'}`"></span>
                      <span class="flex-1 min-w-0">
                        <span class="block text-sm font-medium text-gray-800 truncate">{{ m.model }}</span>
                        <span class="block text-xs text-gray-400">{{ m.count }} requests</span>
                      </span>
                      <span v-if="selectedModels.includes(m.model)" class="text-xs text-secondary font-semibold">
                        #{{ selectedModels.indexOf(m.model) + 1 }}
                      </span>
                    </label>
                  </div>
                </div>
                <!-- Period selector for compare -->
                <div class="px-4 py-3 border-t border-gray-100">
                  <p class="text-xs text-gray-500 mb-2 font-medium">Compare period:</p>
                  <div class="grid grid-cols-3 gap-1 text-xs">
                    <button v-for="p in [{ v: '30d', l: '30d' }, { v: '90d', l: '90d' }, { v: '365d', l: '1yr' }, { v: '7d', l: '7d' }, { v: 'all', l: 'All' }]"
                            :key="p.v" @click="comparePeriod = p.v"
                            class="cursor-pointer py-1 rounded border text-center transition-colors"
                            :class="comparePeriod === p.v ? 'bg-secondary text-white border-secondary font-medium' : 'border-gray-200 text-gray-600 hover:bg-gray-50'">
                      {{ p.l }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- Right: Chart + stat cards -->
              <div class="lg:col-span-2 space-y-4">

                <!-- Empty state -->
                <div v-if="!selectedModels.length" class="bg-white rounded-lg border border-gray-200 py-16 text-center text-gray-400">
                  <i class="fa-solid fa-code-compare text-3xl mb-3 block opacity-30"></i>
                  <p class="text-sm">Select at least one model from the list to compare</p>
                </div>

                <!-- Compare line chart -->
                <div v-else class="bg-white rounded-lg border border-gray-200">
                  <div class="px-5 py-4 border-b border-gray-100">
                    <h3 class="font-semibold text-gray-900 text-sm">Request Volume Comparison</h3>
                  </div>
                  <div class="p-4">
                    <div v-if="compareLoading" class="h-[300px] bg-gray-50 rounded animate-pulse"></div>
                    <div v-else-if="!compareData.length || !compareData.some(m => m.trend.length)" class="h-[300px] flex items-center justify-center text-gray-400 text-sm">
                      No trend data for selected period
                    </div>
                    <div v-else ref="compareEl"></div>
                  </div>
                </div>

                <!-- Stat cards per model -->
                <div v-if="compareData.length" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                      v-for="(m, i) in compareData" :key="m.model"
                      class="bg-white rounded-lg border-2 p-4 space-y-3"
                      :style="`border-color: ${COLORS[i]}`"
                  >
                    <div class="flex items-start gap-2">
                      <span class="w-3 h-3 rounded-full mt-0.5 shrink-0" :style="`background:${COLORS[i]}`"></span>
                      <div class="min-w-0">
                        <p class="font-semibold text-sm text-gray-900 truncate">{{ m.model }}</p>
                        <p v-if="m.valuation" class="text-xs text-gray-400 truncate">{{ m.valuation.name }}</p>
                      </div>
                    </div>
                    <div class="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p class="text-xs text-gray-400 mb-0.5">Requests</p>
                        <p class="font-bold text-gray-900 text-lg">{{ m.total }}</p>
                        <span v-if="m.change_pct !== null"
                              class="text-xs font-semibold px-1.5 py-0.5 rounded"
                              :class="(m.change_pct ?? 0) >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'">
                        {{ (m.change_pct ?? 0) >= 0 ? '+' : '' }}{{ m.change_pct }}%
                      </span>
                      </div>
                      <div v-if="m.valuation">
                        <p class="text-xs text-gray-400 mb-0.5">URA CIF</p>
                        <p class="font-bold text-gray-900">{{ fmtUSD(m.valuation.cif) }}</p>
                        <p class="text-xs text-gray-400">{{ m.valuation.cc }}cc</p>
                      </div>
                      <div v-else>
                        <p class="text-xs text-gray-400 mb-0.5">URA Valuation</p>
                        <p class="text-xs text-gray-400 italic">Not in latest batch</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </TabPanel>

          <!-- ══════════════════════════════════════════════════════════════════
               TAB 3 — ALL REQUESTS
          ══════════════════════════════════════════════════════════════════════ -->
          <TabPanel class="space-y-4 pt-4">

            <!-- Filters -->
            <div class="flex flex-wrap gap-3 items-end">
              <div class="relative flex-1 min-w-[200px]">
                <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                <input v-model="reqSearch" type="text" placeholder="Search by car model…"
                       class="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                       @input="onReqSearch">
              </div>
              <div class="flex items-center gap-2">
                <input v-model="reqDateFrom" type="date"
                       class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none"
                       @change="fetchRequests(1)">
                <span class="text-gray-400 text-xs">to</span>
                <input v-model="reqDateTo" type="date"
                       class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none"
                       @change="fetchRequests(1)">
              </div>
              <span class="text-xs text-gray-400 ml-auto">{{ reqMeta.total.toLocaleString() }} requests</span>
            </div>

            <!-- Table -->
            <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead class="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Car Model</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Date &amp; Time</th>
                  </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100">
                  <tr v-if="reqLoading" v-for="n in 10" :key="n" class="animate-pulse">
                    <td class="px-4 py-3"><div class="h-4 w-8 bg-gray-200 rounded"></div></td>
                    <td class="px-4 py-3"><div class="h-4 w-40 bg-gray-200 rounded"></div></td>
                    <td class="px-4 py-3"><div class="h-4 w-28 bg-gray-200 rounded"></div></td>
                  </tr>
                  <tr v-else-if="requests.length === 0">
                    <td colspan="3" class="px-4 py-16 text-center text-gray-400">
                      <i class="fa-solid fa-calculator text-3xl mb-3 block opacity-30"></i>
                      <p class="text-sm">No requests found</p>
                    </td>
                  </tr>
                  <tr v-else v-for="r in requests" :key="r.id" class="hover:bg-gray-50/50">
                    <td class="px-4 py-3 text-gray-400 text-xs font-mono">{{ r.id }}</td>
                    <td class="px-4 py-3 font-medium text-gray-900">
                      <span v-if="r.model">{{ r.model }}</span>
                      <span v-else class="text-gray-400 italic text-xs">not provided</span>
                    </td>
                    <td class="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {{ new Date(r.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }}
                    </td>
                  </tr>
                  </tbody>
                </table>
              </div>

              <!-- Pagination -->
              <div v-if="reqMeta.last_page > 1" class="px-4 py-3 border-t border-gray-100 flex items-center justify-between gap-3">
                <p class="text-xs text-gray-500">
                  Showing {{ ((reqMeta.current_page - 1) * reqMeta.per_page) + 1 }}–{{ Math.min(reqMeta.current_page * reqMeta.per_page, reqMeta.total) }} of {{ reqMeta.total }}
                </p>
                <div class="flex items-center gap-1">
                  <button class="cursor-pointer px-2.5 py-1.5 text-sm rounded-md border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                          :disabled="reqMeta.current_page === 1" @click="fetchRequests(reqMeta.current_page - 1)">&lsaquo;</button>
                  <template v-for="p in pages(reqMeta)" :key="p">
                    <span v-if="p === '...'" class="px-2 text-gray-400 text-sm">…</span>
                    <button v-else class="cursor-pointer px-2.5 py-1.5 text-sm rounded-md border transition-colors"
                            :class="p === reqMeta.current_page ? 'border-primary bg-primary text-white' : 'border-gray-300 text-gray-600 hover:bg-gray-50'"
                            @click="fetchRequests(p as number)">{{ p }}</button>
                  </template>
                  <button class="cursor-pointer px-2.5 py-1.5 text-sm rounded-md border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                          :disabled="reqMeta.current_page === reqMeta.last_page" @click="fetchRequests(reqMeta.current_page + 1)">&rsaquo;</button>
                </div>
              </div>
            </div>

          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>

  </div>
</template>
