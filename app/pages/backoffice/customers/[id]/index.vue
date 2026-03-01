<script setup lang="ts">
import { TabGroup, TabList, Tab, TabPanels, TabPanel, Dialog, DialogPanel, TransitionRoot, TransitionChild } from '@headlessui/vue'

definePageMeta({ layout: 'admin-layout' })

const { $api } = useNuxtApp()
const router = useRouter()
const route = useRoute()
const id = route.params.id as string

// ── Types ──────────────────────────────────────────────────────────────────
interface VehicleSummary {
  id: number
  reference: string
  model: string
  brand: { id: number; name: string } | null
  status: string
}

interface Sale {
  id: number
  agreedPrice: string
  reservationDeposit: string | null
  saleDate: string | null
  notes: string | null
  vehicle: VehicleSummary
}

interface Payment {
  id: number
  vehicleId: number
  amount: string
  paymentMethod: string
  receiptNumber: string
  referenceNumber: string | null
  notes: string | null
  paidAt: string
}

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
  sales: Sale[]
  payments: Payment[]
}

// ── State ──────────────────────────────────────────────────────────────────
const customer = ref<Customer | null>(null)
const loading  = ref(true)
const error    = ref('')

// ── Fetch ──────────────────────────────────────────────────────────────────
const fetchCustomer = async () => {
  loading.value = true
  error.value   = ''
  try {
    const { data } = await $api.get(`/v1/customers/${id}`)
    customer.value = data.data
  } catch (e: any) {
    error.value = e.response?.data?.message ?? 'Failed to load customer'
  } finally {
    loading.value = false
  }
}

onMounted(fetchCustomer)

// ── Helpers ────────────────────────────────────────────────────────────────
const fmtUGX = (n: any) =>
  n != null
    ? new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(Number(n))
    : '\u2014'

const fmtDate = (s: string | null | undefined) =>
  s ? new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '\u2014'

const statusColors: Record<string, string> = {
  draft:      'bg-gray-100 text-gray-600',
  in_transit: 'bg-blue-100 text-blue-700',
  available:  'bg-green-100 text-green-700',
  reserved:   'bg-yellow-100 text-yellow-700',
  sold:       'bg-red-100 text-red-600',
}

const statusLabel = (s: string) => s.replace(/_/g, ' ')

// ── Computed summaries ─────────────────────────────────────────────────────
const totalPaid = computed(() =>
  customer.value?.payments.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0
)

const vehicleRefForPayment = (payment: Payment): string => {
  const sale = customer.value?.sales.find(s => s.vehicle.id === payment.vehicleId)
  return sale?.vehicle.reference ?? '\u2014'
}

// ── Tab state ──────────────────────────────────────────────────────────────
const tabKeys = ['vehicles', 'payments'] as const
type TabKey = typeof tabKeys[number]
const activeTab = ref<TabKey>('vehicles')
const tabIndex  = computed(() => tabKeys.indexOf(activeTab.value))

// ── Edit modal ─────────────────────────────────────────────────────────────
const editModal = ref(false)
const editForm  = ref({ name: '', phone: '', email: '', id_type: '', id_number: '', address: '', notes: '' })
const saving    = ref(false)
const saveError = ref('')

const openEdit = () => {
  if (!customer.value) return
  editForm.value = {
    name:      customer.value.name,
    phone:     customer.value.phone,
    email:     customer.value.email ?? '',
    id_type:   customer.value.idType ?? '',
    id_number: customer.value.idNumber ?? '',
    address:   customer.value.address ?? '',
    notes:     customer.value.notes ?? '',
  }
  saveError.value = ''
  editModal.value = true
}

const submitEdit = async () => {
  saving.value    = true
  saveError.value = ''
  try {
    const payload: Record<string, any> = { ...editForm.value }
    Object.keys(payload).forEach(k => { if (payload[k] === '') payload[k] = null })
    const { data } = await $api.patch(`/v1/customers/${id}`, payload)
    customer.value = { ...customer.value!, ...data.data }
    editModal.value = false
  } catch (e: any) {
    const errs = e.response?.data?.data
    saveError.value = errs ? Object.values(errs).flat().join(' · ') : (e.response?.data?.message ?? 'Failed to save')
  } finally {
    saving.value = false
  }
}

// ── Delete ─────────────────────────────────────────────────────────────────
const deleteConfirm = ref(false)
const deleting      = ref(false)

