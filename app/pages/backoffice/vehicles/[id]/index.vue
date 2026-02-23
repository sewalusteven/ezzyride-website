<script setup lang="ts">
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/vue'
definePageMeta({ layout: 'admin-layout' })
const { $api } = useNuxtApp()
const route = useRoute()
const id = route.params.id as string

// ── State ──────────────────────────────────────────────────────────────────
const vehicle   = ref<any>(null)
const loading   = ref(true)
const tab       = ref<'details' | 'importation' | 'costs' | 'transactions' | 'client' | 'documents'>('details')

// Sub-form state
const saving     = ref(false)
const formError  = ref('')
const formSuccess= ref('')

// Importation form
const importForm = ref<Record<string, any>>({})

// Cost add form
const costForm = ref({ category: 'other', description: '', amount: '', currency: 'ugx', exchange_rate_used: '', amount_ugx: '', incurred_at: '' })
const addingCost = ref(false)
const costError  = ref('')

// Payment form
const paymentForm = ref({ amount: '', payment_method: 'cash', reference_number: '', notes: '', paid_at: new Date().toISOString().split('T')[0] })
const addingPayment = ref(false)
const paymentError = ref('')

// Sale form
const saleForm = ref({ agreed_price: '', reservation_deposit: '', notes: '', sale_date: '', customer_id: '' })
const savingSale = ref(false)
const saleError = ref('')

// Customer form
const customerForm = ref({ name: '', phone: '', email: '', id_type: 'nin', id_number: '', address: '', notes: '' })
const savingCustomer = ref(false)
const customerError = ref('')
const customers = ref<any[]>([])
const showNewCustomer = ref(false)

// Document form
const docForm = ref({ name: '', type: 'other' })
const docFile = ref<File | null>(null)
const uploadingDoc = ref(false)
const docError = ref('')

// Activity log note
const noteText = ref('')
const addingNote = ref(false)

const sources = ref<any[]>([])

// ── Fetch ──────────────────────────────────────────────────────────────────
const fetchVehicle = async () => {
  loading.value = true
  try {
    const { data } = await $api.get(`/v1/vehicles/${id}`)
    vehicle.value = data.data
    importForm.value = {
      source_platform_id: data.data.importation?.source_platform_id ?? '',
      source_url: data.data.importation?.source_url ?? '',
      auction_reference: data.data.importation?.auction_reference ?? '',
      shipping_line: data.data.importation?.shipping_line ?? '',
      bl_number: data.data.importation?.bl_number ?? '',
      eta: data.data.importation?.eta ?? '',
      status: data.data.importation?.status ?? 'auction_won',
      notes: data.data.importation?.notes ?? '',
    }
    if (data.data.sale) {
      saleForm.value = {
        agreed_price: data.data.sale.agreed_price ?? '',
        reservation_deposit: data.data.sale.reservation_deposit ?? '',
        notes: data.data.sale.notes ?? '',
        sale_date: data.data.sale.sale_date ?? '',
        customer_id: data.data.sale.customer_id ?? '',
      }
    }
  } finally {
    loading.value = false
  }
}

const fetchSources = async () => {
  const { data } = await $api.get('/v1/config/source-platforms')
  sources.value = data.data
}

const fetchCustomers = async () => {
  const { data } = await $api.get('/v1/customers')
  customers.value = data.data.data ?? data.data
}

onMounted(async () => {
  await fetchVehicle()
  fetchSources()
  fetchCustomers()
})

// ── Save importation ───────────────────────────────────────────────────────
const saveImportation = async () => {
  saving.value = true; formError.value = ''; formSuccess.value = ''
  try {
    await $api.put(`/v1/vehicles/${id}/importation`, importForm.value)
    formSuccess.value = 'Importation saved'
    await fetchVehicle()
  } catch (e: any) {
    formError.value = e.response?.data?.message ?? 'Failed to save'
  } finally {
    saving.value = false
  }
}

// ── Add cost ───────────────────────────────────────────────────────────────
const addCost = async () => {
  addingCost.value = true; costError.value = ''
  try {
    // Auto-calculate UGX if USD
    if (costForm.value.currency === 'usd' && costForm.value.exchange_rate_used) {
      costForm.value.amount_ugx = String(Number(costForm.value.amount) * Number(costForm.value.exchange_rate_used))
    } else {
      costForm.value.amount_ugx = costForm.value.amount
    }
    await $api.post(`/v1/vehicles/${id}/costs`, costForm.value)
    costForm.value = { category: 'other', description: '', amount: '', currency: 'ugx', exchange_rate_used: '', amount_ugx: '', incurred_at: '' }
    await fetchVehicle()
  } catch (e: any) {
    const errs = e.response?.data?.data
    costError.value = errs ? Object.values(errs).flat().join(' · ') : (e.response?.data?.message ?? 'Failed')
  } finally {
    addingCost.value = false
  }
}

const deleteCost = (costId: number) => {
  requestConfirm('Remove Cost', 'Are you sure you want to remove this cost entry?', async () => {
    await $api.delete(`/v1/vehicles/${id}/costs/${costId}`)
    await fetchVehicle()
  })
}

// ── Save sale & add payment ────────────────────────────────────────────────
const saveSale = async () => {
  savingSale.value = true; saleError.value = ''
  try {
    await $api.put(`/v1/vehicles/${id}/sale`, saleForm.value)
    formSuccess.value = 'Sale information saved'
    await fetchVehicle()
  } catch (e: any) {
    saleError.value = e.response?.data?.message ?? 'Failed'
  } finally {
    savingSale.value = false
  }
}

