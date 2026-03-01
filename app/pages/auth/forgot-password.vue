<script setup lang="ts">
definePageMeta({ layout: 'auth-layout' })

const { $api } = useNuxtApp()
const email   = ref('')
const loading = ref(false)
const sent    = ref(false)
const error   = ref('')

const submit = async () => {
  loading.value = true
  error.value   = ''
  try {
    await $api.post('/web/auth/forgot-password', { email: email.value })
    sent.value = true
  } catch (err: any) {
    error.value = err.response?.data?.message ?? 'Something went wrong. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Success state -->
    <div v-if="sent" class="text-center space-y-4">
      <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <i class="fa-solid fa-envelope-circle-check text-green-600 text-2xl"></i>
      </div>
      <h3 class="font-semibold text-gray-800">Check your inbox</h3>
      <p class="text-sm text-gray-500">
        If <span class="font-medium text-gray-700">{{ email }}</span> is registered, we've sent a password reset link. Check your spam folder if you don't see it.
      </p>
      <NuxtLink to="/auth" class="inline-block text-sm text-primary hover:underline">
        Back to sign in
      </NuxtLink>
    </div>

    <!-- Form state -->
    <form v-else @submit.prevent="submit" class="space-y-5">
      <div class="text-center">
        <h3 class="font-semibold text-gray-800 mb-1">Forgot your password?</h3>
        <p class="text-sm text-gray-500">Enter your email and we'll send you a reset link.</p>
      </div>

      <div v-if="error" class="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
        <i class="fa-solid fa-circle-exclamation shrink-0"></i>
        <span>{{ error }}</span>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <i class="fa-solid fa-envelope text-gray-400"></i>
          </div>
          <input
            v-model="email"
            type="email"
            class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition duration-200"
            placeholder="your@email.com"
            required
            autocomplete="email"
          />
        </div>
      </div>

      <button
        type="submit"
        :disabled="loading"
        class="w-full bg-gradient-to-r from-primary to-secondary hover:from-red-700 hover:to-blue-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition duration-300"
      >
        <i v-if="loading" class="fa-solid fa-spinner fa-spin mr-2"></i>
        {{ loading ? 'Sending...' : 'Send Reset Link' }}
      </button>

      <div class="text-center">
        <NuxtLink to="/auth" class="text-sm text-primary hover:underline">Back to sign in</NuxtLink>
      </div>
    </form>
  </div>
</template>
