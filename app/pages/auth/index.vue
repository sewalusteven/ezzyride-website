<script setup lang="ts">
definePageMeta({
  layout: 'auth-layout',
})

const { login } = useAuth()

const form = ref({ email: '', password: '' })
const otp = ref('')
const loading = ref(false)
const error = ref('')
const showPassword = ref(false)
const twoFactorStep = ref(false)

const handleLogin = async () => {
  loading.value = true
  error.value = ''
  try {
    const result = await login(
      form.value.email,
      form.value.password,
      twoFactorStep.value ? otp.value : undefined,
    )
    if (result?.twoFactorRequired) {
      twoFactorStep.value = true
      return
    }
    await navigateTo('/backoffice')
  } catch (err: any) {
    error.value = err.response?.data?.message ?? 'Login failed. Please try again.'
  } finally {
    loading.value = false
  }
}

const backToLogin = () => {
  twoFactorStep.value = false
  otp.value = ''
  error.value = ''
}
</script>

<template>
  <form class="space-y-6" @submit.prevent="handleLogin">
    <!-- Error Alert -->
    <div v-if="error" class="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
      <i class="fa-solid fa-circle-exclamation shrink-0"></i>
      <span>{{ error }}</span>
    </div>

    <!-- 2FA OTP Step -->
    <template v-if="twoFactorStep">
      <div class="text-center mb-2">
        <div class="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <i class="fa-solid fa-shield-halved text-blue-600 text-xl"></i>
        </div>
        <h3 class="font-semibold text-gray-900">Two-Factor Authentication</h3>
        <p class="text-sm text-gray-500 mt-1">Enter the 6-digit code from your authenticator app</p>
      </div>

      <div>
        <input
          v-model="otp"
          type="text"
          inputmode="numeric"
          maxlength="6"
          pattern="[0-9]*"
          class="w-full text-center text-2xl tracking-[0.5em] font-mono py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          placeholder="000000"
          required
          autofocus
        >
      </div>

      <button
        type="submit"
        :disabled="loading || otp.length !== 6"
        class="w-full bg-gradient-to-r from-primary to-secondary hover:from-red-700 hover:to-blue-800 disabled:opacity-60 text-white font-medium py-3 px-4 rounded-lg transition duration-300"
      >
        <i v-if="loading" class="fa-solid fa-spinner fa-spin mr-2"></i>
        <i v-else class="fa-solid fa-check mr-2"></i>
        {{ loading ? 'Verifying...' : 'Verify & Sign In' }}
      </button>

      <button type="button" @click="backToLogin" class="w-full text-sm text-gray-500 hover:text-gray-700 py-2">
        <i class="fa-solid fa-arrow-left mr-1"></i> Back to login
      </button>
    </template>

    <!-- Normal Login Step -->
    <template v-else>
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
    </template>
  </form>
</template>
