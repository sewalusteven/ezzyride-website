<script setup lang="ts">
const { user, can } = useAuth()
const route = useRoute()
const sidebarOpen = useState('adminSidebar', () => false)

const allNavItems = [
  { label: 'Dashboard',           icon: 'fa-chart-line',      to: '/backoffice',                    permission: 'ui.menu.dashboard' },
  { label: 'Vehicles',            icon: 'fa-car',             to: '/backoffice/vehicles',           permission: 'ui.menu.vehicles' },
  { label: 'Customers',           icon: 'fa-users',           to: '/backoffice/customers',          permission: 'ui.menu.customers' },
  { label: 'Transactions',        icon: 'fa-money-bill-wave', to: '/backoffice/transactions',       permission: 'ui.menu.transactions' },
  { label: 'Market Demand',       icon: 'fa-arrow-trend-up',  to: '/backoffice/market-demand',      permission: 'ui.menu.market-demand' },
  { label: 'Import Applications', icon: 'fa-file-import',     to: '/backoffice/import-applications',permission: 'ui.menu.import-applications' },
  { label: 'Valuations',          icon: 'fa-chart-bar',       to: '/backoffice/valuations',         permission: 'ui.menu.valuations' },
  { label: 'Tax Settings',        icon: 'fa-calculator',      to: '/backoffice/tax-settings',       permission: 'ui.menu.tax-settings' },
  { label: 'Inquiries',           icon: 'fa-envelope',        to: '/backoffice/inquiries',          permission: 'ui.menu.inquiries' },
  { label: 'Mailing List',        icon: 'fa-envelope-open-text', to: '/backoffice/mailing-list',      permission: 'ui.menu.mailing-list' },
  { label: 'Users',               icon: 'fa-user-shield',     to: '/backoffice/users',              permission: 'ui.menu.users' },
  { label: 'Settings',            icon: 'fa-cog',             to: '/backoffice/settings',           permission: 'ui.menu.settings' },
]

const navItems = computed(() => allNavItems.filter(item => can(item.permission)))

const isActive = (to: string) =>
  to === '/backoffice'
    ? route.path === '/backoffice'
    : route.path.startsWith(to)
</script>

<template>
  <aside
    class="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-50 flex flex-col transition-transform duration-300 ease-in-out"
    :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
  >
    <!-- Logo + close -->
    <div class="p-4 border-b border-gray-200 flex items-center justify-between">
      <NuxtLink to="/backoffice" class="flex items-center" @click="sidebarOpen = false">
        <span class="text-primary font-bold text-xl">EzzyRide</span>
        <span class="text-secondary font-semibold text-sm ml-1">Admin</span>
      </NuxtLink>
      <button
        class="lg:hidden p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        @click="sidebarOpen = false"
      >
        <i class="fa-solid fa-xmark text-lg"></i>
      </button>
    </div>

    <!-- Nav -->
    <nav class="p-2 flex-1 overflow-y-auto">
      <div class="space-y-0.5">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center px-3 py-2 rounded-md text-sm transition-colors"
          :class="isActive(item.to)
            ? 'bg-primary/10 text-primary font-medium'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'"
        >
          <i :class="`fa-solid ${item.icon} w-4 mr-3 text-center`"></i>
          {{ item.label }}
        </NuxtLink>
      </div>
    </nav>

    <!-- User info (no logout — that's in the header dropdown) -->
    <div class="p-3 border-t border-gray-200">
      <div class="flex items-center gap-3 px-2 py-2">
        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xs font-bold shrink-0">
          {{ user?.name?.charAt(0).toUpperCase() ?? 'A' }}
        </div>
        <div class="min-w-0">
          <p class="text-sm font-medium text-gray-800 truncate">{{ user?.name ?? 'Admin' }}</p>
          <p class="text-xs text-gray-400 truncate capitalize">{{ user?.role ?? '' }}</p>
        </div>
      </div>
    </div>
  </aside>
</template>
