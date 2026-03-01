<script setup lang="ts">
definePageMeta({ layout: 'admin-layout' })

const { $api } = useNuxtApp()

// ── Types ─────────────────────────────────────────────────────────────────
interface ImportApplication {
  id: number
  reference: string
  serviceType: string
  status: string
  timeline: string
  submittedVia: string
  customerId: number | null
  customer: { id: number; name: string; phone: string } | null
  applicantName: string | null
  applicantPhone: string | null
  applicantEmail: string | null
  vehicleDescription: string | null
  vehicleYear: number | null
  budgetUsd: string | null
  serviceFeeUgx: string | null
  assignedUser: { id: number; name: string } | null
  createdAt: string
}
interface Stats {
  summary: {
    total: number
    active: number
    completed: number
    stalled: number
    cancelled: number
    period: string
    serviceFeeIncome: number
  }
  byServiceType: Record<string, number>
  byStatus: Record<string, number>
}
interface Meta { current_page: number; last_page: number; total: number; per_page: number }
interface NewAppForm {
  customer_id: string
  applicant_name: string
  applicant_phone: string
  applicant_email: string
  service_type: string
  vehicle_description: string
  vehicle_year: string
  vehicle_link: string
  budget_usd: string
  timeline: string
  service_fee_ugx: string
  submitted_via: string
  notes: string
  internal_notes: string
}

// ── State ─────────────────────────────────────────────────────────────────
const applications  = ref<ImportApplication[]>([])
const stats         = ref<Stats | null>(null)
const meta          = ref<Meta>({ current_page: 1, last_page: 1, total: 0, per_page: 15 })
const loadingList   = ref(false)
const loadingStats  = ref(false)
const search        = ref('')
const filterStatus  = ref('')
const filterType    = ref('')
const statsPeriod   = ref('month')
const searchTimer   = ref<ReturnType<typeof setTimeout> | null>(null)

// ── New Application modal ─────────────────────────────────────────────────
const showModal  = ref(false)
const saving     = ref(false)
const modalError = ref('')
const form = ref<NewAppForm>({
  customer_id: '',
  applicant_name: '',
  applicant_phone: '',
  applicant_email: '',
  service_type: 'full_import',
  vehicle_description: '',
  vehicle_year: '',
  vehicle_link: '',
  budget_usd: '',
  timeline: 'flexible',
  service_fee_ugx: '',
  submitted_via: 'backoffice',
  notes: '',
  internal_notes: '',
})

// ── Fetch stats ───────────────────────────────────────────────────────────
const fetchStats = async () => {
  loadingStats.value = true
  try {
    const { data } = await $api.get('/v1/import-applications/stats', { params: { period: statsPeriod.value } })
    stats.value = data.data
  } finally {
    loadingStats.value = false
  }
}

// ── Fetch list ────────────────────────────────────────────────────────────
const fetchList = async (page = 1) => {
  loadingList.value = true
  try {
    const params: Record<string, any> = { page }
    if (search.value.trim()) params.search = search.value.trim()
    if (filterStatus.value)  params.status = filterStatus.value
    if (filterType.value)    params.service_type = filterType.value
    const { data } = await $api.get('/v1/import-applications', { params })
    applications.value = data.data
    meta.value         = data.meta
  } finally {
    loadingList.value = false
  }
}

const onSearch = () => {
  if (searchTimer.value) clearTimeout(searchTimer.value)
  searchTimer.value = setTimeout(() => fetchList(1), 400)
}

watch([filterStatus, filterType], () => fetchList(1))
watch(statsPeriod, () => fetchStats())

// ── Create application ────────────────────────────────────────────────────
const openModal = () => {
  form.value = {
    customer_id: '', applicant_name: '', applicant_phone: '', applicant_email: '',
    service_type: 'full_import', vehicle_description: '', vehicle_year: '',
    vehicle_link: '', budget_usd: '', timeline: 'flexible', service_fee_ugx: '',
    submitted_via: 'backoffice', notes: '', internal_notes: '',
  }
  modalError.value = ''
  showModal.value = true
}

