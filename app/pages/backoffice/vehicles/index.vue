<script setup lang="ts">
import { Dialog, DialogPanel, TabGroup, TabList, Tab, TabPanels, TabPanel, TransitionRoot, TransitionChild } from '@headlessui/vue'
import { Notify } from 'notiflix'
definePageMeta({ layout: 'admin-layout' })

const { $api } = useNuxtApp()

// ── Types ──────────────────────────────────────────────────────────────────
interface Vehicle {
  id: number; reference: string; externalReference: string | null; model: string; year: number; vin: string | null
  colour: string | null; transmission: string; fuelType: string; driveType: string
  engineCc: number | null; mileage: number | null; status: string; isPublished: boolean
  sellingPrice: string | null; soldPrice: string | null
  brand: { id: number; name: string } | null
  category: { id: number; name: string } | null
  primaryImage: string | null
  sale: { id: number; agreed_price: string; reservation_deposit: string; sale_date: string; customer: { id: number; name: string; phone: string | null } | null } | null
  createdAt: string
  deletedAt: string | null
}
interface Brand    { id: number; name: string; slug: string; is_active: boolean; sort_order: number }
interface Category { id: number; name: string; slug: string; is_active: boolean; sort_order: number }
interface Feature  { id: number; name: string; icon: string | null; category: string; is_active: boolean }
interface Attribute{ id: number; name: string; type: string; unit: string | null; is_active: boolean; sort_order: number; options: {id:number;value:string}[] }
interface SourcePlatform { id: number; name: string; website_url: string | null; is_active: boolean }
interface Meta { current_page: number; last_page: number; total: number; per_page: number }

// ── Tab ────────────────────────────────────────────────────────────────────
const activeTab = ref<'vehicles' | 'configurations' | 'templates'>('vehicles')
const mainTabIndex = computed(() => ({ vehicles: 0, configurations: 1, templates: 2 }[activeTab.value]))
const configTabIndex = computed(() => ['brands','categories','features','attributes','platforms'].indexOf(configTab.value))

// ── Vehicle sub-tab (Active / Archived) ──────────────────────────────────
const vehicleView = ref<'active' | 'archived'>('active')

// ── Vehicles list state ────────────────────────────────────────────────────
const vehicles       = ref<Vehicle[]>([])
const brands         = ref<Brand[]>([])
const loadingList    = ref(false)
const meta           = ref<Meta>({ current_page: 1, last_page: 1, total: 0, per_page: 15 })
const search         = ref('')
const filterStatus   = ref('')
const filterBrand    = ref<number | ''>('')
const filterPartner  = ref<number | ''>('')
const perPage        = ref(15)
const searchTimer    = ref<ReturnType<typeof setTimeout> | null>(null)

// ── Archived vehicles state ───────────────────────────────────────────────
const archivedVehicles  = ref<Vehicle[]>([])
const archivedMeta      = ref<Meta>({ current_page: 1, last_page: 1, total: 0, per_page: 15 })
const archivedSearch    = ref('')
const archivedPerPage   = ref(15)
const loadingArchived   = ref(false)
const archivedSearchTimer = ref<ReturnType<typeof setTimeout> | null>(null)
const archivedSelectedIds = ref<Set<number>>(new Set())
const archivedSelectAllChecked = computed({
  get: () => archivedVehicles.value.length > 0 && archivedVehicles.value.every(v => archivedSelectedIds.value.has(v.id)),
  set: (val: boolean) => {
    if (val) archivedVehicles.value.forEach(v => archivedSelectedIds.value.add(v.id))
    else archivedSelectedIds.value.clear()
  },
})
const toggleArchivedSelect = (id: number) => {
  if (archivedSelectedIds.value.has(id)) archivedSelectedIds.value.delete(id)
  else archivedSelectedIds.value.add(id)
}

// ── Bulk selection ────────────────────────────────────────────────────────
const selectedIds    = ref<Set<number>>(new Set())
const selectAllChecked = computed({
  get: () => vehicles.value.length > 0 && vehicles.value.every(v => selectedIds.value.has(v.id)),
  set: (val: boolean) => {
    if (val) vehicles.value.forEach(v => selectedIds.value.add(v.id))
    else selectedIds.value.clear()
  },
})
const toggleSelect = (id: number) => {
  if (selectedIds.value.has(id)) selectedIds.value.delete(id)
  else selectedIds.value.add(id)
}
const bulkDeleting = ref(false)

// ── Configurations state ───────────────────────────────────────────────────
const categories      = ref<Category[]>([])
const features        = ref<Feature[]>([])
const attributes      = ref<Attribute[]>([])
const sourcePlatforms = ref<SourcePlatform[]>([])
const configLoaded    = ref(false)
const configLoading   = ref(false)
const configTab = ref<'brands' | 'categories' | 'features' | 'attributes' | 'platforms'>('brands')

// ── Import Templates state ────────────────────────────────────────────────
interface ImportTemplate {
  id: number; name: string; createdAt: string; updatedAt: string
  headerMapping?: Record<string, string>
  valueMapping?: Record<string, any>
  featureListMapping?: Record<string, number>
  skippedColumnConfig?: Record<string, any>
}
const importTemplates = ref<ImportTemplate[]>([])
const loadingTemplates = ref(false)
const templatesLoaded = ref(false)
const previewTemplate = ref<ImportTemplate | null>(null)
const showTemplatePreview = ref(false)
const editingTemplateName = ref<number | null>(null)
const editingTemplateNameValue = ref('')

// ── Config modal state ─────────────────────────────────────────────────────
const modal = ref({ show: false, type: '' as string, editing: null as any, saving: false, error: '' })
const modalForm = ref<Record<string, any>>({})

// ── Fetch vehicles ─────────────────────────────────────────────────────────
const fetchVehicles = async (page = 1) => {
  loadingList.value = true
  selectedIds.value.clear()
  try {
    const params: Record<string, any> = { page, limit: perPage.value }
    if (search.value.trim())  params.search   = search.value.trim()
    if (filterStatus.value)   params.status   = filterStatus.value
    if (filterBrand.value)    params.brand_id    = filterBrand.value
    if (filterPartner.value)  params.partner_id  = filterPartner.value
    const { data } = await $api.get('/v1/vehicles', { params })
    vehicles.value = data.data
    meta.value     = data.meta
  } finally {
    loadingList.value = false
  }
}

const fetchBrandsForFilter = async () => {
  try {
    const { data } = await $api.get('/v1/config/vehicle-brands')
    brands.value = data.data
  } catch {}
}

interface PartnerOption { id: number; name: string }
const partners = ref<PartnerOption[]>([])
const fetchPartnersForFilter = async () => {
  try {
    const { data } = await $api.get('/v1/partners')
    partners.value = (data.data.data ?? data.data).map((p: any) => ({ id: p.id, name: p.name }))
  } catch {}
}

const onSearch = () => {
  if (searchTimer.value) clearTimeout(searchTimer.value)
  searchTimer.value = setTimeout(() => fetchVehicles(1), 400)
}

watch([filterStatus, filterBrand, filterPartner], () => fetchVehicles(1))
watch(perPage, () => fetchVehicles(1))

// ── Fetch config ───────────────────────────────────────────────────────────
const fetchConfig = async () => {
  configLoading.value = true
  try {
    const [b, c, f, a, sp] = await Promise.all([
      $api.get('/v1/config/vehicle-brands'),
      $api.get('/v1/config/vehicle-categories'),
      $api.get('/v1/config/features'),
      $api.get('/v1/config/attributes'),
      $api.get('/v1/config/source-platforms'),
    ])
    brands.value         = b.data.data
    categories.value     = c.data.data
    features.value       = f.data.data
    attributes.value     = a.data.data
    sourcePlatforms.value= sp.data.data
    configLoaded.value   = true
  } finally {
    configLoading.value = false
  }
}