const addPayment = async () => {
  addingPayment.value = true; paymentError.value = ''
  try {
    await $api.post(`/v1/vehicles/${id}/sale/payments`, paymentForm.value)
    paymentForm.value = { amount: '', payment_method: 'cash', reference_number: '', notes: '', paid_at: new Date().toISOString().split('T')[0] }
    await fetchVehicle()
  } catch (e: any) {
    const errs = e.response?.data?.data
    paymentError.value = errs ? Object.values(errs).flat().join(' · ') : (e.response?.data?.message ?? 'Failed')
  } finally {
    addingPayment.value = false
  }
}

// ── Create customer & attach ───────────────────────────────────────────────
const saveCustomer = async () => {
  savingCustomer.value = true; customerError.value = ''
  try {
    const { data } = await $api.post('/v1/customers', customerForm.value)
    customers.value.unshift(data.data)
    saleForm.value.customer_id = data.data.id
    showNewCustomer.value = false
  } catch (e: any) {
    const errs = e.response?.data?.data
    customerError.value = errs ? Object.values(errs).flat().join(' · ') : 'Failed'
  } finally {
    savingCustomer.value = false
  }
}

// ── Upload document ────────────────────────────────────────────────────────
const onDocFile = (e: Event) => {
  docFile.value = (e.target as HTMLInputElement).files?.[0] ?? null
  if (docFile.value && !docForm.value.name) docForm.value.name = docFile.value.name
}

