<script setup lang="ts">
const { user, logout } = useAuth()
const loggingOut = ref(false)

const handleLogout = async () => {
  loggingOut.value = true
  await logout()
}
</script>

<template>
  <header id="header" class="bg-white border-b border-gray-200 px-6 py-3">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold text-gray-900">Dashboard</h1>
      <div class="flex items-center space-x-4">
        <button class="p-2 text-gray-400 hover:text-gray-600">
          <i class="fa-solid fa-bell"></i>
        </button>
        <div class="flex items-center space-x-2">
          <div class="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xs font-bold">
            {{ user?.name?.charAt(0).toUpperCase() ?? 'A' }}
          </div>
          <span class="text-sm font-medium text-gray-700">{{ user?.name ?? 'Admin' }}</span>
        </div>
        <button
          :disabled="loggingOut"
          class="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
          @click="handleLogout"
        >
          <i v-if="loggingOut" class="fa-solid fa-spinner fa-spin"></i>
          <i v-else class="fa-solid fa-right-from-bracket"></i>
          <span>{{ loggingOut ? 'Signing out...' : 'Logout' }}</span>
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>

</style>