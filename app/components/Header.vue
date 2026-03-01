<script setup lang="ts">
const route  = useRoute()
const router = useRouter()

const mobileMenu  = ref(false)
const trackModal  = ref(false)
const trackInput  = ref('')

const navLinks = [
  { label: 'Home',              to: '/' },
  { label: 'Vehicles',          to: '/vehicles' },
  { label: 'Tax Calculator',    to: '/tax-calculator' },
  { label: 'Valuations',        to: '/valuations' },
  { label: 'Import Assistance', to: '/import-assistance' },
  { label: 'About Us',          to: '/about' },
]

const isActive = (to: string) =>
  to === '/' ? route.path === '/' : route.path.startsWith(to)

// Close menus on route change
watch(() => route.path, () => {
  mobileMenu.value = false
  trackModal.value = false
})

const openTrackModal = () => {
  trackInput.value = ''
  mobileMenu.value = false
  trackModal.value = true
}

const submitTrack = () => {
  const ref = trackInput.value.trim().toUpperCase()
  if (!ref) return
  trackModal.value = false
  router.push(`/track/${ref}`)
}
</script>

<template>
  <header class="fixed w-full top-0 z-50 bg-white shadow-md">
    <div class="container mx-auto px-4 py-3">
      <div class="flex items-center justify-between">
        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center">
          <span class="text-primary font-bold text-3xl font-montserrat">Ezzy</span>
          <span class="text-secondary font-semibold text-xl ml-1 font-montserrat">Ride</span>
        </NuxtLink>

        <!-- Desktop Navigation -->
        <nav class="hidden md:flex items-center space-x-6">
          <NuxtLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="font-medium transition duration-300 text-sm"
            :class="isActive(link.to) ? 'text-primary' : 'text-secondary hover:text-primary'"
          >
            {{ link.label }}
          </NuxtLink>
        </nav>

        <!-- Desktop right actions -->
        <div class="hidden md:flex items-center gap-3">
          <button
            @click="openTrackModal"
            class="border border-secondary/30 hover:border-primary text-secondary hover:text-primary font-medium py-2 px-4 rounded-full transition duration-300 text-sm flex items-center gap-1.5"
          >
            <i class="fa-solid fa-location-dot text-xs"></i>
            Track Order
          </button>
          <NuxtLink to="/contact" class="bg-primary hover:bg-red-700 text-white font-medium py-2 px-5 rounded-full transition duration-300 text-sm">
            Contact Us
          </NuxtLink>
        </div>

        <!-- Mobile Menu Button -->
        <button
          class="md:hidden text-secondary focus:outline-none p-1"
          @click="mobileMenu = !mobileMenu"
          aria-label="Toggle menu"
        >
          <i :class="mobileMenu ? 'fa-solid fa-times' : 'fa-solid fa-bars'" class="text-2xl"></i>
        </button>
      </div>

      <!-- Mobile Menu -->
      <div
        v-if="mobileMenu"
        class="md:hidden absolute top-full left-0 w-full bg-white shadow-lg border-t border-gray-100"
      >
        <nav class="container mx-auto px-4 py-4 flex flex-col space-y-1">
          <NuxtLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="font-medium py-2.5 px-3 rounded-md transition duration-300"
            :class="isActive(link.to) ? 'text-primary bg-primary/5' : 'text-secondary hover:text-primary hover:bg-gray-50'"
          >
            {{ link.label }}
          </NuxtLink>
          <button
            @click="openTrackModal"
            class="text-secondary hover:text-primary hover:bg-gray-50 font-medium py-2.5 px-3 rounded-md transition duration-300 text-left flex items-center gap-2"
          >
            <i class="fa-solid fa-location-dot text-xs"></i>
            Track Order
          </button>
          <NuxtLink to="/contact" class="bg-primary hover:bg-red-700 text-white font-medium py-2.5 px-4 rounded-full transition duration-300 inline-block text-center mt-2">
            Contact Us
          </NuxtLink>
        </nav>
      </div>
    </div>
  </header>

  <!-- Track Order Modal -->
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="trackModal"
        class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50"
        @click.self="trackModal = false"
      >
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
          <!-- Header -->
          <div class="flex items-center justify-between mb-5">
            <div>
              <h2 class="text-lg font-bold font-montserrat text-secondary">Track Your Order</h2>
              <p class="text-xs text-gray-400 mt-0.5">Enter your vehicle or import reference number</p>
            </div>
            <button @click="trackModal = false" class="text-gray-400 hover:text-gray-600 transition-colors p-1">
              <i class="fa-solid fa-times text-lg"></i>
            </button>
          </div>

          <!-- Input -->
          <div class="mb-4">
            <input
              v-model="trackInput"
              type="text"
              placeholder="EZR-2026-00001 or IMP-2026-0001"
              class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              @keydown.enter="submitTrack"
              autofocus
            />
            <p class="text-xs text-gray-400 mt-2">
              Vehicle purchases start with <span class="font-mono font-semibold">EZR-</span>, import applications with <span class="font-mono font-semibold">IMP-</span>
            </p>
          </div>

          <!-- Actions -->
          <div class="flex gap-3">
            <button
              @click="trackModal = false"
              class="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium py-2.5 rounded-xl transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              @click="submitTrack"
              :disabled="!trackInput.trim()"
              class="flex-1 bg-primary hover:bg-red-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
            >
              <i class="fa-solid fa-magnifying-glass text-xs"></i>
              Track
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
