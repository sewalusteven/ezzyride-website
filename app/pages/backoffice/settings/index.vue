<script setup lang="ts">
import { Notify } from 'notiflix'

definePageMeta({ layout: 'admin-layout' })

const { $api } = useNuxtApp()
const { can }  = useAuth()

type Tab = 'company' | 'hours' | 'social' | 'pricing' | 'payment' | 'currencies' | 'roles' | 'audit'

const activeTab = ref<Tab>('company')
const loading   = ref(true)
const saving    = ref(false)

// ── Roles & Permissions state ─────────────────────────────────────────────────
const allRoles       = ref<{ id: number; name: string; permissions: string[] }[]>([])
const allPermissions = ref<string[]>([])
const loadingRoles   = ref(false)
const savingRole     = ref<number | null>(null)
const rolePermMap    = ref<Record<number, Set<string>>>({})

// Create role modal
const showCreateRole = ref(false)
const newRoleName    = ref('')
const creatingRole   = ref(false)
const roleError      = ref('')

// Group permissions by module prefix
const permissionGroups = computed(() => {
  const groups: Record<string, string[]> = {}
  for (const p of allPermissions.value) {
    const prefix = p.split('.')[0]
    if (!groups[prefix]) groups[prefix] = []
    groups[prefix].push(p)
  }
  return groups
})

const fetchRoles = async () => {
  if (!can('settings.roles')) return
  loadingRoles.value = true
  try {
    const { data } = await $api.get('/v1/roles')
    allRoles.value       = data.data.roles
    allPermissions.value = data.data.permissions
    // Build permission map for each role
    rolePermMap.value = {}
    for (const r of allRoles.value) {
      rolePermMap.value[r.id] = new Set(r.permissions)
    }
  } catch { /* ignore */ }
  finally { loadingRoles.value = false }
}

const togglePerm = (roleId: number, perm: string) => {
  const set = rolePermMap.value[roleId]
  if (!set) return
  if (set.has(perm)) set.delete(perm)
  else set.add(perm)
}

const saveRolePermissions = async (role: { id: number; name: string }) => {
  savingRole.value = role.id
  try {
    await $api.patch(`/v1/roles/${role.id}`, {
      permissions: Array.from(rolePermMap.value[role.id] ?? [])
    })
    Notify.success(`Permissions saved for "${role.name}"`)
  } catch (err: any) {
    Notify.failure(err.response?.data?.message ?? 'Failed to save permissions.')
  } finally {
    savingRole.value = null
  }
}

const createRole = async () => {
  creatingRole.value = true
  roleError.value    = ''
  try {
    await $api.post('/v1/roles', { name: newRoleName.value.trim(), permissions: [] })
    showCreateRole.value = false
    newRoleName.value    = ''
    await fetchRoles()
  } catch (err: any) {
    const d = err.response?.data
    roleError.value = d?.errors ? Object.values(d.errors).flat().join(' ') : (d?.message ?? 'Failed to create role.')
  } finally {
    creatingRole.value = false
  }
}

const deleteRole = async (role: { id: number; name: string }) => {
  if (!confirm(`Delete role "${role.name}"? This cannot be undone.`)) return
  try {
    await $api.delete(`/v1/roles/${role.id}`)
    await fetchRoles()
  } catch (err: any) {
    Notify.failure(err.response?.data?.message ?? 'Failed to delete role.')
  }
}

const prettyPerm = (p: string) => p.split('.').slice(1).join('.') || p
const prettyGroup = (g: string) => g.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

// ── Currency Rates state ─────────────────────────────────────────────────────
interface CurrencyRate { id: number; currency_code: string; currency_name: string; rate_to_ugx: string }
const currencyRates    = ref<CurrencyRate[]>([])
const loadingCurrencies = ref(false)
const savingCurrency    = ref(false)
const currencyForm      = ref({ currency_code: '', currency_name: '', rate_to_ugx: '' })
const currencyError     = ref('')

const fetchCurrencyRates = async () => {
  loadingCurrencies.value = true
  try {
    const { data } = await $api.get('/v1/currency-rates')
    currencyRates.value = data.data
  } catch { /* ignore */ }
  finally { loadingCurrencies.value = false }
}

