<script setup lang="ts">
definePageMeta({ layout: 'admin-layout' })

const { $api } = useNuxtApp()
const { storageUrl } = useStorage()

// ── State ──────────────────────────────────────────────────────────────────
const loading = ref(true)
const data    = ref<any>(null)

const fetch = async () => {
  loading.value = true
  try {
    const { data: res } = await $api.get('/v1/dashboard')
    data.value = res.data
  } finally {
    loading.value = false
  }
}

onMounted(fetch)

// ── Helpers ────────────────────────────────────────────────────────────────
const fmtUgx = (v: number | string | null) =>
  v ? 'UGX ' + Number(v).toLocaleString('en-UG', { maximumFractionDigits: 0 }) : '—'

const fmtDate = (d: string) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const timeAgo = (d: string) => {
  const diff = Date.now() - new Date(d).getTime()
  const mins  = Math.floor(diff / 60000)
  if (mins < 60)   return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)    return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const vehicleStatusColor = (s: string) => ({
  available:  'bg-green-100 text-green-700',
  reserved:   'bg-yellow-100 text-yellow-700',
  sold:       'bg-red-100 text-red-600',
  in_transit: 'bg-blue-100 text-blue-700',
  draft:      'bg-gray-100 text-gray-500',
}[s] ?? 'bg-gray-100 text-gray-500')

const importStatusColor = (s: string) => ({
  enquiry:            'bg-gray-100 text-gray-700',
  quoted:             'bg-blue-100 text-blue-700',
  accepted:           'bg-indigo-100 text-indigo-700',
  sourcing:           'bg-purple-100 text-purple-700',
  vehicle_found:      'bg-violet-100 text-violet-700',
  purchased:          'bg-cyan-100 text-cyan-700',
  pre_shipment:       'bg-sky-100 text-sky-700',
  shipped:            'bg-teal-100 text-teal-700',
  port_arrived:       'bg-emerald-100 text-emerald-700',
  customs_clearance:  'bg-lime-100 text-lime-700',
  in_transit_uganda:  'bg-yellow-100 text-yellow-700',
  delivered:          'bg-orange-100 text-orange-700',
  completed:          'bg-green-100 text-green-700',
  stalled:            'bg-amber-100 text-amber-700',
  cancelled:          'bg-red-100 text-red-700',
}[s] ?? 'bg-gray-100 text-gray-600')

const fmtStatus = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

const serviceTypeLabel = (t: string) => ({
  full_import:        'Full Import',
  sourcing_only:      'Sourcing Only',
  mombasa_clearance:  'Mombasa Clearance',
  consultation:       'Consultation',
  custom:             'Custom Plan',
}[t] ?? t)
</script>

