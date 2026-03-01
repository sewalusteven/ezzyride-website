<script setup lang="ts">
useSeoMeta({
  title: 'Track Your Order | EzzyRide Uganda',
  description: 'Track your vehicle purchase or import application status and payment history.',
})

const { $api } = useNuxtApp()
const route    = useRoute()
const router   = useRouter()

const reference  = ref((route.params.reference as string ?? '').toUpperCase())
const inputRef   = ref(reference.value)
const loading    = ref(false)
const trackData  = ref<any>(null)
const notFound   = ref(false)

// ── Status labels & icons ───────────────────────────────────────────────────
const importStepLabels: Record<string, string> = {
  enquiry:           'Enquiry Received',
  quoted:            'Quote Sent',
  accepted:          'Quote Accepted',
  sourcing:          'Sourcing Vehicle',
  vehicle_found:     'Vehicle Found',
  purchased:         'Vehicle Purchased',
  pre_shipment:      'Pre-Shipment Inspection',
  shipped:           'Shipped from Japan',
  port_arrived:      'Arrived at Port',
  customs_clearance: 'Customs Clearance',
  in_transit_uganda: 'In Transit to Uganda',
  delivered:         'Delivered',
  completed:         'Completed',
}

const vehicleStatusLabels: Record<string, { label: string; colour: string }> = {
  available:    { label: 'Available',    colour: 'text-green-600 bg-green-50' },
  reserved:     { label: 'Reserved',     colour: 'text-yellow-600 bg-yellow-50' },
  sold:         { label: 'Sold',         colour: 'text-blue-600 bg-blue-50' },
  imported:     { label: 'Imported',     colour: 'text-purple-600 bg-purple-50' },
  in_transit:   { label: 'In Transit',   colour: 'text-orange-600 bg-orange-50' },
}

const serviceTypeLabel = (t: string) => ({
  full_import:       'Full Import',
  mombasa_clearance: 'Mombasa Clearance',
  sourcing_only:     'Sourcing Only',
  consultation:      'Consultation',
}[t] ?? t)

const paymentTypeLabel = (t: string) => t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
const paymentMethodLabel = (m: string) => m.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

