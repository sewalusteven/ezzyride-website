<script setup lang="ts">
definePageMeta({ layout: 'admin-layout' })

const { $api } = useNuxtApp()

// ── Types ──────────────────────────────────────────────────────────────────
interface TaxConfig {
  id: number
  usdRate: number
  importDutyRate: number
  vatRate: number
  withholdingRate: number
  infrastructureTaxRate: number
  commissionRate: number
  envLevyPartialAgeMin: number
  envLevyPartialAgeMax: number
  envLevyPartialRate: number
  envLevyFullAgeMin: number
  envLevyFullRate: number
  exciseDutyRate: number
  formFees: number
  stampDuty: number
  registrationFees: number
  createdAt: string
}

// ── State ──────────────────────────────────────────────────────────────────
const loading  = ref(true)
const saving   = ref(false)
const saved    = ref(false)
const error    = ref('')
const history  = ref<TaxConfig[]>([])

const form = ref<Omit<TaxConfig, 'id' | 'createdAt'>>({
  usdRate: 0,
  importDutyRate: 0,
  vatRate: 0,
  withholdingRate: 0,
  infrastructureTaxRate: 0,
  commissionRate: 0,
  envLevyPartialAgeMin: 0,
  envLevyPartialAgeMax: 0,
  envLevyPartialRate: 0,
  envLevyFullAgeMin: 0,
  envLevyFullRate: 0,
  exciseDutyRate: 0,
  formFees: 0,
  stampDuty: 0,
  registrationFees: 0,
})

// ── Fetch ──────────────────────────────────────────────────────────────────
const loadConfig = async () => {
  loading.value = true
  try {
    const { data } = await $api.get('/v1/tax-configurations?limit=8')
    const configs: TaxConfig[] = data.data

    if (configs.length) {
      const current = configs[0]
      form.value = {
        usdRate:               current.usdRate,
        importDutyRate:        current.importDutyRate,
        vatRate:               current.vatRate,
        withholdingRate:       current.withholdingRate,
        infrastructureTaxRate: current.infrastructureTaxRate,
        commissionRate:        current.commissionRate,
        envLevyPartialAgeMin:  current.envLevyPartialAgeMin,
        envLevyPartialAgeMax:  current.envLevyPartialAgeMax,
        envLevyPartialRate:    current.envLevyPartialRate,
        envLevyFullAgeMin:     current.envLevyFullAgeMin,
        envLevyFullRate:       current.envLevyFullRate,
        exciseDutyRate:        current.exciseDutyRate,
        formFees:              current.formFees,
        stampDuty:             current.stampDuty,
        registrationFees:      current.registrationFees,
      }
    }
    history.value = configs
  } finally {
    loading.value = false
  }
}

onMounted(loadConfig)

