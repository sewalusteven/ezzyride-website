<script setup lang="ts">
import { Notify } from 'notiflix'
import { Dialog, DialogPanel, TransitionRoot, TransitionChild } from '@headlessui/vue'

definePageMeta({ layout: 'admin-layout' })

const { $api } = useNuxtApp()
const router = useRouter()

interface Partner {
  id: number; name: string; contactName: string | null; contactEmail: string | null
  contactPhone: string | null; isActive: boolean; isLocal: boolean; defaultCurrency: string
  apiKeyPrefix: string; vehiclesCount: number; lastSyncAt: string | null
  lastSyncStatus: string | null; createdAt: string
}
interface Meta { current_page: number; last_page: number; total: number; per_page: number }

const partners    = ref<Partner[]>([])
const loading     = ref(false)
const search      = ref('')
const searchTimer = ref<ReturnType<typeof setTimeout> | null>(null)
const meta        = ref<Meta>({ current_page: 1, last_page: 1, total: 0, per_page: 20 })

const fetchPartners = async (page = 1) => {
  loading.value = true
  try {
    const params: Record<string, any> = { page }
    if (search.value.trim()) params.search = search.value.trim()
    const { data } = await $api.get('/v1/partners', { params })
    partners.value = data.data.data ?? data.data
    meta.value     = data.data.meta ?? data.meta ?? meta.value
  } finally {
    loading.value = false
  }
}

const onSearch = () => {
  if (searchTimer.value) clearTimeout(searchTimer.value)
  searchTimer.value = setTimeout(() => fetchPartners(1), 400)
}

const pages = computed(() => {
  const total = meta.value.last_page, cur = meta.value.current_page
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const arr: (number | '...')[] = [1]
  if (cur > 3) arr.push('...')
  for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) arr.push(i)
  if (cur < total - 2) arr.push('...')
  arr.push(total)
  return arr
})

const fmtDate = (s: string) => new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

// ── Create modal ────────────────────────────────────────────────────────────
const createModal = ref(false)
const createForm  = ref({ name: '', contact_name: '', contact_email: '', contact_phone: '', notes: '', is_local: true, default_currency: 'UGX' })
const creating    = ref(false)
const createError = ref('')
const createdApiKey = ref('')
const showApiKeyModal = ref(false)

// Currency rates from settings
const currencyRates = ref<{ id: number; currency_code: string; currency_name: string }[]>([])
const fetchCurrencyRates = async () => {
  try {
    const { data } = await $api.get('/v1/currency-rates')
    currencyRates.value = data.data
  } catch { /* ignore */ }
}

const openCreate = () => {
  createForm.value  = { name: '', contact_name: '', contact_email: '', contact_phone: '', notes: '', is_local: true, default_currency: 'UGX' }
  createError.value = ''
  createModal.value = true
}

const submitCreate = async () => {
  creating.value    = true
  createError.value = ''
  try {
    const payload: Record<string, any> = { ...createForm.value }
    Object.keys(payload).forEach(k => { if (payload[k] === '') delete payload[k] })
    const { data } = await $api.post('/v1/partners', payload)
    createModal.value = false
    createdApiKey.value = data.data.apiKey
    showApiKeyModal.value = true
    fetchPartners()
  } catch (e: any) {
    const errs = e.response?.data?.data
    createError.value = errs ? Object.values(errs).flat().join(' · ') : (e.response?.data?.message ?? 'Failed to create partner.')
  } finally {
    creating.value = false
  }
}

const copyApiKey = () => {
  navigator.clipboard.writeText(createdApiKey.value)
  Notify.success('API key copied!')
}

const deletePartner = async (p: Partner) => {
  if (!confirm(`Delete partner "${p.name}"?`)) return
  try {
    await $api.delete(`/v1/partners/${p.id}`)
    Notify.success('Partner deleted.')
    fetchPartners(meta.value.current_page)
  } catch {
    Notify.failure('Failed to delete partner.')
  }
}

onMounted(() => { fetchPartners(); fetchCurrencyRates() })
</script>

