<script setup lang="ts">
useSeoMeta({
  title: 'Unsubscribe | EzzyRide Uganda',
  robots: 'noindex',
})

const route    = useRoute()
const { $api } = useNuxtApp()

const token      = computed(() => route.query.token as string)
const email      = ref('')
const reason     = ref('')
const checking   = ref(true)
const submitting = ref(false)
const done       = ref(false)
const tokenError = ref('')
const submitError= ref('')

onMounted(async () => {
  if (!token.value) {
    tokenError.value = 'No unsubscribe token found. Please use the link from your email.'
    checking.value   = false
    return
  }
  try {
    const { data } = await $api.get('/web/mailing-list/unsubscribe', { params: { token: token.value } })
    email.value = data.data.email
  } catch (err: any) {
    tokenError.value = err.response?.data?.message ?? 'This unsubscribe link is invalid or has already been used.'
  } finally {
    checking.value = false
  }
})

const submit = async () => {
  submitting.value  = true
  submitError.value = ''
  try {
    await $api.post('/web/mailing-list/unsubscribe', {
      token:  token.value,
      reason: reason.value.trim() || null,
    })
    done.value = true
  } catch (err: any) {
    submitError.value = err.response?.data?.message ?? 'Something went wrong. Please try again.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <!-- Simple header -->
    <header class="bg-white border-b border-gray-100 px-6 py-4">
      <NuxtLink to="/" class="flex items-center w-fit">
        <span class="text-primary font-bold text-2xl font-montserrat">Ezzy</span>
        <span class="text-secondary font-semibold text-lg ml-1 font-montserrat">Ride</span>
      </NuxtLink>
    </header>

    <!-- Content -->
    <div class="flex-1 flex items-center justify-center p-6">
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-md p-8">

        <!-- Checking -->
        <div v-if="checking" class="text-center py-6">
          <i class="fa-solid fa-spinner fa-spin text-primary text-3xl"></i>
          <p class="text-sm text-gray-400 mt-3">Verifying your link…</p>
        </div>

        <!-- Invalid token -->
        <div v-else-if="tokenError" class="text-center space-y-4">
          <div class="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
            <i class="fa-solid fa-link-slash text-red-400 text-2xl"></i>
          </div>
          <h1 class="text-lg font-bold font-montserrat text-gray-900">Link Invalid</h1>
          <p class="text-sm text-gray-500">{{ tokenError }}</p>
          <NuxtLink to="/" class="inline-block text-sm text-primary hover:underline">Back to homepage</NuxtLink>
        </div>

        <!-- Success -->
        <div v-else-if="done" class="text-center space-y-4">
          <div class="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
            <i class="fa-solid fa-check text-green-500 text-2xl"></i>
          </div>
          <h1 class="text-lg font-bold font-montserrat text-gray-900">You're unsubscribed</h1>
          <p class="text-sm text-gray-500">
            <span class="font-medium text-gray-700">{{ email }}</span> has been removed from our mailing list.
            You won't receive any more emails from EzzyRide Uganda.
          </p>
          <p class="text-xs text-gray-400">Changed your mind? You can always re-subscribe on our website.</p>
          <NuxtLink to="/" class="inline-block text-sm text-primary hover:underline">Back to homepage</NuxtLink>
        </div>

        <!-- Unsubscribe form -->
        <div v-else class="space-y-6">
          <div class="text-center">
            <div class="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i class="fa-solid fa-envelope-open text-gray-400 text-xl"></i>
            </div>
            <h1 class="text-lg font-bold font-montserrat text-gray-900">Unsubscribe</h1>
            <p class="text-sm text-gray-500 mt-1">
              You're about to unsubscribe <span class="font-medium text-gray-700">{{ email }}</span> from EzzyRide Uganda updates.
            </p>
          </div>

          <div v-if="submitError" class="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <i class="fa-solid fa-circle-exclamation shrink-0"></i>
            <span>{{ submitError }}</span>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Reason for unsubscribing <span class="font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              v-model="reason"
              rows="3"
              placeholder="e.g. Too many emails, not relevant to me…"
              class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            ></textarea>
            <p class="text-xs text-gray-400 mt-1">Your feedback helps us improve. Completely optional.</p>
          </div>

          <div class="flex gap-3">
            <NuxtLink to="/"
              class="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium py-2.5 rounded-xl transition-colors text-sm text-center">
              Cancel
            </NuxtLink>
            <button
              @click="submit"
              :disabled="submitting"
              class="flex-1 bg-secondary hover:bg-blue-900 disabled:opacity-60 text-white font-medium py-2.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
            >
              <i v-if="submitting" class="fa-solid fa-spinner fa-spin text-xs"></i>
              {{ submitting ? 'Unsubscribing…' : 'Confirm Unsubscribe' }}
            </button>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>