// ── Save ───────────────────────────────────────────────────────────────────
const save = async () => {
  error.value = ''
  saving.value = true
  try {
    await $api.post('/v1/tax-configurations', form.value)
    saved.value = true
    setTimeout(() => (saved.value = false), 3000)
    await loadConfig()
  } catch (err: any) {
    const errs = err.response?.data?.data
    if (errs && typeof errs === 'object') {
      error.value = Object.values(errs).flat().join(' · ')
    } else {
      error.value = err.response?.data?.message ?? 'Failed to save. Please try again.'
    }
  } finally {
    saving.value = false
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const fmtUGX = (n: number) =>
  new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(n)
</script>

<template>
  <div class="p-6 space-y-5">

    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-semibold text-gray-900">Tax Settings</h2>
        <p class="text-sm text-gray-500 mt-0.5">Every save creates a new revision — the calculator always uses the latest</p>
      </div>
      <button
        :disabled="saving || loading"
        class="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-60"
        @click="save"
      >
        <i v-if="saving" class="fa-solid fa-spinner fa-spin"></i>
        <i v-else-if="saved" class="fa-solid fa-check"></i>
        <i v-else class="fa-solid fa-floppy-disk"></i>
        {{ saving ? 'Saving...' : saved ? 'Saved!' : 'Save Configuration' }}
      </button>
    </div>

    <!-- Error -->
    <div v-if="error" class="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
      <i class="fa-solid fa-circle-exclamation mt-0.5 shrink-0"></i>
      <span>{{ error }}</span>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="grid grid-cols-3 gap-5 animate-pulse">
      <div class="col-span-2 space-y-4">
        <div v-for="n in 5" :key="n" class="h-32 bg-gray-100 rounded-lg"></div>
      </div>
      <div class="h-64 bg-gray-100 rounded-lg"></div>
    </div>

    <div v-else class="grid grid-cols-3 gap-5">

      <!-- ── LEFT: Form ─────────────────────────────────────────────────── -->
      <div class="col-span-2 space-y-4">

        <!-- 1. Exchange Rate -->
        <div class="bg-white rounded-lg border border-gray-200">
          <div class="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <div class="w-8 h-8 rounded-md bg-blue-100 flex items-center justify-center shrink-0">
              <i class="fa-solid fa-dollar-sign text-blue-600 text-sm"></i>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 text-sm">Exchange Rate</h3>
              <p class="text-xs text-gray-400">Applied first — converts CIF USD → UGX</p>
            </div>
          </div>
          <div class="p-5">
            <div class="flex items-end gap-4">
              <div class="flex-1">
                <label class="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">1 USD equals</label>
                <div class="flex rounded-md border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-primary">
                  <input
                    v-model.number="form.usdRate"
                    type="number"
                    min="0"
                    step="1"
                    class="flex-1 px-4 py-2.5 text-base font-semibold border-0 outline-none bg-white [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  >
                  <span class="px-4 py-2.5 bg-gray-50 border-l border-gray-300 text-sm text-gray-500 font-medium flex items-center">UGX</span>
                </div>
              </div>
              <div class="pb-0.5 flex-shrink-0">
                <div class="px-4 py-2.5 bg-secondary/5 border border-secondary/20 rounded-md text-center min-w-[140px]">
                  <p class="text-xs text-gray-500">Current rate</p>
                  <p class="text-lg font-bold text-secondary leading-tight">{{ form.usdRate.toLocaleString() }}</p>
                  <p class="text-xs text-gray-400">UGX / USD</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. Import-based Tax Rates -->
        <div class="bg-white rounded-lg border border-gray-200">
          <div class="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <div class="w-8 h-8 rounded-md bg-orange-100 flex items-center justify-center shrink-0">
              <i class="fa-solid fa-percent text-orange-600 text-sm"></i>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 text-sm">Import-based Tax Rates</h3>
              <p class="text-xs text-gray-400">All applied as a percentage of CIF_UGX</p>
            </div>
          </div>
          <div class="p-5 grid grid-cols-2 gap-x-5 gap-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Import Duty</label>
              <p class="text-xs text-gray-400 mb-2">Applied on CIF_UGX</p>
              <div class="flex rounded-md border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-primary">
                <input v-model.number="form.importDutyRate" type="number" min="0" max="100" step="0.1"
                  class="flex-1 px-3 py-2.5 text-sm border-0 outline-none bg-white [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none">
                <span class="px-3 py-2.5 bg-gray-50 border-l border-gray-300 text-sm text-gray-500 font-medium flex items-center">%</span>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">VAT</label>
              <p class="text-xs text-gray-400 mb-2">Applied on CIF_UGX + Import Duty</p>
              <div class="flex rounded-md border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-primary">
                <input v-model.number="form.vatRate" type="number" min="0" max="100" step="0.1"
                  class="flex-1 px-3 py-2.5 text-sm border-0 outline-none bg-white [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none">
                <span class="px-3 py-2.5 bg-gray-50 border-l border-gray-300 text-sm text-gray-500 font-medium flex items-center">%</span>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Withholding Tax</label>
              <p class="text-xs text-gray-400 mb-2">Applied on CIF_UGX</p>
              <div class="flex rounded-md border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-primary">
                <input v-model.number="form.withholdingRate" type="number" min="0" max="100" step="0.1"
                  class="flex-1 px-3 py-2.5 text-sm border-0 outline-none bg-white [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none">
                <span class="px-3 py-2.5 bg-gray-50 border-l border-gray-300 text-sm text-gray-500 font-medium flex items-center">%</span>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Infrastructure Tax</label>
              <p class="text-xs text-gray-400 mb-2">Applied on CIF_UGX</p>
              <div class="flex rounded-md border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-primary">
                <input v-model.number="form.infrastructureTaxRate" type="number" min="0" max="100" step="0.1"
                  class="flex-1 px-3 py-2.5 text-sm border-0 outline-none bg-white [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none">
                <span class="px-3 py-2.5 bg-gray-50 border-l border-gray-300 text-sm text-gray-500 font-medium flex items-center">%</span>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Import Commission</label>
              <p class="text-xs text-gray-400 mb-2">Applied on CIF_UGX</p>
              <div class="flex rounded-md border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-primary">
                <input v-model.number="form.commissionRate" type="number" min="0" max="100" step="0.1"
                  class="flex-1 px-3 py-2.5 text-sm border-0 outline-none bg-white [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none">
                <span class="px-3 py-2.5 bg-gray-50 border-l border-gray-300 text-sm text-gray-500 font-medium flex items-center">%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Environmental Levy -->
        <div class="bg-white rounded-lg border border-gray-200">
          <div class="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <div class="w-8 h-8 rounded-md bg-green-100 flex items-center justify-center shrink-0">
              <i class="fa-solid fa-leaf text-green-600 text-sm"></i>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 text-sm">Environmental Levy</h3>
              <p class="text-xs text-gray-400">Age-based levy on CIF_UGX — older vehicles pay more</p>
            </div>
          </div>
          <div class="p-5 space-y-5">

            <!-- Visual age bands -->
            <div class="bg-gray-50 rounded-md border border-gray-200 p-4">
              <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Current age bands</p>
              <div class="space-y-2.5">
                <div class="flex items-center gap-3">
                  <span class="w-2.5 h-2.5 rounded-full bg-green-400 shrink-0"></span>
                  <span class="text-sm text-gray-600 flex-1">0 – {{ form.envLevyPartialAgeMin }} years old</span>
                  <span class="text-sm font-semibold text-green-600">No levy</span>
                </div>
                <div class="flex items-center gap-3">
                  <span class="w-2.5 h-2.5 rounded-full bg-yellow-400 shrink-0"></span>
                  <span class="text-sm text-gray-600 flex-1">
                    {{ form.envLevyPartialAgeMin + 1 }} – {{ form.envLevyPartialAgeMax - 1 }} years old
                    <span class="text-xs text-gray-400">(age &gt; {{ form.envLevyPartialAgeMin }} and &lt; {{ form.envLevyPartialAgeMax }})</span>
                  </span>
                  <span class="text-sm font-semibold text-yellow-600">{{ form.envLevyPartialRate }}% levy</span>
                </div>
                <div class="flex items-center gap-3">
                  <span class="w-2.5 h-2.5 rounded-full bg-red-400 shrink-0"></span>
                  <span class="text-sm text-gray-600 flex-1">
                    {{ form.envLevyFullAgeMin }}+ years old
                    <span class="text-xs text-gray-400">(age ≥ {{ form.envLevyFullAgeMin }})</span>
                  </span>
                  <span class="text-sm font-semibold text-red-600">{{ form.envLevyFullRate }}% levy</span>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <!-- Partial band -->
              <div class="border border-yellow-200 bg-yellow-50/60 rounded-md p-4 space-y-3">
                <p class="text-xs font-semibold text-yellow-700 uppercase tracking-wide flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-yellow-400 inline-block"></span>
                  Partial Levy Band
                </p>
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1.5">Lower bound (exclusive &gt;)</label>
                  <div class="flex rounded-md border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-primary bg-white">
                    <input v-model.number="form.envLevyPartialAgeMin" type="number" min="0" step="1"
                      class="flex-1 px-3 py-2 text-sm border-0 outline-none bg-white [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none">
                    <span class="px-3 py-2 bg-gray-50 border-l border-gray-200 text-xs text-gray-400 flex items-center">yrs</span>
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1.5">Upper bound (exclusive &lt;)</label>
                  <div class="flex rounded-md border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-primary bg-white">
                    <input v-model.number="form.envLevyPartialAgeMax" type="number" min="0" step="1"
                      class="flex-1 px-3 py-2 text-sm border-0 outline-none bg-white [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none">
                    <span class="px-3 py-2 bg-gray-50 border-l border-gray-200 text-xs text-gray-400 flex items-center">yrs</span>
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1.5">Levy rate</label>
                  <div class="flex rounded-md border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-primary bg-white">
                    <input v-model.number="form.envLevyPartialRate" type="number" min="0" max="100" step="0.1"
                      class="flex-1 px-3 py-2 text-sm border-0 outline-none bg-white [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none">
                    <span class="px-3 py-2 bg-gray-50 border-l border-gray-200 text-sm text-gray-500 font-medium flex items-center">%</span>
                  </div>
                </div>
              </div>

              <!-- Full band -->
              <div class="border border-red-200 bg-red-50/60 rounded-md p-4 space-y-3">
                <p class="text-xs font-semibold text-red-700 uppercase tracking-wide flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-red-400 inline-block"></span>
                  Full Levy Band
                </p>
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1.5">Age threshold (inclusive ≥)</label>
                  <div class="flex rounded-md border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-primary bg-white">
                    <input v-model.number="form.envLevyFullAgeMin" type="number" min="0" step="1"
                      class="flex-1 px-3 py-2 text-sm border-0 outline-none bg-white [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none">
                    <span class="px-3 py-2 bg-gray-50 border-l border-gray-200 text-xs text-gray-400 flex items-center">yrs</span>
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1.5">Levy rate</label>
                  <div class="flex rounded-md border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-primary bg-white">
                    <input v-model.number="form.envLevyFullRate" type="number" min="0" max="100" step="0.1"
                      class="flex-1 px-3 py-2 text-sm border-0 outline-none bg-white [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none">
                    <span class="px-3 py-2 bg-gray-50 border-l border-gray-200 text-sm text-gray-500 font-medium flex items-center">%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 4. Excise Duty -->
        <div class="bg-white rounded-lg border border-gray-200">
          <div class="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <div class="w-8 h-8 rounded-md bg-purple-100 flex items-center justify-center shrink-0">
              <i class="fa-solid fa-gem text-purple-600 text-sm"></i>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 text-sm">Excise Duty</h3>
              <p class="text-xs text-gray-400">Flat rate on CIF_UGX — luxury or electric vehicles only</p>
            </div>
          </div>
          <div class="p-5 flex items-start gap-5">
            <div class="w-44 shrink-0">
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Rate for Luxury / EV</label>
              <div class="flex rounded-md border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-primary">
                <input v-model.number="form.exciseDutyRate" type="number" min="0" max="100" step="0.1"
                  class="flex-1 px-3 py-2.5 text-sm border-0 outline-none bg-white [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none">
                <span class="px-3 py-2.5 bg-gray-50 border-l border-gray-300 text-sm text-gray-500 font-medium flex items-center">%</span>
              </div>
            </div>
            <div class="flex-1 flex items-start gap-2.5 p-3 bg-purple-50 border border-purple-100 rounded-md text-sm text-purple-700 mt-6">
              <i class="fa-solid fa-circle-info mt-0.5 shrink-0"></i>
              <span>Standard vehicles pay <strong>0%</strong>. This rate only applies when "Is Luxury" or "Is Electric" is set on the calculator.</span>
            </div>
          </div>
        </div>

        <!-- 5. Fixed Government Fees -->
        <div class="bg-white rounded-lg border border-gray-200">
          <div class="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <div class="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center shrink-0">
              <i class="fa-solid fa-building-columns text-gray-600 text-sm"></i>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 text-sm">Fixed Government Fees</h3>
              <p class="text-xs text-gray-400">Flat UGX amounts — not percentage-based</p>
            </div>
          </div>
          <div class="p-5 grid grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Form Fees</label>
              <div class="flex rounded-md border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-primary">
                <span class="px-3 py-2.5 bg-gray-50 border-r border-gray-300 text-xs text-gray-500 font-medium flex items-center">UGX</span>
                <input v-model.number="form.formFees" type="number" min="0" step="1000"
                  class="flex-1 px-3 py-2.5 text-sm border-0 outline-none bg-white [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none">
              </div>
              <p class="text-xs text-gray-400 mt-1.5 font-medium">{{ fmtUGX(form.formFees) }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Stamp Duty</label>
              <div class="flex rounded-md border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-primary">
                <span class="px-3 py-2.5 bg-gray-50 border-r border-gray-300 text-xs text-gray-500 font-medium flex items-center">UGX</span>
                <input v-model.number="form.stampDuty" type="number" min="0" step="1000"
                  class="flex-1 px-3 py-2.5 text-sm border-0 outline-none bg-white [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none">
              </div>
              <p class="text-xs text-gray-400 mt-1.5 font-medium">{{ fmtUGX(form.stampDuty) }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Registration Fees</label>
              <div class="flex rounded-md border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-primary">
                <span class="px-3 py-2.5 bg-gray-50 border-r border-gray-300 text-xs text-gray-500 font-medium flex items-center">UGX</span>
                <input v-model.number="form.registrationFees" type="number" min="0" step="1000"
                  class="flex-1 px-3 py-2.5 text-sm border-0 outline-none bg-white [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none">
              </div>
              <p class="text-xs text-gray-400 mt-1.5 font-medium">{{ fmtUGX(form.registrationFees) }}</p>
            </div>
          </div>
        </div>

      </div>

      <!-- ── RIGHT: Sidebar ─────────────────────────────────────────────── -->
      <div class="space-y-4">

        <!-- Summary card -->
        <div class="bg-secondary text-white rounded-lg p-4">
          <p class="text-xs font-semibold text-blue-200 uppercase tracking-wide mb-3">Active Configuration</p>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between items-baseline">
              <span class="text-blue-300 text-xs">USD Rate</span>
              <span class="font-semibold text-sm">{{ form.usdRate.toLocaleString() }} UGX</span>
            </div>
            <div class="flex justify-between items-baseline">
              <span class="text-blue-300 text-xs">Import Duty</span>
              <span class="font-semibold text-sm">{{ form.importDutyRate }}%</span>
            </div>
            <div class="flex justify-between items-baseline">
              <span class="text-blue-300 text-xs">VAT</span>
              <span class="font-semibold text-sm">{{ form.vatRate }}%</span>
            </div>
            <div class="flex justify-between items-baseline">
              <span class="text-blue-300 text-xs">Withholding</span>
              <span class="font-semibold text-sm">{{ form.withholdingRate }}%</span>
            </div>
            <div class="flex justify-between items-baseline">
              <span class="text-blue-300 text-xs">Infrastructure</span>
              <span class="font-semibold text-sm">{{ form.infrastructureTaxRate }}%</span>
            </div>
            <div class="flex justify-between items-baseline">
              <span class="text-blue-300 text-xs">Commission</span>
              <span class="font-semibold text-sm">{{ form.commissionRate }}%</span>
            </div>
            <div class="border-t border-white/10 pt-2 mt-1 space-y-2">
              <div class="flex justify-between items-baseline">
                <span class="text-blue-300 text-xs">Excise (luxury/EV)</span>
                <span class="font-semibold text-sm">{{ form.exciseDutyRate }}%</span>
              </div>
              <div class="flex justify-between items-baseline">
                <span class="text-blue-300 text-xs">Env levy (partial)</span>
                <span class="font-semibold text-sm">{{ form.envLevyPartialRate }}%</span>
              </div>
              <div class="flex justify-between items-baseline">
                <span class="text-blue-300 text-xs">Env levy (full)</span>
                <span class="font-semibold text-sm">{{ form.envLevyFullRate }}%</span>
              </div>
            </div>
            <div class="border-t border-white/10 pt-2 mt-1 space-y-2">
              <div class="flex justify-between items-baseline">
                <span class="text-blue-300 text-xs">Form fees</span>
                <span class="font-semibold text-sm">{{ fmtUGX(form.formFees) }}</span>
              </div>
              <div class="flex justify-between items-baseline">
                <span class="text-blue-300 text-xs">Stamp duty</span>
                <span class="font-semibold text-sm">{{ fmtUGX(form.stampDuty) }}</span>
              </div>
              <div class="flex justify-between items-baseline">
                <span class="text-blue-300 text-xs">Registration</span>
                <span class="font-semibold text-sm">{{ fmtUGX(form.registrationFees) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- History -->
        <div class="bg-white rounded-lg border border-gray-200">
          <div class="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <i class="fa-solid fa-clock-rotate-left text-gray-400 text-sm"></i>
            <h3 class="font-semibold text-gray-900 text-sm">Configuration History</h3>
          </div>

          <div v-if="history.length === 0" class="text-sm text-gray-400 text-center py-6">
            No history yet
          </div>

          <div class="divide-y divide-gray-100">
            <div
              v-for="(cfg, i) in history"
              :key="cfg.id"
              class="px-4 py-3 transition-colors"
              :class="i === 0 ? 'bg-red-50' : 'hover:bg-gray-50 cursor-pointer'"
              @click="i !== 0 && Object.assign(form, {
                usdRate: cfg.usdRate, importDutyRate: cfg.importDutyRate,
                vatRate: cfg.vatRate, withholdingRate: cfg.withholdingRate,
                infrastructureTaxRate: cfg.infrastructureTaxRate, commissionRate: cfg.commissionRate,
                envLevyPartialAgeMin: cfg.envLevyPartialAgeMin, envLevyPartialAgeMax: cfg.envLevyPartialAgeMax,
                envLevyPartialRate: cfg.envLevyPartialRate, envLevyFullAgeMin: cfg.envLevyFullAgeMin,
                envLevyFullRate: cfg.envLevyFullRate, exciseDutyRate: cfg.exciseDutyRate,
                formFees: cfg.formFees, stampDuty: cfg.stampDuty, registrationFees: cfg.registrationFees,
              })"
            >
              <div class="flex items-center justify-between mb-1">
                <span v-if="i === 0" class="text-xs font-semibold text-primary">Active</span>
                <span v-else class="text-xs text-gray-400">Click to restore</span>
                <span class="text-xs text-gray-400">#{{ cfg.id }}</span>
              </div>
              <p class="text-xs text-gray-500">{{ fmtDate(cfg.createdAt) }}</p>
              <p class="text-xs text-gray-700 mt-0.5">
                {{ cfg.usdRate.toLocaleString() }} UGX/USD · Duty {{ cfg.importDutyRate }}% · VAT {{ cfg.vatRate }}%
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>
