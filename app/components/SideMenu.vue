<script setup lang="ts">
const { user, logout } = useAuth()
const route = useRoute()
const loggingOut = ref(false)

const handleLogout = async () => {
  loggingOut.value = true
  await logout()
}

const navItems = [
  { label: 'Dashboard',    icon: 'fa-chart-line', to: '/backoffice' },
  { label: 'Vehicles',     icon: 'fa-car',             to: '/backoffice/vehicles' },
  { label: 'Customers',    icon: 'fa-users',           to: '/backoffice/customers' },
  { label: 'Transactions',   icon: 'fa-money-bill-wave',  to: '/backoffice/transactions' },
  { label: 'Market Demand', icon: 'fa-arrow-trend-up',  to: '/backoffice/market-demand' },
  { label: 'Valuations',    icon: 'fa-chart-bar',        to: '/backoffice/valuations' },
  { label: 'Tax Settings', icon: 'fa-calculator', to: '/backoffice/tax-settings' },
  { label: 'Inquiries',    icon: 'fa-envelope',   to: '/backoffice/inquiries' },
  { label: 'Users',        icon: 'fa-users',      to: '/backoffice/users' },
  { label: 'Settings',     icon: 'fa-cog',        to: '/backoffice/settings' },
]

const isActive = (to: string) =>
  to === '/backoffice'
    ? route.path === '/backoffice'
    : route.path.startsWith(to)
</script>

<template>
  <aside id="sidebar" class="fixed left-0 top-0 w-64 h-full bg-white border-r border-gray-200 z-50 flex flex-col">
    <div class="p-4 border-b border-gray-200">
      <div class="flex items-center">
        <span class="text-primary font-bold text-xl">EzzyRide</span>
        <span class="text-secondary font-semibold text-sm ml-1">Admin</span>
      </div>
    </div>

    <nav class="p-2 flex-1">
      <div class="space-y-1">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center px-3 py-2 rounded-md text-sm transition-colors"
          :class="isActive(item.to)
            ? 'bg-primary/10 text-primary font-medium'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'"
        >
          <i :class="`fa-solid ${item.icon} w-4 h-4 mr-3`"></i>
          {{ item.label }}
        </NuxtLink>
      </div>
    </nav>

    <!-- User + Logout pinned to bottom -->
    <div class="p-3 border-t border-gray-200">
      <div class="flex items-center gap-3 px-2 py-2 mb-1">
        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xs font-bold shrink-0">
          {{ user?.name?.charAt(0).toUpperCase() ?? 'A' }}
        </div>
        <div class="min-w-0">
          <p class="text-sm font-medium text-gray-800 truncate">{{ user?.name ?? 'Admin' }}</p>
          <p class="text-xs text-gray-400 truncate">{{ user?.email ?? '' }}</p>
        </div>
      </div>
      <button
        :disabled="loggingOut"
        class="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
        @click="handleLogout"
      >
        <i v-if="loggingOut" class="fa-solid fa-spinner fa-spin"></i>
        <i v-else class="fa-solid fa-right-from-bracket"></i>
        {{ loggingOut ? 'Signing out...' : 'Sign out' }}
      </button>
    </div>
  </aside>
</template>

<style scoped>

</style>