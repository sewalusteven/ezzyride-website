<script setup lang="ts">
const sidebarOpen = useState('adminSidebar', () => false)
const route = useRoute()

// Close sidebar on navigation
watch(() => route.path, () => { sidebarOpen.value = false })
</script>

<template>
  <div class="font-inter bg-light-gray text-gray-900 text-sm min-h-screen">

    <!-- Mobile backdrop -->
    <Transition name="fade">
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 bg-black/40 z-40 lg:hidden"
        @click="sidebarOpen = false"
      />
    </Transition>

    <SideMenu />

    <main class="lg:ml-64 min-h-screen flex flex-col">
      <AdminHeader />
      <div class="flex-1">
        <slot />
      </div>
    </main>

  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from,
.fade-leave-to    { opacity: 0; }
</style>
