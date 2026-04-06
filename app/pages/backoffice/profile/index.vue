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

// 2FA state
const twoFaEnabled    = ref(false)
const twoFaSetup      = ref<{ secret: string; qr_url: string } | null>(null)
const twoFaOtp        = ref('')
const twoFaLoading    = ref(false)
const twoFaMsg        = ref('')
const twoFaErr        = ref('')
const disablePassword = ref('')
const showDisable2FA  = ref(false)

const check2FAStatus = () => {
  twoFaEnabled.value = !!(user.value as any)?.twoFactorEnabled
}
onMounted(check2FAStatus)
watch(user, check2FAStatus)

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

// 2FA methods
const startEnable2FA = async () => {
  twoFaLoading.value = true
  twoFaErr.value = ''
  twoFaMsg.value = ''
  twoFaSetup.value = null
  try {
    const { data } = await $api.post('/v1/auth/2fa/enable')
    twoFaSetup.value = data.data
  } catch (err: any) {
    twoFaErr.value = err.response?.data?.message ?? 'Failed to start 2FA setup.'
  } finally {
    twoFaLoading.value = false
  }
}

const confirm2FA = async () => {
  twoFaLoading.value = true
  twoFaErr.value = ''
  try {
    await $api.post('/v1/auth/2fa/confirm', { otp: twoFaOtp.value })
    twoFaEnabled.value = true
    twoFaSetup.value = null
    twoFaOtp.value = ''
    twoFaMsg.value = 'Two-factor authentication enabled successfully.'
    await refreshUser()
  } catch (err: any) {
    twoFaErr.value = err.response?.data?.message ?? 'Invalid code.'
  } finally {
    twoFaLoading.value = false
  }
}

const disable2FA = async () => {
  twoFaLoading.value = true
  twoFaErr.value = ''
  try {
    await $api.post('/v1/auth/2fa/disable', { password: disablePassword.value })
    twoFaEnabled.value = false
    showDisable2FA.value = false
    disablePassword.value = ''
    twoFaMsg.value = 'Two-factor authentication disabled.'
    await refreshUser()
  } catch (err: any) {
    twoFaErr.value = err.response?.data?.message ?? 'Failed to disable 2FA.'
  } finally {
    twoFaLoading.value = false
  }
}

const cancelSetup = () => {
  twoFaSetup.value = null
  twoFaOtp.value = ''
  twoFaErr.value = ''
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

    <!-- Two-Factor Authentication Card -->
    <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 class="font-semibold text-gray-900">Two-Factor Authentication</h2>
          <p class="text-xs text-gray-400 mt-0.5">Add an extra layer of security using a TOTP authenticator app.</p>
        </div>
        <span v-if="twoFaEnabled" class="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
          <i class="fa-solid fa-check-circle"></i> Enabled
        </span>
        <span v-else class="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">
          <i class="fa-solid fa-xmark-circle"></i> Disabled
        </span>
      </div>

      <div class="px-6 py-5 space-y-4">
        <div v-if="twoFaMsg" class="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          <i class="fa-solid fa-check-circle"></i> {{ twoFaMsg }}
        </div>
        <div v-if="twoFaErr" class="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <i class="fa-solid fa-circle-exclamation"></i> {{ twoFaErr }}
        </div>

        <!-- Not enabled — show enable button or setup flow -->
        <template v-if="!twoFaEnabled">
          <!-- Setup flow -->
          <template v-if="twoFaSetup">
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p class="text-sm text-blue-800 mb-3">
                <i class="fa-solid fa-info-circle mr-1"></i>
                Scan this QR code with your authenticator app (Google Authenticator, Authy, 1Password, etc.)
              </p>

              <!-- QR Code -->
              <div class="flex justify-center mb-3">
                <img
                  :src="`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(twoFaSetup.qr_url)}`"
                  alt="2FA QR Code"
                  class="w-48 h-48 rounded-lg border border-gray-200"
                />
              </div>

              <p class="text-xs text-gray-500 text-center mb-3">
                Or enter this key manually: <code class="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono select-all">{{ twoFaSetup.secret }}</code>
              </p>
            </div>

            <form @submit.prevent="confirm2FA" class="space-y-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Enter the 6-digit code from your app</label>
                <input
                  v-model="twoFaOtp"
                  type="text"
                  inputmode="numeric"
                  maxlength="6"
                  pattern="[0-9]*"
                  required
                  placeholder="000000"
                  class="w-full text-center text-xl tracking-[0.3em] font-mono border border-gray-200 rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div class="flex gap-2">
                <button
                  type="submit"
                  :disabled="twoFaLoading || twoFaOtp.length !== 6"
                  class="flex-1 bg-primary hover:bg-red-700 disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-lg"
                >
                  <i v-if="twoFaLoading" class="fa-solid fa-spinner fa-spin mr-1"></i>
                  Verify & Enable
                </button>
                <button type="button" @click="cancelSetup" class="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg">
                  Cancel
                </button>
              </div>
            </form>
          </template>

          <!-- Initial state — show enable button -->
          <template v-else>
            <p class="text-sm text-gray-600">
              Two-factor authentication adds a second step to your login by requiring a code from an authenticator app on your phone.
            </p>
            <button
              @click="startEnable2FA"
              :disabled="twoFaLoading"
              class="bg-secondary hover:bg-blue-900 disabled:opacity-60 text-white text-sm font-medium py-2.5 px-5 rounded-lg flex items-center gap-2"
            >
              <i v-if="twoFaLoading" class="fa-solid fa-spinner fa-spin"></i>
              <i v-else class="fa-solid fa-shield-halved"></i>
              Enable Two-Factor Authentication
            </button>
          </template>
        </template>

        <!-- Enabled — show disable option -->
        <template v-else>
          <p class="text-sm text-gray-600">
            Two-factor authentication is active. You will be asked for a code from your authenticator app each time you log in.
          </p>

          <template v-if="showDisable2FA">
            <form @submit.prevent="disable2FA" class="space-y-3 bg-red-50 border border-red-200 rounded-lg p-4">
              <p class="text-sm text-red-700 font-medium">Confirm your password to disable 2FA</p>
              <input
                v-model="disablePassword"
                type="password"
                required
                placeholder="Enter your password"
                class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
              />
              <div class="flex gap-2">
                <button
                  type="submit"
                  :disabled="twoFaLoading"
                  class="bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-medium py-2 px-4 rounded-lg"
                >
                  <i v-if="twoFaLoading" class="fa-solid fa-spinner fa-spin mr-1"></i>
                  Disable 2FA
                </button>
                <button type="button" @click="showDisable2FA = false; disablePassword = ''" class="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">
                  Cancel
                </button>
              </div>
            </form>
          </template>
          <template v-else>
            <button
              @click="showDisable2FA = true"
              class="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
            >
              <i class="fa-solid fa-shield-halved"></i> Disable Two-Factor Authentication
            </button>
          </template>
        </template>
      </div>
    </div>

  </div>
</template>
