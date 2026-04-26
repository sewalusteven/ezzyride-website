<script setup lang="ts">
import { Notify } from 'notiflix'

useSeoMeta({
  title: 'Budget Estimator | EzzyRide Uganda',
  description: 'Have a budget in mind? Find out exactly what vehicle CIF range you can import within your total budget — taxes and fees included.',
})

const { $api } = useNuxtApp()
const { formatCurrency } = useTaxUtilities()
const config = useRuntimeConfig()

interface AffordTier { label: string; yearRange: string; cifUsd: number; cifUgx: number; tax: number }
interface SuggestedVehicle { id: number; name: string; cif: number; cc: string; origin: string | null }

const budgetInput   = ref<string>('')
const affordResult  = ref<{ budget: number; tiers: AffordTier[]; suggestions: SuggestedVehicle[]; popularSearches: Record<string, number> } | null>(null)
const affordLoading = ref(false)
const envLevyConfig = ref<{ partialAgeMin: number; partialAgeMax: number; fullAgeMin: number } | null>(null)

const calculateAfford = async () => {
  const budget = parseFloat(budgetInput.value?.replace(/,/g, '') || '0')
  if (budget <= 0) {
    Notify.failure('Please enter your budget in UGX.')
    return
  }

  affordLoading.value = true
  affordResult.value = null

  try {
    const { data } = await $api.post('/web/tax-calculator/afford', { budget })
    const res = data.data

    if (res.envLevyConfig) envLevyConfig.value = res.envLevyConfig

    affordResult.value = {
      budget: res.budget,
      tiers: res.tiers,
      suggestions: res.matchingVehicles ?? [],
      popularSearches: res.popularSearches ?? {},
    }

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

const goToTaxCalculator = (vehicleName: string) => {
  navigateTo({ path: '/tax-calculator', query: { make: vehicleName } })
}
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
            <span>Budget Estimator</span>
          </div>
          <h1 class="text-3xl md:text-4xl font-bold font-montserrat">Budget Estimator</h1>
          <p class="text-blue-100 mt-2">Have a budget? Find out exactly what you can import within it.</p>
        </div>
      </div>
    </section>

    <!-- Estimator -->
    <section class="py-12 bg-white">
      <div class="container mx-auto px-4">
        <div class="max-w-3xl mx-auto">
          <div class="bg-light p-6 md:p-8 rounded-2xl shadow-sm">
            <h2 class="text-2xl font-semibold font-montserrat text-secondary mb-2 flex items-center gap-3">
              <i class="fa-solid fa-wallet text-primary"></i> What Can I Afford?
            </h2>
            <p class="text-sm text-gray-500 mb-6">Enter your total budget (vehicle + import taxes) and we'll show you what CIF range you can target across different vehicle ages.</p>

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
                <p class="text-xs text-gray-500 mt-1">This is the maximum you're willing to spend in total — vehicle CIF + all import taxes combined.</p>
              </div>

              <button type="submit" :disabled="affordLoading"
                class="w-full bg-primary hover:bg-red-700 disabled:opacity-60 text-white font-bold py-4 px-8 rounded-xl transition duration-300 text-lg flex items-center justify-center gap-3">
                <i v-if="affordLoading" class="fa-solid fa-spinner fa-spin"></i>
                <i v-else class="fa-solid fa-search-dollar"></i>
                {{ affordLoading ? 'Calculating…' : 'Show What I Can Afford' }}
              </button>
            </form>

            <!-- Results -->
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
                          :class="tier.label.includes('Under') ? 'bg-green-500/20 text-green-300' : tier.label.includes('Over') ? 'bg-orange-500/20 text-orange-300' : 'bg-yellow-500/20 text-yellow-300'">
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

              <!-- Matching vehicles -->
              <div v-if="affordResult.suggestions.length > 0" class="bg-white rounded-xl p-5 border border-gray-100">
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
                <p class="text-xs text-gray-500 mb-3">Most calculated vehicles by other buyers in your range:</p>
                <div class="flex flex-wrap gap-2">
                  <button v-for="(count, name) in affordResult.popularSearches" :key="name"
                    @click="goToTaxCalculator(String(name))"
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
      </div>
    </section>

    <!-- How it works -->
    <section class="py-12 bg-gray-50">
      <div class="container mx-auto px-4">
        <div class="max-w-3xl mx-auto">
          <h2 class="text-xl font-bold text-secondary mb-6 text-center">How the Budget Estimator Works</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-white p-5 rounded-xl shadow-sm">
              <div class="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                <span class="font-bold text-primary">1</span>
              </div>
              <h3 class="font-semibold text-secondary text-sm mb-1">Enter your budget</h3>
              <p class="text-xs text-gray-500">Tell us the maximum you're willing to spend in total — including taxes.</p>
            </div>
            <div class="bg-white p-5 rounded-xl shadow-sm">
              <div class="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                <span class="font-bold text-primary">2</span>
              </div>
              <h3 class="font-semibold text-secondary text-sm mb-1">We work backwards</h3>
              <p class="text-xs text-gray-500">Using URA tax rates, we calculate the vehicle CIF range you can afford for different ages.</p>
            </div>
            <div class="bg-white p-5 rounded-xl shadow-sm">
              <div class="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                <span class="font-bold text-primary">3</span>
              </div>
              <h3 class="font-semibold text-secondary text-sm mb-1">Get vehicle suggestions</h3>
              <p class="text-xs text-gray-500">See real vehicles from URA's database that fit your budget — with CIF prices.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