const submitNew = async () => {
  saving.value = true
  modalError.value = ''
  try {
    const payload: Record<string, any> = { ...form.value }
    // clean up empty strings
    Object.keys(payload).forEach(k => { if (payload[k] === '') delete payload[k] })
    const { data } = await $api.post('/v1/import-applications', payload)
    showModal.value = false
    await navigateTo(`/backoffice/import-applications/${data.data.id}`)
  } catch (err: any) {
    modalError.value = err?.response?.data?.message ?? 'Failed to create application'
  } finally {
    saving.value = false
  }
}

// ── Delete ────────────────────────────────────────────────────────────────
const deleteApp = async (app: ImportApplication) => {
  if (!confirm(`Delete application ${app.reference}? This cannot be undone.`)) return
  try {
    await $api.delete(`/v1/import-applications/${app.id}`)
    await fetchList(meta.value.current_page)
  } catch {}
}

// ── Helpers ───────────────────────────────────────────────────────────────
const statusColor = (s: string) => ({
  enquiry: 'bg-gray-100 text-gray-700',
  quoted: 'bg-blue-100 text-blue-700',
  accepted: 'bg-indigo-100 text-indigo-700',
  sourcing: 'bg-purple-100 text-purple-700',
  vehicle_found: 'bg-violet-100 text-violet-700',
  purchased: 'bg-cyan-100 text-cyan-700',
  pre_shipment: 'bg-sky-100 text-sky-700',
  shipped: 'bg-teal-100 text-teal-700',
  port_arrived: 'bg-emerald-100 text-emerald-700',
  customs_clearance: 'bg-lime-100 text-lime-700',
  in_transit_uganda: 'bg-yellow-100 text-yellow-700',
  delivered: 'bg-orange-100 text-orange-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  stalled: 'bg-amber-100 text-amber-700',
}[s] ?? 'bg-gray-100 text-gray-600')

const serviceTypeLabel = (t: string) => ({
  full_import: 'Full Import',
  sourcing_only: 'Sourcing Only',
  mombasa_clearance: 'Mombasa Clearance',
  consultation: 'Consultation',
  custom: 'Custom Plan',
}[t] ?? t)

const applicantName = (app: ImportApplication) =>
  app.customer?.name ?? app.applicantName ?? '—'

const fmtStatus = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

// ── Pagination ────────────────────────────────────────────────────────────
const pages = computed(() => {
  const total = meta.value.last_page
  const cur   = meta.value.current_page
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '...')[] = [1]
  if (cur > 3) pages.push('...')
  for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i)
  if (cur < total - 2) pages.push('...')
  pages.push(total)
  return pages
})

