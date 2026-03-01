<script setup lang="ts">
import { Notify } from 'notiflix'

useSeoMeta({
  title: 'Contact Us | EzzyRide Uganda',
  description: 'Get in touch with EzzyRide Uganda. We\'re here to help with vehicle imports, tax calculations, and any questions you have.',
})

const { $api } = useNuxtApp()

const settings = ref<Record<string, string>>({})
const loading  = ref(true)

onMounted(async () => {
  try {
    const { data } = await $api.get('/web/settings')
    settings.value = data.data
  } catch {} finally {
    loading.value = false
  }
})

// Contact form
const form = ref({
  name: '', email: '', phone: '', subject: '', message: '',
})
const sending   = ref(false)
const submitted = ref(false)

const subjects = [
  'Vehicle Enquiry',
  'Import Assistance',
  'Tax Calculator Help',
  'Valuation Question',
  'General Enquiry',
  'Other',
]

const sendMessage = async () => {
  if (!form.value.name || !form.value.message || (!form.value.email && !form.value.phone)) {
    Notify.failure('Please fill in your name, message, and at least one contact method (email or phone).')
    return
  }
  sending.value = true
  try {
    await $api.post('/web/inquiries', {
      name:    form.value.name,
      email:   form.value.email || undefined,
      phone:   form.value.phone || undefined,
      subject: form.value.subject || 'General Enquiry',
      message: form.value.message,
    })
    submitted.value = true
    form.value = { name: '', email: '', phone: '', subject: '', message: '' }
  } catch {
    Notify.failure('Could not send your message. Please try again or reach us directly by phone.')
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <div class="font-roboto text-gray-800">

    <!-- ── Page Header ────────────────────────────────────────────────────── -->
    <section class="relative pt-24 pb-12 bg-secondary overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-br from-secondary via-secondary/95 to-accent/50"></div>
      <div class="container mx-auto px-4 relative z-10 text-center text-white">
        <div class="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-sm px-4 py-1.5 rounded-full mb-5">
          <i class="fa-solid fa-envelope text-primary text-xs"></i> Get In Touch
        </div>
        <h1 class="text-4xl md:text-5xl font-bold font-montserrat mb-4">
          Contact <span class="text-primary">Us</span>
        </h1>
        <p class="text-gray-300 text-lg max-w-xl mx-auto">
          Have a question? We'd love to hear from you. Send us a message or reach out on any of our channels.
        </p>
      </div>
    </section>

    <!-- ── Main Grid ──────────────────────────────────────────────────────── -->
    <section class="py-16 bg-gray-50">
      <div class="container mx-auto px-4">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-10 max-w-6xl mx-auto">

          <!-- Contact Info -->
          <div class="space-y-6">
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 class="font-bold text-secondary text-xl mb-5 font-montserrat">Get in Touch</h2>

              <div class="space-y-5">
                <div v-if="settings.company_phone" class="flex items-start gap-4">
                  <div class="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <i class="fa-solid fa-phone text-primary text-sm"></i>
                  </div>
                  <div>
                    <div class="text-xs font-medium text-gray-400 mb-0.5">Phone</div>
                    <a :href="`tel:${settings.company_phone}`" class="text-secondary hover:text-primary transition-colors font-medium text-sm">
                      {{ settings.company_phone }}
                    </a>
                  </div>
                </div>

                <div v-if="settings.company_whatsapp" class="flex items-start gap-4">
                  <div class="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <i class="fa-brands fa-whatsapp text-green-500 text-sm"></i>
                  </div>
                  <div>
                    <div class="text-xs font-medium text-gray-400 mb-0.5">WhatsApp</div>
                    <a
                      :href="`https://wa.me/${settings.company_whatsapp?.replace(/\D/g, '')}`"
                      target="_blank"
                      class="text-secondary hover:text-green-600 transition-colors font-medium text-sm"
                    >
                      {{ settings.company_whatsapp }}
                    </a>
                  </div>
                </div>

                <div v-if="settings.company_email" class="flex items-start gap-4">
                  <div class="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <i class="fa-solid fa-envelope text-primary text-sm"></i>
                  </div>
                  <div>
                    <div class="text-xs font-medium text-gray-400 mb-0.5">Email</div>
                    <a :href="`mailto:${settings.company_email}`" class="text-secondary hover:text-primary transition-colors font-medium text-sm break-all">
                      {{ settings.company_email }}
                    </a>
                  </div>
                </div>

                <div v-if="settings.company_address" class="flex items-start gap-4">
                  <div class="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <i class="fa-solid fa-location-dot text-primary text-sm"></i>
                  </div>
                  <div>
                    <div class="text-xs font-medium text-gray-400 mb-0.5">Address</div>
                    <p class="text-secondary font-medium text-sm">{{ settings.company_address }}</p>
                  </div>
                </div>

                <!-- Placeholder row when loading -->
                <template v-if="loading">
                  <div v-for="i in 3" :key="i" class="flex items-start gap-4 animate-pulse">
                    <div class="w-10 h-10 bg-gray-200 rounded-lg shrink-0"></div>
                    <div class="flex-1 space-y-1.5 pt-1">
                      <div class="h-2.5 bg-gray-200 rounded w-16"></div>
                      <div class="h-4 bg-gray-200 rounded w-40"></div>
                    </div>
                  </div>
                </template>
              </div>
            </div>

            <!-- Business Hours -->
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 class="font-semibold text-secondary mb-4 flex items-center gap-2">
                <i class="fa-solid fa-clock text-primary text-sm"></i> Business Hours
              </h3>
              <div class="space-y-2 text-sm">
                <div v-if="settings.business_hours_weekday" class="flex items-center justify-between">
                  <span class="text-gray-500">Mon – Fri</span>
                  <span class="font-medium text-secondary">{{ settings.business_hours_weekday.replace('Monday – Friday: ', '').replace('Monday - Friday: ', '') }}</span>
                </div>
                <div v-if="settings.business_hours_saturday" class="flex items-center justify-between">
                  <span class="text-gray-500">Saturday</span>
                  <span class="font-medium text-secondary">{{ settings.business_hours_saturday.replace('Saturday: ', '') }}</span>
                </div>
                <div v-if="settings.business_hours_sunday" class="flex items-center justify-between">
                  <span class="text-gray-500">Sunday</span>
                  <span class="font-medium text-gray-400">{{ settings.business_hours_sunday.replace('Sunday: ', '') }}</span>
                </div>
                <template v-if="loading">
                  <div v-for="i in 3" :key="i" class="flex justify-between animate-pulse">
                    <div class="h-3 bg-gray-200 rounded w-16"></div>
                    <div class="h-3 bg-gray-200 rounded w-32"></div>
                  </div>
                </template>
              </div>
            </div>

            <!-- Social links -->
            <div v-if="settings.social_facebook || settings.social_instagram || settings.social_twitter || settings.social_youtube" class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 class="font-semibold text-secondary mb-4 flex items-center gap-2">
                <i class="fa-solid fa-hashtag text-primary text-sm"></i> Follow Us
              </h3>
              <div class="flex gap-3">
                <a v-if="settings.social_facebook" :href="settings.social_facebook" target="_blank" rel="noopener" class="w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center transition-colors">
                  <i class="fa-brands fa-facebook text-sm"></i>
                </a>
                <a v-if="settings.social_instagram" :href="settings.social_instagram" target="_blank" rel="noopener" class="w-10 h-10 bg-pink-600 hover:bg-pink-700 text-white rounded-lg flex items-center justify-center transition-colors">
                  <i class="fa-brands fa-instagram text-sm"></i>
                </a>
                <a v-if="settings.social_twitter" :href="settings.social_twitter" target="_blank" rel="noopener" class="w-10 h-10 bg-gray-800 hover:bg-black text-white rounded-lg flex items-center justify-center transition-colors">
                  <i class="fa-brands fa-x-twitter text-sm"></i>
                </a>
                <a v-if="settings.social_youtube" :href="settings.social_youtube" target="_blank" rel="noopener" class="w-10 h-10 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center transition-colors">
                  <i class="fa-brands fa-youtube text-sm"></i>
                </a>
              </div>
            </div>

          </div>

          <!-- Contact Form -->
          <div class="lg:col-span-2">
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h2 class="font-bold text-secondary text-xl mb-2 font-montserrat">Send Us a Message</h2>
              <p class="text-gray-500 text-sm mb-6">We typically respond within a few business hours.</p>

              <!-- Success -->
              <div v-if="submitted" class="text-center py-12">
                <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                  <i class="fa-solid fa-circle-check text-green-500 text-4xl"></i>
                </div>
                <h3 class="text-xl font-bold text-secondary mb-2">Message Sent!</h3>
                <p class="text-gray-500 mb-6 text-sm max-w-sm mx-auto">
                  Thank you for reaching out. We'll get back to you as soon as possible.
                </p>
                <button
                  @click="submitted = false"
                  class="bg-primary hover:bg-red-700 text-white px-6 py-2.5 rounded-full font-medium transition-colors"
                >
                  Send Another Message
                </button>
              </div>

              <!-- Form -->
              <form v-else @submit.prevent="sendMessage" class="space-y-4">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-medium text-gray-500 mb-1.5">Full Name *</label>
                    <input
                      v-model="form.name"
                      type="text"
                      required
                      placeholder="John Doe"
                      class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-500 mb-1.5">Subject</label>
                    <select v-model="form.subject" class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
                      <option value="">Select a subject…</option>
                      <option v-for="s in subjects" :key="s" :value="s">{{ s }}</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-500 mb-1.5">Email Address</label>
                    <input
                      v-model="form.email"
                      type="email"
                      placeholder="you@example.com"
                      class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-500 mb-1.5">Phone / WhatsApp</label>
                    <input
                      v-model="form.phone"
                      type="tel"
                      placeholder="+256 700 000 000"
                      class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-500 mb-1.5">Message *</label>
                  <textarea
                    v-model="form.message"
                    rows="6"
                    required
                    placeholder="Tell us how we can help you…"
                    class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  ></textarea>
                </div>
                <p class="text-xs text-gray-400">* Required. Please provide either email or phone so we can reach you.</p>
                <button
                  type="submit"
                  :disabled="sending"
                  class="w-full bg-primary hover:bg-red-700 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <i v-if="sending" class="fa-solid fa-spinner fa-spin"></i>
                  <i v-else class="fa-solid fa-paper-plane"></i>
                  {{ sending ? 'Sending…' : 'Send Message' }}
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- ── Quick Links CTA row ────────────────────────────────────────────── -->
    <section class="py-12 bg-white border-t border-gray-100">
      <div class="container mx-auto px-4">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <NuxtLink
            v-for="link in [
              { icon: 'fa-solid fa-car', label: 'Browse Vehicles', to: '/vehicles' },
              { icon: 'fa-solid fa-calculator', label: 'Tax Calculator', to: '/tax-calculator' },
              { icon: 'fa-solid fa-ship', label: 'Import Assistance', to: '/import-assistance' },
              { icon: 'fa-solid fa-magnifying-glass', label: 'Valuations', to: '/valuations' },
            ]"
            :key="link.to"
            :to="link.to"
            class="flex flex-col items-center gap-2 p-5 rounded-xl border border-gray-100 hover:border-primary/30 hover:bg-primary/5 transition-all text-center group"
          >
            <div class="w-12 h-12 bg-gray-100 group-hover:bg-primary/10 rounded-full flex items-center justify-center transition-colors">
              <i :class="link.icon" class="text-secondary group-hover:text-primary transition-colors"></i>
            </div>
            <span class="text-sm font-medium text-secondary group-hover:text-primary transition-colors">{{ link.label }}</span>
          </NuxtLink>
        </div>
      </div>
    </section>

  </div>
</template>