<template>
  <div class="p-6 space-y-6">

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20 text-gray-400">
      <i class="fa-solid fa-spinner fa-spin text-3xl"></i>
    </div>

    <template v-else-if="data">

      <!-- ── Top stat cards ──────────────────────────────────────────────── -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">

        <!-- Vehicles -->
        <NuxtLink to="/backoffice/vehicles" class="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow block">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-xs text-gray-500 mb-1">Total Vehicles</p>
              <p class="text-2xl font-bold text-gray-900">{{ data.vehicles.total }}</p>
              <p class="text-xs text-gray-400 mt-1">
                <span class="text-green-600 font-medium">{{ data.vehicles.available }} available</span>
                · {{ data.vehicles.published }} listed
              </p>
            </div>
            <div class="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
              <i class="fa-solid fa-car text-blue-600 text-sm"></i>
            </div>
          </div>
        </NuxtLink>

        <!-- Active Imports -->
        <NuxtLink to="/backoffice/import-applications" class="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow block">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-xs text-gray-500 mb-1">Active Imports</p>
              <p class="text-2xl font-bold text-gray-900">{{ data.imports.active }}</p>
              <p class="text-xs text-gray-400 mt-1">
                <span v-if="data.imports.stalled > 0" class="text-amber-600 font-medium">{{ data.imports.stalled }} stalled</span>
                <span v-else class="text-gray-400">none stalled</span>
                · {{ data.imports.total }} total
              </p>
            </div>
            <div class="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center shrink-0">
              <i class="fa-solid fa-file-import text-purple-600 text-sm"></i>
            </div>
          </div>
        </NuxtLink>

        <!-- Customers -->
        <NuxtLink to="/backoffice/customers" class="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow block">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-xs text-gray-500 mb-1">Customers</p>
              <p class="text-2xl font-bold text-gray-900">{{ data.customers }}</p>
              <p class="text-xs text-gray-400 mt-1">registered profiles</p>
            </div>
            <div class="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
              <i class="fa-solid fa-users text-emerald-600 text-sm"></i>
            </div>
          </div>
        </NuxtLink>

        <!-- Unread Inquiries -->
        <NuxtLink to="/backoffice/inquiries" class="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow block"
          :class="data.unreadInquiries > 0 ? 'border-amber-300 bg-amber-50/40' : ''">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-xs text-gray-500 mb-1">Unread Inquiries</p>
              <p class="text-2xl font-bold" :class="data.unreadInquiries > 0 ? 'text-amber-600' : 'text-gray-900'">
                {{ data.unreadInquiries }}
              </p>
              <p class="text-xs text-gray-400 mt-1">need attention</p>
            </div>
            <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              :class="data.unreadInquiries > 0 ? 'bg-amber-100' : 'bg-gray-100'">
              <i class="fa-solid fa-envelope text-sm" :class="data.unreadInquiries > 0 ? 'text-amber-600' : 'text-gray-500'"></i>
            </div>
          </div>
        </NuxtLink>
      </div>

      <!-- ── Revenue + Quick Actions row ───────────────────────────────────── -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">

        <!-- Revenue this month -->
        <div class="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5">
          <h3 class="text-sm font-semibold text-gray-700 mb-4">Revenue This Month</h3>
          <p class="text-3xl font-bold text-gray-900">{{ fmtUgx(data.revenueThisMonth) }}</p>
          <p class="text-xs text-gray-400 mt-1">Vehicle sales + import service fees combined</p>

          <!-- Recent transactions -->
          <div v-if="data.recentTransactions.length" class="mt-4 space-y-2">
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Recent Payments</p>
            <div
              v-for="t in data.recentTransactions"
              :key="t.receiptNumber"
              class="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0"
            >
              <div class="flex items-center gap-2 min-w-0">
                <span
                  class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0"
                  :class="t.source === 'vehicle' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'"
                >
                  <i :class="t.source === 'vehicle' ? 'fa-solid fa-car' : 'fa-solid fa-file-import'"></i>
                </span>
                <span class="text-gray-700 truncate">{{ t.label }}</span>
              </div>
              <div class="text-right shrink-0 ml-3">
                <p class="font-semibold text-gray-900 text-xs">{{ fmtUgx(t.amount) }}</p>
                <p class="text-[10px] text-gray-400">{{ timeAgo(t.paidAt) }}</p>
              </div>
            </div>
          </div>
          <p v-else class="text-xs text-gray-400 mt-4">No payments recorded yet this month.</p>
        </div>

        <!-- Quick Actions -->
        <div class="bg-white border border-gray-200 rounded-xl p-5">
          <h3 class="text-sm font-semibold text-gray-700 mb-4">Quick Actions</h3>
          <div class="space-y-1.5">
            <NuxtLink
              to="/backoffice/vehicles/add"
              class="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <i class="fa-solid fa-plus w-4 text-primary text-center"></i>
              Add New Vehicle
            </NuxtLink>
            <NuxtLink
              to="/backoffice/import-applications"
              class="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <i class="fa-solid fa-file-import w-4 text-primary text-center"></i>
              New Import Application
            </NuxtLink>
            <NuxtLink
              to="/backoffice/customers"
              class="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <i class="fa-solid fa-user-plus w-4 text-primary text-center"></i>
              Add Customer
            </NuxtLink>
            <NuxtLink
              to="/backoffice/tax-settings"
              class="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <i class="fa-solid fa-sliders w-4 text-primary text-center"></i>
              Tax Settings
            </NuxtLink>
            <NuxtLink
              to="/backoffice/valuations"
              class="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <i class="fa-solid fa-chart-line w-4 text-primary text-center"></i>
              Update Valuations
            </NuxtLink>
            <NuxtLink
              to="/backoffice/inquiries"
              class="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <i class="fa-solid fa-envelope w-4 text-primary text-center"></i>
              View Inquiries
              <span v-if="data.unreadInquiries > 0" class="ml-auto text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold">
                {{ data.unreadInquiries }}
              </span>
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- ── Recent Vehicles + Active Imports ───────────────────────────────── -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">

        <!-- Recent Vehicles -->
        <div class="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 class="text-sm font-semibold text-gray-700">Recent Vehicles</h3>
            <NuxtLink to="/backoffice/vehicles" class="text-xs text-primary hover:underline">View all</NuxtLink>
          </div>
          <div v-if="data.recentVehicles.length" class="divide-y divide-gray-50">
            <NuxtLink
              v-for="v in data.recentVehicles"
              :key="v.id"
              :to="`/backoffice/vehicles/${v.id}`"
              class="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
            >
              <!-- Thumbnail -->
              <div class="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                <img v-if="v.image" :src="storageUrl(v.image)" :alt="v.model" class="w-full h-full object-cover">
                <i v-else class="fa-solid fa-car text-gray-300 text-lg"></i>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-800 truncate">{{ v.brand }} {{ v.model }}</p>
                <p class="text-xs text-gray-400">{{ v.year }} · {{ v.reference }}</p>
              </div>
              <div class="text-right shrink-0">
                <span class="inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold" :class="vehicleStatusColor(v.status)">
                  {{ fmtStatus(v.status) }}
                </span>
                <p class="text-xs text-gray-500 mt-0.5">{{ v.sellingPrice ? fmtUgx(v.sellingPrice) : '—' }}</p>
              </div>
            </NuxtLink>
          </div>
          <p v-else class="px-5 py-8 text-center text-sm text-gray-400">No vehicles yet.</p>
        </div>

        <!-- Active Import Applications -->
        <div class="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 class="text-sm font-semibold text-gray-700">Active Imports</h3>
            <NuxtLink to="/backoffice/import-applications" class="text-xs text-primary hover:underline">View all</NuxtLink>
          </div>
          <div v-if="data.recentImports.length" class="divide-y divide-gray-50">
            <NuxtLink
              v-for="a in data.recentImports"
              :key="a.id"
              :to="`/backoffice/import-applications/${a.id}`"
              class="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
            >
              <div class="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                <i class="fa-solid fa-file-import text-purple-500 text-sm"></i>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-800 truncate">{{ a.clientName }}</p>
                <p class="text-xs text-gray-400">{{ serviceTypeLabel(a.serviceType) }} · {{ a.reference }}</p>
              </div>
              <div class="text-right shrink-0">
                <span class="inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold" :class="importStatusColor(a.status)">
                  {{ fmtStatus(a.status) }}
                </span>
                <p class="text-xs text-gray-400 mt-0.5">{{ timeAgo(a.createdAt) }}</p>
              </div>
            </NuxtLink>
          </div>
          <p v-else class="px-5 py-8 text-center text-sm text-gray-400">No active imports.</p>
        </div>
      </div>

      <!-- ── Unread Inquiries ────────────────────────────────────────────────── -->
      <div v-if="data.recentInquiries.length" class="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 class="text-sm font-semibold text-gray-700">
            Unread Inquiries
            <span class="ml-2 bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-semibold">{{ data.unreadInquiries }}</span>
          </h3>
          <NuxtLink to="/backoffice/inquiries" class="text-xs text-primary hover:underline">View all</NuxtLink>
        </div>
        <div class="divide-y divide-gray-50">
          <NuxtLink
            v-for="inq in data.recentInquiries"
            :key="inq.id"
            to="/backoffice/inquiries"
            class="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors"
          >
            <div class="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 text-xs font-bold text-amber-700">
              {{ inq.name?.charAt(0)?.toUpperCase() ?? '?' }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-800">{{ inq.name }}</p>
              <p class="text-xs text-gray-400 truncate">{{ inq.subject }}</p>
            </div>
            <div class="text-right shrink-0">
              <p class="text-xs text-gray-400">{{ timeAgo(inq.createdAt) }}</p>
              <p class="text-xs text-gray-500 mt-0.5">{{ inq.phone }}</p>
            </div>
          </NuxtLink>
        </div>
      </div>

      <!-- ── Vehicle inventory summary ──────────────────────────────────────── -->
      <div class="bg-white border border-gray-200 rounded-xl p-5">
        <h3 class="text-sm font-semibold text-gray-700 mb-4">Inventory Breakdown</h3>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div class="text-center p-3 bg-green-50 rounded-xl">
            <p class="text-2xl font-bold text-green-700">{{ data.vehicles.available }}</p>
            <p class="text-xs text-green-600 mt-0.5">Available</p>
          </div>
          <div class="text-center p-3 bg-yellow-50 rounded-xl">
            <p class="text-2xl font-bold text-yellow-700">{{ data.vehicles.reserved }}</p>
            <p class="text-xs text-yellow-600 mt-0.5">Reserved</p>
          </div>
          <div class="text-center p-3 bg-blue-50 rounded-xl">
            <p class="text-2xl font-bold text-blue-700">{{ data.vehicles.in_transit }}</p>
            <p class="text-xs text-blue-600 mt-0.5">In Transit</p>
          </div>
          <div class="text-center p-3 bg-red-50 rounded-xl">
            <p class="text-2xl font-bold text-red-700">{{ data.vehicles.sold }}</p>
            <p class="text-xs text-red-600 mt-0.5">Sold</p>
          </div>
        </div>
      </div>

    </template>
  </div>
</template>
