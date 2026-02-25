<script setup lang="ts">
definePageMeta({ layout: 'admin-layout' })

const { $api } = useNuxtApp()

interface Transaction {
  id: number
  vehicleId: number
  amount: string
  paymentMethod: string
  receiptNumber: string
  referenceNumber: string | null
  notes: string | null
  paidAt: string
  vehicle: { id: number; reference: string; model: string; brand: { id: number; name: string } | null } | null
  customer: { id: number; name: string; phone: string } | null
}
interface Meta { current_page: number; last_page: number; total: number; per_page: number }

const transactions = ref<Transaction[]>([])
const meta         = ref<Meta>({ current_page: 1, last_page: 1, total: 0, per_page: 25 })
const loading      = ref(false)
const search       = ref('')
const filterMethod = ref('')
const dateFrom     = ref('')
const dateTo       = ref('')
const searchTimer  = ref<ReturnType<typeof setTimeout> | null>(null)

const fetchTransactions = async (page = 1) => {
  loading.value = true
  try {
    const params: Record<string, any> = { page }
    if (search.value.trim()) params.search         = search.value.trim()
    if (filterMethod.value)  params.payment_method = filterMethod.value
    if (dateFrom.value)      params.date_from      = dateFrom.value
    if (dateTo.value)        params.date_to        = dateTo.value
    const { data } = await $api.get('/v1/transactions', { params })
    transactions.value = data.data
    meta.value         = data.meta
  } finally {
    loading.value = false
  }
}

const onSearch = () => {
  if (searchTimer.value) clearTimeout(searchTimer.value)
  searchTimer.value = setTimeout(() => fetchTransactions(1), 400)
}

watch([filterMethod, dateFrom, dateTo], () => fetchTransactions(1))

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

const fmtUGX     = (n: any) => n ? new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(Number(n)) : '—'
const fmtDate    = (s: string) => s ? new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const fmtDateTime= (s: string) => s ? new Date(s).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

const methodLabels: Record<string, string> = {
  cash: 'Cash', bank_transfer: 'Bank Transfer', mobile_money: 'Mobile Money', cheque: 'Cheque', other: 'Other',
}
const methodColors: Record<string, string> = {
  cash: 'bg-gray-100 text-gray-600', bank_transfer: 'bg-blue-100 text-blue-700',
  mobile_money: 'bg-green-100 text-green-700', cheque: 'bg-purple-100 text-purple-700', other: 'bg-gray-100 text-gray-600',
}

onMounted(() => fetchTransactions())
</script>

