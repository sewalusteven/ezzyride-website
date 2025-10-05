<script setup lang="ts">
import {computed, ref} from "vue";
import type {TaxCalculatorPayload, TaxCalculatorResponse, VehicleValuation} from "@/types";

import {Loading, Notify} from "notiflix";
import {useTaxUtilities} from "~/composables/taxUtilities";
import UraValuationSearch from "~/components/UraValuationSearch.vue";

const currFaq =  ref<number>(0)

function toggleFAQ(tab: number){
  currFaq.value = tab
}

const form = ref<TaxCalculatorPayload>({
  cif: 0,
  year: "",
  isLuxury: false,
  make: "",
  isEV: false
})

const mailingEmail = ref<string>("")

const taxObject =  ref<TaxCalculatorResponse|undefined>()

const { fetchTaxes, formatCurrency, addEmail } =  useTaxUtilities()

const yearDropDown = computed<number[]|string[]>(() => {
  const year = new Date().getFullYear()
  const years = []
  for (let i = year; (year - i) <= 15; i--) {
    years.push(i)
  }
  return years
})

function submit(){
  Loading.standard("Calculating taxes...")
  if(form.value.cif === 0 || form.value.year === ""){
    Loading.remove()
    Notify.failure("Please fill in all required fields")
    return
  }
  fetchTaxes(form.value).then(res => {
    taxObject.value = res
    Loading.remove()
    form.value = {
      cif: 0,
      year: "",
      isLuxury: false,
      make: "",
      isEV: false
    }
  }).catch(err => {
    Loading.remove()
    Notify.failure(err.response.data.message)
  })

}

function submitEmail(){
  Loading.standard("Sending email...")
  if(mailingEmail.value === ""){
    Loading.remove()
    Notify.failure("Please enter your email address")
    return
  }

  addEmail(mailingEmail.value).then(res => {
    Loading.remove()
    mailingEmail.value = ""
    Notify.success("Email sent successfully")
  }).catch(err => {
    Loading.remove()
    Notify.failure(err.response.data.message)
  })

}

const valuationSelection = ref("ura")

function prefillVehicle(vehicle:VehicleValuation){
  form.value.cif = +vehicle.cif
  form.value.year = vehicle.year
  form.value.make = vehicle.name
}

</script>

