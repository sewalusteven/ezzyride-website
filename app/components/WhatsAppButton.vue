<script setup lang="ts">
const config = useRuntimeConfig()
const route = useRoute()

const props = defineProps<{
  message?: string
}>()

const whatsappNumber = config.public.whatsappNumber

const defaultMessage = computed(() => {
  if (props.message) return props.message
  return `Hi EzzyRide, I'm interested in your services. I'm browsing ${route.fullPath}`
})

const whatsappUrl = computed(() => {
  const msg = encodeURIComponent(defaultMessage.value)
  return `https://wa.me/${whatsappNumber}?text=${msg}`
})

// Hide on backoffice and auth pages
const isVisible = computed(() => {
  return !route.path.startsWith('/backoffice') && !route.path.startsWith('/auth')
})
</script>

<template>
  <a
    v-if="isVisible && whatsappNumber"
    :href="whatsappUrl"
    target="_blank"
    rel="noopener"
    class="fixed bottom-6 right-6 z-[100] w-14 h-14 bg-[#25D366] hover:bg-[#20BD5A] text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 group"
    title="Chat with us on WhatsApp"
  >
    <i class="fa-brands fa-whatsapp text-2xl"></i>
    <!-- Tooltip -->
    <span class="absolute right-full mr-3 bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
      Chat with us
    </span>
  </a>
</template>
