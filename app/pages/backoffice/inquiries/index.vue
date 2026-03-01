<script setup lang="ts">
definePageMeta({ layout: 'admin-layout' })

const { $api } = useNuxtApp()

interface Inquiry {
  id: number
  name: string
  email: string | null
  phone: string | null
  subject: string | null
  message: string
  status: 'new' | 'read' | 'resolved'
  resolved_at: string | null
  created_at: string
}
interface Meta { current_page: number; last_page: number; total: number; per_page: number }

const inquiries   = ref<Inquiry[]>([])
const loading     = ref(false)
const search      = ref('')
const filterStatus = ref('')
const searchTimer = ref<ReturnType<typeof setTimeout> | null>(null)
const meta        = ref<Meta>({ current_page: 1, last_page: 1, total: 0, per_page: 25 })

// Detail modal
const selected    = ref<Inquiry | null>(null)
const updating    = ref(false)

const fetchInquiries = async (page = 1) => {
  loading.value = true
  try {
    const params: Record<string, any> = { page }
    if (search.value.trim())  params.search = search.value.trim()
    if (filterStatus.value)   params.status = filterStatus.value
    const { data } = await $api.get('/v1/inquiries', { params })
    inquiries.value = data.data
    meta.value      = data.meta
  } finally {
    loading.value = false
  }
}