const saveCurrencyRate = async () => {
  savingCurrency.value = true
  currencyError.value  = ''
  try {
    await $api.post('/v1/currency-rates', {
      currency_code: currencyForm.value.currency_code.toUpperCase().trim(),
      currency_name: currencyForm.value.currency_name.trim(),
      rate_to_ugx:   parseFloat(currencyForm.value.rate_to_ugx),
    })
    currencyForm.value = { currency_code: '', currency_name: '', rate_to_ugx: '' }
    fetchCurrencyRates()
    Notify.success('Currency rate saved.')
  } catch (e: any) {
    currencyError.value = e.response?.data?.message ?? 'Failed to save.'
  } finally {
    savingCurrency.value = false
  }
}

const editCurrencyRate = (rate: CurrencyRate) => {
  currencyForm.value = {
    currency_code: rate.currency_code,
    currency_name: rate.currency_name,
    rate_to_ugx:   rate.rate_to_ugx,
  }
}

const deleteCurrencyRate = async (rate: CurrencyRate) => {
  if (!confirm(`Delete ${rate.currency_code} rate?`)) return
  try {
    await $api.delete(`/v1/currency-rates/${rate.id}`)
    fetchCurrencyRates()
    Notify.success('Currency rate deleted.')
  } catch {
    Notify.failure('Failed to delete.')
  }
}

const form = ref({
  // Company
  company_name:     '',
  company_tagline:  '',
  company_phone:    '',
  company_whatsapp: '',
  company_email:    '',
  company_address:  '',
  // Business Hours
  business_hours_weekday:  '',
  business_hours_saturday: '',
  business_hours_sunday:   '',
  // Social
  social_facebook:  '',
  social_instagram: '',
  social_twitter:   '',
  social_youtube:   '',
  // Exchange rate
  cif_usd_rate:              '',
  // Additional import fees (added to estimated total, not taxes)
  fee_number_plate:          '',
  fee_third_party_insurance: '',
  // Pricing (UGX)
  pricing_full_import:       '',
  pricing_mombasa_clearance: '',
  pricing_sourcing_only:     '',
  pricing_consultation:      '',
  // Payment details (used on quotes)
  bank_name:              '',
  bank_account_name:      '',
  bank_account_number:    '',
  mobile_money_number:    '',
  mobile_money_name:      '',
  mobile_money_provider:  '',
})

// ── Audit Log state ──────────────────────────────────────────────────────────
interface AuditEntry {
  id: number; action: string; target_type: string | null; target_id: number | null
  target_label: string | null; details: any; ip_address: string | null
  created_at: string; user: { id: number; name: string; email: string } | null
}
const auditLogs       = ref<AuditEntry[]>([])
const auditMeta       = ref<{ current_page: number; last_page: number; total: number }>({ current_page: 1, last_page: 1, total: 0 })
const auditLoading    = ref(false)
const auditSearch     = ref('')
const auditFilter     = ref('')
let auditSearchTimer: ReturnType<typeof setTimeout> | null = null

const fetchAuditLogs = async (page = 1) => {
  auditLoading.value = true
  try {
    const params: Record<string, any> = { page, limit: 25 }
    if (auditSearch.value) params.search = auditSearch.value
    if (auditFilter.value) params.action = auditFilter.value
    const { data } = await $api.get('/v1/audit-logs', { params })
    auditLogs.value = data.data.data
    auditMeta.value = { current_page: data.data.current_page, last_page: data.data.last_page, total: data.data.total }
  } finally {
    auditLoading.value = false
  }
}

const onAuditSearch = () => {
  if (auditSearchTimer) clearTimeout(auditSearchTimer)
  auditSearchTimer = setTimeout(() => fetchAuditLogs(1), 400)
}

const auditActionLabel = (action: string) => action.replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

const auditActionColor = (action: string) => {
  if (action.includes('delete')) return 'bg-red-100 text-red-700'
  if (action.includes('create') || action.includes('enable')) return 'bg-green-100 text-green-700'
  if (action.includes('login')) return 'bg-blue-100 text-blue-700'
  if (action.includes('unlock') || action.includes('reset')) return 'bg-amber-100 text-amber-700'
  return 'bg-gray-100 text-gray-700'
}

watch(activeTab, (tab) => {
  if (tab === 'currencies' && currencyRates.value.length === 0) fetchCurrencyRates()
  if (tab === 'audit' && auditLogs.value.length === 0) fetchAuditLogs()
})

onMounted(async () => {
  try {
    const { data } = await $api.get('/v1/settings')
    Object.assign(form.value, data.data)
  } finally {
    loading.value = false
  }
  fetchRoles()
})