watch(activeTab, (tab) => {
  if (tab === 'configurations' && !configLoaded.value) fetchConfig()
})

onMounted(() => {
  fetchVehicles()
  fetchBrandsForFilter()
  fetchPartnersForFilter()
})

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

// ── Delete vehicle ─────────────────────────────────────────────────────────
const deleteVehicle = (v: Vehicle) => {
  requestConfirm(
    'Delete Vehicle',
    `Remove ${v.reference} from inventory? This is a soft delete and can be reversed.`,
    async () => {
      await $api.delete(`/v1/vehicles/${v.id}`)
      fetchVehicles(meta.value.current_page)
    }
  )
}

// ── Bulk delete ───────────────────────────────────────────────────────────
const bulkDelete = () => {
  const count = selectedIds.value.size
  if (count === 0) return
  requestConfirm(
    `Delete ${count} Vehicle${count > 1 ? 's' : ''}`,
    `Are you sure you want to remove ${count} vehicle${count > 1 ? 's' : ''} from inventory? This is a soft delete and can be reversed.`,
    async () => {
      bulkDeleting.value = true
      try {
        const ids = [...selectedIds.value]
        await Promise.all(ids.map(id => $api.delete(`/v1/vehicles/${id}`)))
        selectedIds.value.clear()
        fetchVehicles(meta.value.current_page)
      } finally {
        bulkDeleting.value = false
      }
    }
  )
}

// ── Archived vehicles ──────────────────────────────────────────────────
const fetchArchived = async (page = 1) => {
  loadingArchived.value = true
  archivedSelectedIds.value.clear()
  try {
    const params: Record<string, any> = { page, limit: archivedPerPage.value }
    if (archivedSearch.value.trim()) params.search = archivedSearch.value.trim()
    const { data } = await $api.get('/v1/vehicles/archived', { params })
    archivedVehicles.value = data.data
    archivedMeta.value     = data.meta
  } finally {
    loadingArchived.value = false
  }
}

const onArchivedSearch = () => {
  if (archivedSearchTimer.value) clearTimeout(archivedSearchTimer.value)
  archivedSearchTimer.value = setTimeout(() => fetchArchived(1), 400)
}

watch(archivedPerPage, () => fetchArchived(1))

watch(vehicleView, (view) => {
  if (view === 'archived' && archivedVehicles.value.length === 0) fetchArchived()
})

const restoreVehicle = (v: Vehicle) => {
  requestConfirm(
    'Restore Vehicle',
    `Restore ${v.reference} back to active inventory?`,
    async () => {
      await $api.post(`/v1/vehicles/${v.id}/restore`)
      fetchArchived(archivedMeta.value.current_page)
      fetchVehicles(meta.value.current_page)
    }
  )
}

const forceDeleteVehicle = (v: Vehicle) => {
  requestConfirm(
    'Permanently Delete',
    `This will permanently delete ${v.reference} including all images and documents. This cannot be undone.`,
    async () => {
      await $api.delete(`/v1/vehicles/${v.id}/force-delete`)
      fetchArchived(archivedMeta.value.current_page)
    }
  )
}

const bulkForceDelete = () => {
  const count = archivedSelectedIds.value.size
  if (count === 0) return
  requestConfirm(
    `Permanently Delete ${count} Vehicle${count > 1 ? 's' : ''}`,
    `This will permanently delete ${count} vehicle${count > 1 ? 's' : ''} including all their images and documents. This cannot be undone.`,
    async () => {
      const ids = [...archivedSelectedIds.value]
      await Promise.all(ids.map(id => $api.delete(`/v1/vehicles/${id}/force-delete`)))
      archivedSelectedIds.value.clear()
      fetchArchived(archivedMeta.value.current_page)
    }
  )
}

const bulkRestore = () => {
  const count = archivedSelectedIds.value.size
  if (count === 0) return
  requestConfirm(
    `Restore ${count} Vehicle${count > 1 ? 's' : ''}`,
    `Restore ${count} vehicle${count > 1 ? 's' : ''} back to active inventory?`,
    async () => {
      const ids = [...archivedSelectedIds.value]
      await Promise.all(ids.map(id => $api.post(`/v1/vehicles/${id}/restore`)))
      archivedSelectedIds.value.clear()
      fetchArchived(archivedMeta.value.current_page)
      fetchVehicles(meta.value.current_page)
    }
  )
}

const archivedPages = computed(() => {
  const total = archivedMeta.value.last_page, cur = archivedMeta.value.current_page
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const arr: (number | '...')[] = [1]
  if (cur > 3) arr.push('...')
  for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) arr.push(i)
  if (cur < total - 2) arr.push('...')
  arr.push(total)
  return arr
})

// ── Import Templates ──────────────────────────────────────────────────────
const fetchImportTemplates = async () => {
  loadingTemplates.value = true
  try {
    const { data } = await $api.get('/v1/import-templates')
    importTemplates.value = (data.data ?? []).map((t: any) => ({
      id: t.id,
      name: t.name,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    }))
    templatesLoaded.value = true
  } finally {
    loadingTemplates.value = false
  }
}

const previewImportTemplate = async (t: ImportTemplate) => {
  try {
    const { data } = await $api.get(`/v1/import-templates/${t.id}/apply`)
    previewTemplate.value = {
      ...t,
      headerMapping: data.data.headerMapping,
      valueMapping: data.data.valueMapping,
      featureListMapping: data.data.featureListMapping,
      skippedColumnConfig: data.data.skippedColumnConfig,
    }
    showTemplatePreview.value = true
  } catch (err: any) {
    Notify.failure(err.response?.data?.message ?? 'Failed to load template details.')
  }
}

const deleteImportTemplate = (t: ImportTemplate) => {
  requestConfirm(
    'Delete Template',
    `Delete "${t.name}"? This cannot be undone.`,
    async () => {
      await $api.delete(`/v1/import-templates/${t.id}`)
      Notify.success('Template deleted.')
      fetchImportTemplates()
    }
  )
}

const startEditTemplateName = (t: ImportTemplate) => {
  editingTemplateName.value = t.id
  editingTemplateNameValue.value = t.name
}

const saveTemplateName = async (t: ImportTemplate) => {
  const newName = editingTemplateNameValue.value.trim()
  if (!newName || newName === t.name) {
    editingTemplateName.value = null
    return
  }
  try {
    await $api.patch(`/v1/import-templates/${t.id}`, { name: newName })
    t.name = newName
    Notify.success('Template renamed.')
  } catch (err: any) {
    Notify.failure(err.response?.data?.message ?? 'Failed to rename template.')
  } finally {
    editingTemplateName.value = null
  }
}

watch(activeTab, (tab) => {
  if (tab === 'templates' && !templatesLoaded.value) fetchImportTemplates()
})

// ── Config CRUD ────────────────────────────────────────────────────────────
const openModal = (type: string, item: any = null) => {
  modal.value = { show: true, type, editing: item, saving: false, error: '' }
  if (type === 'brand')    modalForm.value = { name: item?.name ?? '', is_active: item?.is_active ?? true }
  if (type === 'category') modalForm.value = { name: item?.name ?? '', is_active: item?.is_active ?? true }
  if (type === 'feature')  modalForm.value = { name: item?.name ?? '', icon: item?.icon ?? '', category: item?.category ?? 'comfort', is_active: item?.is_active ?? true }
  if (type === 'attribute')modalForm.value = { name: item?.name ?? '', type: item?.type ?? 'text', unit: item?.unit ?? '', is_active: item?.is_active ?? true, options: item?.options?.map((o: any) => o.value).join('\n') ?? '' }
  if (type === 'platform') modalForm.value = { name: item?.name ?? '', website_url: item?.website_url ?? '', is_active: item?.is_active ?? true }
}
const closeModal = () => { modal.value.show = false }

