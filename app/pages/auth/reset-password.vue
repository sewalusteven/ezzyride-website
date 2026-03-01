<script setup lang="ts">
definePageMeta({ layout: 'auth-layout' })

const route   = useRoute()
const { $api } = useNuxtApp()

const form    = ref({ password: '', password_confirmation: '' })
const loading = ref(false)
const done    = ref(false)
const error   = ref('')
const showPwd = ref(false)

const token = computed(() => route.query.token as string)
const email = computed(() => route.query.email as string)

const submit = async () => {
  loading.value = true
  error.value   = ''
  try {
    await $api.post('/web/auth/reset-password', {
      token:                 token.value,
      email:                 email.value,
      password:              form.value.password,
      password_confirmation: form.value.password_confirmation,
    })
    done.value = true
  } catch (err: any) {
    const data = err.response?.data
    error.value = data?.errors
      ? Object.values(data.errors).flat().join(' ')
      : (data?.message ?? 'Something went wrong.')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Success -->
    <div v-if="done" class="text-center space-y-4">
      <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <i class="fa-solid fa-check text-green-600 text-2xl"></i>
      </div>
      <h3 class="font-semibold text-gray-800">Password reset!</h3>
      <p class="text-sm text-gray-500">Your password has been updated. You can now sign in.</p>
      <NuxtLink to="/auth" class="inline-block bg-primary text-white text-sm font-medium py-2 px-6 rounded-lg hover:bg-red-700 transition">
        Sign In
      </NuxtLink>
    </div>

    <!-- Form -->
    <form v-else @submit.prevent="submit" class="space-y-5">
      <div class="text-center">
        <h3 class="font-semibold text-gray-800 mb-1">Set a new password</h3>
        <p class="text-sm text-gray-500">Choose a strong password with uppercase, lowercase, numbers and symbols.</p>
      </div>

      <div v-if="!token || !email" class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
        <i class="fa-solid fa-circle-exclamation mr-1"></i>
        Invalid reset link. Please request a new one.
      </div>

      <div v-if="error" class="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
        <i class="fa-solid fa-circle-exclamation shrink-0"></i>
        <span>{{ error }}</span>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">New Password</label>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <i class="fa-solid fa-lock text-gray-400"></i>
          </div>
          <input
            v-model="form.password"
            :type="showPwd ? 'text' : 'password'"
            class="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition duration-200"
            placeholder="Min 8 chars, upper, lower, number, symbol"
            required
            autocomplete="new-password"
          />
          <button type="button" class="absolute inset-y-0 right-0 pr-3 flex items-center" @click="showPwd = !showPwd">
            <i :class="showPwd ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'" class="text-gray-400 hover:text-gray-600"></i>
          </button>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <i class="fa-solid fa-lock text-gray-400"></i>
          </div>
          <input
            v-model="form.password_confirmation"
            :type="showPwd ? 'text' : 'password'"
            class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition duration-200"
            placeholder="Repeat your new password"
            required
            autocomplete="new-password"
          />
        </div>
      </div>

      <button
        type="submit"
        :disabled="loading || !token || !email"
        class="w-full bg-gradient-to-r from-primary to-secondary hover:from-red-700 hover:to-blue-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition duration-300"
      >
        <i v-if="loading" class="fa-solid fa-spinner fa-spin mr-2"></i>
        {{ loading ? 'Saving...' : 'Set New Password' }}
      </button>
    </form>
  </div>
</template>