const confirmDelete = async () => {
  deleting.value = true
  try {
    await $api.delete(`/v1/customers/${id}`)
    router.push('/backoffice/customers')
  } catch {
    deleteConfirm.value = false
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="p-6 space-y-5">

    <!-- Loading -->
    <div v-if="loading" class="py-16 text-center text-gray-400">
      <i class="fa-solid fa-spinner fa-spin text-2xl mb-2 block"></i>
      <p class="text-sm">Loading customer…</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="py-16 text-center text-red-400">
      <i class="fa-solid fa-circle-exclamation text-2xl mb-2 block"></i>
      <p class="text-sm">{{ error }}</p>
      <button class="cursor-pointer mt-4 text-sm text-primary hover:underline" @click="fetchCustomer">
        Try again
      </button>
    </div>

    <template v-else-if="customer">

      <!-- Back + Header -->
      <div class="flex items-center gap-4">
        <NuxtLink
          to="/backoffice/customers"
          class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
        >
          <i class="fa-solid fa-arrow-left"></i>
        </NuxtLink>

        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-3 flex-wrap">
            <h2 class="text-xl font-semibold text-gray-900 truncate">{{ customer.name }}</h2>
            <span class="font-mono text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
              {{ customer.phone }}
            </span>
            <span v-if="customer.email" class="text-sm text-gray-500">{{ customer.email }}</span>
            <span v-else class="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
              <i class="fa-solid fa-envelope-slash text-[10px]"></i> No email
            </span>
          </div>
          <p class="text-sm text-gray-400 mt-0.5">Member since {{ fmtDate(customer.createdAt) }}</p>
        </div>

        <!-- Action buttons -->
        <div class="flex items-center gap-2 shrink-0">
          <button @click="openEdit"
            class="cursor-pointer flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-50 transition-colors">
            <i class="fa-solid fa-pen text-xs"></i>
            Edit
          </button>
          <button @click="deleteConfirm = true"
            class="cursor-pointer flex items-center gap-2 px-3 py-2 border border-red-200 text-red-600 rounded-md text-sm hover:bg-red-50 transition-colors">
            <i class="fa-solid fa-trash text-xs"></i>
            Delete
          </button>
        </div>
      </div>

      <!-- Two-column body -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

        <!-- Left: Tabs (2/3) -->
        <div class="col-span-2">
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
            <TabGroup
              :selectedIndex="tabIndex"
              @change="(i: number) => { const t = tabKeys[i]; if (t) activeTab = t }"
            >
              <div class="border-b border-gray-200 mb-4">
                <TabList as="nav" class="flex -mb-px overflow-x-auto">
                  <Tab
                    v-for="t in [
                      { key: 'vehicles', label: 'Vehicles', icon: 'fa-car' },
                      { key: 'payments', label: 'Payments', icon: 'fa-money-bill-wave' },
                    ]"
                    :key="t.key"
                    as="template"
                    v-slot="{ selected }"
                  >
                    <button
                      class="cursor-pointer flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap"
                      :class="selected
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700'"
                    >
                      <i :class="`fa-solid ${t.icon} text-xs`"></i>
                      {{ t.label }}
                    </button>
                  </Tab>
                </TabList>
              </div>

              <TabPanels>

                <!-- Tab 1: Vehicles -->
                <TabPanel>
                  <div v-if="customer.sales.length === 0" class="py-12 text-center text-gray-400">
                    <i class="fa-solid fa-car text-3xl mb-3 block opacity-30"></i>
                    <p class="text-sm">No vehicle purchases on record.</p>
                  </div>

                  <div v-else class="overflow-x-auto rounded-lg border border-gray-100">
                    <table class="w-full text-sm">
                      <thead>
                        <tr class="bg-gray-50 border-b border-gray-200 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          <th class="px-4 py-3">Ref</th>
                          <th class="px-4 py-3">Vehicle</th>
                          <th class="px-4 py-3">Agreed Price</th>
                          <th class="px-4 py-3">Reservation</th>
                          <th class="px-4 py-3">Sale Date</th>
                          <th class="px-4 py-3">Status</th>
                          <th class="px-4 py-3"></th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-gray-100">
                        <tr
                          v-for="sale in customer.sales"
                          :key="sale.id"
                          class="hover:bg-gray-50 transition-colors"
                        >
                          <td class="px-4 py-3">
                            <span class="font-mono text-xs font-semibold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
                              {{ sale.vehicle.reference }}
                            </span>
                          </td>
                          <td class="px-4 py-3 font-medium text-gray-900">
                            {{ sale.vehicle.brand?.name ?? '' }} {{ sale.vehicle.model }}
                          </td>
                          <td class="px-4 py-3 text-gray-700">{{ fmtUGX(sale.agreedPrice) }}</td>
                          <td class="px-4 py-3 text-gray-500">
                            {{ sale.reservationDeposit ? fmtUGX(sale.reservationDeposit) : '\u2014' }}
                          </td>
                          <td class="px-4 py-3 text-gray-500">{{ fmtDate(sale.saleDate) }}</td>
                          <td class="px-4 py-3">
                            <span
                              class="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                              :class="statusColors[sale.vehicle.status] ?? 'bg-gray-100 text-gray-600'"
                            >
                              {{ statusLabel(sale.vehicle.status) }}
                            </span>
                          </td>
                          <td class="px-4 py-3">
                            <NuxtLink
                              :to="`/backoffice/vehicles/${sale.vehicle.id}`"
                              class="cursor-pointer text-primary hover:underline text-xs font-medium"
                            >
                              View <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                            </NuxtLink>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </TabPanel>

                <!-- Tab 2: Payments -->
                <TabPanel>
                  <div v-if="customer.payments.length === 0" class="py-12 text-center text-gray-400">
                    <i class="fa-solid fa-receipt text-3xl mb-3 block opacity-30"></i>
                    <p class="text-sm">No payments on record.</p>
                  </div>

                  <div v-else class="overflow-x-auto rounded-lg border border-gray-100">
                    <table class="w-full text-sm">
                      <thead>
                        <tr class="bg-gray-50 border-b border-gray-200 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          <th class="px-4 py-3">Date</th>
                          <th class="px-4 py-3">Receipt #</th>
                          <th class="px-4 py-3">Vehicle Ref</th>
                          <th class="px-4 py-3">Method</th>
                          <th class="px-4 py-3 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-gray-100">
                        <tr
                          v-for="payment in customer.payments"
                          :key="payment.id"
                          class="hover:bg-gray-50 transition-colors"
                        >
                          <td class="px-4 py-3 text-gray-500">{{ fmtDate(payment.paidAt) }}</td>
                          <td class="px-4 py-3">
                            <span class="font-mono text-xs font-semibold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
                              {{ payment.receiptNumber }}
                            </span>
                          </td>
                          <td class="px-4 py-3">
                            <NuxtLink
                              :to="`/backoffice/vehicles/${payment.vehicleId}`"
                              class="cursor-pointer font-mono text-xs font-semibold text-primary hover:underline"
                            >
                              {{ vehicleRefForPayment(payment) }}
                            </NuxtLink>
                          </td>
                          <td class="px-4 py-3 capitalize text-gray-600">
                            {{ payment.paymentMethod.replace(/_/g, ' ') }}
                          </td>
                          <td class="px-4 py-3 text-right font-semibold text-gray-900">
                            {{ fmtUGX(payment.amount) }}
                          </td>
                        </tr>
                      </tbody>
                      <tfoot>
                        <tr class="bg-gray-50 border-t-2 border-gray-200">
                          <td colspan="4" class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Total Paid
                          </td>
                          <td class="px-4 py-3 text-right font-bold text-gray-900">
                            {{ fmtUGX(totalPaid) }}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </TabPanel>

              </TabPanels>
            </TabGroup>
          </div>
        </div>

        <!-- Right: Sidebar (1/3) -->
        <div class="space-y-4">

          <!-- Info card -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5 space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <i class="fa-solid fa-user text-gray-400 text-xs"></i>
                Customer Info
              </h3>
              <button @click="openEdit" class="cursor-pointer text-xs text-primary hover:underline flex items-center gap-1">
                <i class="fa-solid fa-pen text-[10px]"></i> Edit
              </button>
            </div>

            <dl class="space-y-3 text-sm">
              <div class="flex justify-between gap-2">
                <dt class="text-gray-500 shrink-0">Full Name</dt>
                <dd class="font-medium text-gray-900 text-right">{{ customer.name }}</dd>
              </div>
              <div class="flex justify-between gap-2 border-t border-gray-50 pt-3">
                <dt class="text-gray-500 shrink-0">Phone</dt>
                <dd class="font-medium text-gray-900 text-right">{{ customer.phone }}</dd>
              </div>
              <div class="flex justify-between gap-2 border-t border-gray-50 pt-3">
                <dt class="text-gray-500 shrink-0">Email</dt>
                <dd class="font-medium text-gray-900 text-right break-all">{{ customer.email ?? '\u2014' }}</dd>
              </div>
              <div class="flex justify-between gap-2 border-t border-gray-50 pt-3">
                <dt class="text-gray-500 shrink-0">ID Type</dt>
                <dd class="font-medium text-gray-900 text-right uppercase">{{ customer.idType ?? '\u2014' }}</dd>
              </div>
              <div class="flex justify-between gap-2 border-t border-gray-50 pt-3">
                <dt class="text-gray-500 shrink-0">ID Number</dt>
                <dd class="font-mono text-xs font-medium text-gray-900 text-right">{{ customer.idNumber ?? '\u2014' }}</dd>
              </div>
              <div class="flex justify-between gap-2 border-t border-gray-50 pt-3">
                <dt class="text-gray-500 shrink-0">Address</dt>
                <dd class="font-medium text-gray-900 text-right">{{ customer.address ?? '\u2014' }}</dd>
              </div>
              <div v-if="customer.notes" class="border-t border-gray-50 pt-3">
                <dt class="text-gray-500 mb-1">Notes</dt>
                <dd class="text-gray-700 text-xs leading-relaxed whitespace-pre-line">{{ customer.notes }}</dd>
              </div>
              <div class="flex justify-between gap-2 border-t border-gray-50 pt-3">
                <dt class="text-gray-500 shrink-0">Member Since</dt>
                <dd class="font-medium text-gray-900 text-right">{{ fmtDate(customer.createdAt) }}</dd>
              </div>
            </dl>
          </div>

          <!-- Summary card -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5 space-y-4">
            <h3 class="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <i class="fa-solid fa-chart-simple text-gray-400 text-xs"></i>
              Summary
            </h3>

            <div class="space-y-3 text-sm">
              <div class="flex items-center justify-between">
                <span class="text-gray-500">Total Vehicles</span>
                <span class="font-bold text-gray-900 text-base">{{ customer.sales.length }}</span>
              </div>
              <div class="border-t border-gray-100 pt-3 flex items-center justify-between">
                <span class="text-gray-500">Total Paid</span>
                <span class="font-bold text-green-700 text-base">{{ fmtUGX(totalPaid) }}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

    </template>
  </div>

  <!-- Edit Customer Modal -->
  <TransitionRoot :show="editModal" as="template">
    <Dialog as="div" class="relative z-50" @close="editModal = false">
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
                <h3 class="font-semibold text-gray-900">Edit Customer</h3>
                <button @click="editModal = false" class="cursor-pointer text-gray-400 hover:text-gray-600 p-1 rounded">
                  <i class="fa-solid fa-xmark"></i>
                </button>
              </div>
              <div class="p-6 space-y-4">
                <div v-if="saveError" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">{{ saveError }}</div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1.5">Full Name <span class="text-red-500">*</span></label>
                    <input v-model="editForm.name" type="text"
                      class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1.5">Phone <span class="text-red-500">*</span></label>
                    <input v-model="editForm.phone" type="text"
                      class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none">
                  </div>
                  <div class="col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                    <input v-model="editForm.email" type="email" placeholder="e.g. john@example.com"
                      class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1.5">ID Type</label>
                    <select v-model="editForm.id_type"
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
                    <input v-model="editForm.id_number" type="text"
                      class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none">
                  </div>
                  <div class="col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
                    <input v-model="editForm.address" type="text"
                      class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none">
                  </div>
                  <div class="col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                    <textarea v-model="editForm.notes" rows="2"
                      class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none resize-none"></textarea>
                  </div>
                </div>
              </div>
              <div class="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                <button @click="editModal = false"
                  class="cursor-pointer px-4 py-2 border border-gray-300 text-gray-600 rounded-md text-sm hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button :disabled="saving" @click="submitEdit"
                  class="cursor-pointer flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-60 transition-colors">
                  <i v-if="saving" class="fa-solid fa-spinner fa-spin"></i>
                  Save Changes
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>

  <!-- Delete Confirmation -->
  <ConfirmDialog
    :show="deleteConfirm"
    title="Delete Customer"
    :message="`Are you sure you want to delete ${customer?.name}? This cannot be undone.`"
    confirmLabel="Delete"
    @confirm="confirmDelete"
    @cancel="deleteConfirm = false"
  />
</template>
