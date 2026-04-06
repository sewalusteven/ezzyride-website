<script setup lang="ts">
import { Loading, Notify } from 'notiflix'
import type { TaxCalculatorPayload, TaxCalculatorResponse, VehicleValuation } from '@/types'
import UraValuationSearch from '~/components/UraValuationSearch.vue'

useSeoMeta({
  title: 'URA Tax Calculator | EzzyRide Uganda',
  description: 'Calculate precise import duties and taxes for any vehicle based on current Uganda Revenue Authority rates.',
})

const { $api } = useNuxtApp()
const { fetchTaxes, formatCurrency } = useTaxUtilities()

// ── Calculator mode ──────────────────────────────────────────────────────
const mode = ref<'calculate' | 'afford'>('calculate')

// ── Form state ───────────────────────────────────────────────────────────
const form = ref<TaxCalculatorPayload>({ cif: 0, year: '', isLuxury: false, make: '', isEV: false })
const cifInput        = ref<string>('')
const selectedValuation = ref<VehicleValuation | null>(null)
const taxObject       = ref<TaxCalculatorResponse | undefined>()
const marketRate      = ref<number | null>(null)

// ── "What can I afford?" state ───────────────────────────────────────────
const budgetInput     = ref<string>('')
interface AffordTier { label: string; yearRange: string; cifUsd: number; cifUgx: number; tax: number }
interface SuggestedVehicle { id: number; name: string; cif: number; cc: string; origin: string | null }
const affordResult    = ref<{ budget: number; tiers: AffordTier[]; suggestions: SuggestedVehicle[]; popularSearches: Record<string, number> } | null>(null)
const affordLoading   = ref(false)
const envLevyConfig   = ref<{ partialAgeMin: number; partialAgeMax: number; fullAgeMin: number } | null>(null)

// ── Calculation history (local storage) ──────────────────────────────────
interface CalcHistoryEntry {
  vehicle: string; year: string; cifUsd: number; totalTax: number; estimatedTotal: number; date: string
}
const calcHistory = ref<CalcHistoryEntry[]>([])

const loadHistory = () => {
  if (!import.meta.client) return
  try {
    const raw = localStorage.getItem('ezzyride_calc_history')
    if (raw) calcHistory.value = JSON.parse(raw)
  } catch { /* ignore */ }
}

const saveToHistory = (entry: CalcHistoryEntry) => {
  // Deduplicate by vehicle+year, keep last 10
  calcHistory.value = [entry, ...calcHistory.value.filter(h => !(h.vehicle === entry.vehicle && h.year === entry.year))].slice(0, 10)
  if (import.meta.client) {
    localStorage.setItem('ezzyride_calc_history', JSON.stringify(calcHistory.value))
  }
}

const clearHistory = () => {
  calcHistory.value = []
  if (import.meta.client) localStorage.removeItem('ezzyride_calc_history')
}

// ── Fetch market rate from settings ──────────────────────────────────────
onMounted(async () => {
  loadHistory()
  try {
    const { data } = await $api.get('/web/settings')
    const rate = parseFloat(data.data?.cif_usd_rate)
    if (rate > 0) marketRate.value = rate
  } catch { /* fall back to URA rate */ }
})

// ── Prefill from valuation search ─────────────────────────────────────────
const prefillVehicle = (vehicle: VehicleValuation) => {
  selectedValuation.value = vehicle
  form.value.year  = vehicle.year
  form.value.make  = vehicle.name
  // Only overwrite cifInput if user hasn't typed anything
  if (!cifInput.value) {
    cifInput.value = parseFloat(vehicle.cif).toFixed(2)
  }
}