const uploadDoc = async () => {
  if (!docFile.value) return
  uploadingDoc.value = true; docError.value = ''
  const fd = new FormData()
  fd.append('document', docFile.value)
  fd.append('name', docForm.value.name)
  fd.append('type', docForm.value.type)
  try {
    await $api.post(`/v1/vehicles/${id}/documents`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    docForm.value = { name: '', type: 'other' }; docFile.value = null
    await fetchVehicle()
  } catch (e: any) {
    docError.value = e.response?.data?.message ?? 'Upload failed'
  } finally {
    uploadingDoc.value = false
  }
}

const deleteDoc = (docId: number) => {
  requestConfirm('Remove Document', 'Are you sure you want to remove this document?', async () => {
    await $api.delete(`/v1/vehicles/${id}/documents/${docId}`)
    await fetchVehicle()
  })
}

// ── Add note ───────────────────────────────────────────────────────────────
const addNote = async () => {
  if (!noteText.value.trim()) return
  addingNote.value = true
  try {
    await $api.post(`/v1/vehicles/${id}/activity-log`, { notes: noteText.value })
    noteText.value = ''
    await fetchVehicle()
  } finally {
    addingNote.value = false
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────
const { storageUrl } = useStorage()
const fmtUGX = (n: any) => n ? new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(Number(n)) : '—'
const fmtDate= (s: string) => s ? new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const fmtDateTime = (s: string) => s ? new Date(s).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600', in_transit: 'bg-blue-100 text-blue-700',
  available: 'bg-green-100 text-green-700', reserved: 'bg-yellow-100 text-yellow-700', sold: 'bg-red-100 text-red-600',
}

const totalCosts = computed(() => vehicle.value?.costs?.reduce((sum: number, c: any) => sum + Number(c.amount_ugx), 0) ?? 0)
const totalPaid  = computed(() => vehicle.value?.payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) ?? 0)
const balance    = computed(() => {
  const agreed = Number(vehicle.value?.sale?.agreed_price ?? 0)
  return agreed - totalPaid.value
})

const importSteps = [
  { key: 'auction_won', label: 'Auction Won' },
  { key: 'payment_made', label: 'Payment Made' },
  { key: 'pre_shipment_inspection', label: 'Inspection' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'in_transit', label: 'In Transit' },
  { key: 'port_arrived', label: 'Port Arrived' },
  { key: 'customs_lodged', label: 'Customs Lodged' },
  { key: 'customs_cleared', label: 'Cleared' },
  { key: 'in_country', label: 'In Country' },
  { key: 'delivered', label: 'Delivered' },
]

const currentStepIdx = computed(() => importSteps.findIndex(s => s.key === importForm.value.status))

const tabKeys = ['details', 'importation', 'costs', 'transactions', 'client', 'documents'] as const
const tabIndex = computed(() => tabKeys.indexOf(tab.value))

// ── Confirm dialog ─────────────────────────────────────────────────────────
const confirmState = ref({ show: false, title: '', message: '', action: null as (() => void) | null })
const requestConfirm = (title: string, message: string, action: () => void) => {
  confirmState.value = { show: true, title, message, action }
}
const doConfirm = async () => {
  await confirmState.value.action?.()
  confirmState.value.show = false
}
const cancelConfirm = () => { confirmState.value.show = false }
</script>

<template>
  <div class="p-6 space-y-5">
    <!-- Loading -->
    <div v-if="loading" class="py-16 text-center text-gray-400">
      <i class="fa-solid fa-spinner fa-spin text-2xl mb-2 block"></i>
      <p class="text-sm">Loading vehicle…</p>
    </div>

    <template v-else-if="vehicle">
      <!-- Header -->
      <div class="flex items-center gap-4">
        <NuxtLink to="/backoffice/vehicles" class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
          <i class="fa-solid fa-arrow-left"></i>
        </NuxtLink>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-3">
            <h2 class="text-xl font-semibold text-gray-900 truncate">{{ vehicle.brand?.name }} {{ vehicle.model }} ({{ vehicle.year }})</h2>
            <span class="font-mono text-xs font-semibold text-secondary bg-secondary/10 px-2 py-0.5 rounded">{{ vehicle.reference }}</span>
            <span class="text-xs px-2 py-0.5 rounded-full font-medium" :class="statusColors[vehicle.status]">{{ vehicle.status.replace('_',' ') }}</span>
          </div>
          <p class="text-sm text-gray-500 mt-0.5">{{ vehicle.category?.name }} · {{ vehicle.colour ?? 'No colour' }} · {{ vehicle.transmission }} · {{ vehicle.fuelType }}</p>
        </div>
        <NuxtLink :to="`/backoffice/vehicles/${id}/edit`" class="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-600 rounded-md text-sm hover:bg-gray-50">
          <i class="fa-solid fa-pen"></i> Edit
        </NuxtLink>
      </div>

      <!-- Success/Error banner -->
      <div v-if="formSuccess" class="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700">
        <i class="fa-solid fa-circle-check shrink-0"></i>
        <span>{{ formSuccess }}</span>
        <button class="cursor-pointer ml-auto text-green-600 hover:text-green-800" @click="formSuccess = ''"><i class="fa-solid fa-times"></i></button>
      </div>
      <div v-if="formError" class="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
        <i class="fa-solid fa-circle-exclamation shrink-0"></i><span>{{ formError }}</span>
        <button class="cursor-pointer ml-auto" @click="formError = ''"><i class="fa-solid fa-times"></i></button>
      </div>

      <!-- Tabs -->
      <div class="p-2 bg-white rounded shadow">
        <TabGroup :selectedIndex="tabIndex" @change="(i: number) => { const t = tabKeys[i]; if (t) tab = t }">
      <div class="border-b border-gray-200 mb-4">
        <TabList as="nav" class="flex -mb-px overflow-x-auto">
          <Tab v-for="t in [
            { key: 'details', label: 'Details', icon: 'fa-info-circle' },
            { key: 'importation', label: 'Importation', icon: 'fa-ship' },
            { key: 'costs', label: 'Costs', icon: 'fa-receipt' },
            { key: 'transactions', label: 'Transactions', icon: 'fa-money-bill-wave' },
            { key: 'client', label: 'Client', icon: 'fa-user' },
            { key: 'documents', label: 'Documents', icon: 'fa-file' },
          ]" :key="t.key" as="template" v-slot="{ selected }">
            <button
              class="cursor-pointer flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap"
              :class="selected ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'"
            >
              <i :class="`fa-solid ${t.icon} text-xs`"></i>{{ t.label }}
            </button>
          </Tab>
        </TabList>
      </div>
      <TabPanels>

      <!-- ══ DETAILS TAB ═══════════════════════════════════════════════ -->
      <TabPanel>
      <div class="grid grid-cols-3 gap-5">
        <div class="col-span-2 space-y-5">
          <!-- Images -->
          <div class="bg-white rounded-lg border border-gray-200 p-5">
            <h3 class="font-semibold text-gray-900 text-sm mb-4">Images</h3>
            <div v-if="vehicle.images?.length" class="grid grid-cols-4 gap-3">
              <div v-for="img in vehicle.images" :key="img.id" class="aspect-square rounded-md overflow-hidden bg-gray-100 relative">
                <img :src="storageUrl(img.path)" class="w-full h-full object-cover" :alt="vehicle.model">
                <span v-if="img.isPrimary" class="absolute top-1 left-1 text-[10px] bg-primary text-white px-1.5 py-0.5 rounded font-medium">Primary</span>
              </div>
            </div>
            <p v-else class="text-sm text-gray-400">No images yet — <NuxtLink :to="`/backoffice/vehicles/${id}/edit`" class="text-primary hover:underline">add from the edit page</NuxtLink></p>
          </div>

          <!-- Specs grid -->
          <div class="bg-white rounded-lg border border-gray-200 p-5">
            <h3 class="font-semibold text-gray-900 text-sm mb-4">Specifications</h3>
            <div class="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
              <div class="flex justify-between border-b border-gray-50 pb-2"><span class="text-gray-500">Brand</span><span class="font-medium text-gray-900">{{ vehicle.brand?.name ?? '—' }}</span></div>
              <div class="flex justify-between border-b border-gray-50 pb-2"><span class="text-gray-500">Model</span><span class="font-medium text-gray-900">{{ vehicle.model }}</span></div>
              <div class="flex justify-between border-b border-gray-50 pb-2"><span class="text-gray-500">Year</span><span class="font-medium text-gray-900">{{ vehicle.year }}</span></div>
              <div class="flex justify-between border-b border-gray-50 pb-2"><span class="text-gray-500">Body Type</span><span class="font-medium text-gray-900">{{ vehicle.category?.name ?? '—' }}</span></div>
              <div class="flex justify-between border-b border-gray-50 pb-2"><span class="text-gray-500">Colour</span><span class="font-medium text-gray-900">{{ vehicle.colour ?? '—' }}</span></div>
              <div class="flex justify-between border-b border-gray-50 pb-2"><span class="text-gray-500">VIN</span><span class="font-mono text-xs font-medium text-gray-900">{{ vehicle.vin ?? '—' }}</span></div>
              <div class="flex justify-between border-b border-gray-50 pb-2"><span class="text-gray-500">Engine CC</span><span class="font-medium text-gray-900">{{ vehicle.engineCc ? vehicle.engineCc.toLocaleString() + ' cc' : '—' }}</span></div>
              <div class="flex justify-between border-b border-gray-50 pb-2"><span class="text-gray-500">Mileage</span><span class="font-medium text-gray-900">{{ vehicle.mileage ? vehicle.mileage.toLocaleString() + ' km' : '—' }}</span></div>
              <div class="flex justify-between border-b border-gray-50 pb-2"><span class="text-gray-500">Transmission</span><span class="font-medium text-gray-900 capitalize">{{ vehicle.transmission }}</span></div>
              <div class="flex justify-between border-b border-gray-50 pb-2"><span class="text-gray-500">Fuel Type</span><span class="font-medium text-gray-900 capitalize">{{ vehicle.fuelType }}</span></div>
              <div class="flex justify-between border-b border-gray-50 pb-2"><span class="text-gray-500">Drive</span><span class="font-medium text-gray-900 uppercase">{{ vehicle.driveType }}</span></div>
              <div class="flex justify-between border-b border-gray-50 pb-2"><span class="text-gray-500">Seats</span><span class="font-medium text-gray-900">{{ vehicle.seatingCapacity ?? '—' }}</span></div>
            </div>
          </div>

          <!-- Dynamic attributes -->
          <div v-if="vehicle.attributes?.length" class="bg-white rounded-lg border border-gray-200 p-5">
            <h3 class="font-semibold text-gray-900 text-sm mb-4">Additional Attributes</h3>
            <div class="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
              <div v-for="va in vehicle.attributes" :key="va.id" class="flex justify-between border-b border-gray-50 pb-2">
                <span class="text-gray-500">{{ va.attributeName }}</span>
                <span class="font-medium text-gray-900">{{ va.value }}{{ va.unit ? ' ' + va.unit : '' }}</span>
              </div>
            </div>
          </div>

          <!-- Features -->
          <div v-if="vehicle.features?.length" class="bg-white rounded-lg border border-gray-200 p-5">
            <h3 class="font-semibold text-gray-900 text-sm mb-4">Features</h3>
            <div class="flex flex-wrap gap-2">
              <span v-for="f in vehicle.features" :key="f.id" class="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/5 border border-secondary/20 text-secondary text-xs font-medium rounded-full">
                <i v-if="f.icon" :class="`fa-solid ${f.icon}`"></i>{{ f.name }}
              </span>
            </div>
          </div>

          <!-- Description -->
          <div v-if="vehicle.description" class="bg-white rounded-lg border border-gray-200 p-5">
            <h3 class="font-semibold text-gray-900 text-sm mb-3">Description</h3>
            <p class="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{{ vehicle.description }}</p>
          </div>

          <!-- YouTube -->
          <div v-if="vehicle.youtubeUrl" class="bg-white rounded-lg border border-gray-200 p-5">
            <h3 class="font-semibold text-gray-900 text-sm mb-3">Video</h3>
            <a :href="vehicle.youtubeUrl" target="_blank" class="text-sm text-blue-500 hover:underline flex items-center gap-2">
              <i class="fa-brands fa-youtube text-red-500"></i>{{ vehicle.youtubeUrl }}
            </a>
          </div>
        </div>

        <!-- Right sidebar: pricing + activity log -->
        <div class="space-y-4">
          <div class="bg-secondary text-white rounded-lg p-4">
            <p class="text-xs font-semibold text-blue-200 uppercase tracking-wide mb-3">Pricing Summary</p>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between"><span class="text-blue-300 text-xs">CIF (USD)</span><span class="font-semibold">{{ vehicle.cifUsd ? '$' + Number(vehicle.cifUsd).toLocaleString() : '—' }}</span></div>
              <div class="flex justify-between"><span class="text-blue-300 text-xs">Cost Price</span><span class="font-semibold">{{ fmtUGX(vehicle.costPrice) }}</span></div>
              <div class="flex justify-between border-t border-white/10 pt-2 mt-1"><span class="text-blue-300 text-xs">Asking Price</span><span class="font-semibold text-green-300">{{ fmtUGX(vehicle.sellingPrice) }}</span></div>
              <div v-if="vehicle.soldPrice" class="flex justify-between"><span class="text-blue-300 text-xs">Sold For</span><span class="font-semibold text-yellow-300">{{ fmtUGX(vehicle.soldPrice) }}</span></div>
            </div>
          </div>
          <!-- Activity log -->
          <div class="bg-white rounded-lg border border-gray-200">
            <div class="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <i class="fa-solid fa-timeline text-gray-400 text-sm"></i>
              <h3 class="font-semibold text-gray-900 text-sm">Activity Log</h3>
            </div>
            <div class="p-4">
              <div class="flex gap-2 mb-4">
                <input v-model="noteText" type="text" placeholder="Add a note…" class="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none" @keydown.enter="addNote">
                <button :disabled="addingNote || !noteText.trim()" @click="addNote" class="cursor-pointer px-3 py-2 bg-secondary text-white rounded-md text-sm disabled:opacity-40 hover:bg-blue-800">
                  <i v-if="addingNote" class="fa-solid fa-spinner fa-spin"></i>
                  <i v-else class="fa-solid fa-paper-plane"></i>
                </button>
              </div>
              <div class="space-y-3 max-h-64 overflow-y-auto">
                <div v-for="log in vehicle.activityLog" :key="log.id" class="flex gap-2.5">
                  <div class="w-1.5 h-1.5 rounded-full bg-secondary mt-1.5 shrink-0"></div>
                  <div class="flex-1 min-w-0">
                    <p class="text-xs font-medium text-gray-900">{{ log.action }}</p>
                    <p v-if="log.notes" class="text-xs text-gray-600 mt-0.5">{{ log.notes }}</p>
                    <p class="text-xs text-gray-400 mt-0.5">{{ fmtDateTime(log.created_at) }} · {{ log.user?.name ?? 'System' }}</p>
                  </div>
                </div>
                <p v-if="!vehicle.activityLog?.length" class="text-xs text-gray-400 text-center py-4">No activity yet</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      </TabPanel>

      <!-- ══ IMPORTATION TAB ═══════════════════════════════════════════ -->
      <TabPanel>
      <div class="grid grid-cols-3 gap-5">
        <div class="col-span-2 space-y-5">
          <!-- Import timeline -->
          <div class="bg-white rounded-lg border border-gray-200 p-5">
            <h3 class="font-semibold text-gray-900 text-sm mb-4">Import Status</h3>
            <div class="flex items-center gap-0 overflow-x-auto pb-3">
              <div v-for="(step, i) in importSteps" :key="step.key" class="flex items-center">
                <div class="flex flex-col items-center gap-1.5 min-w-[72px]">
                  <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors"
                    :class="i < currentStepIdx ? 'bg-green-500 border-green-500 text-white' : i === currentStepIdx ? 'bg-secondary border-secondary text-white' : 'bg-white border-gray-300 text-gray-400'">
                    <i v-if="i < currentStepIdx" class="fa-solid fa-check text-[10px]"></i>
                    <span v-else class="text-[10px]">{{ i + 1 }}</span>
                  </div>
                  <p class="text-[10px] text-center leading-tight" :class="i <= currentStepIdx ? 'text-gray-700 font-medium' : 'text-gray-400'">{{ step.label }}</p>
                </div>
                <div v-if="i < importSteps.length - 1" class="w-6 h-0.5 mb-4 shrink-0" :class="i < currentStepIdx ? 'bg-green-400' : 'bg-gray-200'"></div>
              </div>
            </div>
          </div>

          <!-- Import form -->
          <div class="bg-white rounded-lg border border-gray-200">
            <div class="px-5 py-4 border-b border-gray-100">
              <h3 class="font-semibold text-gray-900 text-sm">Importation Details</h3>
            </div>
            <div class="p-5 grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Source Platform</label>
                <select v-model="importForm.source_platform_id" class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none">
                  <option value="">— none —</option>
                  <option v-for="s in sources" :key="s.id" :value="s.id">{{ s.name }}</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                <select v-model="importForm.status" class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none">
                  <option v-for="s in importSteps" :key="s.key" :value="s.key">{{ s.label }}</option>
                </select>
              </div>
              <div class="col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Source URL</label>
                <input v-model="importForm.source_url" type="url" placeholder="https://beforward.jp/..." class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Auction Reference</label>
                <input v-model="importForm.auction_reference" type="text" class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">ETA</label>
                <input v-model="importForm.eta" type="date" class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Shipping Line</label>
                <input v-model="importForm.shipping_line" type="text" placeholder="e.g. MOL, Evergreen" class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">B/L Number</label>
                <input v-model="importForm.bl_number" type="text" class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none">
              </div>
              <div class="col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                <textarea v-model="importForm.notes" rows="3" class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none resize-none"></textarea>
              </div>
            </div>
            <div class="px-5 py-4 border-t border-gray-100 flex justify-end">
              <button :disabled="saving" @click="saveImportation" class="cursor-pointer flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-60">
                <i v-if="saving" class="fa-solid fa-spinner fa-spin"></i>
                {{ saving ? 'Saving…' : 'Save Importation' }}
              </button>
            </div>
          </div>
        </div>
        <div class="space-y-4">
          <div class="bg-secondary/5 border border-secondary/20 rounded-lg p-4 text-sm">
            <p class="font-semibold text-secondary mb-2 text-xs uppercase tracking-wide">Reference</p>
            <p class="font-mono font-bold text-secondary text-lg">{{ vehicle.reference }}</p>
            <p class="text-xs text-gray-500 mt-1">Share this with your customer to track status</p>
          </div>
        </div>
      </div>
      </TabPanel>

      <!-- ══ COSTS TAB ════════════════════════════════════════════════ -->
      <TabPanel>
      <div class="grid grid-cols-3 gap-5">
        <div class="col-span-2 space-y-5">
          <!-- Add cost form -->
          <div class="bg-white rounded-lg border border-gray-200">
            <div class="px-5 py-4 border-b border-gray-100"><h3 class="font-semibold text-gray-900 text-sm">Add Cost Entry</h3></div>
            <div class="p-5 space-y-4">
              <div v-if="costError" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">{{ costError }}</div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                  <select v-model="costForm.category" class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none">
                    <option v-for="c in ['purchase','freight','insurance','tax','duty','local_transport','repair','cleaning','registration','other']" :key="c" :value="c" class="capitalize">{{ c.replace('_',' ') }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">Date Incurred</label>
                  <input v-model="costForm.incurred_at" type="date" class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none">
                </div>
                <div class="col-span-2">
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                  <input v-model="costForm.description" type="text" placeholder="e.g. Customs duty payment" class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">Currency</label>
                  <select v-model="costForm.currency" class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none">
                    <option value="ugx">UGX</option>
                    <option value="usd">USD</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">Amount</label>
                  <div class="flex rounded-md border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-primary">
                    <span class="px-3 py-2.5 bg-gray-50 border-r border-gray-300 text-xs text-gray-500 flex items-center font-medium uppercase">{{ costForm.currency }}</span>
                    <input v-model="costForm.amount" type="number" min="0" class="flex-1 px-3 py-2.5 text-sm border-0 outline-none bg-white [&::-webkit-inner-spin-button]:appearance-none">
                  </div>
                </div>
                <div v-if="costForm.currency === 'usd'">
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">Exchange Rate (UGX/USD)</label>
                  <input v-model="costForm.exchange_rate_used" type="number" placeholder="e.g. 3700" class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none [&::-webkit-inner-spin-button]:appearance-none">
                </div>
                <div v-if="costForm.currency === 'usd'">
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">Amount (UGX equivalent)</label>
                  <div class="flex rounded-md border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-primary">
                    <span class="px-3 py-2.5 bg-gray-50 border-r border-gray-300 text-xs text-gray-500 flex items-center">UGX</span>
                    <input v-model="costForm.amount_ugx" type="number" min="0" class="flex-1 px-3 py-2.5 text-sm border-0 outline-none bg-white [&::-webkit-inner-spin-button]:appearance-none">
                  </div>
                </div>
              </div>
              <div class="flex justify-end">
                <button :disabled="addingCost" @click="addCost" class="cursor-pointer flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-60">
                  <i v-if="addingCost" class="fa-solid fa-spinner fa-spin"></i>
                  Add Cost
                </button>
              </div>
            </div>
          </div>

          <!-- Costs list -->
          <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 class="font-semibold text-gray-900 text-sm">Cost Register</h3>
              <span class="text-sm font-semibold text-gray-900">Total: {{ fmtUGX(totalCosts) }}</span>
            </div>
            <div v-if="!vehicle.costs?.length" class="py-10 text-center text-sm text-gray-400">No costs recorded yet</div>
            <table v-else class="w-full text-sm">
              <thead class="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Description</th>
                  <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Amount (UGX)</th>
                  <th class="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="c in vehicle.costs" :key="c.id" class="hover:bg-gray-50/50">
                  <td class="px-4 py-3 text-gray-600 whitespace-nowrap">{{ fmtDate(c.incurred_at) }}</td>
                  <td class="px-4 py-3"><span class="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full capitalize">{{ c.category.replace('_',' ') }}</span></td>
                  <td class="px-4 py-3 text-gray-700">{{ c.description }}</td>
                  <td class="px-4 py-3 text-right font-medium text-gray-900">{{ fmtUGX(c.amount_ugx) }}</td>
                  <td class="px-4 py-3 text-right">
                    <button @click="deleteCost(c.id)" class="cursor-pointer p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md"><i class="fa-solid fa-trash text-xs"></i></button>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="bg-gray-50 border-t border-gray-200">
                  <td colspan="3" class="px-4 py-3 text-sm font-semibold text-gray-700">Total Cost</td>
                  <td class="px-4 py-3 text-right font-bold text-gray-900">{{ fmtUGX(totalCosts) }}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
        <div>
          <div class="bg-secondary text-white rounded-lg p-4">
            <p class="text-xs font-semibold text-blue-200 uppercase tracking-wide mb-3">P&L Preview</p>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between"><span class="text-blue-300 text-xs">Total Costs</span><span class="font-semibold">{{ fmtUGX(totalCosts) }}</span></div>
              <div class="flex justify-between"><span class="text-blue-300 text-xs">Asking Price</span><span class="font-semibold">{{ fmtUGX(vehicle.sellingPrice) }}</span></div>
              <div class="border-t border-white/10 pt-2 flex justify-between">
                <span class="text-blue-300 text-xs">Est. Margin</span>
                <span class="font-bold" :class="(Number(vehicle.sellingPrice ?? 0) - totalCosts) >= 0 ? 'text-green-300' : 'text-red-300'">
                  {{ fmtUGX(Number(vehicle.sellingPrice ?? 0) - totalCosts) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      </TabPanel>

      <!-- ══ TRANSACTIONS TAB ══════════════════════════════════════════ -->
      <TabPanel>
      <div class="grid grid-cols-3 gap-5">
        <div class="col-span-2 space-y-5">
          <!-- Add payment -->
          <div class="bg-white rounded-lg border border-gray-200">
            <div class="px-5 py-4 border-b border-gray-100"><h3 class="font-semibold text-gray-900 text-sm">Record Payment</h3></div>
            <div class="p-5 space-y-4">
              <div v-if="paymentError" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">{{ paymentError }}</div>
              <div v-if="!vehicle.sale" class="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-md p-3"><i class="fa-solid fa-triangle-exclamation mr-1.5"></i>Set up sale information in the Client tab first.</div>
              <template v-else>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1.5">Amount (UGX)</label>
                    <div class="flex rounded-md border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-primary">
                      <span class="px-3 py-2.5 bg-gray-50 border-r border-gray-300 text-xs text-gray-500 flex items-center">UGX</span>
                      <input v-model="paymentForm.amount" type="number" min="0" class="flex-1 px-3 py-2.5 text-sm border-0 outline-none bg-white [&::-webkit-inner-spin-button]:appearance-none">
                    </div>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1.5">Payment Method</label>
                    <select v-model="paymentForm.payment_method" class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none">
                      <option value="cash">Cash</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="mobile_money">Mobile Money</option>
                      <option value="cheque">Cheque</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1.5">Payment Date</label>
                    <input v-model="paymentForm.paid_at" type="date" class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1.5">Reference Number</label>
                    <input v-model="paymentForm.reference_number" type="text" placeholder="e.g. TRN-0012345" class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none">
                  </div>
                  <div class="col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                    <input v-model="paymentForm.notes" type="text" class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none">
                  </div>
                </div>
                <div class="flex justify-end">
                  <button :disabled="addingPayment" @click="addPayment" class="cursor-pointer flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-60">
                    <i v-if="addingPayment" class="fa-solid fa-spinner fa-spin"></i>
                    Record Payment
                  </button>
                </div>
              </template>
            </div>
          </div>

          <!-- Payments list -->
          <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div class="px-5 py-4 border-b border-gray-100"><h3 class="font-semibold text-gray-900 text-sm">Payment History</h3></div>
            <div v-if="!vehicle.payments?.length" class="py-10 text-center text-sm text-gray-400">No payments recorded</div>
            <table v-else class="w-full text-sm">
              <thead class="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Receipt #</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Method</th>
                  <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="p in vehicle.payments" :key="p.id" class="hover:bg-gray-50/50">
                  <td class="px-4 py-3 text-gray-600 whitespace-nowrap">{{ fmtDate(p.paid_at) }}</td>
                  <td class="px-4 py-3 font-mono text-xs text-gray-700">{{ p.receipt_number }}</td>
                  <td class="px-4 py-3 capitalize text-gray-600">{{ p.payment_method.replace('_',' ') }}</td>
                  <td class="px-4 py-3 text-right font-semibold text-gray-900">{{ fmtUGX(p.amount) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <!-- Balance sidebar -->
        <div>
          <div class="bg-secondary text-white rounded-lg p-4 space-y-2 text-sm">
            <p class="text-xs font-semibold text-blue-200 uppercase tracking-wide mb-3">Balance Summary</p>
            <div class="flex justify-between"><span class="text-blue-300 text-xs">Agreed Price</span><span class="font-semibold">{{ fmtUGX(vehicle.sale?.agreed_price) }}</span></div>
            <div class="flex justify-between"><span class="text-blue-300 text-xs">Total Paid</span><span class="font-semibold text-green-300">{{ fmtUGX(totalPaid) }}</span></div>
            <div class="border-t border-white/10 pt-2 flex justify-between">
              <span class="text-blue-300 text-xs">Balance Due</span>
              <span class="font-bold text-lg" :class="balance <= 0 ? 'text-green-300' : 'text-yellow-300'">{{ fmtUGX(balance) }}</span>
            </div>
            <p v-if="balance <= 0" class="text-xs text-green-300 text-center pt-1"><i class="fa-solid fa-circle-check mr-1"></i>Fully paid</p>
          </div>
        </div>
      </div>
      </TabPanel>

      <!-- ══ CLIENT TAB ════════════════════════════════════════════════ -->
      <TabPanel>
      <div class="grid grid-cols-3 gap-5">
        <div class="col-span-2 space-y-5">
          <!-- Sale info -->
          <div class="bg-white rounded-lg border border-gray-200">
            <div class="px-5 py-4 border-b border-gray-100"><h3 class="font-semibold text-gray-900 text-sm">Sale Information</h3></div>
            <div class="p-5 space-y-4">
              <div v-if="saleError" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">{{ saleError }}</div>
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <label class="block text-sm font-medium text-gray-700">Customer</label>
                  <button class="text-xs text-primary hover:underline" @click="showNewCustomer = !showNewCustomer">
                    {{ showNewCustomer ? 'Cancel' : '+ New customer' }}
                  </button>
                </div>
                <select v-if="!showNewCustomer" v-model="saleForm.customer_id" class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none">
                  <option value="">— no customer yet —</option>
                  <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }} · {{ c.phone }}</option>
                </select>
                <!-- New customer inline form -->
                <div v-else class="border border-gray-200 rounded-md p-4 space-y-3 bg-gray-50">
                  <p class="text-xs font-semibold text-gray-600 uppercase tracking-wide">New Customer</p>
                  <div v-if="customerError" class="text-xs text-red-600">{{ customerError }}</div>
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="block text-xs font-medium text-gray-700 mb-1">Full Name <span class="text-red-500">*</span></label>
                      <input v-model="customerForm.name" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none">
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-gray-700 mb-1">Phone <span class="text-red-500">*</span></label>
                      <input v-model="customerForm.phone" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none">
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-gray-700 mb-1">Email</label>
                      <input v-model="customerForm.email" type="email" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none">
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-gray-700 mb-1">ID Number</label>
                      <input v-model="customerForm.id_number" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none">
                    </div>
                  </div>
                  <button :disabled="savingCustomer" @click="saveCustomer" class="cursor-pointer text-sm px-3 py-1.5 bg-secondary text-white rounded-md hover:bg-blue-800 disabled:opacity-60">
                    <i v-if="savingCustomer" class="fa-solid fa-spinner fa-spin mr-1"></i>
                    Create Customer
                  </button>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">Agreed Price (UGX)</label>
                  <div class="flex rounded-md border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-primary">
                    <span class="px-3 py-2.5 bg-gray-50 border-r border-gray-300 text-xs text-gray-500 flex items-center">UGX</span>
                    <input v-model="saleForm.agreed_price" type="number" min="0" class="flex-1 px-3 py-2.5 text-sm border-0 outline-none bg-white [&::-webkit-inner-spin-button]:appearance-none">
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">Reservation Deposit</label>
                  <div class="flex rounded-md border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-primary">
                    <span class="px-3 py-2.5 bg-gray-50 border-r border-gray-300 text-xs text-gray-500 flex items-center">UGX</span>
                    <input v-model="saleForm.reservation_deposit" type="number" min="0" class="flex-1 px-3 py-2.5 text-sm border-0 outline-none bg-white [&::-webkit-inner-spin-button]:appearance-none">
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">Sale Date</label>
                  <input v-model="saleForm.sale_date" type="date" class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                  <input v-model="saleForm.notes" type="text" class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none">
                </div>
              </div>
              <div class="flex justify-end">
                <button :disabled="savingSale" @click="saveSale" class="cursor-pointer flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-60">
                  <i v-if="savingSale" class="fa-solid fa-spinner fa-spin"></i>
                  Save Sale Info
                </button>
              </div>
            </div>
          </div>

          <!-- Customer details display -->
          <div v-if="vehicle.sale?.customer" class="bg-white rounded-lg border border-gray-200 p-5">
            <h3 class="font-semibold text-gray-900 text-sm mb-4">Customer Details</h3>
            <div class="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
              <div class="flex justify-between border-b border-gray-50 pb-2"><span class="text-gray-500">Name</span><span class="font-medium">{{ vehicle.sale.customer.name }}</span></div>
              <div class="flex justify-between border-b border-gray-50 pb-2"><span class="text-gray-500">Phone</span><span class="font-medium">{{ vehicle.sale.customer.phone }}</span></div>
              <div class="flex justify-between border-b border-gray-50 pb-2"><span class="text-gray-500">Email</span><span class="font-medium">{{ vehicle.sale.customer.email ?? '—' }}</span></div>
              <div class="flex justify-between border-b border-gray-50 pb-2"><span class="text-gray-500">ID</span><span class="font-medium">{{ vehicle.sale.customer.id_number ?? '—' }}</span></div>
            </div>
          </div>
        </div>
        <div>
          <div class="bg-secondary/5 border border-secondary/20 rounded-lg p-4 text-sm">
            <p class="text-xs font-semibold text-secondary mb-2">Customer Ref Portal</p>
            <p class="text-xs text-gray-600">Once a customer reference is shared, they can check import status and payments at:</p>
            <p class="font-mono text-xs mt-2 bg-white border border-gray-200 rounded p-2 text-secondary break-all">/track/{{ vehicle.reference }}</p>
          </div>
        </div>
      </div>
      </TabPanel>

      <!-- ══ DOCUMENTS TAB ═════════════════════════════════════════════ -->
      <TabPanel>
      <div class="grid grid-cols-3 gap-5">
        <div class="col-span-2 space-y-5">
          <!-- Upload form -->
          <div class="bg-white rounded-lg border border-gray-200">
            <div class="px-5 py-4 border-b border-gray-100"><h3 class="font-semibold text-gray-900 text-sm">Upload Document</h3></div>
            <div class="p-5 space-y-4">
              <div v-if="docError" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">{{ docError }}</div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">Document Name</label>
                  <input v-model="docForm.name" type="text" class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none" placeholder="e.g. Log Book">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
                  <select v-model="docForm.type" class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none">
                    <option value="log_book">Log Book</option>
                    <option value="customs_release">Customs Release</option>
                    <option value="insurance">Insurance</option>
                    <option value="inspection_report">Inspection Report</option>
                    <option value="title">Title</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <label class="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-primary hover:bg-red-50/30 transition-colors">
                <i class="fa-solid fa-cloud-arrow-up text-2xl text-gray-400 mb-2"></i>
                <p class="text-sm text-gray-600">{{ docFile ? docFile.name : 'Click to select file' }}</p>
                <p class="text-xs text-gray-400 mt-1">PDF, images, up to 20MB</p>
                <input type="file" class="hidden" @change="onDocFile">
              </label>
              <div class="flex justify-end">
                <button :disabled="uploadingDoc || !docFile" @click="uploadDoc" class="cursor-pointer flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-60">
                  <i v-if="uploadingDoc" class="fa-solid fa-spinner fa-spin"></i>
                  Upload
                </button>
              </div>
            </div>
          </div>

          <!-- Docs list -->
          <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div class="px-5 py-4 border-b border-gray-100"><h3 class="font-semibold text-gray-900 text-sm">Documents</h3></div>
            <div v-if="!vehicle.documents?.length" class="py-10 text-center text-sm text-gray-400">No documents uploaded</div>
            <div v-else class="divide-y divide-gray-100">
              <div v-for="doc in vehicle.documents" :key="doc.id" class="flex items-center justify-between px-5 py-3 hover:bg-gray-50/50">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-md bg-blue-50 flex items-center justify-center">
                    <i class="fa-solid fa-file text-blue-500"></i>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-900">{{ doc.name }}</p>
                    <p class="text-xs text-gray-400 capitalize">{{ doc.type.replace('_',' ') }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <a :href="storageUrl(doc.path)" target="_blank" class="p-1.5 text-gray-400 hover:text-secondary hover:bg-blue-50 rounded-md"><i class="fa-solid fa-download text-sm"></i></a>
                  <button @click="deleteDoc(doc.id)" class="cursor-pointer p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md"><i class="fa-solid fa-trash text-sm"></i></button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div>
          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Document Types</p>
            <div class="space-y-1.5 text-xs text-gray-600">
              <p><span class="font-medium text-gray-700">Log Book</span> — vehicle registration</p>
              <p><span class="font-medium text-gray-700">Customs Release</span> — cleared customs</p>
              <p><span class="font-medium text-gray-700">Inspection Report</span> — pre-shipment check</p>
              <p><span class="font-medium text-gray-700">Insurance</span> — cover note</p>
              <p><span class="font-medium text-gray-700">Title</span> — ownership document</p>
            </div>
          </div>
        </div>
      </div>
      </TabPanel>

      </TabPanels>
      </TabGroup>
      </div>

      <ConfirmDialog
        :show="confirmState.show"
        :title="confirmState.title"
        :message="confirmState.message"
        @confirm="doConfirm"
        @cancel="cancelConfirm"
      />
    </template>
  </div>
</template>