const saveSettings = async () => {
  saving.value = true
  try {
    const payload = Object.fromEntries(
      Object.entries(form.value).map(([k, v]) => [k, v != null && v !== '' ? String(v) : v])
    )
    await $api.put('/v1/settings', payload)
    Notify.success('Settings saved successfully.')
  } catch {
    Notify.failure('Failed to save settings. Please try again.')
  } finally {
    saving.value = false
  }
}

const tabs = computed(() => [
  { key: 'company' as Tab, label: 'Company Info',        icon: 'fa-solid fa-building' },
  { key: 'hours'   as Tab, label: 'Business Hours',      icon: 'fa-solid fa-clock' },
  { key: 'social'  as Tab, label: 'Social Media',        icon: 'fa-solid fa-hashtag' },
  { key: 'pricing' as Tab,  label: 'Import Pricing',      icon: 'fa-solid fa-tag' },
  { key: 'payment' as Tab,  label: 'Payment Details',     icon: 'fa-solid fa-building-columns' },
  { key: 'currencies' as Tab, label: 'Currency Rates',    icon: 'fa-solid fa-money-bill-transfer' },
  ...(can('settings.roles') ? [{ key: 'roles' as Tab, label: 'Roles & Permissions', icon: 'fa-solid fa-shield-halved' }] : []),
  ...(can('audit-log.view') ? [{ key: 'audit' as Tab, label: 'Audit Log', icon: 'fa-solid fa-clipboard-list' }] : []),
])
</script>

