<script setup lang="ts">
definePageMeta({ layout: 'admin-layout' })

const { $api } = useNuxtApp()
const { storageUrl } = useStorage()
const route = useRoute()
const id = route.params.id as string

// ── Types ─────────────────────────────────────────────────────────────────
interface Payment {
  id: number; paymentType: string; amount: string; paymentMethod: string
  referenceNumber: string | null; notes: string | null
  paidAt: string; receiptNumber: string; receiptSentAt: string | null
}
interface Expense {
  id: number; category: string; description: string; amount: string
  currency: string; exchangeRateUsed: string | null; amountUgx: string
  receiptPath: string | null; incurredAt: string
}
interface Document { id: number; name: string; type: string; path: string }
interface ActivityEntry { id: number; action: string; notes: string | null; createdAt: string; user: { id: number; name: string } | null }

interface Application {
  id: number; reference: string; serviceType: string; status: string
  timeline: string; submittedVia: string
  customerId: number | null
  customer: { id: number; name: string; phone: string; email: string } | null
  applicantName: string | null; applicantPhone: string | null; applicantEmail: string | null
  vehicleValuationId: number | null
  vehicleValuation: { id: number; name: string; cif: string } | null
  vehicleDescription: string | null; vehicleYear: number | null
  vehicleLink: string | null; sourcingPlatforms: number[] | null; budgetUsd: string | null
  actualCifUsd: string | null; transportCostUgx: string | null
  serviceFeeUgx: string | null; quoteSentAt: string | null; quoteAcceptedAt: string | null
  assignedTo: number | null
  assignedUser: { id: number; name: string } | null
  stallReason: string | null; stallResolution: string | null
  linkedVehicleId: number | null
  linkedVehicle: { id: number; reference: string; model: string } | null
  notes: string | null; internalNotes: string | null
  floatReceived: number | null; totalExpensesUgx: number | null; floatBalance: number | null
  payments: Payment[]; expenses: Expense[]; documents: Document[]; activityLog: ActivityEntry[]
  createdAt: string; updatedAt: string
}

// ── State ─────────────────────────────────────────────────────────────────
const app        = ref<Application | null>(null)
const financials = ref<{
  actualCifUgx: number | null
  usdRate: number | null
  totalDutiesUgx: number | null
  transportCostUgx: number | null
  serviceFeeUgx: number | null
  grandTotalUgx: number | null
  totalPaidUgx: number | null
  estimatedOutstanding: number | null
} | null>(null)
const loading    = ref(true)
const activeTab  = ref(0)
const error      = ref('')
const successMsg = ref('')

// ── Status update ─────────────────────────────────────────────────────────
const statusForm   = ref({ status: '', stall_reason: '', actual_cif_usd: '', transport_cost_ugx: '', notes: '' })
const savingStatus = ref(false)
const showStatusModal = ref(false)

// ── Add payment ───────────────────────────────────────────────────────────
const paymentForm = ref({ payment_type: 'service_fee', amount: '', payment_method: 'cash', reference_number: '', notes: '', paid_at: '' })
const savingPayment = ref(false)
const paymentError  = ref('')

// ── Add expense ───────────────────────────────────────────────────────────
const expenseForm = ref({ category: 'port_fees', description: '', amount: '', currency: 'ugx', exchange_rate_used: '1', amount_ugx: '', incurred_at: '' })
const savingExpense = ref(false)
const expenseError  = ref('')
const showExpenseForm = ref(false)

// Auto-set rate to 1 when switching to UGX; clear it when switching to USD
watch(() => expenseForm.value.currency, (val) => {
  expenseForm.value.exchange_rate_used = val === 'ugx' ? '1' : ''
  // Recalculate ugx amount after currency switch
  const amt  = parseFloat(expenseForm.value.amount) || 0
  const rate = val === 'ugx' ? 1 : 0
  expenseForm.value.amount_ugx = amt > 0 && rate > 0 ? String(Math.round(amt * rate)) : ''
})

// Auto-calculate amount_ugx whenever amount or rate changes
watch(
  () => [expenseForm.value.amount, expenseForm.value.exchange_rate_used],
  () => {
    const amt  = parseFloat(expenseForm.value.amount) || 0
    const rate = parseFloat(expenseForm.value.exchange_rate_used) || 0
    expenseForm.value.amount_ugx = amt > 0 && rate > 0 ? String(Math.round(amt * rate)) : ''
  }
)
const showPaymentForm = ref(false)

// ── Document upload ───────────────────────────────────────────────────────
const docForm = ref({ name: '', type: 'other', file: null as File | null })
const savingDoc = ref(false)
const docError  = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

// ── Quote ─────────────────────────────────────────────────────────────────
const sendingQuote    = ref(false)
const showQuoteMenu   = ref(false)

