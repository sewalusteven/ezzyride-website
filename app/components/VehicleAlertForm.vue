<script setup lang="ts">
import { Notify } from 'notiflix'

const { $api } = useNuxtApp()

const props = defineProps<{
  prefillBrand?: string
  prefillModel?: string
  prefillPriceMax?: number
  prefillYearMin?: number
  compact?: boolean
}>()

const form = ref({
  email: '',
  phone: '',
  brand: props.prefillBrand || '',
  model: props.prefillModel || '',
  price_max: props.prefillPriceMax ? String(props.prefillPriceMax) : '',
  year_min: props.prefillYearMin ? String(props.prefillYearMin) : '',
  fuel_type: '',
})

const submitting = ref(false)
const submitted = ref(false)

const submit = async () => {
  if (!form.value.email) {
    Notify.failure('Please enter your email address.')
    return
  }
  submitting.value = true
  try {
    const payload: Record<string, any> = { email: form.value.email }
    if (form.value.phone) payload.phone = form.value.phone
    if (form.value.brand) payload.brand = form.value.brand
    if (form.value.model) payload.model = form.value.model
    if (form.value.price_max) payload.price_max = Number(form.value.price_max)
    if (form.value.year_min) payload.year_min = Number(form.value.year_min)
    if (form.value.fuel_type) payload.fuel_type = form.value.fuel_type

    await $api.post('/web/vehicle-alerts', payload)
    submitted.value = true
  } catch {
    Notify.failure('Failed to save alert. Please try again.')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="bg-gradient-to-br from-secondary to-blue-900 rounded-xl p-5 text-white">
    <!-- Success -->
    <div v-if="submitted" class="text-center py-4">
      <div class="w-12 h-12 bg-green-400/20 rounded-full flex items-center justify-center mx-auto mb-3">
        <i class="fa-solid fa-bell text-green-300 text-xl"></i>
      </div>
      <p class="font-semibold mb-1">Alert Set!</p>
      <p class="text-sm text-gray-300">We'll email you when vehicles matching your preferences arrive.</p>
    </div>

    <!-- Form -->
    <template v-else>
      <div class="flex items-center gap-2 mb-3">
        <i class="fa-solid fa-bell text-primary"></i>
        <h4 class="font-semibold text-sm">{{ compact ? 'Get Notified' : 'Notify Me When Vehicles Arrive' }}</h4>
      </div>
      <p v-if="!compact" class="text-xs text-gray-300 mb-4">
        Don't see what you're looking for? Set an alert and we'll email you when matching vehicles are listed.
      </p>

      <form @submit.prevent="submit" :class="compact ? 'space-y-2' : 'space-y-3'">
        <input v-model="form.email" type="email" required placeholder="Your email *"
          class="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50" />

        <PhoneInput v-if="!compact" v-model="form.phone" placeholder="Phone (optional)" />

        <div v-if="!compact" class="grid grid-cols-2 gap-2">
          <input v-model="form.brand" type="text" placeholder="Preferred brand"
            class="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50" />
          <input v-model="form.model" type="text" placeholder="Preferred model"
            class="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>

        <div v-if="!compact" class="grid grid-cols-2 gap-2">
          <input v-model="form.price_max" type="number" min="0" placeholder="Max budget (UGX)"
            class="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50" />
          <select v-model="form.fuel_type"
            class="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50">
            <option value="">Any fuel type</option>
            <option value="petrol">Petrol</option>
            <option value="diesel">Diesel</option>
            <option value="hybrid">Hybrid</option>
            <option value="electric">Electric</option>
          </select>
        </div>

        <button type="submit" :disabled="submitting"
          class="w-full bg-primary hover:bg-red-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
          <i v-if="submitting" class="fa-solid fa-spinner fa-spin"></i>
          <i v-else class="fa-solid fa-bell"></i>
          {{ submitting ? 'Saving…' : 'Set Alert' }}
        </button>
      </form>
    </template>
  </div>
</template>