<template>
  <div>


    <!-- Tax Calculator Section -->
    <section id="tax-calculator-main" class="py-20 bg-white">
      <div class="container mx-auto px-4">
        <div class="text-center mb-12">
          <h2 class="text-4xl font-bold font-montserrat text-secondary mb-4">URA Tax Calculator</h2>
          <p class="text-xl text-gray-600 max-w-3xl mx-auto">Get precise estimates for import duties, taxes, and fees based on current Uganda Revenue Authority regulations. Our calculator considers all applicable charges for your specific vehicle.</p>
        </div>

        <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
          <!-- Calculator Form -->
          <div id="calculator-form" class="bg-light p-8 rounded-2xl shadow-lg">
            <h3 class="text-2xl font-semibold text-secondary mb-6 flex items-center">
              <i class="fa-solid fa-car text-primary mr-3"></i>
              Vehicle Information
            </h3>

            <form @submit.prevent="submit" class="space-y-6">
              <div class="bg-white p-6 rounded-lg border-2 border-gray-200">
                <label class="block text-gray-700 font-semibold mb-4">Choose Valuation Method *</label>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="relative">
                    <input type="radio" v-model="valuationSelection" id="ura-valuation" name="valuation-method" value="ura" class="peer sr-only">
                    <label for="ura-valuation" class="flex flex-col p-4 border-2 border-gray-300 rounded-lg cursor-pointer peer-checked:border-primary peer-checked:bg-primary/5 hover:border-primary/50 transition">
                      <div class="flex items-center justify-between mb-2">
                        <span class="font-medium text-secondary">URA Official Valuation</span>
                        <i class="fa-solid fa-check-circle text-primary opacity-0 peer-checked:opacity-100"></i>
                      </div>
                      <p class="text-sm text-gray-600">Use official URA vehicle valuations database</p>
                      <div class="mt-2 text-xs text-green-600 font-medium">
                        <i class="fa-solid fa-star mr-1"></i>Recommended - Most Accurate
                      </div>
                    </label>
                  </div>

                  <div class="relative">
                    <input type="radio" v-model="valuationSelection" id="custom-cif" name="valuation-method" value="custom" class="peer sr-only">
                    <label for="custom-cif" class="flex flex-col p-4 border-2 border-gray-300 rounded-lg cursor-pointer peer-checked:border-primary peer-checked:bg-primary/5 hover:border-primary/50 transition">
                      <div class="flex items-center justify-between mb-2">
                        <span class="font-medium text-secondary">Custom CIF Value</span>
                        <i class="fa-solid fa-check-circle text-primary opacity-0 peer-checked:opacity-100"></i>
                      </div>
                      <p class="text-sm text-gray-600">Enter your own CIF value manually</p>
                      <div class="mt-2 text-xs text-gray-600">
                        <i class="fa-solid fa-edit mr-1"></i>Manual Entry
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <UraValuationSearch v-if="valuationSelection === 'ura'" @vehicle-selected="prefillVehicle" />

              <div v-if="valuationSelection === 'custom'" id="custom-section" class=" space-y-6">
                <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div class="flex items-center mb-2">
                    <i class="fa-solid fa-edit text-blue-600 mr-2"></i>
                    <h4 class="font-medium text-blue-800">Custom CIF Entry</h4>
                  </div>
                  <p class="text-sm text-blue-700">Enter your vehicle details and CIF value manually for tax calculation.</p>
                </div>

                <div>
                  <label class="block text-gray-700 font-semibold mb-2">CIF Value (USD) <span class="text-red-600">*</span></label>
                  <input v-model="form.cif" type="number" id="cif-value" class="w-full bg-white p-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition" placeholder="e.g. 15000">
                  <p class="text-sm text-gray-500 mt-1">Cost, Insurance, and Freight value of the vehicle</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

                  <div>
                    <label class="block text-gray-700 font-semibold mb-2">Year of Manufacture <span class="text-red-600">*</span></label>
                    <select v-model="form.year" id="manufacture-year" class="w-full bg-white p-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition">
                      <option value="">Select year</option>
                      <option v-for="(y, i) in yearDropDown" :key="i" :value="y">{{ y }}</option>
                    </select>
                  </div>
                  <div>
                    <label class="gap-1 text-gray-700 font-semibold flex items-center mb-2">Vehicle Make & Model <span class="text-xs text-gray-500">(Optional)</span></label>
                    <input v-model="form.make" type="text" id="vehicle-model" class="w-full p-4 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition" placeholder="e.g. Mazda CX-5">

                  </div>

                </div>

              </div>



              <div class="bg-blue-50 p-4 rounded-lg">
                <div class="flex items-center mb-2">
                  <input v-model="form.isEV" :value="true" type="checkbox" id="first-time-import" class="mr-2 scale-125">
                  <label for="first-time-import" class="text-gray-700 font-medium">Is this an Electric Vehicle (EV) ?</label>
                </div>
                <div class="flex items-center mb-2">
                  <input v-model="form.isLuxury" :value="true" type="checkbox" id="first-time-import" class="mr-2 scale-125">
                  <label for="first-luxury" class="text-gray-700 font-medium">Is Vehicle categorized as luxury?</label>
                </div>
              </div>

              <button type="submit" id="calculate-btn" class="w-full cursor-pointer bg-primary hover:bg-red-700 text-white font-bold py-4 px-8 rounded-lg transition duration-300 text-lg">
                <i class="fa-solid fa-calculator mr-2"></i>Calculate Import Taxes
              </button>
            </form>
          </div>

          <!-- Results Panel -->
          <div id="results-panel" class="bg-secondary text-white p-8 rounded-2xl shadow-lg">
            <h3 class="text-2xl font-semibold mb-6 flex items-center">
              <i class="fa-solid fa-receipt text-primary mr-3"></i>
              Tax Breakdown
            </h3>

            <div id="calculation-results" class="space-y-6">
              <!-- Vehicle Summary -->
              <div class="bg-white/10 p-4 rounded-lg">
                <h4 class="font-semibold mb-2 text-primary">Vehicle Summary</h4>
                <div class="grid lg:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span class="text-gray-300">USD Rate:</span>
                    <span id="summary-type" class="ml-2 font-medium">{{ taxObject ? formatCurrency(taxObject.usdRate, 'UGX') : '-' }}</span>
                  </div>
                  <div>
                    <span class="text-gray-300">UGX CIF:</span>
                    <span id="summary-year" class="ml-2 font-medium">{{ taxObject ?  formatCurrency(taxObject.cifUGX,'UGX'): '-' }}</span>
                  </div>

                </div>
              </div>

              <!-- Tax Calculations -->
              <div class="space-y-4">
                <div class="flex flex-col lg:flex-row lg:justify-between lg:items-center pb-2 border-b border-white/20">
                                <span class="flex items-center">
                                    <i class="fa-solid fa-percent text-primary mr-2"></i>
                                    Import Duty (25%)
                                </span>
                  <span id="import-duty" class="font-bold text-lg">{{ taxObject ? formatCurrency(taxObject.importDuty, "UGX") : '--' }}</span>
                </div>

                <div class="flex flex-col lg:flex-row lg:justify-between lg:items-center  pb-2 border-b border-white/20">
                                <span class="flex items-center">
                                    <i class="fa-solid fa-receipt text-primary mr-2"></i>
                                    VAT (18%)
                                </span>
                  <span id="vat-amount" class="font-bold text-lg">{{ taxObject ? formatCurrency(taxObject.vat, "UGX") : '--' }}</span>
                </div>
                <div class="flex flex-col lg:flex-row lg:justify-between lg:items-center  pb-2 border-b border-white/20">
                                <span class="flex items-center">
                                    <i class="fa-solid fa-road text-primary mr-2"></i>
                                    Infrastructure Levy (1.5%)
                                </span>
                  <span id="infrastructure-levy" class="font-bold text-lg">{{ taxObject ? formatCurrency(taxObject.infrastructureTax, "UGX") : '--' }}</span>
                </div>
                <div class="flex flex-col lg:flex-row lg:justify-between lg:items-center  pb-2 border-b border-white/20">
                                <span class="flex items-center">
                                    <i class="fa-solid fa-leaf text-primary mr-2"></i>
                                    Environmental Levy
                                </span>
                  <span id="environmental-levy" class="font-bold text-lg">{{ taxObject ? formatCurrency(taxObject.envLevy, "UGX") : '--' }}</span>
                </div>
                <div class="flex flex-col lg:flex-row lg:justify-between lg:items-center  pb-2 border-b border-white/20">
                                <span class="flex items-center">
                                    <i class="fa-solid fa-file-alt text-primary mr-2"></i>
                                    Withholding
                                </span>
                  <span id="registration-fees" class="font-bold text-lg">{{ taxObject ? formatCurrency(taxObject.withholding, "UGX") : '--' }}</span>
                </div>
                <div class="flex flex-col lg:flex-row lg:justify-between lg:items-center  pb-2 border-b border-white/20">
                                <span class="flex items-center">
                                    <i class="fa-solid fa-coins text-primary mr-2"></i>
                                    Other Fees
                                </span>
                  <span id="excise-duty" class="font-bold text-lg">{{ taxObject ? formatCurrency(taxObject.stampDuty + taxObject.registrationFees + taxObject.formFees, "UGX") : '--' }}</span>
                </div>
                <div v-if="valuationSelection === 'custom'" class="flex flex-col lg:flex-row lg:justify-between lg:items-center  pb-2 border-b border-white/20">
                                <span class="flex items-center font-bold uppercase">
                                    <i class="fa-solid fa-money-bill text-primary mr-2"></i>
                                    Total Taxes
                                </span>
                  <span id="taxes" class="font-bold uppercase text-lg">{{ taxObject ? formatCurrency(taxObject.totalTax, "UGX") : '--' }}</span>
                </div>
              </div>

              <!-- Total -->
              <div v-if="valuationSelection === 'custom'" class="bg-primary/20 p-4 rounded-lg">
                <div class="flex flex-col lg:flex-row lg:justify-between lg:items-center  text-2xl font-bold">
                  <span>Est. Total Cost</span>
                  <span id="total-cost" class="text-primary">{{ taxObject ? formatCurrency(taxObject.totalCarValue, "UGX") : '--' }}</span>
                </div>
                <p class="text-sm text-gray-200 mt-2">Including all taxes, duties, and fees</p>
              </div>
              <div v-else class="bg-primary/20 p-4 rounded-lg">
                <div class="flex flex-col lg:flex-row lg:justify-between lg:items-center  text-2xl font-bold">
                  <span>Est. Total Taxes</span>
                  <span id="total-cost" class="text-primary">{{ taxObject ? formatCurrency(taxObject.totalTax, "UGX") : '--' }}</span>
                </div>
              </div>

              <!-- Disclaimer -->
              <div class="bg-yellow-400/20 p-4 rounded-lg border border-yellow-400/30">
                <div class="flex items-start">
                  <i class="fa-solid fa-exclamation-triangle text-yellow-400 mr-2 mt-1"></i>
                  <div>
                    <p class="text-sm font-medium text-yellow-100 mb-1">Important Disclaimer</p>
                    <p class="text-xs text-gray-200">
                      This is an estimate based on current URA rates. Actual costs may vary due to vehicle inspection, currency fluctuations, or policy changes. Contact us for a detailed professional assessment.
                    </p>
                  </div>
                </div>
              </div>

              <!-- Action Buttons -->

            </div>
          </div>
        </div>
      </div>
    </section>




    <!-- Coming Soon Services Section -->
    <section id="coming-soon" class="py-20 bg-gradient-to-r from-secondary to-accent text-white">
      <div class="container mx-auto px-4">
        <div class="text-center mb-16">
          <h2 class="text-4xl font-bold font-montserrat mb-4">More Services Coming Soon</h2>
          <p class="text-xl max-w-3xl mx-auto">We're expanding our platform to offer you a complete vehicle import and purchase solution.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <!-- Vehicle Sales -->
          <div id="service-preview-1" class="text-center">
            <div class="bg-white/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <i class="fa-solid fa-car text-3xl"></i>
            </div>
            <h3 class="text-xl font-semibold mb-2">Vehicle Sales</h3>
            <p class="text-gray-200 text-sm mb-4">Browse and purchase from our curated selection of premium Japanese imports.</p>
            <div class="bg-yellow-400 text-black px-3 py-1 rounded-full text-xs font-medium inline-block">
              Coming Soon
            </div>
          </div>

          <!-- Import Assistance -->
          <div id="service-preview-2" class="text-center">
            <div class="bg-white/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <i class="fa-solid fa-ship text-3xl"></i>
            </div>
            <h3 class="text-xl font-semibold mb-2">Import Assistance</h3>
            <p class="text-gray-200 text-sm mb-4">Full-service vehicle import from Japan to Uganda with complete documentation.</p>
            <div class="bg-yellow-400 text-black px-3 py-1 rounded-full text-xs font-medium inline-block">
              Coming Soon
            </div>
          </div>

          <!-- Vehicle Valuations -->
          <div id="service-preview-3" class="text-center">
            <div class="bg-white/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <i class="fa-solid fa-chart-line text-3xl"></i>
            </div>
            <h3 class="text-xl font-semibold mb-2">Vehicle Valuations</h3>
            <p class="text-gray-200 text-sm mb-4">Real-time market valuations and price tracking for informed decision making.</p>
            <div class="bg-yellow-400 text-black px-3 py-1 rounded-full text-xs font-medium inline-block">
              Coming Soon
            </div>
          </div>

          <!-- Mobile App -->
          <div id="service-preview-4" class="text-center">
            <div class="bg-white/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <i class="fa-solid fa-mobile-alt text-3xl"></i>
            </div>
            <h3 class="text-xl font-semibold mb-2">Mobile App</h3>
            <p class="text-gray-200 text-sm mb-4">Calculate taxes, browse vehicles, and track imports on the go with our mobile app.</p>
            <div class="bg-yellow-400 text-black px-3 py-1 rounded-full text-xs font-medium inline-block">
              Coming Soon
            </div>
          </div>
        </div>

        <div class="text-center mt-12">
          <p class="text-lg mb-6">Be the first to know when these services launch!</p>
          <form @submit.prevent="submitEmail" class="max-w-md mx-auto flex">
            <input type="email" v-model="mailingEmail" placeholder="Enter your email address" class="flex-1 bg-white px-4 py-3 rounded-l-lg text-gray-800 focus:outline-none">
            <button type="submit" class="bg-primary hover:bg-red-700 px-6 py-3 rounded-r-lg font-medium transition">
              Notify Me
            </button>
          </form>
        </div>
      </div>
    </section>

    <!-- FAQ Section -->
    <section id="faq" class="py-20 bg-white">
      <div class="container mx-auto px-4">
        <div class="text-center mb-16">
          <h2 class="text-4xl font-bold font-montserrat text-secondary mb-4">Frequently Asked Questions</h2>
          <p class="text-xl text-gray-600 max-w-3xl mx-auto">Get answers to common questions about vehicle import taxes and our calculator.</p>
        </div>

        <div class="max-w-4xl mx-auto">
          <div class="space-y-6">
            <!-- FAQ Item 1 -->
            <div id="faq-1" class="bg-light p-6 rounded-lg">
              <div class="flex justify-between items-start cursor-pointer" @click="toggleFAQ(1)">
                <h3 class="text-lg font-semibold text-secondary pr-4">How accurate is the tax calculator?</h3>
                <i id="faq-icon-1" class="fa-solid fa-chevron-down text-primary mt-1"></i>
              </div>
              <div v-if="currFaq === 1" id="faq-content-1" class=" mt-4 text-gray-600">
                <p>Our calculator is approximately 95% accurate based on current URA regulations. It uses the latest tax rates and exchange rates updated daily. However, final costs may vary due to vehicle inspection results, currency fluctuations, or policy changes. We recommend using our estimates for budgeting purposes and consulting with our team for final calculations.</p>
              </div>
            </div>

            <!-- FAQ Item 2 -->
            <div id="faq-2" class="bg-light p-6 rounded-lg">
              <div class="flex justify-between items-start cursor-pointer" @click="toggleFAQ(2)">
                <h3 class="text-lg font-semibold text-secondary pr-4">What is CIF value and how do I calculate it?</h3>
                <i id="faq-icon-2" class="fa-solid fa-chevron-down text-primary mt-1"></i>
              </div>
              <div v-if="currFaq === 2" id="faq-content-2" class=" mt-4 text-gray-600">
                <p>CIF stands for Cost, Insurance, and Freight. It includes the purchase price of the vehicle, insurance costs, and shipping costs to Uganda. For auction vehicles from Japan, this typically includes the auction price, auction fees, inland transport in Japan, shipping costs, and marine insurance. If you're unsure about the CIF value, we can help you calculate it based on your specific vehicle and shipping arrangements.</p>
              </div>
            </div>

            <!-- FAQ Item 3 -->
            <div id="faq-3" class="bg-light p-6 rounded-lg">
              <div class="flex justify-between items-start cursor-pointer" @click="toggleFAQ(3)">
                <h3 class="text-lg font-semibold text-secondary pr-4">Are there any tax benefits for hybrid or electric vehicles?</h3>
                <i id="faq-icon-3" class="fa-solid fa-chevron-down text-primary mt-1"></i>
              </div>
              <div v-if="currFaq === 3" id="faq-content-3" class=" mt-4 text-gray-600">
                <p>Yes! Uganda offers tax incentives for environmentally friendly vehicles. Hybrid vehicles typically enjoy reduced excise duty rates (often 10-15% lower than conventional vehicles). Electric vehicles have even greater incentives with significantly reduced import duties. Our calculator automatically applies these benefits when you select the appropriate fuel type. The exact savings depend on the vehicle's specifications and current government policies.</p>
              </div>
            </div>

            <!-- FAQ Item 4 -->
            <div id="faq-4" class="bg-light p-6 rounded-lg">
              <div class="flex justify-between items-start cursor-pointer" @click="toggleFAQ(4)">
                <h3 class="text-lg font-semibold text-secondary pr-4">How often are the tax rates updated?</h3>
                <i id="faq-icon-4" class="fa-solid fa-chevron-down text-primary mt-1"></i>
              </div>
              <div v-if="currFaq === 4" id="faq-content-4" class=" mt-4 text-gray-600">
                <p>We update our tax rates immediately when URA announces changes, typically during budget announcements or policy updates. Exchange rates are updated daily from the Bank of Uganda. Environmental levies and registration fees are reviewed quarterly. We recommend checking back periodically or subscribing to our updates to stay informed about any changes that might affect your import costs.</p>
              </div>
            </div>

            <!-- FAQ Item 5 -->
            <div id="faq-5" class="bg-light p-6 rounded-lg">
              <div class="flex justify-between items-start cursor-pointer" @click="toggleFAQ(5)">
                <h3 class="text-lg font-semibold text-secondary pr-4">What additional costs should I consider beyond taxes?</h3>
                <i id="faq-icon-5" class="fa-solid fa-chevron-down text-primary mt-1"></i>
              </div>
              <div v-if="currFaq === 5" id="faq-content-5" class=" mt-4 text-gray-600">
                <p>Beyond the taxes calculated by our tool, consider these additional costs: customs agent fees (UGX 500,000-1,500,000), port storage fees (if delayed), vehicle inspection costs, number plate fees, insurance, transport from port to your location, and any necessary repairs or modifications. We can provide a comprehensive cost breakdown including these additional expenses when you contact us for detailed consultation.</p>
              </div>
            </div>

            <!-- FAQ Item 6 -->
            <div id="faq-6" class="bg-light p-6 rounded-lg">
              <div class="flex justify-between items-start cursor-pointer" @click="toggleFAQ(6)">
                <h3 class="text-lg font-semibold text-secondary pr-4">Can I save money by importing an older vehicle?</h3>
                <i id="faq-icon-6" class="fa-solid fa-chevron-down text-primary mt-1"></i>
              </div>
              <div v-if="currFaq === 6" id="faq-content-6" class=" mt-4 text-gray-600">
                <p>Not necessarily. While older vehicles have lower CIF values, Uganda has restrictions on vehicle age (typically 15 years maximum for most vehicles). Additionally, excise duty rates can be higher for older vehicles in certain categories. The environmental levy is also higher for older, more polluting vehicles. Our calculator factors in these age-related variations to give you an accurate comparison across different vehicle years.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

  </div>
</template>

<style scoped>

</style>