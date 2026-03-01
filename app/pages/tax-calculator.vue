<script setup lang="ts">
import { Loading, Notify } from 'notiflix'
import type { TaxCalculatorPayload, TaxCalculatorResponse, VehicleValuation } from '@/types'
import UraValuationSearch from '~/components/UraValuationSearch.vue'

useSeoMeta({
  title: 'URA Tax Calculator | EzzyRide Uganda',
  description: 'Calculate precise import duties and taxes for any vehicle based on current Uganda Revenue Authority rates.',
})

const { fetchTaxes, formatCurrency } = useTaxUtilities()

// ── Form state ────────────────────────────────────────────────────────────
const form = ref<TaxCalculatorPayload>({ cif: 0, year: '', isLuxury: false, make: '', isEV: false })
const cifInput        = ref<string>('')
const selectedValuation = ref<VehicleValuation | null>(null)
const taxObject       = ref<TaxCalculatorResponse | undefined>()

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
  // Resolve final CIF: manual input wins; fall back to valuation CIF
  const parsedInput = parseFloat(cifInput.value)
  const finalCif = parsedInput > 0 ? parsedInput : parseFloat(selectedValuation.value?.cif ?? '0') || 0

  if (finalCif === 0 || !form.value.year) {
    Notify.failure('Please provide the vehicle year and a CIF value (or select a vehicle from the valuation search above).')
    return
  }

  form.value.cif = finalCif

  Loading.standard('Calculating taxes…')
  fetchTaxes(form.value)
    .then(res => {
      taxObject.value = res
      Loading.remove()
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

// ── Display computed ──────────────────────────────────────────────────────
const displayCif = computed(() => {
  const parsed = parseFloat(cifInput.value)
  return parsed > 0 ? parsed : (selectedValuation.value ? parseFloat(selectedValuation.value.cif) : 0)
})

const cifUgx = computed(() => {
  if (!taxObject.value) return '--'
  const c = displayCif.value
  return c > 0 ? formatCurrency(c * taxObject.value.usdRate, 'UGX') : formatCurrency(taxObject.value.cifUGX ?? 0, 'UGX')
})

const totalAmount = computed(() => {
  if (!taxObject.value) return '--'
  const c = displayCif.value
  if (c > 0) return formatCurrency(c * taxObject.value.usdRate + taxObject.value.totalTax, 'UGX')
  return formatCurrency(taxObject.value.totalCarValue ?? 0, 'UGX')
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
        <div class="flex flex-col lg:flex-row gap-8">
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
              <div class="grid grid-cols-3 gap-3 mb-2">
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

              <!-- CTA -->
              <div class="flex flex-wrap gap-3">
                <NuxtLink to="/import-assistance" class="flex-1 bg-primary hover:bg-red-700 text-white font-medium py-3 px-4 rounded-xl text-sm text-center transition-colors">
                  <i class="fa-solid fa-ship mr-2"></i>Get Import Assistance
                </NuxtLink>
                <NuxtLink to="/contact" class="flex-1 bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-4 rounded-xl text-sm text-center transition-colors">
                  <i class="fa-solid fa-headset mr-2"></i>Talk to an Expert
                </NuxtLink>
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
