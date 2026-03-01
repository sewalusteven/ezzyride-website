<script setup lang="ts">
definePageMeta({
  layout: 'auth-layout',
})

const { login } = useAuth()

const form = ref({ email: '', password: '' })
const loading = ref(false)
const error = ref('')
const showPassword = ref(false)

const handleLogin = async () => {
  loading.value = true
  error.value = ''
  try {
    await login(form.value.email, form.value.password)
    await navigateTo('/backoffice')
  } catch (err: any) {
    error.value = err.response?.data?.message ?? 'Login failed. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <form class="space-y-6" @submit.prevent="handleLogin">
    <!-- Error Alert -->
    <div v-if="error" class="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
      <i class="fa-solid fa-circle-exclamation shrink-0"></i>
      <span>{{ error }}</span>
    </div>

    <!-- Email Field -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
      <div class="relative">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <i class="fa-solid fa-envelope text-gray-400"></i>
        </div>
        <input
          v-model="form.email"
          type="email"
          class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition duration-200"
          placeholder="admin@ezzydrive.com"
          required
          autocomplete="email"
        >
      </div>
    </div>

    <!-- Password Field -->
    <div>
      <div class="flex items-center justify-between mb-2">
        <label class="block text-sm font-medium text-gray-700">Password</label>
        <NuxtLink to="/auth/forgot-password" class="text-xs text-primary hover:underline">Forgot password?</NuxtLink>
      </div>
      <div class="relative">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <i class="fa-solid fa-lock text-gray-400"></i>
        </div>
        <input
          v-model="form.password"
          :type="showPassword ? 'text' : 'password'"
          class="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition duration-200"
          placeholder="Enter your password"
          required
          autocomplete="current-password"
        >
        <button
          type="button"
          class="absolute inset-y-0 right-0 pr-3 flex items-center"
          @click="showPassword = !showPassword"
        >
          <i :class="showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'" class="text-gray-400 hover:text-gray-600"></i>
        </button>
      </div>
    </div>

    <!-- Login Button -->
    <button
      type="submit"
      :disabled="loading"
      class="w-full bg-gradient-to-r from-primary to-secondary hover:from-red-700 hover:to-blue-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition duration-300 transform hover:scale-105"
    >
      <i v-if="loading" class="fa-solid fa-spinner fa-spin mr-2"></i>
      <i v-else class="fa-solid fa-sign-in-alt mr-2"></i>
      {{ loading ? 'Signing in...' : 'Sign In to Dashboard' }}
    </button>
  </form>
</template>