const formatUgx = (v: number) =>
  'UGX ' + Number(v).toLocaleString('en-UG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

// ── Fetch ───────────────────────────────────────────────────────────────────
const fetchTracking = async (ref: string) => {
  if (!ref.trim()) return
  loading.value  = true
  notFound.value = false
  trackData.value = null
  try {
    const { data } = await $api.get(`/web/track/${encodeURIComponent(ref.trim().toUpperCase())}`)
    trackData.value = data.data
  } catch (e: any) {
    notFound.value = true
  } finally {
    loading.value = false
  }
}

const search = () => {
  const ref = inputRef.value.trim().toUpperCase()
  if (!ref) return
  router.push(`/track/${ref}`)
  reference.value = ref
  fetchTracking(ref)
}

onMounted(() => {
  if (reference.value) fetchTracking(reference.value)
})
</script>

<template>
  <div class="font-roboto text-gray-800 min-h-screen bg-gray-50">

    <!-- Hero -->
    <section class="pt-24 pb-10 bg-secondary">
      <div class="container mx-auto px-4 text-center text-white">
        <div class="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-sm px-4 py-1.5 rounded-full mb-4">
          <i class="fa-solid fa-location-dot text-primary text-xs"></i> Order Tracking
        </div>
        <h1 class="text-3xl md:text-4xl font-bold font-montserrat mb-3">
          Track Your <span class="text-primary">Order</span>
        </h1>
        <p class="text-gray-300 mb-8 max-w-lg mx-auto text-sm">
          Enter your vehicle or import application reference to see your current status and payment history.
        </p>

        <!-- Search bar -->
        <div class="max-w-lg mx-auto flex gap-2">
          <input
            v-model="inputRef"
            type="text"
            placeholder="EZR-2026-00001 or IMP-2026-0001"
            class="flex-1 px-4 py-3 rounded-xl text-gray-900 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            @keydown.enter="search"
          />
          <button
            @click="search"
            :disabled="loading"
            class="bg-primary hover:bg-red-700 disabled:opacity-60 text-white font-semibold px-5 py-3 rounded-xl transition-colors flex items-center gap-2 shrink-0"
          >
            <i v-if="loading" class="fa-solid fa-spinner fa-spin"></i>
            <i v-else class="fa-solid fa-magnifying-glass"></i>
            <span class="hidden sm:inline">Track</span>
          </button>
        </div>
      </div>
    </section>

    <!-- Results -->
    <section class="py-10">
      <div class="container mx-auto px-4 max-w-3xl">

        <!-- Loading -->
        <div v-if="loading" class="text-center py-20 text-gray-400">
          <i class="fa-solid fa-spinner fa-spin text-3xl mb-3 text-primary"></i>
          <p>Loading tracking information…</p>
        </div>

        <!-- Not found -->
        <div v-else-if="notFound" class="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
          <div class="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="fa-solid fa-circle-xmark text-red-400 text-3xl"></i>
          </div>
          <h2 class="text-xl font-bold text-gray-800 mb-2">Reference Not Found</h2>
          <p class="text-gray-500 text-sm mb-5">
            We couldn't find any record for <span class="font-mono font-semibold text-secondary">{{ reference }}</span>.
            Please check your reference number and try again.
          </p>
          <NuxtLink to="/contact" class="text-primary text-sm font-medium hover:underline">
            Contact us for help →
          </NuxtLink>
        </div>

        <!-- Empty (no reference yet) -->
        <div v-else-if="!trackData && !reference" class="text-center py-20 text-gray-400">
          <i class="fa-solid fa-magnifying-glass text-5xl mb-4 text-gray-200"></i>
          <p class="font-medium">Enter your reference above to start tracking</p>
        </div>

        <!-- ── IMPORT APPLICATION result ───────────────────────────────────── -->
        <template v-else-if="trackData?.type === 'import_application'">

          <!-- Header card -->
          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Import Application</p>
                <p class="font-mono text-lg font-bold text-secondary">{{ trackData.reference }}</p>
                <p class="text-sm text-gray-500 mt-0.5">{{ serviceTypeLabel(trackData.serviceType) }}
                  <span v-if="trackData.vehicleDescription"> · {{ trackData.vehicleDescription }}</span>
                </p>
              </div>
              <div>
                <span v-if="trackData.isCancelled" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-red-50 text-red-600">
                  <i class="fa-solid fa-ban text-xs"></i> Cancelled
                </span>
                <span v-else-if="trackData.isStalled" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-yellow-50 text-yellow-700">
                  <i class="fa-solid fa-pause text-xs"></i> On Hold
                </span>
                <span v-else class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-green-50 text-green-700">
                  <i class="fa-solid fa-circle-dot text-xs"></i>
                  {{ importStepLabels[trackData.status] ?? trackData.status }}
                </span>
              </div>
            </div>
            <p v-if="trackData.notes" class="mt-4 text-sm text-gray-600 bg-blue-50 rounded-lg p-3 border border-blue-100">
              <i class="fa-solid fa-circle-info text-blue-400 mr-1.5"></i>{{ trackData.notes }}
            </p>
          </div>

          <!-- Status timeline -->
          <div v-if="!trackData.isCancelled && !trackData.isStalled" class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
            <h3 class="text-sm font-semibold text-gray-700 mb-5">Import Progress</h3>
            <div class="relative">
              <!-- Connecting line -->
              <div class="absolute left-3.5 top-4 bottom-4 w-0.5 bg-gray-100"></div>
              <div class="space-y-4">
                <div
                  v-for="(step, i) in trackData.statusSteps"
                  :key="step"
                  class="relative flex items-start gap-4 pl-10"
                >
                  <!-- Dot -->
                  <div
                    class="absolute left-0 w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors"
                    :class="i < trackData.statusStep
                      ? 'bg-green-500 border-green-500'
                      : i === trackData.statusStep
                        ? 'bg-primary border-primary'
                        : 'bg-white border-gray-200'"
                  >
                    <i v-if="i < trackData.statusStep" class="fa-solid fa-check text-white text-xs"></i>
                    <div v-else-if="i === trackData.statusStep" class="w-2.5 h-2.5 bg-white rounded-full"></div>
                  </div>
                  <!-- Label -->
                  <div class="pt-0.5">
                    <p
                      class="text-sm font-medium transition-colors"
                      :class="i === trackData.statusStep
                        ? 'text-primary'
                        : i < trackData.statusStep
                          ? 'text-green-600'
                          : 'text-gray-400'"
                    >
                      {{ importStepLabels[step] }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Payment summary -->
          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-semibold text-gray-700">Payments</h3>
              <span class="text-sm font-semibold text-secondary">
                Total: {{ formatUgx(trackData.totalPaid) }}
              </span>
            </div>
            <div v-if="trackData.payments.length" class="divide-y divide-gray-50">
              <div v-for="p in trackData.payments" :key="p.receiptNumber" class="py-3 flex items-center justify-between gap-4">
                <div class="min-w-0">
                  <p class="text-sm font-medium text-gray-800">{{ paymentTypeLabel(p.paymentType) }}</p>
                  <p class="text-xs text-gray-400 mt-0.5">{{ formatDate(p.paidAt) }} · {{ paymentMethodLabel(p.paymentMethod) }} · <span class="font-mono">{{ p.receiptNumber }}</span></p>
                </div>
                <p class="text-sm font-semibold text-gray-900 shrink-0">{{ formatUgx(p.amount) }}</p>
              </div>
            </div>
            <p v-else class="text-sm text-gray-400 text-center py-6">No payments recorded yet.</p>
          </div>
        </template>

        <!-- ── VEHICLE SALE result ──────────────────────────────────────────── -->
        <template v-else-if="trackData?.type === 'vehicle_sale'">

          <!-- Header card -->
          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Vehicle Purchase</p>
                <p class="font-mono text-lg font-bold text-secondary">{{ trackData.reference }}</p>
                <p class="text-gray-700 font-semibold mt-1">
                  {{ trackData.vehicle.brand }} {{ trackData.vehicle.model }}
                  <span class="font-normal text-gray-500">({{ trackData.vehicle.year }}<span v-if="trackData.vehicle.colour"> · {{ trackData.vehicle.colour }}</span>)</span>
                </p>
              </div>
              <div>
                <span
                  v-if="vehicleStatusLabels[trackData.status]"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold"
                  :class="vehicleStatusLabels[trackData.status].colour"
                >
                  {{ vehicleStatusLabels[trackData.status].label }}
                </span>
              </div>
            </div>
          </div>

          <!-- Payment summary -->
          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
            <h3 class="text-sm font-semibold text-gray-700 mb-4">Payment Summary</h3>
            <div class="grid grid-cols-3 gap-4 mb-5">
              <div class="text-center bg-gray-50 rounded-xl p-4">
                <p class="text-xs text-gray-400 mb-1">Agreed Price</p>
                <p class="text-base font-bold text-secondary">{{ formatUgx(trackData.agreedPrice) }}</p>
              </div>
              <div class="text-center bg-gray-50 rounded-xl p-4">
                <p class="text-xs text-gray-400 mb-1">Total Paid</p>
                <p class="text-base font-bold text-green-600">{{ formatUgx(trackData.totalPaid) }}</p>
              </div>
              <div class="text-center rounded-xl p-4" :class="trackData.isFullyPaid ? 'bg-green-50' : 'bg-yellow-50'">
                <p class="text-xs mb-1" :class="trackData.isFullyPaid ? 'text-green-500' : 'text-yellow-600'">Balance</p>
                <p class="text-base font-bold" :class="trackData.isFullyPaid ? 'text-green-600' : 'text-yellow-700'">
                  {{ trackData.isFullyPaid ? 'Fully Paid' : formatUgx(trackData.balance) }}
                </p>
              </div>
            </div>

            <!-- Payment list -->
            <div v-if="trackData.payments.length" class="divide-y divide-gray-50 border-t border-gray-100 pt-4">
              <div v-for="p in trackData.payments" :key="p.receiptNumber" class="py-3 flex items-center justify-between gap-4">
                <div class="min-w-0">
                  <p class="text-sm font-medium text-gray-800">Payment</p>
                  <p class="text-xs text-gray-400 mt-0.5">{{ formatDate(p.paidAt) }} · {{ paymentMethodLabel(p.paymentMethod) }} · <span class="font-mono">{{ p.receiptNumber }}</span></p>
                </div>
                <p class="text-sm font-semibold text-gray-900 shrink-0">{{ formatUgx(p.amount) }}</p>
              </div>
            </div>
            <p v-else class="text-sm text-gray-400 text-center py-4 border-t border-gray-100 mt-3">No payments recorded yet.</p>
          </div>

        </template>

      </div>
    </section>

    <!-- Help footer -->
    <section class="py-8 border-t border-gray-100 bg-white">
      <div class="container mx-auto px-4 text-center text-sm text-gray-500">
        Having trouble? <NuxtLink to="/contact" class="text-primary font-medium hover:underline">Contact our team</NuxtLink> and quote your reference number.
      </div>
    </section>

  </div>
</template>