<template>
  <div class="p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-xl font-bold text-gray-900">Partners</h1>
        <p class="text-sm text-gray-500 mt-0.5">Manage external partners that sync vehicle data via API</p>
      </div>
      <button @click="openCreate" class="bg-primary hover:bg-red-700 text-white font-medium py-2.5 px-5 rounded-lg text-sm transition-colors flex items-center gap-2">
        <i class="fa-solid fa-plus"></i> New Partner
      </button>
    </div>

    <div class="p-2 bg-white rounded shadow">
      <!-- Search -->
      <div class="mb-4">
        <div class="relative w-80">
          <i class="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
          <input v-model="search" @input="onSearch" type="text" placeholder="Search partners…"
                 class="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div v-if="loading && partners.length === 0" class="py-16 text-center text-gray-400">
          <i class="fa-solid fa-spinner fa-spin text-2xl mb-2 block"></i>
          <p class="text-sm">Loading…</p>
        </div>
        <div v-else-if="partners.length === 0" class="py-16 text-center">
          <i class="fa-solid fa-handshake text-4xl text-gray-200 mb-3"></i>
          <p class="text-gray-500 font-medium">No partners yet</p>
          <p class="text-sm text-gray-400 mt-1">Create a partner to start receiving vehicle data via API.</p>
        </div>
        <table v-else class="w-full text-sm">
          <thead>
          <tr class="bg-gray-50 text-gray-500 text-xs uppercase">
            <th class="text-left px-5 py-3">Partner</th>
            <th class="text-left px-5 py-3">Contact</th>
            <th class="text-center px-5 py-3">Status</th>
            <th class="text-center px-5 py-3">Vehicles</th>
            <th class="text-left px-5 py-3">Last Sync</th>
            <th class="text-left px-5 py-3">API Key</th>
            <th class="px-5 py-3"></th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="p in partners" :key="p.id"
              class="border-t border-gray-100 hover:bg-gray-50/50 cursor-pointer"
              @click="router.push(`/backoffice/partners/${p.id}`)"
          >
            <td class="px-5 py-3.5">
              <p class="font-medium text-gray-800">{{ p.name }}</p>
              <span class="text-[10px] font-medium px-1.5 py-0.5 rounded mt-0.5 inline-block"
                :class="p.isLocal ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'">
                {{ p.isLocal ? 'Local' : `Intl · ${p.defaultCurrency}` }}
              </span>
            </td>
            <td class="px-5 py-3.5 text-gray-500 text-xs">
              <p v-if="p.contactName">{{ p.contactName }}</p>
              <p v-if="p.contactEmail" class="text-gray-400">{{ p.contactEmail }}</p>
            </td>
            <td class="px-5 py-3.5 text-center">
              <span class="text-xs font-medium px-2 py-0.5 rounded-full"
                    :class="p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'">
                {{ p.isActive ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td class="px-5 py-3.5 text-center text-gray-700 font-medium">{{ p.vehiclesCount }}</td>
            <td class="px-5 py-3.5 text-xs text-gray-500">
              <template v-if="p.lastSyncAt">
                <span :class="p.lastSyncStatus === 'failed' ? 'text-red-500' : 'text-gray-500'">
                  {{ fmtDate(p.lastSyncAt) }}
                </span>
              </template>
              <span v-else class="text-gray-300">Never</span>
            </td>
            <td class="px-5 py-3.5">
              <code class="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{{ p.apiKeyPrefix }}…</code>
            </td>
            <td class="px-5 py-3.5 text-right" @click.stop>
              <button @click="deletePartner(p)" class="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md">
                <i class="fa-solid fa-trash text-xs"></i>
              </button>
            </td>
          </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="meta.last_page > 1" class="flex items-center justify-center gap-1.5 mt-4">
        <button class="px-2.5 py-1.5 text-sm rounded-md border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                :disabled="meta.current_page === 1" @click="fetchPartners(meta.current_page - 1)">&lsaquo;</button>
        <template v-for="p in pages" :key="p">
          <span v-if="p === '...'" class="px-2 text-gray-400 text-sm">…</span>
          <button v-else class="px-2.5 py-1.5 text-sm rounded-md border transition-colors"
                  :class="p === meta.current_page ? 'border-primary bg-primary text-white' : 'border-gray-300 text-gray-600 hover:bg-gray-50'"
                  @click="fetchPartners(p as number)">{{ p }}</button>
        </template>
        <button class="px-2.5 py-1.5 text-sm rounded-md border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                :disabled="meta.current_page === meta.last_page" @click="fetchPartners(meta.current_page + 1)">&rsaquo;</button>
      </div>

    </div>



    <!-- Create Partner Modal -->
    <TransitionRoot :show="createModal" as="template">
      <Dialog as="div" class="relative z-[200]" @close="createModal = false">
        <TransitionChild as="template" enter="ease-out duration-200" enter-from="opacity-0" enter-to="opacity-100" leave="ease-in duration-150" leave-from="opacity-100" leave-to="opacity-0">
          <div class="fixed inset-0 bg-black/50" />
        </TransitionChild>
        <div class="fixed inset-0 overflow-y-auto">
          <div class="flex min-h-full items-center justify-center p-4">
            <TransitionChild as="template" enter="ease-out duration-200" enter-from="opacity-0 scale-95" enter-to="opacity-100 scale-100" leave="ease-in duration-150" leave-from="opacity-100 scale-100" leave-to="opacity-0 scale-95">
              <DialogPanel class="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                <h3 class="font-semibold text-gray-900 text-lg mb-4">New Partner</h3>
                <div v-if="createError" class="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{{ createError }}</div>
                <div class="space-y-3">
                  <div>
                    <label class="text-xs font-medium text-gray-600">Partner Name *</label>
                    <input v-model="createForm.name" type="text" class="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="e.g. SBT Japan" />
                  </div>
                  <div>
                    <label class="text-xs font-medium text-gray-600">Contact Person</label>
                    <input v-model="createForm.contact_name" type="text" class="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="text-xs font-medium text-gray-600">Email</label>
                      <input v-model="createForm.contact_email" type="email" class="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                    <div>
                      <label class="text-xs font-medium text-gray-600">Phone</label>
                      <input v-model="createForm.contact_phone" type="text" class="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                  </div>
                  <!-- Partner Type -->
                  <div>
                    <label class="text-xs font-medium text-gray-600 mb-1.5 block">Partner Type</label>
                    <div class="flex gap-3">
                      <label class="flex items-center gap-2 cursor-pointer">
                        <input type="radio" :value="true" v-model="createForm.is_local" class="text-primary focus:ring-primary" />
                        <span class="text-sm text-gray-700">Local (UGX)</span>
                      </label>
                      <label class="flex items-center gap-2 cursor-pointer">
                        <input type="radio" :value="false" v-model="createForm.is_local" class="text-primary focus:ring-primary" />
                        <span class="text-sm text-gray-700">International</span>
                      </label>
                    </div>
                  </div>
                  <div v-if="!createForm.is_local">
                    <label class="text-xs font-medium text-gray-600">Default Currency</label>
                    <select v-model="createForm.default_currency" class="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                      <option v-for="r in currencyRates" :key="r.currency_code" :value="r.currency_code">{{ r.currency_code }} — {{ r.currency_name }}</option>
                    </select>
                    <p v-if="currencyRates.length === 0" class="text-xs text-amber-600 mt-1">No currencies configured yet. Add them in Settings &rarr; Currency Rates first.</p>
                    <p v-else class="text-xs text-gray-400 mt-1">The currency this partner uses for CIF pricing.</p>
                  </div>
                  <div>
                    <label class="text-xs font-medium text-gray-600">Notes</label>
                    <textarea v-model="createForm.notes" rows="2" class="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"></textarea>
                  </div>
                </div>
                <div class="flex justify-end gap-2 mt-5">
                  <button @click="createModal = false" class="text-sm text-gray-500 hover:text-gray-700 px-3 py-2">Cancel</button>
                  <button @click="submitCreate" :disabled="!createForm.name.trim() || creating"
                    class="bg-primary hover:bg-red-700 disabled:opacity-60 text-white font-medium py-2 px-5 rounded-lg text-sm transition-colors flex items-center gap-2">
                    <i v-if="creating" class="fa-solid fa-spinner fa-spin"></i>
                    Create Partner
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>

    <!-- API Key Display Modal (one-time) -->
    <TransitionRoot :show="showApiKeyModal" as="template">
      <Dialog as="div" class="relative z-[200]" @close="showApiKeyModal = false">
        <TransitionChild as="template" enter="ease-out duration-200" enter-from="opacity-0" enter-to="opacity-100" leave="ease-in duration-150" leave-from="opacity-100" leave-to="opacity-0">
          <div class="fixed inset-0 bg-black/50" />
        </TransitionChild>
        <div class="fixed inset-0 overflow-y-auto">
          <div class="flex min-h-full items-center justify-center p-4">
            <TransitionChild as="template" enter="ease-out duration-200" enter-from="opacity-0 scale-95" enter-to="opacity-100 scale-100" leave="ease-in duration-150" leave-from="opacity-100 scale-100" leave-to="opacity-0 scale-95">
              <DialogPanel class="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                <div class="text-center mb-4">
                  <i class="fa-solid fa-key text-3xl text-amber-500 mb-2"></i>
                  <h3 class="font-semibold text-gray-900 text-lg">API Key Generated</h3>
                  <p class="text-sm text-gray-500 mt-1">Copy this key now. It will <strong>not</strong> be shown again.</p>
                </div>
                <div class="bg-gray-900 rounded-lg p-4 mb-4">
                  <code class="text-xs text-green-400 break-all select-all">{{ createdApiKey }}</code>
                </div>
                <div class="flex justify-center gap-3">
                  <button @click="copyApiKey" class="bg-primary hover:bg-red-700 text-white font-medium py-2 px-5 rounded-lg text-sm transition-colors flex items-center gap-2">
                    <i class="fa-solid fa-copy"></i> Copy Key
                  </button>
                  <button @click="showApiKeyModal = false" class="border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium py-2 px-5 rounded-lg text-sm transition-colors">
                    Done
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>
  </div>
</template>