// ── Init ──────────────────────────────────────────────────────────────────
onMounted(() => {
  fetchStats()
  fetchList()
})
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Import Applications</h1>
        <p class="text-sm text-gray-500 mt-0.5">Manage import assistance requests</p>
      </div>
      <button
        class="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        @click="openModal"
      >
        <i class="fa-solid fa-plus"></i>
        New Application
      </button>
    </div>

    <!-- Stats Period Tabs -->
    <div class="flex gap-2">
      <button
        v-for="p in ['week','month','quarter','year']"
        :key="p"
        class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
        :class="statsPeriod === p ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'"
        @click="statsPeriod = p"
      >
        {{ p.charAt(0).toUpperCase() + p.slice(1) }}
      </button>
    </div>

    <!-- Stats Cards -->
    <div v-if="stats" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500 mb-1">Total</p>
        <p class="text-2xl font-bold text-gray-900">{{ stats.summary.total }}</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500 mb-1">Active</p>
        <p class="text-2xl font-bold text-blue-600">{{ stats.summary.active }}</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500 mb-1">Completed</p>
        <p class="text-2xl font-bold text-green-600">{{ stats.summary.completed }}</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500 mb-1">Stalled</p>
        <p class="text-2xl font-bold text-amber-600">{{ stats.summary.stalled }}</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500 mb-1">Cancelled</p>
        <p class="text-2xl font-bold text-red-500">{{ stats.summary.cancelled }}</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500 mb-1">Service Fee Income</p>
        <p class="text-lg font-bold text-gray-800">{{ (stats.summary.serviceFeeIncome / 1_000_000).toFixed(1) }}M UGX</p>
      </div>
    </div>
    <div v-else-if="loadingStats" class="grid grid-cols-2 md:grid-cols-6 gap-4">
      <div v-for="i in 6" :key="i" class="bg-white rounded-xl border border-gray-200 p-4 h-20 animate-pulse bg-gray-100"></div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-xl border border-gray-200 p-4">
      <div class="flex flex-wrap gap-3 items-center">
        <div class="relative flex-1 min-w-52">
          <i class="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
          <input
            v-model="search"
            type="text"
            placeholder="Search reference, name, phone…"
            class="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            @input="onSearch"
          />
        </div>
        <select
          v-model="filterStatus"
          class="border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">All Statuses</option>
          <option value="enquiry">Enquiry</option>
          <option value="quoted">Quoted</option>
          <option value="accepted">Accepted</option>
          <option value="sourcing">Sourcing</option>
          <option value="vehicle_found">Vehicle Found</option>
          <option value="purchased">Purchased</option>
          <option value="pre_shipment">Pre-Shipment</option>
          <option value="shipped">Shipped</option>
          <option value="port_arrived">Port Arrived</option>
          <option value="customs_clearance">Customs Clearance</option>
          <option value="in_transit_uganda">In Transit Uganda</option>
          <option value="delivered">Delivered</option>
          <option value="completed">Completed</option>
          <option value="stalled">Stalled</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          v-model="filterType"
          class="border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">All Service Types</option>
          <option value="full_import">Full Import</option>
          <option value="sourcing_only">Sourcing Only</option>
          <option value="mombasa_clearance">Mombasa Clearance</option>
          <option value="consultation">Consultation</option>
          <option value="custom">Custom Plan</option>
        </select>
        <span class="text-sm text-gray-500 ml-auto">{{ meta.total }} application{{ meta.total !== 1 ? 's' : '' }}</span>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-200">
              <th class="text-left px-4 py-3 font-medium text-gray-600">Reference</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">Applicant</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">Service Type</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">Vehicle</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">Assigned To</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">Created</th>
              <th class="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            <!-- Loading skeleton -->
            <template v-if="loadingList">
              <tr v-for="i in 5" :key="i" class="border-b border-gray-100">
                <td v-for="c in 8" :key="c" class="px-4 py-3">
                  <div class="h-4 bg-gray-100 rounded animate-pulse"></div>
                </td>
              </tr>
            </template>

            <!-- Empty state -->
            <tr v-else-if="applications.length === 0">
              <td colspan="8" class="px-4 py-12 text-center text-gray-400">
                <i class="fa-solid fa-file-import text-3xl mb-2 block"></i>
                No applications found.
                <button class="ml-1 text-primary hover:underline" @click="openModal">Create one</button>
              </td>
            </tr>

            <!-- Rows -->
            <tr
              v-else
              v-for="app in applications"
              :key="app.id"
              class="border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <td class="px-4 py-3">
                <span class="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{{ app.reference }}</span>
              </td>
              <td class="px-4 py-3">
                <p class="font-medium text-gray-800">{{ applicantName(app) }}</p>
                <p class="text-xs text-gray-400">{{ app.applicantPhone ?? app.customer?.phone ?? '' }}</p>
              </td>
              <td class="px-4 py-3">
                <span class="text-gray-700">{{ serviceTypeLabel(app.serviceType) }}</span>
              </td>
              <td class="px-4 py-3">
                <span class="text-gray-600 text-xs">
                  {{ app.vehicleYear ? app.vehicleYear + ' · ' : '' }}{{ app.vehicleDescription ? app.vehicleDescription.slice(0, 40) : '—' }}
                </span>
              </td>
              <td class="px-4 py-3">
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" :class="statusColor(app.status)">
                  {{ fmtStatus(app.status) }}
                </span>
              </td>
              <td class="px-4 py-3 text-gray-600 text-xs">
                {{ app.assignedUser?.name ?? '—' }}
              </td>
              <td class="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                {{ new Date(app.createdAt).toLocaleDateString() }}
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2 justify-end">
                  <NuxtLink
                    :to="`/backoffice/import-applications/${app.id}`"
                    class="text-gray-400 hover:text-primary transition-colors"
                    title="View"
                  >
                    <i class="fa-solid fa-eye"></i>
                  </NuxtLink>
                  <button
                    class="text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete"
                    @click="deleteApp(app)"
                  >
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="meta.last_page > 1" class="flex items-center justify-between px-4 py-3 border-t border-gray-200">
        <p class="text-sm text-gray-500">
          Showing {{ (meta.current_page - 1) * meta.per_page + 1 }}–{{ Math.min(meta.current_page * meta.per_page, meta.total) }} of {{ meta.total }}
        </p>
        <div class="flex gap-1">
          <button
            v-for="p in pages" :key="p"
            :disabled="p === '...'"
            class="min-w-[2rem] h-8 px-2 rounded text-sm transition-colors"
            :class="p === meta.current_page
              ? 'bg-primary text-white font-medium'
              : p === '...' ? 'text-gray-400 cursor-default' : 'hover:bg-gray-100 text-gray-700'"
            @click="typeof p === 'number' && fetchList(p)"
          >{{ p }}</button>
        </div>
      </div>
    </div>
  </div>

  <!-- New Application Modal -->
  <Teleport to="body">
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">New Import Application</h2>
          <button class="text-gray-400 hover:text-gray-600" @click="showModal = false">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>

        <form class="p-6 space-y-4" @submit.prevent="submitNew">
          <!-- Applicant -->
          <fieldset class="border border-gray-200 rounded-lg p-4 space-y-3">
            <legend class="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">Applicant Details</legend>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Name</label>
                <input v-model="form.applicant_name" type="text" placeholder="Full name" class="input-field" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                <input v-model="form.applicant_phone" type="text" placeholder="+256 …" class="input-field" />
              </div>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Email</label>
              <input v-model="form.applicant_email" type="email" placeholder="email@example.com" class="input-field" />
            </div>
          </fieldset>

          <!-- Service -->
          <fieldset class="border border-gray-200 rounded-lg p-4 space-y-3">
            <legend class="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">Service</legend>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Service Type <span class="text-red-500">*</span></label>
                <select v-model="form.service_type" required class="input-field">
                  <option value="full_import">Full Import</option>
                  <option value="sourcing_only">Sourcing Only</option>
                  <option value="mombasa_clearance">Mombasa Clearance</option>
                  <option value="consultation">Consultation</option>
                  <option value="custom">Custom Plan</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Timeline</label>
                <select v-model="form.timeline" class="input-field">
                  <option value="asap">ASAP</option>
                  <option value="1month">1 Month</option>
                  <option value="2_3months">2–3 Months</option>
                  <option value="6months">6 Months</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Budget (USD)</label>
                <input v-model="form.budget_usd" type="number" min="0" step="100" placeholder="0" class="input-field" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Service Fee (UGX)</label>
                <input v-model="form.service_fee_ugx" type="number" min="0" step="1000" placeholder="0" class="input-field" />
              </div>
            </div>
          </fieldset>

          <!-- Vehicle -->
          <fieldset class="border border-gray-200 rounded-lg p-4 space-y-3">
            <legend class="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">Vehicle Details</legend>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Vehicle Description</label>
              <input v-model="form.vehicle_description" type="text" placeholder="e.g. Toyota Prado 2018 V8" class="input-field" />
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Vehicle Year</label>
                <input v-model="form.vehicle_year" type="number" min="1980" :max="new Date().getFullYear() + 1" placeholder="2020" class="input-field" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Vehicle Link (URL)</label>
                <input v-model="form.vehicle_link" type="url" placeholder="https://…" class="input-field" />
              </div>
            </div>
          </fieldset>

          <!-- Notes -->
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Notes (customer-visible)</label>
            <textarea v-model="form.notes" rows="2" class="input-field resize-none"></textarea>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Internal Notes</label>
            <textarea v-model="form.internal_notes" rows="2" class="input-field resize-none"></textarea>
          </div>

          <div v-if="modalError" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
            {{ modalError }}
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button type="button" class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" @click="showModal = false">
              Cancel
            </button>
            <button
              type="submit"
              :disabled="saving"
              class="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              <i v-if="saving" class="fa-solid fa-spinner fa-spin mr-1"></i>
              {{ saving ? 'Creating…' : 'Create Application' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
@reference "~/assets/css/main.css";
.input-field {
  @apply w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30;
}
</style>