const onSearch = () => {
  if (searchTimer.value) clearTimeout(searchTimer.value)
  searchTimer.value = setTimeout(() => fetchInquiries(1), 400)
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

const fmtDate = (s: string) => new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const statusColor = (s: string) => ({
  new:      'bg-blue-100 text-blue-700',
  read:     'bg-yellow-100 text-yellow-700',
  resolved: 'bg-green-100 text-green-700',
})[s] ?? 'bg-gray-100 text-gray-500'

const openInquiry = async (inq: Inquiry) => {
  selected.value = { ...inq }
  // Auto-mark as read
  if (inq.status === 'new') {
    try {
      await $api.get(`/v1/inquiries/${inq.id}`)
      // Update local list
      const idx = inquiries.value.findIndex(i => i.id === inq.id)
      if (idx !== -1) {
        inquiries.value[idx].status = 'read'
        selected.value.status = 'read'
      }
    } catch {}
  }
}

const updateStatus = async (status: 'new' | 'read' | 'resolved') => {
  if (!selected.value) return
  updating.value = true
  try {
    const { data } = await $api.patch(`/v1/inquiries/${selected.value.id}`, { status })
    selected.value = data.data
    const idx = inquiries.value.findIndex(i => i.id === selected.value!.id)
    if (idx !== -1) inquiries.value[idx] = data.data
  } finally {
    updating.value = false
  }
}

const deleteInquiry = async (id: number) => {
  if (!confirm('Delete this inquiry permanently?')) return
  try {
    await $api.delete(`/v1/inquiries/${id}`)
    inquiries.value = inquiries.value.filter(i => i.id !== id)
    if (selected.value?.id === id) selected.value = null
  } catch {}
}

const unreadCount = computed(() => inquiries.value.filter(i => i.status === 'new').length)

onMounted(() => fetchInquiries(1))
</script>

<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-xl font-bold text-gray-900">Inquiries</h1>
        <p class="text-sm text-gray-500 mt-0.5">Messages from the website contact form and vehicle enquiries</p>
      </div>
      <div v-if="unreadCount" class="bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-full">
        {{ unreadCount }} new
      </div>
    </div>

    <div class="bg-white p-4 shadow rounded border border-gray-200 flex flex-col gap-2">
      <!-- Filters -->
      <div class="flex flex-col sm:flex-row gap-3 mb-5">
        <div class="relative flex-1 max-w-sm">
          <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
          <input
              v-model="search"
              type="text"
              placeholder="Search by name, email, phone or subject…"
              class="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              @input="onSearch"
          />
        </div>
        <select
            v-model="filterStatus"
            @change="fetchInquiries(1)"
            class="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">All Statuses</option>
          <option value="new">New</option>
          <option value="read">Read</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      <!-- Table + Detail panel -->
      <div class="flex gap-5" :class="selected ? 'flex-col lg:flex-row' : ''">

        <!-- Table -->
        <div class="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden min-w-0">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
              <tr class="border-b border-gray-100 bg-gray-50">
                <th class="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide">Sender</th>
                <th class="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide">Subject</th>
                <th class="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide">Status</th>
                <th class="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide">Date</th>
                <th class="px-4 py-3"></th>
              </tr>
              </thead>
              <tbody>
              <tr v-if="loading">
                <td colspan="5" class="px-4 py-10 text-center text-gray-400">
                  <i class="fa-solid fa-spinner fa-spin mr-2"></i> Loading…
                </td>
              </tr>
              <tr v-else-if="!inquiries.length">
                <td colspan="5" class="px-4 py-10 text-center text-gray-400">No inquiries found.</td>
              </tr>
              <tr
                  v-for="inq in inquiries"
                  :key="inq.id"
                  class="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                  :class="[
                  inq.status === 'new' ? 'font-medium' : '',
                  selected?.id === inq.id ? 'bg-primary/5' : '',
                ]"
                  @click="openInquiry(inq)"
              >
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <div v-if="inq.status === 'new'" class="w-2 h-2 bg-primary rounded-full shrink-0"></div>
                    <div>
                      <div class="text-gray-900">{{ inq.name }}</div>
                      <div class="text-xs text-gray-400">{{ inq.email || inq.phone || '—' }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-3 text-gray-600 max-w-[200px] truncate">
                  {{ inq.subject || '(No subject)' }}
                </td>
                <td class="px-4 py-3">
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize" :class="statusColor(inq.status)">
                    {{ inq.status }}
                  </span>
                </td>
                <td class="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                  {{ fmtDate(inq.created_at) }}
                </td>
                <td class="px-4 py-3 text-right">
                  <button
                      @click.stop="deleteInquiry(inq.id)"
                      class="text-gray-300 hover:text-red-500 transition-colors p-1"
                      title="Delete"
                  >
                    <i class="fa-solid fa-trash text-xs"></i>
                  </button>
                </td>
              </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div v-if="meta.last_page > 1" class="flex items-center gap-1 px-4 py-3 border-t border-gray-100">
            <button
                :disabled="meta.current_page === 1"
                @click="fetchInquiries(meta.current_page - 1)"
                class="w-8 h-8 flex items-center justify-center rounded border text-xs disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              <i class="fa-solid fa-chevron-left text-xs"></i>
            </button>
            <template v-for="p in pages" :key="p">
              <button
                  v-if="p !== '...'"
                  @click="fetchInquiries(p as number)"
                  class="w-8 h-8 flex items-center justify-center rounded border text-xs font-medium transition-colors"
                  :class="p === meta.current_page ? 'bg-primary border-primary text-white' : 'hover:bg-gray-50'"
              >{{ p }}</button>
              <span v-else class="px-1 text-gray-400 text-xs">…</span>
            </template>
            <button
                :disabled="meta.current_page === meta.last_page"
                @click="fetchInquiries(meta.current_page + 1)"
                class="w-8 h-8 flex items-center justify-center rounded border text-xs disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              <i class="fa-solid fa-chevron-right text-xs"></i>
            </button>
          </div>
        </div>

        <!-- Detail panel -->
        <div v-if="selected" class="lg:w-96 bg-white rounded-xl border border-gray-200 overflow-hidden shrink-0">
          <div class="flex items-center justify-between p-4 border-b border-gray-100">
            <h3 class="font-semibold text-gray-800 text-sm">Inquiry Details</h3>
            <button @click="selected = null" class="text-gray-400 hover:text-gray-600 transition-colors p-1">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div class="p-4 space-y-4">
            <!-- Sender info -->
            <div class="bg-gray-50 rounded-lg p-3 space-y-2">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                  <span class="text-primary font-bold text-sm">{{ selected.name.charAt(0).toUpperCase() }}</span>
                </div>
                <div>
                  <div class="font-medium text-gray-900 text-sm">{{ selected.name }}</div>
                  <div class="text-xs text-gray-400">{{ fmtDate(selected.created_at) }}</div>
                </div>
              </div>
              <div v-if="selected.email" class="flex items-center gap-2 text-xs text-gray-600">
                <i class="fa-solid fa-envelope text-gray-400 w-3 text-center"></i>
                <a :href="`mailto:${selected.email}`" class="hover:text-primary transition-colors">{{ selected.email }}</a>
              </div>
              <div v-if="selected.phone" class="flex items-center gap-2 text-xs text-gray-600">
                <i class="fa-solid fa-phone text-gray-400 w-3 text-center"></i>
                <a :href="`tel:${selected.phone}`" class="hover:text-primary transition-colors">{{ selected.phone }}</a>
              </div>
            </div>

            <!-- Subject + message -->
            <div>
              <div class="text-xs font-medium text-gray-400 mb-1">Subject</div>
              <div class="text-sm text-gray-800 font-medium">{{ selected.subject || '(No subject)' }}</div>
            </div>
            <div>
              <div class="text-xs font-medium text-gray-400 mb-1">Message</div>
              <p class="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{{ selected.message }}</p>
            </div>

            <!-- Status + actions -->
            <div class="border-t border-gray-100 pt-4">
              <div class="flex items-center justify-between mb-3">
                <div class="text-xs font-medium text-gray-400">Status</div>
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize" :class="statusColor(selected.status)">
                {{ selected.status }}
              </span>
              </div>
              <div class="flex gap-2 flex-wrap">
                <button
                    v-if="selected.status !== 'resolved'"
                    @click="updateStatus('resolved')"
                    :disabled="updating"
                    class="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-xs py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <i v-if="updating" class="fa-solid fa-spinner fa-spin"></i>
                  <i v-else class="fa-solid fa-circle-check"></i>
                  Mark Resolved
                </button>
                <button
                    v-if="selected.status === 'resolved'"
                    @click="updateStatus('read')"
                    :disabled="updating"
                    class="flex-1 border border-gray-300 hover:bg-gray-50 disabled:opacity-60 text-gray-600 text-xs py-2 px-3 rounded-lg transition-colors"
                >
                  Reopen
                </button>
                <button
                    @click="deleteInquiry(selected.id)"
                    class="border border-red-200 text-red-500 hover:bg-red-50 text-xs py-2 px-3 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <i class="fa-solid fa-trash"></i> Delete
                </button>
              </div>
            </div>

            <!-- Quick reply links -->
            <div v-if="selected.email || selected.phone" class="border-t border-gray-100 pt-4">
              <div class="text-xs font-medium text-gray-400 mb-2">Quick Reply</div>
              <div class="flex gap-2">
                <a
                    v-if="selected.email"
                    :href="`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject || 'Your Inquiry')}`"
                    class="flex-1 flex items-center justify-center gap-1.5 text-xs border border-gray-200 hover:border-primary hover:text-primary text-gray-600 py-2 px-3 rounded-lg transition-colors"
                >
                  <i class="fa-solid fa-envelope"></i> Email
                </a>
                <a
                    v-if="selected.phone"
                    :href="`https://wa.me/${selected.phone?.replace(/\D/g, '')}`"
                    target="_blank"
                    class="flex-1 flex items-center justify-center gap-1.5 text-xs border border-gray-200 hover:border-green-500 hover:text-green-600 text-gray-600 py-2 px-3 rounded-lg transition-colors"
                >
                  <i class="fa-brands fa-whatsapp"></i> WhatsApp
                </a>
                <a
                    v-if="selected.phone"
                    :href="`tel:${selected.phone}`"
                    class="flex-1 flex items-center justify-center gap-1.5 text-xs border border-gray-200 hover:border-primary hover:text-primary text-gray-600 py-2 px-3 rounded-lg transition-colors"
                >
                  <i class="fa-solid fa-phone"></i> Call
                </a>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>

  </div>
</template>
