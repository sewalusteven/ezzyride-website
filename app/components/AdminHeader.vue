<script setup lang="ts">
import { Menu, MenuButton, MenuItems, MenuItem, TransitionRoot } from '@headlessui/vue'

const { user, logout } = useAuth()
const loggingOut  = ref(false)
const sidebarOpen = useState('adminSidebar', () => false)
const route       = useRoute()

const handleLogout = async () => {
  loggingOut.value = true
  await logout()
}

const pageTitle = computed(() => {
  const seg = route.path.replace(/^\/backoffice\/?/, '').split('/')[0]
  if (!seg) return 'Dashboard'
  return seg
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
})
</script>

<template>
  <header class="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3">
    <div class="flex items-center justify-between gap-3">

      <!-- Left: hamburger (mobile) + page title -->
      <div class="flex items-center gap-3 min-w-0">
        <button
          class="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
          @click="sidebarOpen = true"
          aria-label="Open menu"
        >
          <i class="fa-solid fa-bars text-lg"></i>
        </button>
        <h1 class="text-base font-semibold text-gray-900 truncate">{{ pageTitle }}</h1>
      </div>

      <!-- Right: notifications + user dropdown -->
      <div class="flex items-center gap-2 shrink-0">
        <button class="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors">
          <i class="fa-solid fa-bell"></i>
        </button>

        <!-- User dropdown -->
        <Menu as="div" class="relative">
          <MenuButton class="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none">
            <div class="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xs font-bold shrink-0">
              {{ user?.name?.charAt(0).toUpperCase() ?? 'A' }}
            </div>
            <span class="hidden md:block text-sm font-medium text-gray-700">{{ user?.name ?? 'Admin' }}</span>
            <i class="hidden md:block fa-solid fa-chevron-down text-xs text-gray-400"></i>
          </MenuButton>

          <TransitionRoot
            enter="transition ease-out duration-100"
            enter-from="transform opacity-0 scale-95"
            enter-to="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leave-from="transform opacity-100 scale-100"
            leave-to="transform opacity-0 scale-95"
          >
            <MenuItems class="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 focus:outline-none z-50">
              <!-- User info header -->
              <div class="px-4 py-2.5 border-b border-gray-100">
                <p class="text-sm font-semibold text-gray-800 truncate">{{ user?.name }}</p>
                <p class="text-xs text-gray-400 truncate capitalize">{{ user?.role ?? 'User' }}</p>
              </div>

              <!-- Profile -->
              <MenuItem v-slot="{ active }">
                <NuxtLink
                  to="/backoffice/profile"
                  :class="[active ? 'bg-gray-50 text-gray-900' : 'text-gray-700', 'flex items-center gap-2.5 px-4 py-2 text-sm']"
                >
                  <i class="fa-solid fa-user w-4 text-center text-gray-400"></i>
                  My Profile
                </NuxtLink>
              </MenuItem>

              <!-- Divider -->
              <div class="my-1 border-t border-gray-100"></div>

              <!-- Logout -->
              <MenuItem v-slot="{ active }">
                <button
                  :class="[active ? 'bg-red-50 text-red-600' : 'text-gray-600', 'w-full flex items-center gap-2.5 px-4 py-2 text-sm disabled:opacity-50']"
                  :disabled="loggingOut"
                  @click="handleLogout"
                >
                  <i v-if="loggingOut" class="fa-solid fa-spinner fa-spin w-4 text-center"></i>
                  <i v-else class="fa-solid fa-right-from-bracket w-4 text-center"></i>
                  {{ loggingOut ? 'Signing out…' : 'Sign Out' }}
                </button>
              </MenuItem>
            </MenuItems>
          </TransitionRoot>
        </Menu>
      </div>
    </div>
  </header>
</template>