const urlMap: Record<string, string> = {
  brand: 'vehicle-brands', category: 'vehicle-categories',
  feature: 'features', attribute: 'attributes', platform: 'source-platforms',
}

const saveModal = async () => {
  modal.value.saving = true
  modal.value.error  = ''
  const { type, editing } = modal.value
  const url = `/v1/config/${urlMap[type]}`
  try {
    const payload: Record<string, any> = { ...modalForm.value }
    if (type === 'attribute' && modalForm.value.options) {
      payload.options = (modalForm.value.options as string).split('\n').map(s => s.trim()).filter(Boolean)
    }
    if (editing) {
      await $api.patch(`${url}/${editing.id}`, payload)
    } else {
      await $api.post(url, payload)
    }
    closeModal()
    configLoaded.value = false
    await fetchConfig()
    fetchBrandsForFilter()
  } catch (err: any) {
    const errs = err.response?.data?.data
    modal.value.error = errs ? Object.values(errs).flat().join(' · ') : (err.response?.data?.message ?? 'Failed to save')
  } finally {
    modal.value.saving = false
  }
}

const deleteConfigItem = (type: string, id: number) => {
  requestConfirm(
    'Delete Item',
    'Are you sure you want to delete this item? This cannot be undone.',
    async () => {
      await $api.delete(`/v1/config/${urlMap[type]}/${id}`)
      configLoaded.value = false
      await fetchConfig()
      fetchBrandsForFilter()
    }
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────
const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600', in_transit: 'bg-blue-100 text-blue-700',
  available: 'bg-green-100 text-green-700', reserved: 'bg-yellow-100 text-yellow-700',
  sold: 'bg-red-100 text-red-600',
}
const statusLabel: Record<string, string> = {
  draft: 'Draft', in_transit: 'In Transit', available: 'Available', reserved: 'Reserved', sold: 'Sold',
}
const fmtUGX = (n: any) => n ? new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(Number(n)) : '—'
const fmtNum = (n: any) => n ? Number(n).toLocaleString() : '—'

const { storageUrl } = useStorage()

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
</script>

<template>
  <div class="p-6 space-y-5">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-semibold text-gray-900">Vehicles</h2>
        <p class="text-sm text-gray-500 mt-0.5">Manage your vehicle inventory and configurations</p>
      </div>
      <div v-if="activeTab === 'vehicles'" class="flex items-center gap-2">
        <NuxtLink
          to="/backoffice/vehicles/import"
          class="cursor-pointer flex items-center bg-white gap-2 px-4 py-2 border border-gray-200 text-gray-600 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          <i class="fa-solid fa-file-import"></i>
          Import
        </NuxtLink>
        <NuxtLink
          to="/backoffice/vehicles/add"
          class="cursor-pointer flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
        >
          <i class="fa-solid fa-plus"></i>
          Add Vehicle
        </NuxtLink>
      </div>
      <button
        v-else
        class="cursor-pointer flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
        @click="openModal(configTab === 'categories' ? 'category' : configTab === 'platforms' ? 'platform' : configTab.replace(/s$/, ''))"
      >
        <i class="fa-solid fa-plus"></i>
        Add {{ { brands: 'Brand', categories: 'Body Type', features: 'Feature', attributes: 'Attribute', platforms: 'Platform' }[configTab] }}
      </button>
    </div>

    <!-- Tabs -->
    <div class="p-2 bg-white rounded shadow">
      <TabGroup :selectedIndex="mainTabIndex" @change="(i: number) => { const tabs = ['vehicles', 'configurations', 'templates'] as const; activeTab = tabs[i] ?? 'vehicles' }">
        <div class="border-b border-gray-200 mb-4">
          <TabList as="nav" class="flex -mb-px">
            <Tab v-for="t in [{ label: 'Vehicles', icon: 'fa-car' }, { label: 'Configurations', icon: 'fa-sliders' }, { label: 'Import Templates', icon: 'fa-file-import' }]" :key="t.label" as="template" v-slot="{ selected }">
              <button
                  class="cursor-pointer flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors"
                  :class="selected ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
              >
                <i :class="`fa-solid ${t.icon}`"></i>
                {{ t.label }}
              </button>
            </Tab>
          </TabList>
        </div>

        <TabPanels>
          <!-- ══ VEHICLES TAB ══════════════════════════════════════════════════ -->
          <TabPanel>
            <div class="space-y-5">
              <!-- Active / Archived toggle -->
              <div class="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit">
                <button
                  @click="vehicleView = 'active'"
                  class="cursor-pointer px-4 py-1.5 text-sm font-medium rounded-md transition-colors"
                  :class="vehicleView === 'active' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
                >
                  <i class="fa-solid fa-car mr-1.5 text-xs"></i> Active
                  <span class="text-xs ml-1 opacity-60">{{ meta.total }}</span>
                </button>
                <button
                  @click="vehicleView = 'archived'"
                  class="cursor-pointer px-4 py-1.5 text-sm font-medium rounded-md transition-colors"
                  :class="vehicleView === 'archived' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
                >
                  <i class="fa-solid fa-box-archive mr-1.5 text-xs"></i> Archived
                  <span v-if="archivedMeta.total > 0" class="text-xs ml-1 opacity-60">{{ archivedMeta.total }}</span>
                </button>
              </div>

              <!-- ── ACTIVE VIEW ─────────────────────────────────────────────── -->
              <template v-if="vehicleView === 'active'">

              <!-- Bulk action bar -->
              <div v-if="selectedIds.size > 0" class="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                <span class="text-sm font-medium text-red-800">{{ selectedIds.size }} selected</span>
                <button
                  @click="bulkDelete"
                  :disabled="bulkDeleting"
                  class="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-md text-xs font-medium transition-colors"
                >
                  <i :class="bulkDeleting ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-trash'" class="text-[10px]"></i>
                  Delete Selected
                </button>
                <button @click="selectedIds.clear()" class="cursor-pointer text-xs text-red-600 hover:text-red-800 ml-auto">Clear selection</button>
              </div>

              <!-- Filters -->
              <div class="flex items-center gap-3 flex-wrap">
                <div class="relative flex-1 min-w-[220px]">
                  <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                  <input v-model="search" type="text" placeholder="Search by ref, model, brand…"
                         class="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                         @input="onSearch">
                </div>
                <select v-model="filterStatus" class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none">
                  <option value="">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="in_transit">In Transit</option>
                  <option value="available">Available</option>
                  <option value="reserved">Reserved</option>
                  <option value="sold">Sold</option>
                </select>
                <select v-model="filterBrand" class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none">
                  <option value="">All Brands</option>
                  <option v-for="b in brands" :key="b.id" :value="b.id">{{ b.name }}</option>
                </select>
                <select v-model="filterPartner" class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none">
                  <option value="">All Partners</option>
                  <option v-for="p in partners" :key="p.id" :value="p.id">{{ p.name }}</option>
                </select>
                <span class="text-xs text-gray-400 ml-auto">{{ meta.total }} vehicle{{ meta.total !== 1 ? 's' : '' }}</span>
              </div>

              <!-- Table -->
              <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div class="overflow-x-auto">
                  <table class="w-full text-sm">
                    <thead class="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th class="sticky left-0 z-10 bg-gray-50 pl-4 pr-2 py-3 w-10 border-r border-gray-200">
                        <input type="checkbox" v-model="selectAllChecked" class="w-3.5 h-3.5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer" />
                      </th>
                      <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide min-w-[130px] whitespace-nowrap">Ref</th>
                      <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Vehicle</th>
                      <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Year</th>
                      <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Transmission</th>
                      <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Mileage</th>
                      <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Fuel</th>
                      <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Asking Price</th>
                      <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Customer</th>
                      <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Status</th>
                      <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Published</th>
                      <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Actions</th>
                    </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                    <!-- Skeleton -->
                    <tr v-if="loadingList" v-for="n in 5" :key="n" class="animate-pulse">
                      <td class="sticky left-0 z-10 bg-white pl-4 pr-2 py-3 border-r border-gray-100"><div class="h-3.5 w-3.5 bg-gray-200 rounded"></div></td>
                      <td class="px-4 py-3"><div class="h-4 w-24 bg-gray-200 rounded"></div></td>
                      <td class="px-4 py-3"><div class="flex items-center gap-3"><div class="w-10 h-10 bg-gray-200 rounded-md"></div><div class="space-y-1.5"><div class="h-4 w-32 bg-gray-200 rounded"></div><div class="h-3 w-20 bg-gray-200 rounded"></div></div></div></td>
                      <td class="px-4 py-3"><div class="h-4 w-10 bg-gray-200 rounded"></div></td>
                      <td class="px-4 py-3"><div class="h-4 w-20 bg-gray-200 rounded"></div></td>
                      <td class="px-4 py-3"><div class="h-4 w-20 bg-gray-200 rounded"></div></td>
                      <td class="px-4 py-3"><div class="h-4 w-14 bg-gray-200 rounded"></div></td>
                      <td class="px-4 py-3"><div class="h-4 w-24 bg-gray-200 rounded"></div></td>
                      <td class="px-4 py-3"><div class="h-4 w-20 bg-gray-200 rounded"></div></td>
                      <td class="px-4 py-3"><div class="h-5 w-20 bg-gray-200 rounded-full"></div></td>
                      <td class="px-4 py-3"><div class="h-4 w-10 bg-gray-200 rounded"></div></td>
                      <td class="px-4 py-3"><div class="h-4 w-20 bg-gray-200 rounded"></div></td>
                    </tr>
                    <!-- Empty -->
                    <tr v-else-if="vehicles.length === 0">
                      <td colspan="12" class="px-4 py-16 text-center text-gray-400">
                        <i class="fa-solid fa-car text-3xl mb-3 block opacity-30"></i>
                        <p class="text-sm">No vehicles found</p>
                        <NuxtLink to="/backoffice/vehicles/add" class="mt-3 inline-block text-sm text-primary hover:underline">Add your first vehicle</NuxtLink>
                      </td>
                    </tr>
                    <!-- Rows -->
                    <tr v-else v-for="v in vehicles" :key="v.id" class="hover:bg-gray-50/50 transition-colors" :class="selectedIds.has(v.id) ? 'bg-red-50/40' : ''">
                      <!-- Checkbox -->
                      <td class="sticky left-0 z-10 pl-4 pr-2 py-3 border-r border-gray-100" :class="selectedIds.has(v.id) ? 'bg-red-50/40' : 'bg-white'">
                        <input type="checkbox" :checked="selectedIds.has(v.id)" @change="toggleSelect(v.id)" class="w-3.5 h-3.5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer" />
                      </td>
                      <!-- Ref -->
                      <td class="px-4 py-3">
                        <span class="font-mono text-xs font-semibold text-secondary tracking-wide block">{{ v.reference }}</span>
                        <span v-if="v.externalReference" class="font-mono text-[10px] text-gray-400 block mt-0.5">{{ v.externalReference }}</span>
                      </td>
                      <!-- Vehicle -->
                      <td class="px-4 py-3">
                        <div class="flex items-center gap-3">
                          <div class="w-10 h-10 rounded-md bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                            <img v-if="v.primaryImage" :src="storageUrl(v.primaryImage)" class="w-full h-full object-cover" alt="">
                            <i v-else class="fa-solid fa-car text-gray-300 text-sm"></i>
                          </div>
                          <div>
                            <p class="font-medium text-gray-900 whitespace-nowrap">{{ v.brand?.name }} {{ v.model }}</p>
                            <p class="text-xs text-gray-400">{{ v.category?.name ?? '—' }} · {{ v.colour ?? '—' }}</p>
                          </div>
                        </div>
                      </td>
                      <td class="px-4 py-3 text-gray-700 whitespace-nowrap">{{ v.year }}</td>
                      <td class="px-4 py-3 text-gray-700 whitespace-nowrap capitalize">{{ v.transmission }}</td>
                      <td class="px-4 py-3 text-gray-700 whitespace-nowrap">{{ v.mileage ? fmtNum(v.mileage) + ' km' : '—' }}</td>
                      <td class="px-4 py-3 text-gray-700 whitespace-nowrap capitalize">{{ v.fuelType }}</td>
                      <td class="px-4 py-3 text-gray-700 whitespace-nowrap font-medium">{{ fmtUGX(v.sellingPrice) }}</td>
                      <td class="px-4 py-3 whitespace-nowrap">
                        <template v-if="v.sale?.customer">
                          <p class="text-sm text-gray-800 font-medium">{{ v.sale.customer.name }}</p>
                          <p v-if="v.sale.customer.phone" class="text-[10px] text-gray-400">{{ v.sale.customer.phone }}</p>
                        </template>
                        <span v-else class="text-xs text-gray-300">—</span>
                      </td>
                      <td class="px-4 py-3 whitespace-nowrap">
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" :class="statusColors[v.status] ?? 'bg-gray-100 text-gray-600'">
                    {{ statusLabel[v.status] ?? v.status }}
                  </span>
                      </td>
                      <td class="px-4 py-3 whitespace-nowrap">
                        <span v-if="v.isPublished" class="inline-flex items-center gap-1 text-xs text-green-600 font-medium"><i class="fa-solid fa-circle text-[8px]"></i> Live</span>
                        <span v-else class="text-xs text-gray-400">—</span>
                      </td>
                      <td class="px-4 py-3 whitespace-nowrap">
                        <div class="flex items-center gap-1.5">
                          <NuxtLink :to="`/backoffice/vehicles/${v.id}`" class="p-1.5 text-gray-400 hover:text-secondary hover:bg-blue-50 rounded-md transition-colors" title="View"><i class="fa-solid fa-eye text-sm"></i></NuxtLink>
                          <NuxtLink :to="`/backoffice/vehicles/${v.id}/edit`" class="p-1.5 text-gray-400 hover:text-primary hover:bg-red-50 rounded-md transition-colors" title="Edit"><i class="fa-solid fa-pen text-sm"></i></NuxtLink>
                          <button class="cursor-pointer p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete" @click="deleteVehicle(v)"><i class="fa-solid fa-trash text-sm"></i></button>
                        </div>
                      </td>
                    </tr>
                    </tbody>
                  </table>
                </div>
                <!-- Pagination -->
                <div class="px-4 py-3 border-t border-gray-100 flex items-center justify-between gap-3">
                  <div class="flex items-center gap-3">
                    <p class="text-xs text-gray-500">
                      <template v-if="meta.total > 0">Showing {{ ((meta.current_page - 1) * meta.per_page) + 1 }}–{{ Math.min(meta.current_page * meta.per_page, meta.total) }} of {{ meta.total }}</template>
                      <template v-else>No results</template>
                    </p>
                    <div class="flex items-center gap-1.5">
                      <label class="text-xs text-gray-400">Per page</label>
                      <select v-model.number="perPage" class="px-2 py-1 border border-gray-200 rounded text-xs text-gray-600 focus:ring-1 focus:ring-primary outline-none">
                        <option :value="15">15</option>
                        <option :value="25">25</option>
                        <option :value="50">50</option>
                        <option :value="100">100</option>
                      </select>
                    </div>
                  </div>
                  <div v-if="meta.last_page > 1" class="flex items-center gap-1">
                    <button class="cursor-pointer px-2.5 py-1.5 text-sm rounded-md border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-40" :disabled="meta.current_page === 1" @click="fetchVehicles(meta.current_page - 1)">&lsaquo;</button>
                    <template v-for="p in pages" :key="p">
                      <span v-if="p === '...'" class="px-2 text-gray-400 text-sm">…</span>
                      <button v-else class="cursor-pointer px-2.5 py-1.5 text-sm rounded-md border transition-colors" :class="p === meta.current_page ? 'border-primary bg-primary text-white' : 'border-gray-300 text-gray-600 hover:bg-gray-50'" @click="fetchVehicles(p as number)">{{ p }}</button>
                    </template>
                    <button class="cursor-pointer px-2.5 py-1.5 text-sm rounded-md border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-40" :disabled="meta.current_page === meta.last_page" @click="fetchVehicles(meta.current_page + 1)">&rsaquo;</button>
                  </div>
                </div>
              </div>
              </template>

              <!-- ── ARCHIVED VIEW ───────────────────────────────────────────── -->
              <template v-else>

              <!-- Archived bulk action bar -->
              <div v-if="archivedSelectedIds.size > 0" class="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-lg px-4 py-2.5">
                <span class="text-sm font-medium text-orange-800">{{ archivedSelectedIds.size }} selected</span>
                <button
                  @click="bulkRestore"
                  class="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md text-xs font-medium transition-colors"
                >
                  <i class="fa-solid fa-rotate-left text-[10px]"></i>
                  Restore Selected
                </button>
                <button
                  @click="bulkForceDelete"
                  class="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-medium transition-colors"
                >
                  <i class="fa-solid fa-trash text-[10px]"></i>
                  Delete Permanently
                </button>
                <button @click="archivedSelectedIds.clear()" class="cursor-pointer text-xs text-orange-600 hover:text-orange-800 ml-auto">Clear selection</button>
              </div>

              <!-- Archived search -->
              <div class="flex items-center gap-3 flex-wrap">
                <div class="relative flex-1 min-w-[220px]">
                  <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                  <input v-model="archivedSearch" type="text" placeholder="Search archived vehicles…"
                         class="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                         @input="onArchivedSearch">
                </div>
                <span class="text-xs text-gray-400 ml-auto">{{ archivedMeta.total }} archived vehicle{{ archivedMeta.total !== 1 ? 's' : '' }}</span>
              </div>

              <!-- Archived table -->
              <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div class="overflow-x-auto">
                  <table class="w-full text-sm">
                    <thead class="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th class="sticky left-0 z-10 bg-gray-50 pl-4 pr-2 py-3 w-10 border-r border-gray-200">
                        <input type="checkbox" v-model="archivedSelectAllChecked" class="w-3.5 h-3.5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer" />
                      </th>
                      <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide min-w-[130px] whitespace-nowrap">Ref</th>
                      <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Vehicle</th>
                      <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Year</th>
                      <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Asking Price</th>
                      <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Deleted</th>
                      <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Actions</th>
                    </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                    <!-- Skeleton -->
                    <tr v-if="loadingArchived" v-for="n in 5" :key="n" class="animate-pulse">
                      <td class="sticky left-0 z-10 bg-white pl-4 pr-2 py-3 border-r border-gray-100"><div class="h-3.5 w-3.5 bg-gray-200 rounded"></div></td>
                      <td class="px-4 py-3"><div class="h-4 w-24 bg-gray-200 rounded"></div></td>
                      <td class="px-4 py-3"><div class="h-4 w-32 bg-gray-200 rounded"></div></td>
                      <td class="px-4 py-3"><div class="h-4 w-10 bg-gray-200 rounded"></div></td>
                      <td class="px-4 py-3"><div class="h-4 w-24 bg-gray-200 rounded"></div></td>
                      <td class="px-4 py-3"><div class="h-4 w-24 bg-gray-200 rounded"></div></td>
                      <td class="px-4 py-3"><div class="h-4 w-20 bg-gray-200 rounded"></div></td>
                    </tr>
                    <!-- Empty -->
                    <tr v-else-if="archivedVehicles.length === 0">
                      <td colspan="7" class="px-4 py-16 text-center text-gray-400">
                        <i class="fa-solid fa-box-archive text-3xl mb-3 block opacity-30"></i>
                        <p class="text-sm">No archived vehicles</p>
                      </td>
                    </tr>
                    <!-- Rows -->
                    <tr v-else v-for="v in archivedVehicles" :key="v.id" class="hover:bg-gray-50/50 transition-colors" :class="archivedSelectedIds.has(v.id) ? 'bg-orange-50/40' : ''">
                      <td class="sticky left-0 z-10 pl-4 pr-2 py-3 border-r border-gray-100" :class="archivedSelectedIds.has(v.id) ? 'bg-orange-50/40' : 'bg-white'">
                        <input type="checkbox" :checked="archivedSelectedIds.has(v.id)" @change="toggleArchivedSelect(v.id)" class="w-3.5 h-3.5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer" />
                      </td>
                      <td class="px-4 py-3">
                        <span class="font-mono text-xs font-semibold text-gray-400 tracking-wide block line-through">{{ v.reference }}</span>
                        <span v-if="v.externalReference" class="font-mono text-[10px] text-gray-300 block mt-0.5">{{ v.externalReference }}</span>
                      </td>
                      <td class="px-4 py-3">
                        <div class="flex items-center gap-3">
                          <div class="w-10 h-10 rounded-md bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                            <img v-if="v.primaryImage" :src="storageUrl(v.primaryImage)" class="w-full h-full object-cover opacity-50" alt="">
                            <i v-else class="fa-solid fa-car text-gray-300 text-sm"></i>
                          </div>
                          <div>
                            <p class="font-medium text-gray-500 whitespace-nowrap">{{ v.brand?.name }} {{ v.model }}</p>
                            <p class="text-xs text-gray-400">{{ v.category?.name ?? '—' }}</p>
                          </div>
                        </div>
                      </td>
                      <td class="px-4 py-3 text-gray-500 whitespace-nowrap">{{ v.year }}</td>
                      <td class="px-4 py-3 text-gray-500 whitespace-nowrap">{{ fmtUGX(v.sellingPrice) }}</td>
                      <td class="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{{ v.deletedAt ? new Date(v.deletedAt).toLocaleDateString() : '—' }}</td>
                      <td class="px-4 py-3 whitespace-nowrap">
                        <div class="flex items-center gap-1.5">
                          <button class="cursor-pointer p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors" title="Restore" @click="restoreVehicle(v)"><i class="fa-solid fa-rotate-left text-sm"></i></button>
                          <button class="cursor-pointer p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete Permanently" @click="forceDeleteVehicle(v)"><i class="fa-solid fa-trash text-sm"></i></button>
                        </div>
                      </td>
                    </tr>
                    </tbody>
                  </table>
                </div>
                <!-- Pagination -->
                <div class="px-4 py-3 border-t border-gray-100 flex items-center justify-between gap-3">
                  <div class="flex items-center gap-3">
                    <p class="text-xs text-gray-500">
                      <template v-if="archivedMeta.total > 0">Showing {{ ((archivedMeta.current_page - 1) * archivedMeta.per_page) + 1 }}–{{ Math.min(archivedMeta.current_page * archivedMeta.per_page, archivedMeta.total) }} of {{ archivedMeta.total }}</template>
                      <template v-else>No results</template>
                    </p>
                    <div class="flex items-center gap-1.5">
                      <label class="text-xs text-gray-400">Per page</label>
                      <select v-model.number="archivedPerPage" class="px-2 py-1 border border-gray-200 rounded text-xs text-gray-600 focus:ring-1 focus:ring-primary outline-none">
                        <option :value="15">15</option>
                        <option :value="25">25</option>
                        <option :value="50">50</option>
                        <option :value="100">100</option>
                      </select>
                    </div>
                  </div>
                  <div v-if="archivedMeta.last_page > 1" class="flex items-center gap-1">
                    <button class="cursor-pointer px-2.5 py-1.5 text-sm rounded-md border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-40" :disabled="archivedMeta.current_page === 1" @click="fetchArchived(archivedMeta.current_page - 1)">&lsaquo;</button>
                    <template v-for="p in archivedPages" :key="p">
                      <span v-if="p === '...'" class="px-2 text-gray-400 text-sm">…</span>
                      <button v-else class="cursor-pointer px-2.5 py-1.5 text-sm rounded-md border transition-colors" :class="p === archivedMeta.current_page ? 'border-primary bg-primary text-white' : 'border-gray-300 text-gray-600 hover:bg-gray-50'" @click="fetchArchived(p as number)">{{ p }}</button>
                    </template>
                    <button class="cursor-pointer px-2.5 py-1.5 text-sm rounded-md border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-40" :disabled="archivedMeta.current_page === archivedMeta.last_page" @click="fetchArchived(archivedMeta.current_page + 1)">&rsaquo;</button>
                  </div>
                </div>
              </div>
              </template>

            </div>
          </TabPanel>

          <!-- ══ CONFIGURATIONS TAB ════════════════════════════════════════════ -->
          <TabPanel>
            <div v-if="configLoading" class="py-16 text-center text-gray-400">
              <i class="fa-solid fa-spinner fa-spin text-2xl mb-2 block"></i>
              <p class="text-sm">Loading configurations…</p>
            </div>
            <TabGroup v-else as="div" :selectedIndex="configTabIndex" @change="(i: number) => { const keys = ['brands','categories','features','attributes','platforms'] as const; if (keys[i]) configTab = keys[i] }" class="space-y-4">
              <TabList class="flex gap-2 flex-wrap">
                <Tab v-for="ct in [
            { key: 'brands', label: 'Brands', count: brands.length },
            { key: 'categories', label: 'Body Types', count: categories.length },
            { key: 'features', label: 'Features', count: features.length },
            { key: 'attributes', label: 'Attributes', count: attributes.length },
            { key: 'platforms', label: 'Source Platforms', count: sourcePlatforms.length },
          ]" :key="ct.key" as="template" v-slot="{ selected }">
                  <button
                      class="cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                      :class="selected ? 'bg-secondary text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'"
                  >
                    {{ ct.label }}
                    <span class="text-xs px-1.5 py-0.5 rounded-full" :class="selected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'">{{ ct.count }}</span>
                  </button>
                </Tab>
              </TabList>
              <TabPanels>
                <!-- Brands -->
                <TabPanel>
                  <div class="bg-white rounded-lg border border-gray-200">
                    <div class="px-5 py-4 border-b border-gray-100">
                      <h3 class="font-semibold text-gray-900 text-sm">Vehicle Brands</h3>
                      <p class="text-xs text-gray-400 mt-0.5">Brands shown in the vehicle form dropdown</p>
                    </div>
                    <div class="divide-y divide-gray-100">
                      <div v-if="brands.length === 0" class="py-10 text-center text-sm text-gray-400">No brands yet — add one above</div>
                      <div v-for="item in brands" :key="item.id" class="flex items-center justify-between px-5 py-3 hover:bg-gray-50/50">
                        <div class="flex items-center gap-2.5">
                          <span class="font-medium text-gray-900 text-sm">{{ item.name }}</span>
                          <span v-if="!item.is_active" class="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">Inactive</span>
                        </div>
                        <div class="flex items-center gap-1.5">
                          <button class="cursor-pointer p-1.5 text-gray-400 hover:text-secondary hover:bg-blue-50 rounded-md" @click="openModal('brand', item)"><i class="fa-solid fa-pen text-xs"></i></button>
                          <button class="cursor-pointer p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md" @click="deleteConfigItem('brand', item.id)"><i class="fa-solid fa-trash text-xs"></i></button>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabPanel>
                <!-- Categories -->
                <TabPanel>
                  <div class="bg-white rounded-lg border border-gray-200">
                    <div class="px-5 py-4 border-b border-gray-100">
                      <h3 class="font-semibold text-gray-900 text-sm">Body Types / Categories</h3>
                      <p class="text-xs text-gray-400 mt-0.5">Body type options (SUV, Sedan, etc.)</p>
                    </div>
                    <div class="divide-y divide-gray-100">
                      <div v-if="categories.length === 0" class="py-10 text-center text-sm text-gray-400">No body types yet</div>
                      <div v-for="item in categories" :key="item.id" class="flex items-center justify-between px-5 py-3 hover:bg-gray-50/50">
                        <div class="flex items-center gap-2.5">
                          <span class="font-medium text-gray-900 text-sm">{{ item.name }}</span>
                          <span v-if="!item.is_active" class="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">Inactive</span>
                        </div>
                        <div class="flex items-center gap-1.5">
                          <button class="cursor-pointer p-1.5 text-gray-400 hover:text-secondary hover:bg-blue-50 rounded-md" @click="openModal('category', item)"><i class="fa-solid fa-pen text-xs"></i></button>
                          <button class="cursor-pointer p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md" @click="deleteConfigItem('category', item.id)"><i class="fa-solid fa-trash text-xs"></i></button>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabPanel>
                <!-- Features -->
                <TabPanel>
                  <div class="bg-white rounded-lg border border-gray-200">
                    <div class="px-5 py-4 border-b border-gray-100">
                      <h3 class="font-semibold text-gray-900 text-sm">Features Library</h3>
                      <p class="text-xs text-gray-400 mt-0.5">Feature tags assigned per vehicle</p>
                    </div>
                    <div>
                      <div v-if="features.length === 0" class="py-10 text-center text-sm text-gray-400">No features yet</div>
                      <template v-else>
                        <div v-for="cat in ['comfort','safety','technology','exterior','performance']" :key="cat">
                          <template v-if="features.filter(f => f.category === cat).length">
                            <div class="px-5 py-2 bg-gray-50 flex items-center gap-2 border-b border-gray-100">
                              <span class="text-xs font-semibold text-gray-500 uppercase tracking-wide capitalize">{{ cat }}</span>
                              <span class="text-xs text-gray-400">({{ features.filter(f => f.category === cat).length }})</span>
                            </div>
                            <div v-for="item in features.filter(f => f.category === cat)" :key="item.id" class="flex items-center justify-between px-5 py-2.5 hover:bg-gray-50/50 border-b border-gray-50">
                              <div class="flex items-center gap-2.5">
                                <i v-if="item.icon" :class="`fa-solid ${item.icon} text-gray-400 w-4 text-sm`"></i>
                                <span class="text-sm text-gray-900">{{ item.name }}</span>
                                <span v-if="!item.is_active" class="text-xs bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full">Inactive</span>
                              </div>
                              <div class="flex items-center gap-1.5">
                                <button class="cursor-pointer p-1.5 text-gray-400 hover:text-secondary hover:bg-blue-50 rounded-md" @click="openModal('feature', item)"><i class="fa-solid fa-pen text-xs"></i></button>
                                <button class="cursor-pointer p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md" @click="deleteConfigItem('feature', item.id)"><i class="fa-solid fa-trash text-xs"></i></button>
                              </div>
                            </div>
                          </template>
                        </div>
                      </template>
                    </div>
                  </div>
                </TabPanel>
                <!-- Attributes -->
                <TabPanel>
                  <div class="bg-white rounded-lg border border-gray-200">
                    <div class="px-5 py-4 border-b border-gray-100">
                      <h3 class="font-semibold text-gray-900 text-sm">Custom Attributes</h3>
                      <p class="text-xs text-gray-400 mt-0.5">Dynamic specs — text, number, or selectable values</p>
                    </div>
                    <div class="divide-y divide-gray-100">
                      <div v-if="attributes.length === 0" class="py-10 text-center text-sm text-gray-400">No attributes yet</div>
                      <div v-for="item in attributes" :key="item.id" class="flex items-start justify-between px-5 py-3 hover:bg-gray-50/50">
                        <div>
                          <div class="flex items-center gap-2 mb-1">
                            <span class="font-medium text-gray-900 text-sm">{{ item.name }}</span>
                            <span class="text-xs px-1.5 py-0.5 rounded-full font-medium" :class="{ 'bg-blue-100 text-blue-700': item.type === 'number', 'bg-purple-100 text-purple-700': item.type === 'select', 'bg-gray-100 text-gray-600': item.type === 'text' }">{{ item.type }}</span>
                            <span v-if="item.unit" class="text-xs text-gray-400">unit: {{ item.unit }}</span>
                            <span v-if="!item.is_active" class="text-xs bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full">Inactive</span>
                          </div>
                          <div v-if="item.type === 'select' && item.options.length" class="flex flex-wrap gap-1">
                            <span v-for="opt in item.options" :key="opt.id" class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{{ opt.value }}</span>
                          </div>
                        </div>
                        <div class="flex items-center gap-1.5 shrink-0">
                          <button class="cursor-pointer p-1.5 text-gray-400 hover:text-secondary hover:bg-blue-50 rounded-md" @click="openModal('attribute', item)"><i class="fa-solid fa-pen text-xs"></i></button>
                          <button class="cursor-pointer p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md" @click="deleteConfigItem('attribute', item.id)"><i class="fa-solid fa-trash text-xs"></i></button>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabPanel>
                <!-- Source Platforms -->
                <TabPanel>
                  <div class="bg-white rounded-lg border border-gray-200">
                    <div class="px-5 py-4 border-b border-gray-100">
                      <h3 class="font-semibold text-gray-900 text-sm">Source Platforms</h3>
                      <p class="text-xs text-gray-400 mt-0.5">Auction &amp; sourcing platforms you buy from</p>
                    </div>
                    <div class="divide-y divide-gray-100">
                      <div v-if="sourcePlatforms.length === 0" class="py-10 text-center text-sm text-gray-400">No platforms yet</div>
                      <div v-for="item in sourcePlatforms" :key="item.id" class="flex items-center justify-between px-5 py-3 hover:bg-gray-50/50">
                        <div class="flex items-center gap-2.5">
                          <span class="font-medium text-gray-900 text-sm">{{ item.name }}</span>
                          <a v-if="item.website_url" :href="item.website_url" target="_blank" class="text-xs text-blue-500 hover:underline">{{ item.website_url }}</a>
                          <span v-if="!item.is_active" class="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">Inactive</span>
                        </div>
                        <div class="flex items-center gap-1.5">
                          <button class="cursor-pointer p-1.5 text-gray-400 hover:text-secondary hover:bg-blue-50 rounded-md" @click="openModal('platform', item)"><i class="fa-solid fa-pen text-xs"></i></button>
                          <button class="cursor-pointer p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md" @click="deleteConfigItem('platform', item.id)"><i class="fa-solid fa-trash text-xs"></i></button>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabPanel>
              </TabPanels>
            </TabGroup>
          </TabPanel>

          <!-- ══ IMPORT TEMPLATES TAB ════════════════════════════════════════ -->
          <TabPanel>
            <div v-if="loadingTemplates" class="py-16 text-center text-gray-400">
              <i class="fa-solid fa-spinner fa-spin text-2xl mb-2 block"></i>
              <p class="text-sm">Loading templates…</p>
            </div>
            <div v-else-if="importTemplates.length === 0" class="py-16 text-center">
              <i class="fa-solid fa-file-import text-4xl text-gray-200 mb-3"></i>
              <p class="text-gray-500 font-medium">No import templates yet</p>
              <p class="text-sm text-gray-400 mt-1">Templates are saved during the import wizard (Step 4) for reuse on future imports.</p>
              <NuxtLink to="/backoffice/vehicles/import" class="inline-flex items-center gap-2 mt-4 text-sm text-primary hover:text-red-700 font-medium">
                <i class="fa-solid fa-upload"></i> Go to Import Wizard
              </NuxtLink>
            </div>
            <div v-else class="space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="font-semibold text-gray-900 text-sm">Saved Import Templates</h3>
                  <p class="text-xs text-gray-400 mt-0.5">Reusable column and value mappings for bulk imports. {{ importTemplates.length }} template{{ importTemplates.length !== 1 ? 's' : '' }}</p>
                </div>
                <NuxtLink to="/backoffice/vehicles/import" class="text-xs text-primary hover:text-red-700 font-medium flex items-center gap-1.5">
                  <i class="fa-solid fa-upload"></i> Import Wizard
                </NuxtLink>
              </div>

              <div class="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
                <div v-for="t in importTemplates" :key="t.id" class="flex items-center justify-between px-5 py-4 hover:bg-gray-50/50 group">
                  <div class="flex-1 min-w-0">
                    <template v-if="editingTemplateName === t.id">
                      <input
                        v-model="editingTemplateNameValue"
                        type="text" maxlength="100"
                        class="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary/30"
                        @keydown.enter="saveTemplateName(t)"
                        @keydown.escape="editingTemplateName = null"
                        @blur="saveTemplateName(t)"
                      />
                    </template>
                    <template v-else>
                      <p class="text-sm font-medium text-gray-800 truncate">
                        <i class="fa-solid fa-file-lines text-gray-300 mr-2"></i>
                        {{ t.name }}
                      </p>
                      <p class="text-xs text-gray-400 mt-0.5">
                        Created {{ new Date(t.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }}
                      </p>
                    </template>
                  </div>
                  <div class="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button @click="previewImportTemplate(t)" class="cursor-pointer p-1.5 text-gray-400 hover:text-secondary hover:bg-blue-50 rounded-md" title="Preview">
                      <i class="fa-solid fa-eye text-xs"></i>
                    </button>
                    <button @click="startEditTemplateName(t)" class="cursor-pointer p-1.5 text-gray-400 hover:text-secondary hover:bg-blue-50 rounded-md" title="Rename">
                      <i class="fa-solid fa-pen text-xs"></i>
                    </button>
                    <button @click="deleteImportTemplate(t)" class="cursor-pointer p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md" title="Delete">
                      <i class="fa-solid fa-trash text-xs"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>

    <!-- ══ TEMPLATE PREVIEW MODAL ══════════════════════════════════════════ -->
    <Teleport to="body">
      <div v-if="showTemplatePreview && previewTemplate" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/40" @click="showTemplatePreview = false"></div>
        <div class="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-gray-900">{{ previewTemplate.name }}</h3>
            <button @click="showTemplatePreview = false" class="text-gray-400 hover:text-gray-600">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <!-- Column Mappings -->
          <div v-if="previewTemplate.headerMapping && Object.keys(previewTemplate.headerMapping).length" class="mb-5">
            <h4 class="text-xs font-semibold text-gray-500 uppercase mb-2">Column Mappings</h4>
            <div class="space-y-1">
              <div v-for="(field, header) in previewTemplate.headerMapping" :key="header"
                class="flex items-center gap-2 text-sm py-1.5 px-3 rounded-lg bg-gray-50">
                <span class="text-gray-600 font-mono text-xs flex-1 truncate">{{ header }}</span>
                <i class="fa-solid fa-arrow-right text-gray-300 text-[10px]"></i>
                <span class="text-gray-800 font-medium text-xs">{{ field }}</span>
              </div>
            </div>
          </div>

          <!-- Value Mappings -->
          <div v-if="previewTemplate.valueMapping && Object.keys(previewTemplate.valueMapping).length" class="mb-5">
            <h4 class="text-xs font-semibold text-gray-500 uppercase mb-2">Value Mappings</h4>
            <div v-for="(mappings, field) in previewTemplate.valueMapping" :key="field" class="mb-3">
              <p class="text-xs font-medium text-gray-700 mb-1 capitalize">{{ String(field).replace('_', ' ') }}</p>
              <div v-if="typeof mappings === 'object'" class="space-y-0.5">
                <div v-for="(to, from) in (mappings as Record<string, string>)" :key="from"
                  class="flex items-center gap-2 text-xs py-1 px-3 rounded bg-gray-50">
                  <span class="text-gray-500 font-mono truncate flex-1">{{ from }}</span>
                  <i class="fa-solid fa-arrow-right text-gray-300 text-[8px]"></i>
                  <span class="text-gray-700">{{ to }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Feature List Mapping -->
          <div v-if="previewTemplate.featureListMapping && Object.keys(previewTemplate.featureListMapping).length" class="mb-5">
            <h4 class="text-xs font-semibold text-gray-500 uppercase mb-2">Feature List Mapping</h4>
            <div class="flex flex-wrap gap-1.5">
              <span v-for="(fId, name) in previewTemplate.featureListMapping" :key="name"
                class="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full">
                {{ name }}
              </span>
            </div>
          </div>

          <div class="flex justify-end pt-3 border-t border-gray-100">
            <button @click="showTemplatePreview = false" class="text-sm text-gray-500 hover:text-gray-700 px-3 py-2">Close</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ══ CONFIG MODAL ══════════════════════════════════════════════════ -->
    <TransitionRoot :show="modal.show" as="template">
      <Dialog as="div" class="relative z-[200]" @close="closeModal">
        <TransitionChild
          as="template"
          enter="ease-out duration-200" enter-from="opacity-0" enter-to="opacity-100"
          leave="ease-in duration-150" leave-from="opacity-100" leave-to="opacity-0"
        >
          <div class="fixed inset-0 bg-black/50" />
        </TransitionChild>
        <div class="fixed inset-0 overflow-y-auto">
          <div class="flex min-h-full items-center justify-center p-4">
            <TransitionChild
              as="template"
              enter="ease-out duration-200" enter-from="opacity-0 scale-95" enter-to="opacity-100 scale-100"
              leave="ease-in duration-150" leave-from="opacity-100 scale-100" leave-to="opacity-0 scale-95"
            >
              <DialogPanel class="bg-white rounded-lg w-full max-w-md shadow-xl">
                <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 class="font-semibold text-gray-900">
              {{ modal.editing ? 'Edit' : 'Add' }}
              {{ { brand: 'Brand', category: 'Body Type', feature: 'Feature', attribute: 'Attribute', platform: 'Source Platform' }[modal.type] }}
            </h3>
            <button class="cursor-pointer text-gray-400 hover:text-gray-600" @click="closeModal"><i class="fa-solid fa-times"></i></button>
          </div>
          <div class="p-5 space-y-4">
            <div v-if="modal.error" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">{{ modal.error }}</div>

            <template v-if="['brand','category','platform'].includes(modal.type)">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
                <input v-model="modalForm.name" type="text" class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none"
                  :placeholder="modal.type === 'brand' ? 'e.g. Toyota' : modal.type === 'category' ? 'e.g. SUV' : 'e.g. BeForward'">
              </div>
              <div v-if="modal.type === 'platform'">
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Website URL</label>
                <input v-model="modalForm.website_url" type="url" class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none" placeholder="https://...">
              </div>
            </template>

            <template v-if="modal.type === 'feature'">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
                <input v-model="modalForm.name" type="text" class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none" placeholder="e.g. Sunroof">
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                  <select v-model="modalForm.category" class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none">
                    <option v-for="c in ['comfort','safety','technology','exterior','performance']" :key="c" :value="c" class="capitalize">{{ c }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">Icon <span class="text-gray-400 font-normal">(FA)</span></label>
                  <input v-model="modalForm.icon" type="text" class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none" placeholder="fa-snowflake">
                </div>
              </div>
            </template>

            <template v-if="modal.type === 'attribute'">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
                <input v-model="modalForm.name" type="text" class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none" placeholder="e.g. Ground Clearance">
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
                  <select v-model="modalForm.type" class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none">
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="select">Dropdown (Select)</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">Unit <span class="text-gray-400 font-normal">(optional)</span></label>
                  <input v-model="modalForm.unit" type="text" class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none" placeholder="mm, kg, L…">
                </div>
              </div>
              <div v-if="modalForm.type === 'select'">
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Options <span class="text-xs text-gray-400 font-normal">(one per line)</span></label>
                <textarea v-model="modalForm.options" rows="5" class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none resize-none" placeholder="Option A&#10;Option B&#10;Option C"></textarea>
              </div>
            </template>

            <!-- Active toggle -->
            <label class="flex items-center gap-3 cursor-pointer">
              <div class="relative w-9 h-5">
                <input v-model="modalForm.is_active" type="checkbox" class="sr-only">
                <div class="w-9 h-5 rounded-full transition-colors" :class="modalForm.is_active ? 'bg-primary' : 'bg-gray-300'"></div>
                <div class="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform" :class="modalForm.is_active ? 'translate-x-4' : 'translate-x-0.5'"></div>
              </div>
              <span class="text-sm text-gray-700">Active</span>
            </label>
          </div>
          <div class="flex justify-end gap-3 px-5 py-4 border-t border-gray-100">
            <button class="cursor-pointer px-4 py-2 border border-gray-300 text-gray-600 rounded-md text-sm hover:bg-gray-50" @click="closeModal">Cancel</button>
            <button :disabled="modal.saving" class="cursor-pointer flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-60" @click="saveModal">
              <i v-if="modal.saving" class="fa-solid fa-spinner fa-spin"></i>
              {{ modal.saving ? 'Saving…' : (modal.editing ? 'Update' : 'Create') }}
            </button>
          </div>
        </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>

    <ConfirmDialog
      :show="confirmState.show"
      :title="confirmState.title"
      :message="confirmState.message"
      @confirm="doConfirm"
      @cancel="cancelConfirm"
    />

  </div>
</template>