// ── Submit ────────────────────────────────────────────────────────────────
const submit = () => {
  // Use valuation CIF for tax calculation if available, otherwise use manual input
  const calculationCif = selectedValuation.value
      ? parseFloat(selectedValuation.value.cif)
      : parseFloat(cifInput.value) || 0

  if (calculationCif === 0 || !form.value.year) {
    Notify.failure('Please provide the vehicle year and a CIF value (or select a vehicle from the valuation search above).')
    return
  }

  form.value.cif = calculationCif

  Loading.standard('Calculating taxes…')
  fetchTaxes(form.value)
      .then(res => {
        taxObject.value = res
        Loading.remove()

        // Save to history
        saveToHistory({
          vehicle: form.value.make || 'Custom CIF',
          year: String(form.value.year),
          cifUsd: displayCif.value,
          totalTax: res.totalTax,
          estimatedTotal: res.totalCarValue,
          date: new Date().toISOString(),
        })

        // Scroll to results on mobile
        if (window.innerWidth < 1024) {
          setTimeout(() => {
            document.getElementById('results-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }, 100)
        }
      })
      .catch(err => {
        Loading.remove()
        Notify.failure(err?.response?.data?.message ?? 'Calculation failed')
      })
}

// ── "What can I afford?" calculator ──────────────────────────────────────
const calculateAfford = async () => {
  const budget = parseFloat(budgetInput.value?.replace(/,/g, '') || '0')
  if (budget <= 0) {
    Notify.failure('Please enter your budget in UGX.')
    return
  }

  affordLoading.value = true
  affordResult.value = null

  try {
    // Single API call — all tiers + suggestions calculated server-side
    const { data } = await $api.post('/web/tax-calculator/afford', { budget })
    const res = data.data

    if (res.envLevyConfig) envLevyConfig.value = res.envLevyConfig

    affordResult.value = {
      budget: res.budget,
      tiers: res.tiers,
      suggestions: res.matchingVehicles ?? [],
      popularSearches: res.popularSearches ?? {},
    }

    // Track conversion
    if (import.meta.client && (window as any).fbq) {
      (window as any).fbq('track', 'Search', {
        search_string: `Budget: ${budget}`,
        content_category: 'Afford Calculator',
        value: budget,
        currency: 'UGX',
      })
    }
  } catch {
    Notify.failure('Calculation failed. Please try again.')
  } finally {
    affordLoading.value = false
  }
}


// ── Display computed ──────────────────────────────────────────────────────
const displayCif = computed(() => {
  const parsed = parseFloat(cifInput.value)
  return parsed > 0 ? parsed : (selectedValuation.value ? parseFloat(selectedValuation.value.cif) : 0)
})

const cifRate = computed(() => marketRate.value ?? taxObject.value?.usdRate ?? 0)

const cifUgx = computed(() => {
  if (!taxObject.value) return '--'
  const c = displayCif.value
  return c > 0 ? formatCurrency(c * cifRate.value, 'UGX') : formatCurrency(taxObject.value.cifUGX ?? 0, 'UGX')
})

const totalAmount = computed(() => {
  if (!taxObject.value) return '--'
  const c = displayCif.value
  if (c > 0) return formatCurrency(c * cifRate.value + taxObject.value.totalTax, 'UGX')
  return formatCurrency(taxObject.value.totalCarValue ?? 0, 'UGX')
})

// ── Post-calculation conversion ──────────────────────────────────────────
const config = useRuntimeConfig()
const showEmailModal = ref(false)
const emailForm = ref({ email: '', sending: false, sent: false, error: '' })

const estimatedTotalUgx = computed(() => {
  if (!taxObject.value) return 0
  const c = displayCif.value
  return c > 0 ? c * cifRate.value + taxObject.value.totalTax : taxObject.value.totalCarValue ?? 0
})

const vehicleSummary = computed(() => {
  if (!selectedValuation.value && !form.value.make) return 'a vehicle'
  return form.value.make || selectedValuation.value?.name || 'a vehicle'
})

const whatsappCalcMessage = computed(() => {
  if (!taxObject.value) return ''
  const lines = [
    `Hi EzzyRide, I just calculated import taxes on your site.`,
    ``,
    `Vehicle: ${vehicleSummary.value}`,
    `Year: ${form.value.year}`,
    `CIF: USD ${displayCif.value.toLocaleString()}`,
    `Total Taxes: ${formatCurrency(taxObject.value.totalTax, 'UGX')}`,
    `Estimated Total: ${formatCurrency(estimatedTotalUgx.value, 'UGX')}`,
    ``,
    `I'd like to know more about importing this vehicle.`,
  ]
  return lines.join('\n')
})

const whatsappCalcUrl = computed(() => {
  return `https://wa.me/${config.public.whatsappNumber}?text=${encodeURIComponent(whatsappCalcMessage.value)}`
})

const browseVehiclesUrl = computed(() => {
  if (!estimatedTotalUgx.value) return '/vehicles'
  // Use the estimated total (CIF + taxes) as the max — this is the user's actual budget
  return `/vehicles?price_max=${Math.ceil(estimatedTotalUgx.value)}`
})

const sendCalculationEmail = async () => {
  if (!emailForm.value.email) return
  emailForm.value.sending = true
  emailForm.value.error = ''
  try {
    await $api.post('/web/tax-calculator/email', {
      email: emailForm.value.email,
      vehicle: vehicleSummary.value,
      year: form.value.year,
      cif_usd: displayCif.value,
      total_tax: taxObject.value?.totalTax,
      estimated_total: estimatedTotalUgx.value,
      usd_rate: taxObject.value?.usdRate,
      breakdown: {
        importDuty: taxObject.value?.importDuty,
        vat: taxObject.value?.vat,
        withholding: taxObject.value?.withholding,
        envLevy: taxObject.value?.envLevy,
        infrastructureTax: taxObject.value?.infrastructureTax,
        exciseDuty: taxObject.value?.exciseDuty,
        formFees: taxObject.value?.formFees,
        stampDuty: taxObject.value?.stampDuty,
        registrationFees: taxObject.value?.registrationFees,
      }
    })
    emailForm.value.sent = true
    // Track conversion
    if ((window as any).fbq) (window as any).fbq('track', 'Lead', { content_name: 'Tax Calculation Email' })
  } catch {
    emailForm.value.error = 'Failed to send. Please try again.'
  } finally {
    emailForm.value.sending = false
  }
}

// Track tax calculation as a custom event
watch(taxObject, (val) => {
  if (val && import.meta.client) {
    if ((window as any).fbq) {
      (window as any).fbq('track', 'Search', {
        search_string: vehicleSummary.value,
        content_category: 'Tax Calculation',
        value: estimatedTotalUgx.value,
        currency: 'UGX',
      })
    }
  }
})

// ── FAQ ───────────────────────────────────────────────────────────────────
const openFaq = ref<number | null>(null)
const faqs = [
  { q: 'How accurate is the tax calculator?', a: 'Our calculator is approximately 95% accurate based on current URA regulations. Final costs may vary due to vehicle inspection results, currency fluctuations, or policy changes.' },
  { q: 'What is CIF value and how do I calculate it?', a: 'CIF stands for Cost, Insurance, and Freight. It includes the vehicle purchase price, insurance, and shipping costs to Uganda. If you select a vehicle from our valuation database, the CIF is pre-filled automatically.' },
  { q: 'Are there tax benefits for hybrid or electric vehicles?', a: 'Yes. Uganda offers incentives for EVs and hybrids. Our calculator automatically applies these when you check the relevant option.' },
  { q: 'How often are the tax rates updated?', a: 'Rates are updated immediately when URA announces changes. Exchange rates are updated from the Bank of Uganda.' },
  { q: 'What additional costs should I consider?', a: 'Beyond taxes: customs agent fees, port storage, inspection costs, number plate fees, insurance, and transport from port to Kampala. Contact us for a full breakdown.' },
]
</script>

<template>
  <div class="font-roboto text-gray-800 bg-gray-50">
    <!-- Page Title Banner -->
    <section class="pt-24 pb-8 bg-secondary">
      <div class="container mx-auto px-4">
        <div class="text-white">
          <div class="flex items-center gap-2 text-sm text-blue-200 mb-2">
            <NuxtLink to="/" class="hover:text-white transition-colors">Home</NuxtLink>
            <i class="fa-solid fa-chevron-right text-xs"></i>
            <span>Tax Calculator</span>
          </div>
          <h1 class="text-3xl md:text-4xl font-bold font-montserrat">URA Tax Calculator</h1>
          <p class="text-blue-100 mt-2">Calculate the import tax and duties for your vehicle</p>
        </div>
      </div>
    </section>

    <!-- Calculator -->
    <section class="py-12 bg-white">
      <div class="container mx-auto px-4">

        <!-- Mode toggle -->
        <div class="flex justify-center mb-8">
          <div class="inline-flex bg-gray-100 rounded-xl p-1">
            <button
              @click="mode = 'calculate'"
              class="px-5 py-2.5 rounded-lg text-sm font-medium transition-all"
              :class="mode === 'calculate' ? 'bg-white text-secondary shadow-sm' : 'text-gray-500 hover:text-gray-700'"
            >
              <i class="fa-solid fa-calculator mr-1.5"></i> Calculate Tax
            </button>
            <button
              @click="mode = 'afford'"
              class="px-5 py-2.5 rounded-lg text-sm font-medium transition-all"
              :class="mode === 'afford' ? 'bg-white text-secondary shadow-sm' : 'text-gray-500 hover:text-gray-700'"
            >
              <i class="fa-solid fa-wallet mr-1.5"></i> What Can I Afford?
            </button>
          </div>
        </div>

        <!-- ── "What Can I Afford?" Mode ─────────────────────────────── -->
        <div v-if="mode === 'afford'" class="max-w-2xl mx-auto">
          <div class="bg-light p-6 md:p-8 rounded-2xl shadow-sm">
            <h2 class="text-2xl font-semibold font-montserrat text-secondary mb-2 flex items-center gap-3">
              <i class="fa-solid fa-wallet text-primary"></i> What Can I Afford?
            </h2>
            <p class="text-sm text-gray-500 mb-6">Enter your total budget and we'll show you what CIF range you can import within — taxes included.</p>

            <form @submit.prevent="calculateAfford" class="space-y-5">
              <div>
                <label class="block text-gray-700 font-medium mb-2 text-sm">Your Total Budget (UGX)</label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">UGX</span>
                  <input
                    v-model="budgetInput"
                    type="text"
                    inputmode="numeric"
                    class="w-full p-3 pl-14 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white text-lg font-semibold"
                    placeholder="e.g. 80,000,000"
                  />
                </div>
                <p class="text-xs text-gray-500 mt-1">This should be the maximum you're willing to spend in total (vehicle + all import taxes)</p>
              </div>

              <button type="submit" :disabled="affordLoading"
                class="w-full bg-primary hover:bg-red-700 disabled:opacity-60 text-white font-bold py-4 px-8 rounded-xl transition duration-300 text-lg flex items-center justify-center gap-3">
                <i v-if="affordLoading" class="fa-solid fa-spinner fa-spin"></i>
                <i v-else class="fa-solid fa-search-dollar"></i>
                {{ affordLoading ? 'Calculating…' : 'Show What I Can Afford' }}
              </button>
            </form>

            <!-- Afford Results -->
            <div v-if="affordResult" class="mt-8 space-y-4">
              <div class="bg-secondary text-white rounded-xl p-6">
                <h3 class="font-semibold text-lg mb-2">With a budget of {{ formatCurrency(affordResult.budget, 'UGX') }}</h3>
                <p class="text-sm text-gray-300 mb-5">Here's what you can afford depending on the vehicle's age — older cars have higher environmental levies, so your CIF budget varies.</p>

                <div class="space-y-3">
                  <div v-for="tier in affordResult.tiers" :key="tier.label"
                    class="bg-white/10 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div class="flex-1">
                      <div class="flex items-center gap-2 mb-1">
                        <span class="text-xs font-semibold px-2 py-0.5 rounded-full"
                          :class="tier.label.includes('Under') ? 'bg-green-500/20 text-green-300' : tier.label.includes('5') ? 'bg-yellow-500/20 text-yellow-300' : 'bg-orange-500/20 text-orange-300'">
                          {{ tier.label }}
                        </span>
                        <span class="text-xs text-gray-400">{{ tier.yearRange }}</span>
                      </div>
                      <p class="text-xl font-bold text-primary">USD {{ tier.cifUsd.toLocaleString() }}</p>
                      <p class="text-xs text-gray-400">~{{ formatCurrency(tier.cifUgx, 'UGX') }} CIF</p>
                    </div>
                    <div class="text-right sm:text-right">
                      <p class="text-xs text-gray-400">Estimated taxes</p>
                      <p class="text-sm font-semibold text-yellow-300">{{ formatCurrency(tier.tax, 'UGX') }}</p>
                    </div>
                    <NuxtLink :to="`/vehicles?price_max=${affordResult!.budget}`"
                      class="shrink-0 bg-white/10 hover:bg-white/20 text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors text-center">
                      Browse <i class="fa-solid fa-arrow-right ml-1"></i>
                    </NuxtLink>
                  </div>
                </div>

                <div class="mt-4 bg-white/5 rounded-lg p-3">
                  <p class="text-xs text-gray-300">
                    <i class="fa-solid fa-info-circle mr-1"></i>
                    Vehicles under {{ envLevyConfig?.partialAgeMin ?? 9 }} years pay no environmental levy — your full budget goes towards the car. Vehicles {{ envLevyConfig?.partialAgeMin ?? 9 }}–{{ envLevyConfig?.fullAgeMin ?? 11 }} years old pay a partial levy, and {{ envLevyConfig?.fullAgeMin ?? 11 }}+ years pay the full levy, which reduces the CIF you can afford. These are estimates for standard non-luxury, non-EV vehicles.
                  </p>
                </div>
              </div>

              <!-- Matching vehicles from URA valuations -->
              <div v-if="affordResult.suggestions.length > 0" class="bg-white rounded-xl p-5">
                <h4 class="font-semibold text-secondary text-sm mb-3 flex items-center gap-2">
                  <i class="fa-solid fa-car text-primary"></i> Vehicles You Could Afford
                </h4>
                <p class="text-xs text-gray-500 mb-3">Based on URA's official valuations with CIF in your range:</p>
                <div class="space-y-2">
                  <div v-for="v in affordResult.suggestions" :key="v.id"
                    class="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2.5 hover:bg-gray-100 transition-colors">
                    <div class="min-w-0">
                      <p class="text-sm font-medium text-gray-800 truncate">{{ v.name }}</p>
                      <p class="text-xs text-gray-400">{{ v.cc }}{{ v.origin ? ' · ' + v.origin : '' }}</p>
                    </div>
                    <span class="text-sm font-semibold text-primary shrink-0 ml-3">USD {{ v.cif.toLocaleString() }}</span>
                  </div>
                </div>
              </div>

              <!-- Popular searches -->
              <div v-if="Object.keys(affordResult.popularSearches).length > 0" class="bg-gray-50 rounded-xl p-5">
                <h4 class="font-semibold text-secondary text-sm mb-3 flex items-center gap-2">
                  <i class="fa-solid fa-fire text-orange-500"></i> Trending Searches
                </h4>
                <p class="text-xs text-gray-500 mb-3">Most calculated vehicles by other buyers:</p>
                <div class="flex flex-wrap gap-2">
                  <button v-for="(count, name) in affordResult.popularSearches" :key="name"
                    @click="form.make = String(name); mode = 'calculate'"
                    class="inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-3 py-1.5 text-xs text-gray-700 hover:border-primary hover:text-primary transition-colors">
                    {{ name }}
                    <span class="text-[10px] text-gray-400">({{ count }})</span>
                  </button>
                </div>
              </div>

              <!-- CTAs -->
              <div class="grid grid-cols-2 gap-3">
                <a :href="`https://wa.me/${config.public.whatsappNumber}?text=${encodeURIComponent(`Hi EzzyRide, I have a budget of ${formatCurrency(affordResult.budget, 'UGX')} and I'm looking for a vehicle to import. Can you help me find something within my budget?`)}`"
                  target="_blank" rel="noopener"
                  class="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-white font-medium py-3 px-4 rounded-xl text-sm transition-colors">
                  <i class="fa-brands fa-whatsapp text-lg"></i> Chat With Us
                </a>
                <NuxtLink to="/import-assistance"
                  class="flex items-center justify-center gap-2 bg-secondary hover:bg-blue-900 text-white font-medium py-3 px-4 rounded-xl text-sm transition-colors">
                  <i class="fa-solid fa-ship"></i> Import Assistance
                </NuxtLink>
              </div>

              <!-- Vehicle alert -->
              <VehicleAlertForm
                :prefill-price-max="affordResult.tiers[0]?.cifUgx"
                :compact="true"
              />
            </div>
          </div>
        </div>

        <!-- ── Standard Calculator Mode ──────────────────────────────── -->
        <div v-else class="flex flex-col lg:flex-row gap-8">
          <!-- ── Form ─────────────────────────────────────────────────── -->
          <div class="lg:w-5/12 bg-light p-6 md:p-8 rounded-2xl shadow-sm">
            <h2 class="text-2xl font-semibold font-montserrat text-secondary mb-6 flex items-center gap-3">
              <i class="fa-solid fa-car text-primary"></i> Vehicle Details
            </h2>

            <form class="space-y-5" @submit.prevent="submit">
              <!-- Valuation search -->
              <UraValuationSearch @vehicle-selected="prefillVehicle" />

              <!-- CIF -->
              <div>
                <label class="block text-gray-700 font-medium mb-2 text-sm">
                  CIF Value (USD)
                  <span v-if="selectedValuation && !cifInput" class="text-xs font-normal text-green-600 ml-1">
                    — using valuation CIF: USD {{ parseFloat(selectedValuation.cif).toFixed(2) }}
                  </span>
                </label>
                <input
                  v-model="cifInput"
                  type="text"
                  inputmode="decimal"
                  class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white"
                  :placeholder="selectedValuation ? `Leave blank to use valuation CIF (${parseFloat(selectedValuation.cif).toFixed(2)})` : 'e.g. 15000.00'"
                />
                <p class="text-xs text-gray-500 mt-1">Cost, Insurance and Freight value. Leave blank to use the valuation price above.</p>
              </div>

              <!-- Checkboxes -->
              <div class="bg-blue-50 p-4 rounded-lg space-y-3">
                <label class="flex items-center gap-3 cursor-pointer">
                  <input v-model="form.isEV" type="checkbox" class="w-4 h-4 text-primary accent-primary rounded" />
                  <span class="text-gray-700 font-medium text-sm">Electric Vehicle (EV)</span>
                </label>
                <label class="flex items-center gap-3 cursor-pointer">
                  <input v-model="form.isLuxury" type="checkbox" class="w-4 h-4 text-primary accent-primary rounded" />
                  <span class="text-gray-700 font-medium text-sm">Luxury Vehicle</span>
                </label>
              </div>

              <button type="submit" class="w-full bg-primary hover:bg-red-700 text-white font-bold py-4 px-8 rounded-xl transition duration-300 text-lg flex items-center justify-center gap-3">
                <i class="fa-solid fa-calculator"></i> Calculate Import Taxes
              </button>
            </form>
          </div>

          <!-- ── Results ─────────────────────────────────────────────── -->
          <div id="results-panel" class="lg:flex-1 bg-secondary text-white p-6 md:p-8 rounded-2xl shadow-sm">
            <h2 class="text-2xl font-semibold mb-6 flex items-center gap-3">
              <i class="fa-solid fa-receipt text-primary"></i> Tax Breakdown
            </h2>

            <!-- Placeholder state -->
            <div v-if="!taxObject" class="flex flex-col items-center justify-center py-16 text-center opacity-50">
              <i class="fa-solid fa-calculator text-5xl mb-4 text-primary/60"></i>
              <p class="text-lg font-medium">Results will appear here</p>
              <p class="text-sm text-gray-300 mt-1">Fill in the form and press Calculate</p>
            </div>

            <div v-else class="space-y-5">
              <!-- Summary cards -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-2">
                <div class="bg-white/10 rounded-xl p-3 text-center">
                  <p class="text-xs text-gray-300 mb-1">USD Rate</p>
                  <p class="font-bold text-sm">{{ formatCurrency(taxObject.usdRate, 'UGX').replace('UGX', '').trim() }}</p>
                </div>
                <div class="bg-white/10 rounded-xl p-3 text-center">
                  <p class="text-xs text-gray-300 mb-1">CIF (UGX)</p>
                  <p class="font-bold text-sm">{{ cifUgx }}</p>
                </div>
                <div class="bg-primary/30 rounded-xl p-3 text-center">
                  <p class="text-xs text-gray-300 mb-1">Total Tax</p>
                  <p class="font-bold text-sm text-primary">{{ formatCurrency(taxObject.totalTax, 'UGX') }}</p>
                </div>
              </div>

              <!-- Tax line items table -->
              <div class="bg-white/5 rounded-xl overflow-hidden">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="bg-white/10 text-gray-300 text-xs uppercase">
                      <th class="text-left px-4 py-2.5">Tax Component</th>
                      <th class="text-right px-4 py-2.5">Amount (UGX)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in [
                      { label: 'Import Duty (25%)',          icon: 'fa-percent',   val: taxObject.importDuty },
                      { label: 'VAT (18%)',                  icon: 'fa-receipt',   val: taxObject.vat },
                      { label: 'Infrastructure Levy (1.5%)', icon: 'fa-road',      val: taxObject.infrastructureTax },
                      { label: 'Environmental Levy',         icon: 'fa-leaf',      val: taxObject.envLevy },
                      { label: 'Withholding Tax',            icon: 'fa-file-alt',  val: taxObject.withholding },
                      { label: 'Excise Duty',                icon: 'fa-coins',     val: taxObject.exciseDuty },
                    ]" :key="row.label" class="border-t border-white/10">
                      <td class="px-4 py-2.5 flex items-center gap-2 text-gray-200">
                        <i :class="`fa-solid ${row.icon} text-primary w-4`"></i> {{ row.label }}
                      </td>
                      <td class="px-4 py-2.5 text-right font-semibold">
                        {{ row.val > 0 ? formatCurrency(row.val, 'UGX') : '—' }}
                      </td>
                    </tr>
                    <tr class="border-t border-white/10">
                      <td class="px-4 py-2.5 flex items-center gap-2 text-gray-200">
                        <i class="fa-solid fa-file-invoice text-primary w-4"></i> Stamp Duty + Registration + Form Fees
                      </td>
                      <td class="px-4 py-2.5 text-right font-semibold">
                        {{ formatCurrency((taxObject.stampDuty ?? 0) + (taxObject.registrationFees ?? 0) + (taxObject.formFees ?? 0), 'UGX') }}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr class="bg-primary/20 text-base">
                      <td class="px-4 py-3 font-bold uppercase">Total Taxes</td>
                      <td class="px-4 py-3 text-right font-bold text-primary">{{ formatCurrency(taxObject.totalTax, 'UGX') }}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <!-- Total cost highlight -->
              <div class="bg-primary/20 p-5 rounded-xl">
                <div class="flex justify-between items-center text-xl font-bold">
                  <span>Estimated Total Cost</span>
                  <span class="text-primary text-2xl">{{ totalAmount }}</span>
                </div>
                <p class="text-xs text-gray-300 mt-1">CIF value + all taxes, duties and fees</p>
              </div>

              <!-- Disclaimer -->
              <div class="bg-yellow-400/10 border border-yellow-400/20 p-4 rounded-xl">
                <div class="flex items-start gap-2">
                  <i class="fa-solid fa-triangle-exclamation text-yellow-400 mt-0.5 shrink-0"></i>
                  <p class="text-xs text-gray-300">
                    <span class="font-medium text-yellow-200">Estimate only.</span> Actual costs may vary due to vehicle inspection, currency fluctuations, or policy changes. Contact us for a professional assessment.
                  </p>
                </div>
              </div>

              <!-- Conversion CTAs -->
              <div class="space-y-3">
                <!-- Primary: Browse vehicles -->
                <NuxtLink :to="browseVehiclesUrl" class="block w-full bg-primary hover:bg-red-700 text-white font-semibold py-3.5 px-4 rounded-xl text-sm text-center transition-colors">
                  <i class="fa-solid fa-car mr-2"></i>Browse Vehicles in This Price Range
                </NuxtLink>

                <div class="grid grid-cols-2 gap-3">
                  <!-- WhatsApp -->
                  <a :href="whatsappCalcUrl" target="_blank" rel="noopener"
                    class="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-white font-medium py-3 px-4 rounded-xl text-sm transition-colors">
                    <i class="fa-brands fa-whatsapp text-lg"></i> Chat About This
                  </a>
                  <!-- Email me -->
                  <button @click="showEmailModal = true"
                    class="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-4 rounded-xl text-sm transition-colors">
                    <i class="fa-solid fa-envelope"></i> Email Me This
                  </button>
                </div>

                <!-- Import assistance -->
                <NuxtLink to="/import-assistance" class="block w-full bg-white/5 hover:bg-white/10 text-white/80 font-medium py-3 px-4 rounded-xl text-sm text-center transition-colors border border-white/10">
                  <i class="fa-solid fa-ship mr-2"></i>Get Import Assistance
                </NuxtLink>
              </div>

              <!-- Email modal -->
              <Teleport to="body">
                <div v-if="showEmailModal" class="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4" @click.self="showEmailModal = false">
                  <div class="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
                    <div class="bg-secondary px-5 py-3.5 flex items-center justify-between">
                      <h3 class="text-white font-semibold text-sm">Email Tax Breakdown</h3>
                      <button @click="showEmailModal = false" class="text-white/60 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <div class="p-5">
                      <div v-if="emailForm.sent" class="text-center py-4">
                        <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <i class="fa-solid fa-check text-green-600 text-xl"></i>
                        </div>
                        <p class="font-semibold text-gray-900 mb-1">Sent!</p>
                        <p class="text-sm text-gray-500">Check your inbox for the tax breakdown.</p>
                        <button @click="showEmailModal = false" class="mt-3 text-sm text-primary hover:underline">Close</button>
                      </div>
                      <form v-else @submit.prevent="sendCalculationEmail" class="space-y-3">
                        <p class="text-sm text-gray-600">We'll send a detailed tax breakdown for <strong>{{ vehicleSummary }}</strong> to your email.</p>
                        <div v-if="emailForm.error" class="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{{ emailForm.error }}</div>
                        <input
                          v-model="emailForm.email"
                          type="email"
                          required
                          placeholder="your@email.com"
                          class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        <label class="flex items-start gap-2 text-xs text-gray-500">
                          <input type="checkbox" checked disabled class="mt-0.5 rounded border-gray-300" />
                          <span>Also add me to the EzzyRide mailing list for new vehicle alerts</span>
                        </label>
                        <button type="submit" :disabled="emailForm.sending"
                          class="w-full bg-primary hover:bg-red-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg text-sm transition-colors">
                          <i v-if="emailForm.sending" class="fa-solid fa-spinner fa-spin mr-1"></i>
                          {{ emailForm.sending ? 'Sending…' : 'Send Breakdown' }}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </Teleport>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Calculation History -->
    <section v-if="calcHistory.length > 0" class="py-10 bg-white border-t border-gray-100">
      <div class="container mx-auto px-4">
        <div class="max-w-3xl mx-auto">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-secondary flex items-center gap-2">
              <i class="fa-solid fa-clock-rotate-left text-primary"></i> Your Recent Calculations
            </h3>
            <button @click="clearHistory" class="text-xs text-gray-400 hover:text-red-500 transition-colors">
              <i class="fa-solid fa-trash mr-1"></i> Clear
            </button>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div v-for="(h, idx) in calcHistory" :key="idx"
              class="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors cursor-pointer"
              @click="cifInput = String(h.cifUsd); form.year = h.year; form.make = h.vehicle; mode = 'calculate'"
            >
              <div class="flex justify-between items-start">
                <div>
                  <p class="font-medium text-secondary text-sm">{{ h.vehicle }}</p>
                  <p class="text-xs text-gray-400 mt-0.5">{{ h.year }} · CIF USD {{ h.cifUsd.toLocaleString() }}</p>
                </div>
                <div class="text-right">
                  <p class="text-sm font-semibold text-primary">{{ formatCurrency(h.estimatedTotal, 'UGX') }}</p>
                  <p class="text-[10px] text-gray-400">{{ new Date(h.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Additional Help -->
    <section class="py-12 bg-gray-50">
      <div class="container mx-auto px-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <NuxtLink to="/import-assistance" class="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all text-center group">
            <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-primary transition-colors">
              <i class="fa-solid fa-ship text-primary group-hover:text-white text-xl transition-colors"></i>
            </div>
            <h3 class="font-semibold text-secondary mb-1">Import Assistance</h3>
            <p class="text-sm text-gray-500">Let us handle the full import on your behalf</p>
          </NuxtLink>
          <NuxtLink to="/valuations" class="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all text-center group">
            <div class="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-accent transition-colors">
              <i class="fa-solid fa-chart-bar text-accent group-hover:text-white text-xl transition-colors"></i>
            </div>
            <h3 class="font-semibold text-secondary mb-1">Vehicle Valuations</h3>
            <p class="text-sm text-gray-500">Search official URA vehicle valuations</p>
          </NuxtLink>
          <NuxtLink to="/contact" class="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all text-center group">
            <div class="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-secondary transition-colors">
              <i class="fa-solid fa-headset text-secondary group-hover:text-white text-xl transition-colors"></i>
            </div>
            <h3 class="font-semibold text-secondary mb-1">Expert Consultation</h3>
            <p class="text-sm text-gray-500">Talk to our import specialists directly</p>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="py-16 bg-white">
      <div class="container mx-auto px-4">
        <div class="text-center mb-10">
          <h2 class="text-2xl md:text-3xl font-bold font-montserrat text-secondary mb-3">Frequently Asked Questions</h2>
        </div>
        <div class="max-w-3xl mx-auto space-y-3">
          <div v-for="(faq, idx) in faqs" :key="idx" class="border border-gray-100 rounded-xl bg-light overflow-hidden">
            <button
              class="w-full flex justify-between items-center px-5 py-4 text-left font-semibold text-secondary hover:text-primary transition-colors text-sm"
              @click="openFaq = openFaq === idx ? null : idx"
            >
              {{ faq.q }}
              <i class="fa-solid shrink-0 ml-4 text-primary" :class="openFaq === idx ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
            </button>
            <div v-if="openFaq === idx" class="px-5 pb-4 text-sm text-gray-600">{{ faq.a }}</div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