const downloadQuote = async () => {
  showQuoteMenu.value = false
  try {
    const response = await $api.get(`/v1/import-applications/${id}/quote`, { responseType: 'blob' })
    const blob = new Blob([response.data], { type: 'application/pdf' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `quote-${app.value?.reference ?? id}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    error.value = 'Failed to download quote'
  }
}

const sendQuote = async () => {
  if (!confirm('Send the quote PDF to the client\'s email address?')) return
  sendingQuote.value = true
  showQuoteMenu.value = false
  try {
    const { data } = await $api.post(`/v1/import-applications/${id}/send-quote`)
    showSuccess(data.message ?? 'Quote sent')
    await fetch()
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? 'Failed to send quote'
  } finally {
    sendingQuote.value = false
  }
}

// ── Edit application ──────────────────────────────────────────────────────
const showEditModal = ref(false)
const editForm = ref<Record<string, any>>({})
const savingEdit = ref(false)
const editError = ref('')

// ── Fetch ─────────────────────────────────────────────────────────────────
const fetch = async () => {
  loading.value = true
  error.value = ''
  try {
    const { data } = await $api.get(`/v1/import-applications/${id}`)
    app.value = data.data
    financials.value = data.financials ?? null
    statusForm.value.status = data.data.status
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? 'Failed to load application'
  } finally {
    loading.value = false
  }
}

// ── Status update ─────────────────────────────────────────────────────────
const openStatusModal = () => {
  statusForm.value = {
    status: app.value?.status ?? '',
    stall_reason: '',
    actual_cif_usd: app.value?.actualCifUsd ?? '',
    transport_cost_ugx: app.value?.transportCostUgx ?? '',
    notes: '',
  }
  showStatusModal.value = true
}

const submitStatus = async () => {
  savingStatus.value = true
  try {
    const payload: Record<string, any> = { ...statusForm.value }
    Object.keys(payload).forEach(k => { if (!payload[k]) delete payload[k] })
    await $api.patch(`/v1/import-applications/${id}/status`, payload)
    showStatusModal.value = false
    showSuccess('Status updated')
    await fetch()
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? 'Failed to update status'
  } finally {
    savingStatus.value = false
  }
}

// ── Add payment ───────────────────────────────────────────────────────────
const submitPayment = async () => {
  savingPayment.value = true
  paymentError.value = ''
  try {
    const { data } = await $api.post(`/v1/import-applications/${id}/payments`, paymentForm.value)
    app.value?.payments.unshift(data.data)
    showPaymentForm.value = false
    paymentForm.value = { payment_type: 'service_fee', amount: '', payment_method: 'cash', reference_number: '', notes: '', paid_at: '' }
    showSuccess('Payment recorded')
    await fetch()
  } catch (e: any) {
    paymentError.value = e?.response?.data?.message ?? 'Failed to record payment'
  } finally {
    savingPayment.value = false
  }
}

const downloadImportReceipt = async (payment: Payment) => {
  try {
    const response = await $api.get(`/v1/import-applications/${id}/payments/${payment.id}/receipt`, { responseType: 'blob' })
    const blob = new Blob([response.data], { type: 'application/pdf' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `receipt-${payment.receiptNumber}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    error.value = 'Failed to download receipt'
  }
}

const deletePayment = async (payment: Payment) => {
  if (!confirm(`Delete receipt ${payment.receiptNumber}?`)) return
  try {
    await $api.delete(`/v1/import-applications/${id}/payments/${payment.id}`)
    showSuccess('Payment deleted')
    await fetch()
  } catch {}
}

// ── Add expense ───────────────────────────────────────────────────────────
const submitExpense = async () => {
  savingExpense.value = true
  expenseError.value = ''
  try {
    await $api.post(`/v1/import-applications/${id}/expenses`, expenseForm.value)
    showExpenseForm.value = false
    expenseForm.value = { category: 'port_fees', description: '', amount: '', currency: 'ugx', exchange_rate_used: '1', amount_ugx: '', incurred_at: '' }
    showSuccess('Expense recorded')
    await fetch()
  } catch (e: any) {
    expenseError.value = e?.response?.data?.message ?? 'Failed to record expense'
  } finally {
    savingExpense.value = false
  }
}

const deleteExpense = async (expense: Expense) => {
  if (!confirm('Delete this expense?')) return
  try {
    await $api.delete(`/v1/import-applications/${id}/expenses/${expense.id}`)
    showSuccess('Expense deleted')
    await fetch()
  } catch {}
}

// ── Document upload ───────────────────────────────────────────────────────
const onFileChange = (e: Event) => {
  docForm.value.file = (e.target as HTMLInputElement).files?.[0] ?? null
}

const submitDoc = async () => {
  if (!docForm.value.file) { docError.value = 'Select a file'; return }
  savingDoc.value = true
  docError.value = ''
  try {
    const fd = new FormData()
    fd.append('name', docForm.value.name)
    fd.append('type', docForm.value.type)
    fd.append('file', docForm.value.file)
    await $api.post(`/v1/import-applications/${id}/documents`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    docForm.value = { name: '', type: 'other', file: null }
    if (fileInput.value) fileInput.value.value = ''
    showSuccess('Document uploaded')
    await fetch()
  } catch (e: any) {
    docError.value = e?.response?.data?.message ?? 'Upload failed'
  } finally {
    savingDoc.value = false
  }
}

const deleteDoc = async (doc: Document) => {
  if (!confirm(`Delete document "${doc.name}"?`)) return
  try {
    await $api.delete(`/v1/import-applications/${id}/documents/${doc.id}`)
    showSuccess('Document deleted')
    await fetch()
  } catch {}
}

// ── Edit application ──────────────────────────────────────────────────────
const openEdit = () => {
  if (!app.value) return
  editForm.value = {
    applicant_name: app.value.applicantName ?? '',
    applicant_phone: app.value.applicantPhone ?? '',
    applicant_email: app.value.applicantEmail ?? '',
    service_type: app.value.serviceType,
    vehicle_description: app.value.vehicleDescription ?? '',
    vehicle_year: app.value.vehicleYear ?? '',
    vehicle_link: app.value.vehicleLink ?? '',
    budget_usd: app.value.budgetUsd ?? '',
    actual_cif_usd: app.value.actualCifUsd ?? '',
    transport_cost_ugx: app.value.transportCostUgx ?? '',
    timeline: app.value.timeline,
    service_fee_ugx: app.value.serviceFeeUgx ?? '',
    notes: app.value.notes ?? '',
    internal_notes: app.value.internalNotes ?? '',
    stall_reason: app.value.stallReason ?? '',
    stall_resolution: app.value.stallResolution ?? '',
  }
  editError.value = ''
  showEditModal.value = true
}

const submitEdit = async () => {
  savingEdit.value = true
  editError.value = ''
  try {
    const payload = { ...editForm.value }
    Object.keys(payload).forEach(k => { if (payload[k] === '') delete payload[k] })
    await $api.patch(`/v1/import-applications/${id}`, payload)
    showEditModal.value = false
    showSuccess('Application updated')
    await fetch()
  } catch (e: any) {
    editError.value = e?.response?.data?.message ?? 'Failed to update'
  } finally {
    savingEdit.value = false
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────
const showSuccess = (msg: string) => {
  successMsg.value = msg
  setTimeout(() => { successMsg.value = '' }, 3000)
}

const STATUS_PIPELINE = [
  'enquiry','quoted','accepted','sourcing','vehicle_found','purchased',
  'pre_shipment','shipped','port_arrived','customs_clearance','in_transit_uganda',
  'delivered','completed',
]

const currentStepIndex = computed(() => STATUS_PIPELINE.indexOf(app.value?.status ?? ''))

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

const fmtStatus  = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
const fmtDate    = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
const fmtDateTime = (d: string) => new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const fmtUgx     = (v: string | number | null) => v ? 'UGX ' + Number(v).toLocaleString() : '—'
const fmtUsd     = (v: string | number | null) => v ? '$ ' + Number(v).toLocaleString() : '—'

const serviceTypeLabel = (t: string) => ({
  full_import: 'Full Import',
  sourcing_only: 'Sourcing Only',
  mombasa_clearance: 'Mombasa Clearance',
  consultation: 'Consultation',
  custom: 'Custom Plan',
}[t] ?? t)

const timelineLabel = (t: string) => ({
  asap: 'ASAP', '1month': '1 Month', '2_3months': '2–3 Months', '6months': '6 Months', flexible: 'Flexible',
}[t] ?? t)

const paymentTypeLabel = (t: string) => ({
  service_fee: 'Service Fee',
  clearance_advance: 'Clearance Advance',
  sourcing_advance: 'Sourcing Advance',
  deposit: 'Deposit',
  other: 'Other',
}[t] ?? t)

const tabs = ['Overview', 'Customer', 'Payments', 'Expenses', 'Documents', 'Activity Log']

onMounted(fetch)
</script>

<template>
  <div class="p-6 space-y-5">
    <!-- Back -->
    <NuxtLink to="/backoffice/import-applications" class="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors w-fit">
      <i class="fa-solid fa-arrow-left"></i> Import Applications
    </NuxtLink>

    <!-- Success banner -->
    <div v-if="successMsg" class="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
      <i class="fa-solid fa-check-circle"></i> {{ successMsg }}
    </div>

    <!-- Error banner -->
    <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{{ error }}</div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16 text-gray-400">
      <i class="fa-solid fa-spinner fa-spin text-2xl"></i>
    </div>

    <template v-else-if="app">
      <!-- Header -->
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="space-y-1">
          <div class="flex items-center gap-3 flex-wrap">
            <h1 class="text-2xl font-bold text-gray-900">
              {{ app.customer?.name ?? app.applicantName ?? 'Unknown Applicant' }}
            </h1>
            <span class="font-mono text-xs bg-gray-100 border border-gray-200 px-2 py-1 rounded">{{ app.reference }}</span>
            <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold" :class="statusColor(app.status)">
              {{ fmtStatus(app.status) }}
            </span>
          </div>
          <p class="text-sm text-gray-500">{{ serviceTypeLabel(app.serviceType) }} · Created {{ fmtDate(app.createdAt) }}</p>
        </div>
        <div class="flex gap-2 flex-wrap">
          <button
            class="flex items-center gap-1.5 text-sm border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            @click="openEdit"
          >
            <i class="fa-solid fa-pen text-gray-500"></i> Edit
          </button>

          <!-- Quote dropdown -->
          <div class="relative">
            <button
              class="flex items-center gap-1.5 text-sm border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              :disabled="sendingQuote"
              @click="showQuoteMenu = !showQuoteMenu"
            >
              <i v-if="sendingQuote" class="fa-solid fa-spinner fa-spin text-gray-400"></i>
              <i v-else class="fa-solid fa-file-invoice text-gray-500"></i>
              Quote
              <i class="fa-solid fa-chevron-down text-gray-400 text-xs"></i>
            </button>
            <div
              v-if="showQuoteMenu"
              class="absolute right-0 mt-1 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden"
              @mouseleave="showQuoteMenu = false"
            >
              <button
                class="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                @click="downloadQuote"
              >
                <i class="fa-solid fa-download text-gray-400 w-4"></i>
                Download PDF
              </button>
              <button
                class="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left border-t border-gray-100"
                @click="sendQuote"
              >
                <i class="fa-solid fa-paper-plane text-gray-400 w-4"></i>
                Send to Client
                <span v-if="app?.quoteSentAt" class="ml-auto text-xs text-green-600 font-medium">Sent</span>
              </button>
            </div>
          </div>

          <button
            class="flex items-center gap-1.5 text-sm bg-primary text-white px-3 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            @click="openStatusModal"
          >
            <i class="fa-solid fa-arrow-right-arrow-left"></i> Update Status
          </button>
        </div>
      </div>

      <!-- Tabs -->
      <div class="border-b border-gray-200">
        <nav class="flex gap-0 -mb-px">
          <button
            v-for="(tab, idx) in tabs"
            :key="tab"
            class="px-4 py-2.5 text-sm cursor-pointer font-medium border-b-2 transition-colors whitespace-nowrap"
            :class="activeTab === idx
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
            @click="activeTab = idx"
          >
            {{ tab }}
          </button>
        </nav>
      </div>

      <!-- ── Tab 0: Overview ─────────────────────────────────────────────── -->
      <div v-if="activeTab === 0" class="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <!-- Main column -->
        <div class="lg:col-span-2 space-y-5">
          <!-- Status pipeline -->
          <div class="bg-white border border-gray-200 rounded-xl p-5">
            <h3 class="text-sm font-semibold text-gray-700 mb-4">Progress</h3>
            <div class="flex items-center overflow-x-auto pb-2 gap-0">
              <template v-for="(step, idx) in STATUS_PIPELINE" :key="step">
                <div class="flex flex-col items-center min-w-[80px]">
                  <div
                    class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    :class="idx <= currentStepIndex
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-400'"
                  >
                    <i v-if="idx < currentStepIndex" class="fa-solid fa-check text-xs"></i>
                    <span v-else>{{ idx + 1 }}</span>
                  </div>
                  <p class="text-[10px] text-center text-gray-500 mt-1 leading-tight">{{ fmtStatus(step) }}</p>
                </div>
                <div
                  v-if="idx < STATUS_PIPELINE.length - 1"
                  class="h-0.5 flex-1 min-w-[12px]"
                  :class="idx < currentStepIndex ? 'bg-primary' : 'bg-gray-200'"
                ></div>
              </template>
            </div>
            <div v-if="app.status === 'stalled'" class="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              <i class="fa-solid fa-triangle-exclamation mr-1"></i>
              <strong>Stalled:</strong> {{ app.stallReason ?? 'No reason given' }}
              <span v-if="app.stallResolution" class="ml-2">· Resolution: {{ fmtStatus(app.stallResolution) }}</span>
            </div>
          </div>

          <!-- Application details -->
          <div class="bg-white border border-gray-200 rounded-xl p-5">
            <h3 class="text-sm font-semibold text-gray-700 mb-4">Application Details</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <p class="text-gray-500 text-xs">Service Type</p>
                <p class="font-medium text-gray-800">{{ serviceTypeLabel(app.serviceType) }}</p>
              </div>
              <div>
                <p class="text-gray-500 text-xs">Timeline</p>
                <p class="font-medium text-gray-800">{{ timelineLabel(app.timeline) }}</p>
              </div>
              <div>
                <p class="text-gray-500 text-xs">Budget</p>
                <p class="font-medium text-gray-800">{{ fmtUsd(app.budgetUsd) }}</p>
              </div>
              <div>
                <p class="text-gray-500 text-xs">Actual CIF (sourced)</p>
                <p class="font-medium text-gray-800">
                  {{ app.actualCifUsd ? fmtUsd(app.actualCifUsd) : '—' }}
                  <span v-if="app.actualCifUsd && financials?.usdRate" class="text-xs text-gray-400 ml-1">
                    ≈ {{ fmtUgx(Math.round(Number(app.actualCifUsd) * financials.usdRate)) }}
                  </span>
                </p>
              </div>
              <div>
                <p class="text-gray-500 text-xs">Transport (Mombasa → Uganda)</p>
                <p class="font-medium text-gray-800">{{ app.transportCostUgx ? fmtUgx(app.transportCostUgx) : '—' }}</p>
              </div>
              <div>
                <p class="text-gray-500 text-xs">Service Fee</p>
                <p class="font-medium text-gray-800">{{ fmtUgx(app.serviceFeeUgx) }}</p>
              </div>
              <div>
                <p class="text-gray-500 text-xs">Quote Sent</p>
                <p class="font-medium text-gray-800">{{ app.quoteSentAt ? fmtDate(app.quoteSentAt) : '—' }}</p>
              </div>
              <div>
                <p class="text-gray-500 text-xs">Quote Accepted</p>
                <p class="font-medium text-gray-800">{{ app.quoteAcceptedAt ? fmtDate(app.quoteAcceptedAt) : '—' }}</p>
              </div>
              <div>
                <p class="text-gray-500 text-xs">Submitted Via</p>
                <p class="font-medium text-gray-800">{{ fmtStatus(app.submittedVia) }}</p>
              </div>
              <div>
                <p class="text-gray-500 text-xs">Assigned To</p>
                <p class="font-medium text-gray-800">{{ app.assignedUser?.name ?? '—' }}</p>
              </div>
            </div>
          </div>

          <!-- Vehicle details -->
          <div class="bg-white border border-gray-200 rounded-xl p-5">
            <h3 class="text-sm font-semibold text-gray-700 mb-4">Vehicle Details</h3>
            <div class="space-y-3 text-sm">
              <div v-if="app.vehicleValuation">
                <p class="text-gray-500 text-xs">Valuation Match</p>
                <p class="font-medium text-gray-800">{{ app.vehicleValuation.name }} — CIF {{ fmtUsd(app.vehicleValuation.cif) }}</p>
              </div>
              <div v-if="app.vehicleDescription">
                <p class="text-gray-500 text-xs">Description</p>
                <p class="font-medium text-gray-800">{{ app.vehicleDescription }}</p>
              </div>
              <div v-if="app.vehicleYear">
                <p class="text-gray-500 text-xs">Year</p>
                <p class="font-medium text-gray-800">{{ app.vehicleYear }}</p>
              </div>
              <div v-if="app.vehicleLink">
                <p class="text-gray-500 text-xs">Vehicle Link</p>
                <a :href="app.vehicleLink" target="_blank" rel="noopener" class="text-primary hover:underline break-all">
                  {{ app.vehicleLink }}
                  <i class="fa-solid fa-arrow-up-right-from-square text-xs ml-1"></i>
                </a>
              </div>
              <div v-if="!app.vehicleValuation && !app.vehicleDescription && !app.vehicleYear && !app.vehicleLink" class="text-gray-400">
                No vehicle details provided.
              </div>
            </div>
          </div>

          <!-- Notes -->
          <div v-if="app.notes || app.internalNotes" class="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <div v-if="app.notes">
              <h3 class="text-sm font-semibold text-gray-700 mb-1">Notes (customer-visible)</h3>
              <p class="text-sm text-gray-700 whitespace-pre-line">{{ app.notes }}</p>
            </div>
            <div v-if="app.internalNotes">
              <h3 class="text-sm font-semibold text-gray-700 mb-1">Internal Notes <span class="text-xs font-normal text-gray-400">(staff only)</span></h3>
              <p class="text-sm text-gray-700 whitespace-pre-line bg-yellow-50 border border-yellow-100 p-3 rounded-lg">{{ app.internalNotes }}</p>
            </div>
          </div>

          <!-- Linked vehicle (buyout/consignment) -->
          <div v-if="app.linkedVehicle" class="bg-white border border-amber-200 rounded-xl p-5">
            <h3 class="text-sm font-semibold text-amber-700 mb-2">
              <i class="fa-solid fa-link mr-1"></i>
              Linked Vehicle ({{ fmtStatus(app.stallResolution ?? '') }})
            </h3>
            <NuxtLink :to="`/backoffice/vehicles/${app.linkedVehicle.id}`" class="text-sm text-primary hover:underline">
              {{ app.linkedVehicle.reference }} — {{ app.linkedVehicle.model }}
            </NuxtLink>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-5">

          <!-- ── Financial Summary ──────────────────────────────────────── -->
          <div class="bg-white border border-gray-200 rounded-xl p-5">
            <h3 class="text-sm font-semibold text-gray-700 mb-3">Financial Summary</h3>

            <!-- Grand total breakdown — only shown when actual CIF is known -->
            <div v-if="financials?.grandTotalUgx != null" class="space-y-2 text-sm">
              <div class="flex justify-between text-gray-500">
                <span>Actual CIF</span>
                <span class="font-medium text-gray-700">{{ fmtUgx(financials.actualCifUgx) }}</span>
              </div>
              <div class="flex justify-between text-gray-500">
                <span>Import Duties (est.)</span>
                <span class="font-medium text-gray-700">{{ fmtUgx(financials.totalDutiesUgx) }}</span>
              </div>
              <div v-if="financials.transportCostUgx" class="flex justify-between text-gray-500">
                <span>Transport</span>
                <span class="font-medium text-gray-700">{{ fmtUgx(financials.transportCostUgx) }}</span>
              </div>
              <div v-if="financials.serviceFeeUgx" class="flex justify-between text-gray-500">
                <span>Service Fee</span>
                <span class="font-medium text-gray-700">{{ fmtUgx(financials.serviceFeeUgx) }}</span>
              </div>
              <div class="border-t border-gray-200 pt-2 flex justify-between font-semibold text-gray-900">
                <span>Estimated Total</span>
                <span>{{ fmtUgx(financials.grandTotalUgx) }}</span>
              </div>
              <div class="flex justify-between text-gray-500 mt-1">
                <span>Client Has Paid</span>
                <span class="font-medium text-green-600">{{ fmtUgx(financials.totalPaidUgx) }}</span>
              </div>
              <div
                class="border-t border-gray-200 pt-2 flex justify-between font-semibold"
                :class="(financials.estimatedOutstanding ?? 0) > 0 ? 'text-red-600' : 'text-green-600'"
              >
                <span>Outstanding Balance</span>
                <span>{{ fmtUgx(financials.estimatedOutstanding) }}</span>
              </div>
              <!-- Alert if client still owes a significant amount -->
              <div
                v-if="(financials.estimatedOutstanding ?? 0) > 0"
                class="mt-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700 flex items-start gap-1.5"
              >
                <i class="fa-solid fa-triangle-exclamation mt-0.5 shrink-0"></i>
                <span>Client still owes {{ fmtUgx(financials.estimatedOutstanding) }}. Collect before committing further funds.</span>
              </div>
            </div>

            <!-- No actual CIF yet — show what we have -->
            <div v-else class="space-y-2 text-sm">
              <div v-if="app.budgetUsd" class="flex justify-between text-gray-500">
                <span>Client Budget</span>
                <span class="font-medium text-gray-700">{{ fmtUsd(app.budgetUsd) }}</span>
              </div>
              <div v-if="financials?.totalDutiesUgx" class="flex justify-between text-gray-500">
                <span>Est. Duties</span>
                <span class="font-medium text-gray-700">{{ fmtUgx(financials.totalDutiesUgx) }}</span>
              </div>
              <div v-if="financials?.serviceFeeUgx" class="flex justify-between text-gray-500">
                <span>Service Fee</span>
                <span class="font-medium text-gray-700">{{ fmtUgx(financials.serviceFeeUgx) }}</span>
              </div>
              <p v-if="!app.budgetUsd && !financials?.totalDutiesUgx" class="text-gray-400 text-xs">
                Actual CIF not yet recorded. Update status to <em>Vehicle Found</em> to enter sourced figures.
              </p>
              <div class="flex justify-between text-gray-500 pt-1">
                <span>Client Has Paid</span>
                <span class="font-medium text-green-600">{{ fmtUgx(financials?.totalPaidUgx ?? 0) }}</span>
              </div>
            </div>
          </div>

          <!-- ── Float Account ──────────────────────────────────────────── -->
          <div class="bg-white border border-gray-200 rounded-xl p-5">
            <h3 class="text-sm font-semibold text-gray-700 mb-3">Float Account</h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between text-gray-500">
                <span>Advances Received</span>
                <span class="font-medium text-gray-700">{{ fmtUgx(app.floatReceived) }}</span>
              </div>
              <div class="flex justify-between text-gray-500">
                <span>Expenses Drawn</span>
                <span class="font-medium text-red-600">{{ app.totalExpensesUgx ? '− ' + fmtUgx(app.totalExpensesUgx) : '—' }}</span>
              </div>
              <div class="border-t border-gray-100 pt-2 flex justify-between font-semibold">
                <span class="text-gray-700">Float Balance</span>
                <span :class="(app.floatBalance ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'">
                  {{ fmtUgx(app.floatBalance) }}
                </span>
              </div>
              <div
                v-if="(app.floatBalance ?? 0) < 0"
                class="mt-1 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700 flex items-start gap-1.5"
              >
                <i class="fa-solid fa-circle-exclamation mt-0.5 shrink-0"></i>
                <span>Float is negative — EzzyRide is covering {{ fmtUgx(Math.abs(app.floatBalance ?? 0)) }} from own funds.</span>
              </div>
            </div>
          </div>

          <!-- ── Quick counts ───────────────────────────────────────────── -->
          <div class="bg-white border border-gray-200 rounded-xl p-5">
            <h3 class="text-sm font-semibold text-gray-700 mb-3">Records</h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between text-gray-500">
                <span>Payments</span>
                <span class="font-medium text-gray-700">{{ app.payments.length }}</span>
              </div>
              <div class="flex justify-between text-gray-500">
                <span>Expenses</span>
                <span class="font-medium text-gray-700">{{ app.expenses.length }}</span>
              </div>
              <div class="flex justify-between text-gray-500">
                <span>Documents</span>
                <span class="font-medium text-gray-700">{{ app.documents.length }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Tab 1: Customer ─────────────────────────────────────────────── -->
      <div v-if="activeTab === 1" class="bg-white border border-gray-200 rounded-xl p-6">
        <h3 class="text-sm font-semibold text-gray-700 mb-4">Customer / Applicant Info</h3>
        <div v-if="app.customer" class="space-y-3 text-sm">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p class="text-gray-500 text-xs">Name</p>
              <p class="font-medium">{{ app.customer.name }}</p>
            </div>
            <div>
              <p class="text-gray-500 text-xs">Phone</p>
              <p class="font-medium">{{ app.customer.phone }}</p>
            </div>
            <div>
              <p class="text-gray-500 text-xs">Email</p>
              <p class="font-medium">{{ app.customer.email ?? '—' }}</p>
            </div>
          </div>
          <NuxtLink :to="`/backoffice/customers/${app.customer.id}`" class="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-2">
            <i class="fa-solid fa-arrow-up-right-from-square text-xs"></i> View Customer Profile
          </NuxtLink>
        </div>
        <div v-else class="space-y-3 text-sm">
          <p class="text-gray-500 text-xs mb-2">Walk-in / unregistered applicant</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p class="text-gray-500 text-xs">Name</p>
              <p class="font-medium">{{ app.applicantName ?? '—' }}</p>
            </div>
            <div>
              <p class="text-gray-500 text-xs">Phone</p>
              <p class="font-medium">{{ app.applicantPhone ?? '—' }}</p>
            </div>
            <div>
              <p class="text-gray-500 text-xs">Email</p>
              <p class="font-medium">{{ app.applicantEmail ?? '—' }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Tab 2: Payments ────────────────────────────────────────────── -->
      <div v-if="activeTab === 2" class="space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-700">Payments Received</h3>
          <button
            class="flex items-center gap-1.5 text-sm bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
            @click="showPaymentForm = !showPaymentForm"
          >
            <i class="fa-solid fa-plus"></i> Add Payment
          </button>
        </div>

        <!-- Add payment form -->
        <div v-if="showPaymentForm" class="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
          <h4 class="text-sm font-medium text-gray-700">New Payment</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Payment Type</label>
              <select v-model="paymentForm.payment_type" class="input-field">
                <option value="service_fee">Service Fee</option>
                <option value="clearance_advance">Clearance Advance</option>
                <option value="sourcing_advance">Sourcing Advance</option>
                <option value="deposit">Deposit</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Amount (UGX)</label>
              <input v-model="paymentForm.amount" type="number" min="0" class="input-field" placeholder="0" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Method</label>
              <select v-model="paymentForm.payment_method" class="input-field">
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="cheque">Cheque</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Date Paid</label>
              <input v-model="paymentForm.paid_at" type="datetime-local" class="input-field" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Reference No.</label>
              <input v-model="paymentForm.reference_number" type="text" class="input-field" placeholder="Optional" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Notes</label>
              <input v-model="paymentForm.notes" type="text" class="input-field" placeholder="Optional" />
            </div>
          </div>
          <div v-if="paymentError" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{{ paymentError }}</div>
          <div class="flex gap-2">
            <button
              :disabled="savingPayment"
              class="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-60"
              @click="submitPayment"
            >
              <i v-if="savingPayment" class="fa-solid fa-spinner fa-spin mr-1"></i>
              {{ savingPayment ? 'Saving…' : 'Save Payment' }}
            </button>
            <button class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg" @click="showPaymentForm = false">Cancel</button>
          </div>
        </div>

        <!-- Payments table -->
        <div class="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div v-if="app.payments.length > 0" class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-200">
                <th class="text-left px-4 py-2.5 font-medium text-gray-600">Receipt</th>
                <th class="text-left px-4 py-2.5 font-medium text-gray-600">Type</th>
                <th class="text-left px-4 py-2.5 font-medium text-gray-600">Amount</th>
                <th class="text-left px-4 py-2.5 font-medium text-gray-600">Method</th>
                <th class="text-left px-4 py-2.5 font-medium text-gray-600">Date</th>
                <th class="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in app.payments" :key="p.id" class="border-b border-gray-100 last:border-0">
                <td class="px-4 py-3 font-mono text-xs">{{ p.receiptNumber }}</td>
                <td class="px-4 py-3">{{ paymentTypeLabel(p.paymentType) }}</td>
                <td class="px-4 py-3 font-semibold">{{ fmtUgx(p.amount) }}</td>
                <td class="px-4 py-3">{{ fmtStatus(p.paymentMethod) }}</td>
                <td class="px-4 py-3 text-gray-500">{{ fmtDate(p.paidAt) }}</td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-1">
                    <button
                      class="p-1.5 text-gray-400 hover:text-secondary hover:bg-blue-50 rounded-md transition-colors"
                      title="Download receipt PDF"
                      @click="downloadImportReceipt(p)"
                    >
                      <i class="fa-solid fa-download text-xs"></i>
                    </button>
                    <button class="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors" title="Delete payment" @click="deletePayment(p)">
                      <i class="fa-solid fa-trash text-xs"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          </div>
          <div v-else class="px-4 py-8 text-center text-gray-400 text-sm">
            No payments recorded yet.
          </div>
        </div>
      </div>

      <!-- ── Tab 3: Expenses ────────────────────────────────────────────── -->
      <div v-if="activeTab === 3" class="space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-700">Expenses (Float Drawdowns)</h3>
          <button
            class="flex items-center gap-1.5 text-sm bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
            @click="showExpenseForm = !showExpenseForm"
          >
            <i class="fa-solid fa-plus"></i> Add Expense
          </button>
        </div>

        <!-- Add expense form -->
        <div v-if="showExpenseForm" class="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
          <h4 class="text-sm font-medium text-gray-700">New Expense</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Category</label>
              <select v-model="expenseForm.category" class="input-field">
                <option value="port_fees">Port Fees</option>
                <option value="customs_duty">Customs Duty</option>
                <option value="shipping">Shipping</option>
                <option value="inspection">Inspection</option>
                <option value="local_transport">Local Transport</option>
                <option value="agent_fees">Agent Fees</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <input v-model="expenseForm.description" type="text" class="input-field" placeholder="Brief description" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Currency</label>
              <select v-model="expenseForm.currency" class="input-field">
                <option value="ugx">UGX</option>
                <option value="usd">USD</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Amount</label>
              <input v-model="expenseForm.amount" type="number" min="0" step="0.01" class="input-field" placeholder="0" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">
                Exchange Rate
                <span class="text-gray-400 font-normal">(1 {{ expenseForm.currency.toUpperCase() }} = X UGX)</span>
              </label>
              <input
                v-model="expenseForm.exchange_rate_used"
                type="number" min="0" step="0.01"
                :disabled="expenseForm.currency === 'ugx'"
                :class="expenseForm.currency === 'ugx' ? 'input-field bg-gray-50 text-gray-400 cursor-not-allowed' : 'input-field'"
                placeholder="e.g. 3750"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">
                Amount (UGX)
                <span class="text-gray-400 font-normal">— auto-calculated</span>
              </label>
              <div class="input-field bg-gray-50 text-gray-700 font-medium select-none">
                {{ expenseForm.amount_ugx ? Number(expenseForm.amount_ugx).toLocaleString() : '—' }}
              </div>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Date Incurred</label>
              <input v-model="expenseForm.incurred_at" type="date" class="input-field" />
            </div>
          </div>
          <div v-if="expenseError" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{{ expenseError }}</div>
          <div class="flex gap-2">
            <button
              :disabled="savingExpense"
              class="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-60"
              @click="submitExpense"
            >
              <i v-if="savingExpense" class="fa-solid fa-spinner fa-spin mr-1"></i>
              {{ savingExpense ? 'Saving…' : 'Save Expense' }}
            </button>
            <button class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg" @click="showExpenseForm = false">Cancel</button>
          </div>
        </div>

        <!-- Expenses table -->
        <div class="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div v-if="app.expenses.length > 0" class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-200">
                <th class="text-left px-4 py-2.5 font-medium text-gray-600">Category</th>
                <th class="text-left px-4 py-2.5 font-medium text-gray-600">Description</th>
                <th class="text-left px-4 py-2.5 font-medium text-gray-600">Amount</th>
                <th class="text-left px-4 py-2.5 font-medium text-gray-600">UGX Amount</th>
                <th class="text-left px-4 py-2.5 font-medium text-gray-600">Date</th>
                <th class="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="e in app.expenses" :key="e.id" class="border-b border-gray-100 last:border-0">
                <td class="px-4 py-3">{{ fmtStatus(e.category) }}</td>
                <td class="px-4 py-3 text-gray-600">{{ e.description }}</td>
                <td class="px-4 py-3">{{ Number(e.amount).toLocaleString() }} {{ e.currency.toUpperCase() }}</td>
                <td class="px-4 py-3 font-medium">{{ fmtUgx(e.amountUgx) }}</td>
                <td class="px-4 py-3 text-gray-500">{{ fmtDate(e.incurredAt) }}</td>
                <td class="px-4 py-3">
                  <button class="text-gray-400 hover:text-red-500 transition-colors" @click="deleteExpense(e)">
                    <i class="fa-solid fa-trash text-xs"></i>
                  </button>
                </td>
              </tr>
            </tbody>
            <tfoot class="bg-gray-50 border-t border-gray-200">
              <tr>
                <td colspan="3" class="px-4 py-2.5 text-sm font-semibold text-gray-700">Total</td>
                <td class="px-4 py-2.5 text-sm font-bold text-gray-900">{{ fmtUgx(app.totalExpensesUgx) }}</td>
                <td colspan="2"></td>
              </tr>
            </tfoot>
          </table>
          </div>
          <div v-else class="px-4 py-8 text-center text-gray-400 text-sm">
            No expenses recorded yet.
          </div>
        </div>
      </div>

      <!-- ── Tab 4: Documents ───────────────────────────────────────────── -->
      <div v-if="activeTab === 4" class="space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-700">Documents</h3>
        </div>

        <!-- Upload form -->
        <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
          <h4 class="text-sm font-medium text-gray-700">Upload Document</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Document Name</label>
              <input v-model="docForm.name" type="text" class="input-field" placeholder="e.g. Bill of Lading" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Type</label>
              <select v-model="docForm.type" class="input-field">
                <option value="bl_copy">BL Copy</option>
                <option value="customs_release">Customs Release</option>
                <option value="inspection_report">Inspection Report</option>
                <option value="invoice">Invoice</option>
                <option value="shipping_manifest">Shipping Manifest</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">File</label>
            <input ref="fileInput" type="file" class="input-field" @change="onFileChange" />
          </div>
          <div v-if="docError" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{{ docError }}</div>
          <button
            :disabled="savingDoc"
            class="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-60"
            @click="submitDoc"
          >
            <i v-if="savingDoc" class="fa-solid fa-spinner fa-spin mr-1"></i>
            {{ savingDoc ? 'Uploading…' : 'Upload' }}
          </button>
        </div>

        <!-- Documents list -->
        <div class="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div v-if="app.documents.length > 0" class="divide-y divide-gray-100">
            <div v-for="doc in app.documents" :key="doc.id" class="flex items-center justify-between px-4 py-3">
              <div class="flex items-center gap-3">
                <i class="fa-solid fa-file text-gray-400 text-lg"></i>
                <div>
                  <p class="text-sm font-medium text-gray-800">{{ doc.name }}</p>
                  <p class="text-xs text-gray-400">{{ fmtStatus(doc.type) }}</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <a :href="storageUrl(doc.path)" target="_blank" class="text-sm text-primary hover:underline">
                  <i class="fa-solid fa-download text-xs mr-1"></i>Download
                </a>
                <button class="text-gray-400 hover:text-red-500 transition-colors ml-2" @click="deleteDoc(doc)">
                  <i class="fa-solid fa-trash text-xs"></i>
                </button>
              </div>
            </div>
          </div>
          <div v-else class="px-4 py-8 text-center text-gray-400 text-sm">
            No documents uploaded yet.
          </div>
        </div>
      </div>

      <!-- ── Tab 5: Activity Log ─────────────────────────────────────────── -->
      <div v-if="activeTab === 5" class="bg-white border border-gray-200 rounded-xl">
        <div v-if="app.activityLog.length > 0" class="divide-y divide-gray-100">
          <div v-for="entry in app.activityLog" :key="entry.id" class="flex gap-3 px-4 py-3">
            <div class="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
              <i class="fa-solid fa-clock-rotate-left text-gray-500 text-xs"></i>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-gray-800">{{ entry.action }}</p>
              <p v-if="entry.notes" class="text-xs text-gray-500 mt-0.5">{{ entry.notes }}</p>
              <p class="text-xs text-gray-400 mt-1">
                {{ entry.user?.name ?? 'System' }} · {{ fmtDateTime(entry.createdAt) }}
              </p>
            </div>
          </div>
        </div>
        <div v-else class="px-4 py-8 text-center text-gray-400 text-sm">
          No activity recorded yet.
        </div>
      </div>
    </template>
  </div>

  <!-- Update Status Modal -->
  <Teleport to="body">
    <div v-if="showStatusModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div class="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 class="text-base font-semibold text-gray-900">Update Status</h2>
          <button class="text-gray-400 hover:text-gray-600" @click="showStatusModal = false">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
        <div class="p-5 space-y-4">
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">New Status</label>
            <select v-model="statusForm.status" class="input-field">
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
          </div>
          <!-- Vehicle found / purchased — capture actual CIF and transport quote -->
          <div v-if="['vehicle_found', 'purchased'].includes(statusForm.status)"
            class="rounded-xl border border-violet-200 bg-violet-50 p-4 space-y-3">
            <p class="text-xs font-semibold text-violet-700 uppercase tracking-wide">
              <i class="fa-solid fa-car mr-1"></i> Vehicle Confirmed — Update Quote Details
            </p>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">
                  Actual CIF (USD)
                  <span class="text-gray-400 font-normal">— what we paid</span>
                </label>
                <input v-model="statusForm.actual_cif_usd" type="number" min="0" step="0.01"
                  placeholder="e.g. 8500"
                  class="input-field" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">
                  Transport (UGX)
                  <span class="text-gray-400 font-normal">— Mombasa → Uganda</span>
                </label>
                <input v-model="statusForm.transport_cost_ugx" type="number" min="0" step="1"
                  placeholder="e.g. 1500000"
                  class="input-field" />
              </div>
            </div>
            <p class="text-xs text-violet-500">
              These figures will appear on the Updated Quotation PDF. URA duties are still calculated from their own valuation CIF.
            </p>
          </div>

          <div v-if="statusForm.status === 'stalled'">
            <label class="block text-xs font-medium text-gray-700 mb-1">Stall Reason</label>
            <textarea v-model="statusForm.stall_reason" rows="2" class="input-field resize-none" placeholder="Why is this stalled?"></textarea>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Notes (optional)</label>
            <textarea v-model="statusForm.notes" rows="2" class="input-field resize-none"></textarea>
          </div>
        </div>
        <div class="flex justify-end gap-2 px-5 pb-5">
          <button class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg" @click="showStatusModal = false">Cancel</button>
          <button
            :disabled="savingStatus"
            class="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-60"
            @click="submitStatus"
          >
            <i v-if="savingStatus" class="fa-solid fa-spinner fa-spin mr-1"></i>
            {{ savingStatus ? 'Saving…' : 'Update' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Edit Application Modal -->
  <Teleport to="body">
    <div v-if="showEditModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Edit Application</h2>
          <button class="text-gray-400 hover:text-gray-600" @click="showEditModal = false">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
        <form class="p-6 space-y-4" @submit.prevent="submitEdit">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Applicant Name</label>
              <input v-model="editForm.applicant_name" type="text" class="input-field" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Phone</label>
              <input v-model="editForm.applicant_phone" type="text" class="input-field" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Email</label>
              <input v-model="editForm.applicant_email" type="email" class="input-field" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Service Type</label>
              <select v-model="editForm.service_type" class="input-field">
                <option value="full_import">Full Import</option>
                <option value="sourcing_only">Sourcing Only</option>
                <option value="mombasa_clearance">Mombasa Clearance</option>
                <option value="consultation">Consultation</option>
                <option value="custom">Custom Plan</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Timeline</label>
              <select v-model="editForm.timeline" class="input-field">
                <option value="asap">ASAP</option>
                <option value="1month">1 Month</option>
                <option value="2_3months">2–3 Months</option>
                <option value="6months">6 Months</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Budget (USD)</label>
              <input v-model="editForm.budget_usd" type="number" min="0" class="input-field" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">
                Actual CIF (USD)
                <span class="text-gray-400 font-normal">— confirmed sourced price</span>
              </label>
              <input v-model="editForm.actual_cif_usd" type="number" min="0" step="0.01" class="input-field" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">
                Transport Cost (UGX)
                <span class="text-gray-400 font-normal">— Mombasa → Uganda</span>
              </label>
              <input v-model="editForm.transport_cost_ugx" type="number" min="0" step="1" class="input-field" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Service Fee (UGX)</label>
              <input v-model="editForm.service_fee_ugx" type="number" min="0" class="input-field" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Vehicle Year</label>
              <input v-model="editForm.vehicle_year" type="number" min="1980" class="input-field" />
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Vehicle Description</label>
            <input v-model="editForm.vehicle_description" type="text" class="input-field" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Vehicle Link</label>
            <input v-model="editForm.vehicle_link" type="url" class="input-field" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Stall Resolution</label>
            <select v-model="editForm.stall_resolution" class="input-field">
              <option value="">— None —</option>
              <option value="client_paid">Client Paid</option>
              <option value="company_buyout">Company Buyout</option>
              <option value="consignment">Consignment</option>
              <option value="abandoned">Abandoned</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Notes (customer-visible)</label>
            <textarea v-model="editForm.notes" rows="2" class="input-field resize-none"></textarea>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Internal Notes</label>
            <textarea v-model="editForm.internal_notes" rows="2" class="input-field resize-none"></textarea>
          </div>
          <div v-if="editError" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{{ editError }}</div>
          <div class="flex justify-end gap-3 pt-2">
            <button type="button" class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg" @click="showEditModal = false">Cancel</button>
            <button
              type="submit"
              :disabled="savingEdit"
              class="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-60"
            >
              <i v-if="savingEdit" class="fa-solid fa-spinner fa-spin mr-1"></i>
              {{ savingEdit ? 'Saving…' : 'Save Changes' }}
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
