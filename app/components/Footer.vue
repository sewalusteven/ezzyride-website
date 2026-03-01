<script setup lang="ts">
const { $api } = useNuxtApp()
const settings = ref<Record<string, string>>({})

const mailingEmail = ref('')
const mailingMsg = ref('')

onMounted(async () => {
  try {
    const { data } = await $api.get('/web/settings')
    settings.value = data.data
  } catch {}
})

const submitEmail = async () => {
  if (!mailingEmail.value) return
  try {
    await $api.post('/web/mailing-list', { email: mailingEmail.value })
    mailingEmail.value = ''
    mailingMsg.value = 'Thanks for subscribing!'
    setTimeout(() => { mailingMsg.value = '' }, 4000)
  } catch {}
}
</script>

<template>
  <footer class="bg-secondary text-white pt-14 pb-8">
    <div class="container mx-auto px-4">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
        <!-- Brand -->
        <div>
          <div class="flex items-center mb-4">
            <span class="text-primary font-bold text-2xl font-montserrat">Ezzy</span>
            <span class="text-white font-semibold text-lg ml-1 font-montserrat">Ride</span>
          </div>
          <p class="text-gray-300 text-sm mb-5">{{ settings.company_tagline ?? 'Your trusted partner for premium Japanese vehicle imports in Uganda.' }}</p>
          <div class="flex space-x-3">
            <a v-if="settings.social_facebook" :href="settings.social_facebook" target="_blank" rel="noopener" class="w-8 h-8 bg-white/10 hover:bg-primary rounded-full flex items-center justify-center transition-colors">
              <i class="fa-brands fa-facebook text-sm"></i>
            </a>
            <a v-if="settings.social_instagram" :href="settings.social_instagram" target="_blank" rel="noopener" class="w-8 h-8 bg-white/10 hover:bg-primary rounded-full flex items-center justify-center transition-colors">
              <i class="fa-brands fa-instagram text-sm"></i>
            </a>
            <a v-if="settings.social_twitter" :href="settings.social_twitter" target="_blank" rel="noopener" class="w-8 h-8 bg-white/10 hover:bg-primary rounded-full flex items-center justify-center transition-colors">
              <i class="fa-brands fa-x-twitter text-sm"></i>
            </a>
            <a v-if="settings.social_youtube" :href="settings.social_youtube" target="_blank" rel="noopener" class="w-8 h-8 bg-white/10 hover:bg-primary rounded-full flex items-center justify-center transition-colors">
              <i class="fa-brands fa-youtube text-sm"></i>
            </a>
          </div>
        </div>

        <!-- Quick Links -->
        <div>
          <h4 class="text-base font-semibold mb-4">Quick Links</h4>
          <ul class="space-y-2">
            <li v-for="link in [
              { label: 'Home', to: '/' },
              { label: 'Vehicles', to: '/vehicles' },
              { label: 'Tax Calculator', to: '/tax-calculator' },
              { label: 'Valuations', to: '/valuations' },
              { label: 'Import Assistance', to: '/import-assistance' },
              { label: 'About Us', to: '/about' },
              { label: 'Contact Us', to: '/contact' },
            ]" :key="link.to">
              <NuxtLink :to="link.to" class="text-gray-300 hover:text-primary transition-colors text-sm">
                {{ link.label }}
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Contact Info -->
        <div>
          <h4 class="text-base font-semibold mb-4">Contact Us</h4>
          <ul class="space-y-3">
            <li v-if="settings.company_phone" class="flex items-start gap-2 text-sm text-gray-300">
              <i class="fa-solid fa-phone mt-0.5 text-primary shrink-0"></i>
              <a :href="`tel:${settings.company_phone}`" class="hover:text-primary transition-colors">{{ settings.company_phone }}</a>
            </li>
            <li v-if="settings.company_whatsapp" class="flex items-start gap-2 text-sm text-gray-300">
              <i class="fa-brands fa-whatsapp mt-0.5 text-primary shrink-0"></i>
              <a :href="`https://wa.me/${settings.company_whatsapp?.replace(/\D/g,'')}`" target="_blank" class="hover:text-primary transition-colors">{{ settings.company_whatsapp }}</a>
            </li>
            <li v-if="settings.company_email" class="flex items-start gap-2 text-sm text-gray-300">
              <i class="fa-solid fa-envelope mt-0.5 text-primary shrink-0"></i>
              <a :href="`mailto:${settings.company_email}`" class="hover:text-primary transition-colors">{{ settings.company_email }}</a>
            </li>
            <li v-if="settings.company_address" class="flex items-start gap-2 text-sm text-gray-300">
              <i class="fa-solid fa-location-dot mt-0.5 text-primary shrink-0"></i>
              <span>{{ settings.company_address }}</span>
            </li>
          </ul>
        </div>

        <!-- Newsletter -->
        <div>
          <h4 class="text-base font-semibold mb-4">Stay Updated</h4>
          <p class="text-gray-300 text-sm mb-4">Be the first to know about new vehicles and special offers.</p>
          <form class="flex" @submit.prevent="submitEmail">
            <input
              v-model="mailingEmail"
              type="email"
              placeholder="Your email"
              class="flex-1 bg-white/10 text-white placeholder-gray-400 px-3 py-2.5 rounded-l-lg text-sm focus:outline-none focus:bg-white/20"
            />
            <button type="submit" class="bg-primary hover:bg-red-700 px-4 py-2.5 rounded-r-lg transition-colors text-sm font-medium">
              <i class="fa-solid fa-paper-plane"></i>
            </button>
          </form>
          <p v-if="mailingMsg" class="text-green-400 text-xs mt-2">{{ mailingMsg }}</p>
          <div class="mt-4 text-sm text-gray-300 space-y-1">
            <p v-if="settings.business_hours_weekday">{{ settings.business_hours_weekday }}</p>
            <p v-if="settings.business_hours_saturday">{{ settings.business_hours_saturday }}</p>
            <p v-if="settings.business_hours_sunday" class="text-gray-400">{{ settings.business_hours_sunday }}</p>
          </div>
        </div>
      </div>

      <div class="pt-8 border-t border-white/10 text-center text-gray-400 text-sm">
        <p>&copy; {{ new Date().getFullYear() }} {{ settings.company_name ?? 'EzzyRide Uganda' }}. All rights reserved.</p>
      </div>
    </div>
  </footer>
</template>