<template>
  <div class="p-6 space-y-5">
    <!-- Header -->
    <div>
      <h2 class="text-xl font-semibold text-gray-900">Transactions</h2>
      <p class="text-sm text-gray-500 mt-0.5">All payment records across all vehicles</p>
    </div>

    <!-- Filter bar -->
    <div class="flex items-center gap-3 flex-wrap">
      <div class="relative flex-1 min-w-[220px]">
        <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
        <input v-model="search" type="text" placeholder="Search by receipt #, customer, vehicle ref…"
          class="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
          @input="onSearch">
      </div>
      <select v-model="filterMethod" class="cursor-pointer px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none">
        <option value="">All Methods</option>
        <option value="cash">Cash</option>
        <option value="bank_transfer">Bank Transfer</option>
        <option value="mobile_money">Mobile Money</option>
        <option value="cheque">Cheque</option>
        <option value="other">Other</option>
      </select>
      <input v-model="dateFrom" type="date" title="From date" class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none">
      <input v-model="dateTo"   type="date" title="To date"   class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none">
      <span class="text-xs text-gray-400 ml-auto whitespace-nowrap">{{ meta.total }} payment{{ meta.total !== 1 ? 's' : '' }}</span>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Date</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Receipt #</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Vehicle</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Customer</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Method</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Amount</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <!-- Skeleton -->
            <tr v-if="loading" v-for="n in 5" :key="n" class="animate-pulse">
              <td class="px-4 py-3"><div class="h-4 w-24 bg-gray-200 rounded"></div></td>
              <td class="px-4 py-3"><div class="h-4 w-28 bg-gray-200 rounded"></div></td>
              <td class="px-4 py-3"><div class="space-y-1.5"><div class="h-4 w-32 bg-gray-200 rounded"></div><div class="h-3 w-20 bg-gray-200 rounded"></div></div></td>
              <td class="px-4 py-3"><div class="space-y-1.5"><div class="h-4 w-28 bg-gray-200 rounded"></div><div class="h-3 w-20 bg-gray-200 rounded"></div></div></td>
              <td class="px-4 py-3"><div class="h-5 w-24 bg-gray-200 rounded-full"></div></td>
              <td class="px-4 py-3"><div class="h-4 w-24 bg-gray-200 rounded"></div></td>
            </tr>
            <!-- Empty -->
            <tr v-else-if="transactions.length === 0">
              <td colspan="6" class="px-4 py-16 text-center text-gray-400">
                <i class="fa-solid fa-receipt text-3xl mb-3 block opacity-30"></i>
                <p class="text-sm">No transactions found</p>
                <p v-if="search || filterMethod || dateFrom || dateTo" class="mt-1 text-xs">Try adjusting your filters</p>
              </td>
            </tr>
            <!-- Rows -->
            <tr v-else v-for="t in transactions" :key="t.id" class="hover:bg-gray-50/50 transition-colors">
              <td class="px-4 py-3 text-gray-700 whitespace-nowrap" :title="fmtDateTime(t.paidAt)">{{ fmtDate(t.paidAt) }}</td>
              <td class="px-4 py-3 whitespace-nowrap">
                <span class="font-mono text-xs font-semibold text-secondary tracking-wide">{{ t.receiptNumber }}</span>
                <p v-if="t.referenceNumber" class="text-xs text-gray-400 mt-0.5">Ref: {{ t.referenceNumber }}</p>
              </td>
              <td class="px-4 py-3 whitespace-nowrap">
                <template v-if="t.vehicle">
                  <NuxtLink :to="`/backoffice/vehicles/${t.vehicle.id}`" class="cursor-pointer font-medium text-gray-900 hover:text-secondary transition-colors">
                    {{ t.vehicle.brand?.name }} {{ t.vehicle.model }}
                  </NuxtLink>
                  <p class="text-xs font-mono text-gray-400 mt-0.5">{{ t.vehicle.reference }}</p>
                </template>
                <span v-else class="text-gray-400">—</span>
              </td>
              <td class="px-4 py-3 whitespace-nowrap">
                <template v-if="t.customer">
                  <NuxtLink :to="`/backoffice/customers/${t.customer.id}`" class="cursor-pointer font-medium text-gray-900 hover:text-secondary transition-colors">
                    {{ t.customer.name }}
                  </NuxtLink>
                  <p class="text-xs text-gray-400 mt-0.5">{{ t.customer.phone }}</p>
                </template>
                <span v-else class="text-gray-400">—</span>
              </td>
              <td class="px-4 py-3 whitespace-nowrap">
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" :class="methodColors[t.paymentMethod] ?? 'bg-gray-100 text-gray-600'">
                  {{ methodLabels[t.paymentMethod] ?? t.paymentMethod }}
                </span>
              </td>
              <td class="px-4 py-3 text-gray-900 whitespace-nowrap font-medium">{{ fmtUGX(t.amount) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Pagination -->
      <div v-if="meta.last_page > 1" class="px-4 py-3 border-t border-gray-100 flex items-center justify-between gap-3">
        <p class="text-xs text-gray-500">Showing {{ ((meta.current_page - 1) * meta.per_page) + 1 }}–{{ Math.min(meta.current_page * meta.per_page, meta.total) }} of {{ meta.total }}</p>
        <div class="flex items-center gap-1">
          <button class="cursor-pointer px-2.5 py-1.5 text-sm rounded-md border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-40" :disabled="meta.current_page === 1" @click="fetchTransactions(meta.current_page - 1)">&lsaquo;</button>
          <template v-for="p in pages" :key="p">
            <span v-if="p === '...'" class="px-2 text-gray-400 text-sm">…</span>
            <button v-else class="cursor-pointer px-2.5 py-1.5 text-sm rounded-md border transition-colors" :class="p === meta.current_page ? 'border-primary bg-primary text-white' : 'border-gray-300 text-gray-600 hover:bg-gray-50'" @click="fetchTransactions(p as number)">{{ p }}</button>
          </template>
          <button class="cursor-pointer px-2.5 py-1.5 text-sm rounded-md border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-40" :disabled="meta.current_page === meta.last_page" @click="fetchTransactions(meta.current_page + 1)">&rsaquo;</button>
        </div>
      </div>
    </div>
  </div>
</template>
