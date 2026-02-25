<script setup lang="ts">
import { Dialog, DialogPanel, TransitionRoot, TransitionChild } from '@headlessui/vue'

definePageMeta({ layout: 'admin-layout' })

const { $api } = useNuxtApp()
const router = useRouter()

interface Customer {
  id: number
  name: string
  phone: string
  email: string | null
  idType: string | null
  idNumber: string | null
  address: string | null
  notes: string | null
  createdAt: string
}
interface Meta { current_page: number; last_page: number; total: number; per_page: number }

const customers   = ref<Customer[]>([])
const loading     = ref(false)
const search      = ref('')
const searchTimer = ref<ReturnType<typeof setTimeout> | null>(null)
const meta        = ref<Meta>({ current_page: 1, last_page: 1, total: 0, per_page: 20 })

const fetchCustomers = async (page = 1) => {
  loading.value = true
  try {
    const params: Record<string, any> = { page }
    if (search.value.trim()) params.search = search.value.trim()
    const { data } = await $api.get('/v1/customers', { params })
    customers.value = data.data
    meta.value      = data.meta
  } finally {
    loading.value = false
  }
}

const onSearch = () => {
  if (searchTimer.value) clearTimeout(searchTimer.value)
  searchTimer.value = setTimeout(() => fetchCustomers(1), 400)
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
const createForm  = ref({ name: '', phone: '', email: '', id_type: '', id_number: '', address: '', notes: '' })
const creating    = ref(false)
const createError = ref('')

const openCreate = () => {
  createForm.value  = { name: '', phone: '', email: '', id_type: '', id_number: '', address: '', notes: '' }
  createError.value = ''
  createModal.value = true
}

const submitCreate = async () => {
  creating.value    = true
  createError.value = ''
  try {
    const payload: Record<string, any> = { ...createForm.value }
    Object.keys(payload).forEach(k => { if (payload[k] === '') delete payload[k] })
    const { data } = await $api.post('/v1/customers', payload)
    createModal.value = false
    router.push(`/backoffice/customers/${data.data.id}`)
  } catch (e: any) {
    const errs = e.response?.data?.data
    createError.value = errs ? Object.values(errs).flat().join(' · ') : (e.response?.data?.message ?? 'Failed to create customer')
  } finally {
    creating.value = false
  }
}

onMounted(() => fetchCustomers())
</script>

<template>
  <div class="p-6 space-y-5">
    <!-- Header -->
    <div class="flex items-center justify-between gap-4">
      <div>
        <h2 class="text-xl font-semibold text-gray-900">Customers</h2>
        <p class="text-sm text-gray-500 mt-0.5">Manage your customer database</p>
      </div>
      <button @click="openCreate" class="cursor-pointer flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors">
        <i class="fa-solid fa-plus text-xs"></i>
        New Customer
      </button>
    </div>

    <!-- Filters -->
    <div class="flex items-center gap-3 flex-wrap">
      <div class="relative flex-1 min-w-[220px]">
        <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
        <input v-model="search" type="text" placeholder="Search by name, phone, email…"
          class="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
          @input="onSearch">
      </div>
      <span class="text-xs text-gray-400 ml-auto">{{ meta.total }} customer{{ meta.total !== 1 ? 's' : '' }}</span>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Name</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Phone</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Email</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">ID</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Notes</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Date Added</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <!-- Skeleton -->
            <tr v-if="loading" v-for="n in 5" :key="n" class="animate-pulse">
              <td class="px-4 py-3"><div class="h-4 w-32 bg-gray-200 rounded"></div></td>
              <td class="px-4 py-3"><div class="h-4 w-28 bg-gray-200 rounded"></div></td>
              <td class="px-4 py-3"><div class="h-4 w-36 bg-gray-200 rounded"></div></td>
              <td class="px-4 py-3"><div class="h-4 w-24 bg-gray-200 rounded"></div></td>
              <td class="px-4 py-3"><div class="h-4 w-40 bg-gray-200 rounded"></div></td>
              <td class="px-4 py-3"><div class="h-4 w-24 bg-gray-200 rounded"></div></td>
              <td class="px-4 py-3"><div class="h-6 w-14 bg-gray-200 rounded"></div></td>
            </tr>
            <!-- Empty -->
            <tr v-else-if="customers.length === 0">
              <td colspan="7" class="px-4 py-16 text-center text-gray-400">
                <i class="fa-solid fa-users text-3xl mb-3 block opacity-30"></i>
                <p class="text-sm">No customers found</p>
                <button @click="openCreate" class="cursor-pointer mt-3 text-sm text-primary hover:underline">Add your first customer</button>
              </td>
            </tr>
            <!-- Rows -->
            <tr v-else v-for="c in customers" :key="c.id"
              class="hover:bg-gray-50/50 transition-colors cursor-pointer"
              @click="router.push(`/backoffice/customers/${c.id}`)">
              <td class="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{{ c.name }}</td>
              <td class="px-4 py-3 text-gray-700 whitespace-nowrap">{{ c.phone }}</td>
              <td class="px-4 py-3 whitespace-nowrap">
                <span v-if="c.email" class="text-gray-500">{{ c.email }}</span>
                <span v-else class="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                  <i class="fa-solid fa-envelope-slash text-[10px]"></i> No email
                </span>
              </td>
              <td class="px-4 py-3 text-gray-700 whitespace-nowrap">
                <template v-if="c.idType && c.idNumber">
                  <span class="text-xs text-gray-400 uppercase mr-1">{{ c.idType }}</span>{{ c.idNumber }}
                </template>
                <span v-else class="text-gray-400">—</span>
              </td>
              <td class="px-4 py-3 text-gray-500 max-w-[200px] truncate">{{ c.notes ?? '—' }}</td>
              <td class="px-4 py-3 text-gray-500 whitespace-nowrap">{{ fmtDate(c.createdAt) }}</td>
              <td class="px-4 py-3 whitespace-nowrap" @click.stop>
                <NuxtLink :to="`/backoffice/customers/${c.id}`"
                  class="inline-flex items-center gap-1.5 p-1.5 text-gray-400 hover:text-secondary hover:bg-blue-50 rounded-md transition-colors" title="View">
                  <i class="fa-solid fa-eye text-sm"></i>
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Pagination -->
      <div v-if="meta.last_page > 1" class="px-4 py-3 border-t border-gray-100 flex items-center justify-between gap-3">
        <p class="text-xs text-gray-500">Showing {{ ((meta.current_page - 1) * meta.per_page) + 1 }}–{{ Math.min(meta.current_page * meta.per_page, meta.total) }} of {{ meta.total }}</p>
        <div class="flex items-center gap-1">
          <button class="cursor-pointer px-2.5 py-1.5 text-sm rounded-md border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-40" :disabled="meta.current_page === 1" @click="fetchCustomers(meta.current_page - 1)">&lsaquo;</button>
          <template v-for="p in pages" :key="p">
            <span v-if="p === '...'" class="px-2 text-gray-400 text-sm">…</span>
            <button v-else class="cursor-pointer px-2.5 py-1.5 text-sm rounded-md border transition-colors" :class="p === meta.current_page ? 'border-primary bg-primary text-white' : 'border-gray-300 text-gray-600 hover:bg-gray-50'" @click="fetchCustomers(p as number)">{{ p }}</button>
          </template>
          <button class="cursor-pointer px-2.5 py-1.5 text-sm rounded-md border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-40" :disabled="meta.current_page === meta.last_page" @click="fetchCustomers(meta.current_page + 1)">&rsaquo;</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Create Customer Modal -->
  <TransitionRoot :show="createModal" as="template">
    <Dialog as="div" class="relative z-50" @close="createModal = false">
      <TransitionChild as="template"
        enter="ease-out duration-200" enter-from="opacity-0" enter-to="opacity-100"
        leave="ease-in duration-150" leave-from="opacity-100" leave-to="opacity-0">
        <div class="fixed inset-0 bg-black/40" />
      </TransitionChild>
      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4">
          <TransitionChild as="template"
            enter="ease-out duration-200" enter-from="opacity-0 scale-95" enter-to="opacity-100 scale-100"
            leave="ease-in duration-150" leave-from="opacity-100 scale-100" leave-to="opacity-0 scale-95">
            <DialogPanel class="bg-white rounded-xl shadow-2xl w-full max-w-lg">
              <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 class="font-semibold text-gray-900">New Customer</h3>
                <button @click="createModal = false" class="cursor-pointer text-gray-400 hover:text-gray-600 p-1 rounded">
                  <i class="fa-solid fa-xmark"></i>
                </button>
              </div>
              <div class="p-6 space-y-4">
                <div v-if="createError" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">{{ createError }}</div>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1.5">Full Name <span class="text-red-500">*</span></label>
                    <input v-model="createForm.name" type="text" placeholder="e.g. John Doe"
                      class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1.5">Phone <span class="text-red-500">*</span></label>
                    <input v-model="createForm.phone" type="text" placeholder="e.g. +256 700 000000"
                      class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none">
                  </div>
                  <div class="col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                    <input v-model="createForm.email" type="email" placeholder="e.g. john@example.com"
                      class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1.5">ID Type</label>
                    <select v-model="createForm.id_type"
                      class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none">
                      <option value="">— None —</option>
                      <option value="nin">NIN</option>
                      <option value="passport">Passport</option>
                      <option value="driving_license">Driving License</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1.5">ID Number</label>
                    <input v-model="createForm.id_number" type="text" placeholder="CM12345678"
                      class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none">
                  </div>
                  <div class="col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
                    <input v-model="createForm.address" type="text" placeholder="e.g. Kampala, Uganda"
                      class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none">
                  </div>
                  <div class="col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                    <textarea v-model="createForm.notes" rows="2" placeholder="Any notes about this customer…"
                      class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none resize-none"></textarea>
                  </div>
                </div>
              </div>
              <div class="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                <button @click="createModal = false"
                  class="cursor-pointer px-4 py-2 border border-gray-300 text-gray-600 rounded-md text-sm hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button :disabled="creating" @click="submitCreate"
                  class="cursor-pointer flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-60 transition-colors">
                  <i v-if="creating" class="fa-solid fa-spinner fa-spin"></i>
                  Create Customer
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
