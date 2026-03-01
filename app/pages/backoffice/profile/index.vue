<script setup lang="ts">
definePageMeta({ layout: 'admin-layout' })

const { user, refreshUser } = useAuth()
const { $api } = useNuxtApp()

// Profile form
const profileForm    = ref({ name: user.value?.name ?? '', phone: user.value?.phone ?? '' })
const savingProfile  = ref(false)
const profileSuccess = ref('')
const profileError   = ref('')

// Password form
const pwdForm     = ref({ current_password: '', password: '', password_confirmation: '' })
const savingPwd   = ref(false)
const pwdSuccess  = ref('')
const pwdError    = ref('')
const showPwd     = ref(false)

const saveProfile = async () => {
  savingProfile.value  = true
  profileSuccess.value = ''
  profileError.value   = ''
  try {
    await $api.put('/v1/auth/profile', profileForm.value)
    await refreshUser()
    profileSuccess.value = 'Profile updated successfully.'
  } catch (err: any) {
    const data = err.response?.data
    profileError.value = data?.errors
      ? Object.values(data.errors).flat().join(' ')
      : (data?.message ?? 'Failed to update profile.')
  } finally {
    savingProfile.value = false
  }
}

const changePassword = async () => {
  savingPwd.value = true
  pwdSuccess.value = ''
  pwdError.value   = ''
  try {
    await $api.put('/v1/auth/change-password', pwdForm.value)
    pwdSuccess.value = 'Password changed successfully.'
    pwdForm.value = { current_password: '', password: '', password_confirmation: '' }
  } catch (err: any) {
    const data = err.response?.data
    pwdError.value = data?.errors
      ? Object.values(data.errors).flat().join(' ')
      : (data?.message ?? 'Failed to change password.')
  } finally {
    savingPwd.value = false
  }
}
</script>

<template>
  <div class="p-6 w-full mx-auto space-y-6">

    <!-- Profile Info Card -->
    <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
        <div class="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-lg font-bold">
          {{ user?.name?.charAt(0).toUpperCase() ?? 'A' }}
        </div>
        <div>
          <h2 class="font-semibold text-gray-900">{{ user?.name }}</h2>
          <p class="text-xs text-gray-400 capitalize">{{ user?.role ?? 'User' }}</p>
        </div>
      </div>

      <form @submit.prevent="saveProfile" class="px-6 py-5 space-y-4">
        <div v-if="profileSuccess" class="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          <i class="fa-solid fa-check-circle"></i> {{ profileSuccess }}
        </div>
        <div v-if="profileError" class="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <i class="fa-solid fa-circle-exclamation"></i> {{ profileError }}
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
            <input v-model="profileForm.name" type="text" required
              class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
            <input v-model="profileForm.phone" type="text"
              class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="+256 700 000000" />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
          <input :value="user?.email" type="email" disabled
            class="w-full border border-gray-100 bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-400 cursor-not-allowed" />
          <p class="text-xs text-gray-400 mt-1">Email cannot be changed. Contact a super-admin if needed.</p>
        </div>

        <div class="flex justify-end pt-2">
          <button type="submit" :disabled="savingProfile"
            class="bg-primary hover:bg-red-700 disabled:opacity-60 text-white text-sm font-medium py-2 px-5 rounded-lg transition-colors flex items-center gap-2">
            <i v-if="savingProfile" class="fa-solid fa-spinner fa-spin"></i>
            {{ savingProfile ? 'Saving…' : 'Save Changes' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Change Password Card -->
    <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-100">
        <h2 class="font-semibold text-gray-900">Change Password</h2>
        <p class="text-xs text-gray-400 mt-0.5">Use a strong password with uppercase, lowercase, numbers and symbols.</p>
      </div>

      <form @submit.prevent="changePassword" class="px-6 py-5 space-y-4">
        <div v-if="pwdSuccess" class="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          <i class="fa-solid fa-check-circle"></i> {{ pwdSuccess }}
        </div>
        <div v-if="pwdError" class="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <i class="fa-solid fa-circle-exclamation"></i> {{ pwdError }}
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
          <div class="relative">
            <input v-model="pwdForm.current_password" :type="showPwd ? 'text' : 'password'" required
              class="w-full border border-gray-200 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              autocomplete="current-password" />
            <button type="button" class="absolute inset-y-0 right-0 pr-3 flex items-center" @click="showPwd = !showPwd">
              <i :class="showPwd ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'" class="text-gray-400 hover:text-gray-600 text-sm"></i>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
            <input v-model="pwdForm.password" :type="showPwd ? 'text' : 'password'" required
              class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              autocomplete="new-password" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
            <input v-model="pwdForm.password_confirmation" :type="showPwd ? 'text' : 'password'" required
              class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              autocomplete="new-password" />
          </div>
        </div>

        <div class="flex justify-end pt-2">
          <button type="submit" :disabled="savingPwd"
            class="bg-secondary hover:bg-blue-900 disabled:opacity-60 text-white text-sm font-medium py-2 px-5 rounded-lg transition-colors flex items-center gap-2">
            <i v-if="savingPwd" class="fa-solid fa-spinner fa-spin"></i>
            {{ savingPwd ? 'Updating…' : 'Update Password' }}
          </button>
        </div>
      </form>
    </div>

  </div>
</template>