<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-xl font-bold text-gray-900">Settings</h1>
      <p class="text-sm text-gray-500 mt-0.5">Manage your company information, business hours, and social media links</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">
      <i class="fa-solid fa-spinner fa-spin text-2xl mb-3"></i>
      <p>Loading settings…</p>
    </div>

    <div v-else class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <!-- Tab navigation -->
      <div class="flex border-b border-gray-100 overflow-x-auto">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          @click="activeTab = tab.key"
          class="flex items-center gap-2 cursor-pointer px-5 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px"
          :class="activeTab === tab.key
            ? 'border-primary text-primary'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
        >
          <i :class="tab.icon" class="text-xs"></i>
          {{ tab.label }}
        </button>
      </div>

      <!-- Tab content -->
      <div class="p-6">

        <!-- Company Info -->
        <div v-if="activeTab === 'company'" class="space-y-5">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1.5">Company Name</label>
              <input
                v-model="form.company_name"
                type="text"
                placeholder="EzzyRide Uganda"
                class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1.5">Company Email</label>
              <input
                v-model="form.company_email"
                type="email"
                placeholder="info@ezzyride.ug"
                class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1.5">Phone Number</label>
              <PhoneInput v-model="form.company_phone" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1.5">WhatsApp Number</label>
              <PhoneInput v-model="form.company_whatsapp" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-xs font-medium text-gray-600 mb-1.5">Physical Address</label>
              <input
                v-model="form.company_address"
                type="text"
                placeholder="e.g. Plot 1, Kampala Road, Kampala, Uganda"
                class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-xs font-medium text-gray-600 mb-1.5">Company Tagline</label>
              <input
                v-model="form.company_tagline"
                type="text"
                placeholder="Your trusted partner for premium Japanese vehicle imports in Uganda."
                class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <p class="text-xs text-gray-400 mt-1">Shown in the website footer below the logo.</p>
            </div>
          </div>

          <!-- Preview -->
          <div class="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div class="text-xs font-medium text-gray-400 mb-3">Contact Us Page Preview</div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div v-if="form.company_phone" class="flex items-center gap-2 text-gray-700">
                <i class="fa-solid fa-phone text-primary text-xs w-4 text-center"></i>
                {{ form.company_phone }}
              </div>
              <div v-if="form.company_whatsapp" class="flex items-center gap-2 text-gray-700">
                <i class="fa-brands fa-whatsapp text-green-500 text-xs w-4 text-center"></i>
                {{ form.company_whatsapp }}
              </div>
              <div v-if="form.company_email" class="flex items-center gap-2 text-gray-700">
                <i class="fa-solid fa-envelope text-primary text-xs w-4 text-center"></i>
                {{ form.company_email }}
              </div>
              <div v-if="form.company_address" class="flex items-center gap-2 text-gray-700">
                <i class="fa-solid fa-location-dot text-primary text-xs w-4 text-center"></i>
                {{ form.company_address }}
              </div>
            </div>
          </div>
        </div>

        <!-- Business Hours -->
        <div v-if="activeTab === 'hours'" class="space-y-5">
          <p class="text-sm text-gray-500">These hours are displayed in the website footer and on the Contact Us page.</p>
          <div class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1.5">Monday – Friday</label>
              <input
                v-model="form.business_hours_weekday"
                type="text"
                placeholder="e.g. Monday – Friday: 8:00 AM – 6:00 PM"
                class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1.5">Saturday</label>
              <input
                v-model="form.business_hours_saturday"
                type="text"
                placeholder="e.g. Saturday: 9:00 AM – 4:00 PM"
                class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1.5">Sunday</label>
              <input
                v-model="form.business_hours_sunday"
                type="text"
                placeholder="e.g. Sunday: Closed"
                class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <!-- Preview -->
          <div class="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div class="text-xs font-medium text-gray-400 mb-3">Hours Preview</div>
            <div class="space-y-2 text-sm">
              <div v-if="form.business_hours_weekday" class="flex items-center gap-2 text-gray-700">
                <i class="fa-solid fa-clock text-primary text-xs"></i>
                {{ form.business_hours_weekday }}
              </div>
              <div v-if="form.business_hours_saturday" class="flex items-center gap-2 text-gray-700">
                <i class="fa-solid fa-clock text-primary text-xs"></i>
                {{ form.business_hours_saturday }}
              </div>
              <div v-if="form.business_hours_sunday" class="flex items-center gap-2 text-gray-400">
                <i class="fa-solid fa-clock text-gray-300 text-xs"></i>
                {{ form.business_hours_sunday }}
              </div>
            </div>
          </div>
        </div>

        <!-- Social Media -->
        <div v-if="activeTab === 'social'" class="space-y-5">
          <p class="text-sm text-gray-500">Social media links appear in the footer. Leave blank to hide the icon.</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1.5">
                <i class="fa-brands fa-facebook text-blue-600 mr-1"></i> Facebook
              </label>
              <input
                v-model="form.social_facebook"
                type="url"
                placeholder="https://facebook.com/yourpage"
                class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1.5">
                <i class="fa-brands fa-instagram text-pink-600 mr-1"></i> Instagram
              </label>
              <input
                v-model="form.social_instagram"
                type="url"
                placeholder="https://instagram.com/yourhandle"
                class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1.5">
                <i class="fa-brands fa-x-twitter text-gray-800 mr-1"></i> X (Twitter)
              </label>
              <input
                v-model="form.social_twitter"
                type="url"
                placeholder="https://x.com/yourhandle"
                class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1.5">
                <i class="fa-brands fa-youtube text-red-600 mr-1"></i> YouTube
              </label>
              <input
                v-model="form.social_youtube"
                type="url"
                placeholder="https://youtube.com/@yourchannel"
                class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <!-- Preview -->
          <div v-if="form.social_facebook || form.social_instagram || form.social_twitter || form.social_youtube" class="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div class="text-xs font-medium text-gray-400 mb-3">Footer Preview</div>
            <div class="flex gap-2">
              <div v-if="form.social_facebook" class="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">
                <i class="fa-brands fa-facebook"></i>
              </div>
              <div v-if="form.social_instagram" class="w-8 h-8 bg-pink-600 text-white rounded-full flex items-center justify-center text-sm">
                <i class="fa-brands fa-instagram"></i>
              </div>
              <div v-if="form.social_twitter" class="w-8 h-8 bg-gray-800 text-white rounded-full flex items-center justify-center text-sm">
                <i class="fa-brands fa-x-twitter"></i>
              </div>
              <div v-if="form.social_youtube" class="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-sm">
                <i class="fa-brands fa-youtube"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Import Pricing -->
        <div v-if="activeTab === 'pricing'" class="space-y-5">

          <!-- CIF USD Exchange Rate -->
          <div class="bg-gray-50 rounded-xl p-5 border border-gray-100 space-y-3">
            <div class="flex items-center gap-2 mb-1">
              <i class="fa-solid fa-money-bill-transfer text-secondary text-sm"></i>
              <span class="text-sm font-semibold text-gray-700">CIF Exchange Rate (Market Rate)</span>
            </div>
            <p class="text-xs text-gray-500">
              This rate is used to convert vehicle CIF (USD) to UGX on quotes.
              It is separate from the URA tax rate configured in Tax Settings.
            </p>
            <div class="max-w-sm">
              <label class="block text-xs font-medium text-gray-600 mb-1.5">1 USD =</label>
              <div class="flex items-center gap-2">
                <input
                  v-model="form.cif_usd_rate"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 3850.75"
                  class="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <span class="text-sm text-gray-400 shrink-0">UGX</span>
              </div>
              <p class="text-xs text-gray-400 mt-1">Used for CIF conversion on import application quotes. The URA/tax rate is managed separately in Tax Settings.</p>
            </div>
          </div>

          <div class="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm text-blue-700">
            <i class="fa-solid fa-circle-info mr-1.5"></i>
            Service fee prices shown on the website's Import Assistance page. Enter amounts in <strong>UGX</strong>. Leave blank to hide the price.
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div v-for="item in [
              { key: 'pricing_full_import',       label: 'Full Import',        icon: 'fa-solid fa-ship' },
              { key: 'pricing_mombasa_clearance',  label: 'Mombasa Clearance',  icon: 'fa-solid fa-anchor' },
              { key: 'pricing_sourcing_only',      label: 'Sourcing Only',      icon: 'fa-solid fa-magnifying-glass' },
              { key: 'pricing_consultation',       label: 'Consultation',       icon: 'fa-solid fa-comments' },
            ]" :key="item.key">
              <label class="block text-xs font-medium text-gray-600 mb-1.5">
                <i :class="item.icon" class="mr-1 text-primary"></i> {{ item.label }}
              </label>
              <div class="flex items-center gap-2">
                <span class="text-sm text-gray-400 shrink-0">UGX</span>
                <input
                  v-model="(form as any)[item.key]"
                  type="text"
                  inputmode="numeric"
                  :placeholder="item.key === 'pricing_consultation' ? 'e.g. Free initial consultation' : 'e.g. 1,800,000'"
                  class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
          </div>

          <!-- Preview -->
          <div class="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div class="text-xs font-medium text-gray-400 mb-3">Website Preview (Import Assistance page)</div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div v-for="item in [
                { key: 'pricing_full_import',      label: 'Full Import' },
                { key: 'pricing_mombasa_clearance', label: 'Mombasa Clearance' },
                { key: 'pricing_sourcing_only',    label: 'Sourcing Only' },
                { key: 'pricing_consultation',     label: 'Consultation' },
              ]" :key="item.key" class="flex justify-between items-center border-b border-gray-100 pb-2">
                <span class="text-gray-500">{{ item.label }}</span>
                <span class="font-medium text-secondary">{{ (form as any)[item.key] ? 'UGX ' + (form as any)[item.key] : '—' }}</span>
              </div>
            </div>
          </div>

          <!-- Additional Import Fees -->
          <div class="border-t border-gray-100 pt-5 mt-2">
            <div class="mb-4">
              <h3 class="font-semibold text-gray-900 text-sm">Additional Import Fees</h3>
              <p class="text-xs text-gray-400 mt-0.5">Added to the estimated total cost shown on the website tax calculator (separate from URA taxes).</p>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1.5">
                  <i class="fa-solid fa-id-card mr-1 text-primary"></i> Number Plate Registration
                </label>
                <div class="flex items-center gap-2">
                  <span class="text-sm text-gray-400 shrink-0">UGX</span>
                  <input
                    v-model="form.fee_number_plate"
                    type="text"
                    inputmode="numeric"
                    placeholder="e.g. 714,300"
                    class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1.5">
                  <i class="fa-solid fa-shield-halved mr-1 text-primary"></i> 3rd Party Insurance
                </label>
                <div class="flex items-center gap-2">
                  <span class="text-sm text-gray-400 shrink-0">UGX</span>
                  <input
                    v-model="form.fee_third_party_insurance"
                    type="text"
                    inputmode="numeric"
                    placeholder="e.g. 75,000"
                    class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Payment Details -->
        <div v-if="activeTab === 'payment'" class="space-y-5">
          <div>
            <h3 class="font-semibold text-gray-900">Payment Details</h3>
            <p class="text-xs text-gray-400 mt-0.5">These details appear on client quotes as payment instructions.</p>
          </div>

          <!-- Bank details -->
          <div class="bg-gray-50 rounded-xl p-5 border border-gray-100 space-y-4">
            <div class="flex items-center gap-2 mb-1">
              <i class="fa-solid fa-building-columns text-secondary text-sm"></i>
              <span class="text-sm font-semibold text-gray-700">Bank Transfer</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-gray-500 mb-1">Bank Name</label>
                <input v-model="form.bank_name" type="text" placeholder="e.g. Stanbic Bank Uganda" class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-500 mb-1">Account Name</label>
                <input v-model="form.bank_account_name" type="text" placeholder="e.g. EzzyRide Uganda Ltd" class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-500 mb-1">Account Number</label>
                <input v-model="form.bank_account_number" type="text" placeholder="e.g. 9030012345678" class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>
          </div>

          <!-- Mobile money details -->
          <div class="bg-gray-50 rounded-xl p-5 border border-gray-100 space-y-4">
            <div class="flex items-center gap-2 mb-1">
              <i class="fa-solid fa-mobile-screen text-secondary text-sm"></i>
              <span class="text-sm font-semibold text-gray-700">Mobile Money</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-gray-500 mb-1">Provider</label>
                <input v-model="form.mobile_money_provider" type="text" placeholder="e.g. MTN Mobile Money" class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-500 mb-1">Number</label>
                <PhoneInput v-model="form.mobile_money_number" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-500 mb-1">Registered Name</label>
                <input v-model="form.mobile_money_name" type="text" placeholder="e.g. EzzyRide Uganda" class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>
          </div>
        </div>

        <!-- Currency Rates -->
        <div v-if="activeTab === 'currencies'" class="space-y-5">
          <div>
            <h3 class="font-semibold text-gray-900">Currency Rates</h3>
            <p class="text-xs text-gray-400 mt-0.5">Configure conversion rates to UGX. These are used for international partner vehicle pricing calculations.</p>
          </div>

          <div v-if="currencyError" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{{ currencyError }}</div>

          <!-- Add / Edit form -->
          <div class="bg-gray-50 rounded-xl p-5 border border-gray-100">
            <div class="flex items-center gap-2 mb-3">
              <i class="fa-solid fa-plus-circle text-primary text-sm"></i>
              <span class="text-sm font-semibold text-gray-700">{{ currencyForm.currency_code ? 'Update' : 'Add' }} Currency Rate</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-500 mb-1">Code</label>
                <input v-model="currencyForm.currency_code" type="text" placeholder="e.g. USD" maxlength="10"
                  class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-500 mb-1">Currency Name</label>
                <input v-model="currencyForm.currency_name" type="text" placeholder="e.g. US Dollar"
                  class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-500 mb-1">1 unit = UGX</label>
                <input v-model="currencyForm.rate_to_ugx" type="number" step="0.0001" min="0" placeholder="e.g. 3750"
                  class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div class="flex items-end">
                <button @click="saveCurrencyRate" :disabled="savingCurrency || !currencyForm.currency_code.trim() || !currencyForm.rate_to_ugx"
                  class="w-full bg-primary hover:bg-red-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
                  <i v-if="savingCurrency" class="fa-solid fa-spinner fa-spin"></i>
                  {{ currencyForm.currency_code ? 'Save' : 'Add' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Existing rates table -->
          <div v-if="loadingCurrencies" class="py-8 text-center text-gray-400">
            <i class="fa-solid fa-spinner fa-spin text-xl"></i>
          </div>
          <div v-else-if="currencyRates.length === 0" class="py-8 text-center text-gray-400">
            <i class="fa-solid fa-money-bill-transfer text-3xl text-gray-200 mb-2"></i>
            <p class="text-sm">No currency rates configured yet.</p>
          </div>
          <div v-else class="border border-gray-200 rounded-xl overflow-hidden">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-gray-50 text-gray-500 text-xs uppercase">
                  <th class="text-left px-5 py-3">Code</th>
                  <th class="text-left px-5 py-3">Currency</th>
                  <th class="text-right px-5 py-3">Rate (UGX)</th>
                  <th class="text-right px-5 py-3">Updated</th>
                  <th class="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="rate in currencyRates" :key="rate.id" class="border-t border-gray-100">
                  <td class="px-5 py-3 font-mono font-medium text-gray-800">{{ rate.currency_code }}</td>
                  <td class="px-5 py-3 text-gray-600">{{ rate.currency_name }}</td>
                  <td class="px-5 py-3 text-right font-medium text-gray-800">{{ Number(rate.rate_to_ugx).toLocaleString() }}</td>
                  <td class="px-5 py-3 text-right text-xs text-gray-400">{{ new Date(rate.updated_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }}</td>
                  <td class="px-5 py-3 text-right">
                    <div class="flex items-center justify-end gap-1">
                      <button @click="editCurrencyRate(rate)" class="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-md" title="Edit">
                        <i class="fa-solid fa-pen text-xs"></i>
                      </button>
                      <button @click="deleteCurrencyRate(rate)" class="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md" title="Delete">
                        <i class="fa-solid fa-trash text-xs"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm text-blue-700">
            <i class="fa-solid fa-circle-info mr-1.5"></i>
            These rates are used during international partner vehicle imports to convert CIF prices to UGX and calculate the estimated selling price (CIF + taxes + import assistance).
            <strong>Transport costs (Mombasa to Kampala), bond fees, and other port charges are excluded</strong> and handled separately in the import application process.
          </div>
        </div>

        <!-- Roles & Permissions -->
        <div v-if="activeTab === 'roles'" class="space-y-6">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-semibold text-gray-900">Roles & Permissions</h3>
              <p class="text-xs text-gray-400 mt-0.5">Configure what each role can do across the admin panel.</p>
            </div>
            <button @click="showCreateRole = true"
              class="inline-flex items-center gap-2 bg-primary hover:bg-red-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors">
              <i class="fa-solid fa-plus text-xs"></i> New Role
            </button>
          </div>

          <div v-if="loadingRoles" class="py-10 text-center text-gray-400">
            <i class="fa-solid fa-spinner fa-spin text-xl"></i>
          </div>

          <div v-else class="space-y-4">
            <div v-for="role in allRoles" :key="role.id"
              class="border border-gray-100 rounded-xl overflow-hidden">
              <!-- Role header -->
              <div class="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
                <div class="flex items-center gap-2">
                  <i class="fa-solid fa-user-shield text-primary text-sm"></i>
                  <span class="font-semibold text-gray-900 capitalize">{{ role.name }}</span>
                  <span v-if="role.name === 'super-admin'" class="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Bypass all checks</span>
                </div>
                <div class="flex items-center gap-2">
                  <button v-if="!['super-admin', 'admin', 'staff'].includes(role.name)" @click="deleteRole(role)"
                    class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors text-xs">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                  <button v-if="role.name !== 'super-admin'" @click="saveRolePermissions(role)" :disabled="savingRole === role.id"
                    class="bg-primary hover:bg-red-700 disabled:opacity-60 text-white text-xs font-medium py-1.5 px-3 rounded-lg transition-colors flex items-center gap-1.5">
                    <i v-if="savingRole === role.id" class="fa-solid fa-spinner fa-spin"></i>
                    {{ savingRole === role.id ? 'Saving…' : 'Save' }}
                  </button>
                </div>
              </div>

              <!-- Permissions grid -->
              <div v-if="role.name !== 'super-admin'" class="p-5">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  <div v-for="(perms, group) in permissionGroups" :key="group">
                    <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{{ prettyGroup(String(group)) }}</p>
                    <div class="space-y-1.5">
                      <label v-for="perm in perms" :key="perm"
                        class="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox"
                          :checked="rolePermMap[role.id]?.has(perm)"
                          @change="togglePerm(role.id, perm)"
                          class="rounded border-gray-300 text-primary focus:ring-primary focus:ring-offset-0" />
                        <span class="text-xs text-gray-600 group-hover:text-gray-900 font-mono">{{ prettyPerm(perm) }}</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="px-5 py-4 text-sm text-gray-400 italic">
                Super-admin automatically has access to everything and is not configurable.
              </div>
            </div>
          </div>

          <!-- Create Role Modal -->
          <Teleport to="body">
            <Transition name="fade">
              <div v-if="showCreateRole" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" @click.self="showCreateRole = false">
                <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
                  <div class="flex items-center justify-between mb-4">
                    <h3 class="font-bold text-gray-900">Create New Role</h3>
                    <button @click="showCreateRole = false" class="text-gray-400 hover:text-gray-600 p-1"><i class="fa-solid fa-times"></i></button>
                  </div>
                  <div v-if="roleError" class="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{{ roleError }}</div>
                  <input v-model="newRoleName" type="text" placeholder="e.g. viewer"
                    class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary mb-4" />
                  <div class="flex gap-3">
                    <button @click="showCreateRole = false"
                      class="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium py-2.5 rounded-xl">Cancel</button>
                    <button @click="createRole" :disabled="creatingRole || !newRoleName.trim()"
                      class="flex-1 bg-primary hover:bg-red-700 disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-xl flex items-center justify-center gap-2">
                      <i v-if="creatingRole" class="fa-solid fa-spinner fa-spin"></i>
                      {{ creatingRole ? 'Creating…' : 'Create Role' }}
                    </button>
                  </div>
                </div>
              </div>
            </Transition>
          </Teleport>
        </div>

        <!-- Audit Log -->
        <div v-if="activeTab === 'audit'" class="space-y-4">
          <div class="flex items-center gap-3">
            <div class="relative flex-1">
              <input v-model="auditSearch" @input="onAuditSearch" type="text" placeholder="Search by action, user, or target..."
                class="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <i class="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
            </div>
            <select v-model="auditFilter" @change="fetchAuditLogs(1)"
              class="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="">All actions</option>
              <option value="auth">Authentication</option>
              <option value="settings">Settings</option>
              <option value="user">Users</option>
              <option value="role">Roles</option>
              <option value="partner">Partners</option>
            </select>
          </div>

          <div v-if="auditLoading" class="py-10 text-center text-gray-400">
            <i class="fa-solid fa-spinner fa-spin text-2xl"></i>
          </div>

          <div v-else-if="auditLogs.length === 0" class="py-10 text-center text-gray-400">
            <i class="fa-solid fa-clipboard-list text-3xl mb-2 block opacity-30"></i>
            <p class="text-sm">No audit log entries found.</p>
          </div>

          <div v-else class="divide-y divide-gray-100">
            <div v-for="entry in auditLogs" :key="entry.id" class="py-3 flex items-start gap-3">
              <div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-xs font-bold text-gray-500 mt-0.5">
                {{ entry.user?.name?.charAt(0).toUpperCase() ?? '?' }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-sm font-medium text-gray-900">{{ entry.user?.name ?? 'System' }}</span>
                  <span class="inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full" :class="auditActionColor(entry.action)">
                    {{ auditActionLabel(entry.action) }}
                  </span>
                </div>
                <p v-if="entry.target_label" class="text-xs text-gray-500 mt-0.5">
                  {{ entry.target_type }}: <strong>{{ entry.target_label }}</strong>
                </p>
                <p v-if="entry.details" class="text-xs text-gray-400 mt-0.5 font-mono truncate">
                  {{ typeof entry.details === 'object' ? JSON.stringify(entry.details) : entry.details }}
                </p>
              </div>
              <div class="text-right shrink-0">
                <p class="text-[10px] text-gray-400">{{ new Date(entry.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }}</p>
                <p class="text-[10px] text-gray-400">{{ new Date(entry.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) }}</p>
                <p v-if="entry.ip_address" class="text-[10px] text-gray-300 font-mono">{{ entry.ip_address }}</p>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div v-if="auditMeta.last_page > 1" class="flex items-center justify-between pt-2">
            <p class="text-xs text-gray-400">{{ auditMeta.total }} entries</p>
            <div class="flex gap-1">
              <button
                v-for="p in auditMeta.last_page"
                :key="p"
                @click="fetchAuditLogs(p)"
                :disabled="p === auditMeta.current_page"
                class="w-8 h-8 rounded text-xs font-medium transition-colors"
                :class="p === auditMeta.current_page ? 'bg-primary text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'"
              >{{ p }}</button>
            </div>
          </div>
        </div>

      </div>

      <div v-if="activeTab !== 'roles' && activeTab !== 'currencies' && activeTab !== 'audit'" class="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
        <p class="text-xs text-gray-400">Changes take effect immediately on the public website.</p>
        <button
          @click="saveSettings"
          :disabled="saving"
          class="bg-primary hover:bg-red-700 disabled:opacity-60 text-white font-medium py-2 px-6 rounded-lg text-sm transition-colors flex items-center gap-2"
        >
          <i v-if="saving" class="fa-solid fa-spinner fa-spin"></i>
          <i v-else class="fa-solid fa-floppy-disk"></i>
          {{ saving ? 'Saving…' : 'Save Settings' }}
        </button>
      </div>
    </div>

  </div>
</template>
