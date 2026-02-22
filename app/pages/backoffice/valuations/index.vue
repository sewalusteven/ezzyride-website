<script setup lang="ts">
definePageMeta({ layout: 'admin-layout' })

const { $api } = useNuxtApp()

// ── Types ──────────────────────────────────────────────────────────────────
interface Batch {
  id: number
  title: string
  review_date: string
}

interface Valuation {
  id: number
  name: string
  model: string
  year: string
  hsc: string
  origin: string
  cc: string
  unit: string
  cif: string | number
  batch: Batch
}

interface PaginationMeta {
  current_page: number
  last_page: number
  total: number
  per_page: number
  from: number | null
  to: number | null
}

// ── State ──────────────────────────────────────────────────────────────────
const valuations   = ref<Valuation[]>([])
const batches      = ref<Batch[]>([])
const loading      = ref(false)
const meta         = ref<PaginationMeta>({ current_page: 1, last_page: 1, total: 0, per_page: 15, from: null, to: null })

const search        = ref('')
const selectedBatch = ref<number | ''>('')
const searchTimer   = ref<ReturnType<typeof setTimeout> | null>(null)

// ── Import modal ───────────────────────────────────────────────────────────
const showImport   = ref(false)
const importFile   = ref<File | null>(null)
const importForm   = ref({ title: '', reviewDate: '' })
const importError  = ref('')
const importing    = ref(false)

// ── Add single valuation modal ─────────────────────────────────────────────
const showAdd  = ref(false)
const addForm  = ref({ batchId: '' as number | '', name: '', hsc: '', origin: '', cc: '', cif: '' })
const addError = ref('')
const adding   = ref(false)

// ── Fetch ──────────────────────────────────────────────────────────────────
const fetchBatches = async () => {
  const { data } = await $api.get<{ data: Batch[] }>('/v1/batches')
  batches.value = data.data
}

const fetchValuations = async (page = 1) => {
  loading.value = true
  try {
    const params: Record<string, any> = { page }
    if (selectedBatch.value) params.batch_id = selectedBatch.value
    if (search.value.trim()) params.search = search.value.trim()

    const { data } = await $api.get('/v1/valuations', { params })
    valuations.value = data.data
    meta.value       = data.meta
  } finally {
    loading.value = false
  }
}

// ── Watchers ───────────────────────────────────────────────────────────────
watch(selectedBatch, () => fetchValuations(1))

watch(search, () => {
  if (searchTimer.value) clearTimeout(searchTimer.value)
  searchTimer.value = setTimeout(() => fetchValuations(1), 400)
})

onMounted(() => {
  fetchBatches()
  fetchValuations()
})

// ── Import Excel ───────────────────────────────────────────────────────────
const onFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement
  importFile.value = input.files?.[0] ?? null
}

const handleImport = async () => {
  importError.value = ''
  if (!importFile.value)        { importError.value = 'Please select a file.'; return }
  if (!importForm.value.title)  { importError.value = 'Batch title is required.'; return }
  if (!importForm.value.reviewDate) { importError.value = 'Review date is required.'; return }

  importing.value = true
  try {
    const fd = new FormData()
    fd.append('file',       importFile.value)
    fd.append('title',      importForm.value.title)
    fd.append('reviewDate', importForm.value.reviewDate)

    await $api.post('/v1/valuations/import', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    closeImport()
    await fetchBatches()
    await fetchValuations(1)
  } catch (err: any) {
    importError.value = err.response?.data?.message ?? 'Import failed. Please try again.'
  } finally {
    importing.value = false
  }
}

const closeImport = () => {
  showImport.value     = false
  importFile.value     = null
  importForm.value     = { title: '', reviewDate: '' }
  importError.value    = ''
}

// ── Add single valuation ───────────────────────────────────────────────────
const handleAdd = async () => {
  addError.value = ''
  if (!addForm.value.batchId) { addError.value = 'Please select a batch.'; return }
  if (!addForm.value.name)    { addError.value = 'Description is required.'; return }
  if (!addForm.value.cif)     { addError.value = 'CIF (USD) is required.'; return }

  adding.value = true
  try {
    await $api.post('/v1/valuations', {
      batchId: addForm.value.batchId,
      name:    addForm.value.name,
      hsc:     addForm.value.hsc,
      origin:  addForm.value.origin,
      cc:      addForm.value.cc,
      cif:     parseFloat(String(addForm.value.cif)),
    })

    closeAdd()
    await fetchValuations(meta.value.current_page)
  } catch (err: any) {
    addError.value = err.response?.data?.message ?? 'Failed to add valuation.'
  } finally {
    adding.value = false
  }
}

const closeAdd = () => {
  showAdd.value  = false
  addForm.value  = { batchId: '', name: '', hsc: '', origin: '', cc: '', cif: '' }
  addError.value = ''
}

// ── Helpers ────────────────────────────────────────────────────────────────
const formatCIF = (val: string | number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(Number(val))

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

const pages = computed(() => {
  const total = meta.value.last_page
  const cur   = meta.value.current_page
  const range: (number | '...')[] = []
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= cur - 1 && i <= cur + 1)) range.push(i)
    else if (range[range.length - 1] !== '...') range.push('...')
  }
  return range
})
</script>

<template>
  <div class="p-6 space-y-5">

    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-semibold text-gray-900">Valuations</h2>
        <p class="text-sm text-gray-500 mt-0.5">URA vehicle valuation database</p>
      </div>
      <div class="flex items-center gap-3">
        <button
          class="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          @click="showImport = true"
        >
          <i class="fa-solid fa-file-excel text-green-600"></i>
          Import Excel
        </button>
        <button
          class="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
          @click="showAdd = true"
        >
          <i class="fa-solid fa-plus"></i>
          Add Valuation
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-lg border border-gray-200 p-4 flex flex-wrap gap-3">
      <!-- Search -->
      <div class="relative flex-1 min-w-48">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <i class="fa-solid fa-search text-gray-400 text-xs"></i>
        </div>
        <input
          v-model="search"
          type="text"
          placeholder="Search by vehicle name..."
          class="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-primary"
        >
      </div>

      <!-- Batch filter -->
      <select
        v-model="selectedBatch"
        class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-primary min-w-48"
      >
        <option value="">All batches</option>
        <option v-for="b in batches" :key="b.id" :value="b.id">
          {{ b.title }} — {{ formatDate(b.review_date) }}
        </option>
      </select>

      <!-- Record count -->
      <div class="flex items-center text-sm text-gray-500 ml-auto">
        <span v-if="!loading">{{ meta.total.toLocaleString() }} records</span>
        <span v-else class="flex items-center gap-1.5">
          <i class="fa-solid fa-spinner fa-spin text-primary"></i> Loading...
        </span>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
              <th class="px-4 py-3 w-12">#</th>
              <th class="px-4 py-3">Description</th>
              <th class="px-4 py-3">Model</th>
              <th class="px-4 py-3">Year</th>
              <th class="px-4 py-3">Engine CC</th>
              <th class="px-4 py-3">Origin</th>
              <th class="px-4 py-3">CIF (USD)</th>
              <th class="px-4 py-3">Batch</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <!-- Loading skeleton -->
            <template v-if="loading">
              <tr v-for="n in 10" :key="n" class="animate-pulse">
                <td class="px-4 py-3"><div class="h-3 w-6 bg-gray-200 rounded"></div></td>
                <td class="px-4 py-3"><div class="h-3 w-48 bg-gray-200 rounded"></div></td>
                <td class="px-4 py-3"><div class="h-3 w-24 bg-gray-200 rounded"></div></td>
                <td class="px-4 py-3"><div class="h-3 w-10 bg-gray-200 rounded"></div></td>
                <td class="px-4 py-3"><div class="h-3 w-16 bg-gray-200 rounded"></div></td>
                <td class="px-4 py-3"><div class="h-3 w-8 bg-gray-200 rounded"></div></td>
                <td class="px-4 py-3"><div class="h-3 w-20 bg-gray-200 rounded"></div></td>
                <td class="px-4 py-3"><div class="h-3 w-28 bg-gray-200 rounded"></div></td>
              </tr>
            </template>

            <!-- Empty state -->
            <tr v-else-if="!valuations.length">
              <td colspan="8" class="px-4 py-16 text-center text-gray-400">
                <i class="fa-solid fa-car-side text-4xl mb-3 block opacity-30"></i>
                <p class="font-medium">No valuations found</p>
                <p class="text-xs mt-1">Try adjusting your search or import a new batch</p>
              </td>
            </tr>

            <!-- Rows -->
            <tr
              v-for="(v, i) in valuations"
              v-else
              :key="v.id"
              class="hover:bg-gray-50 transition-colors"
            >
              <td class="px-4 py-3 text-gray-400 text-xs">
                {{ (meta.from ?? 0) + i }}
              </td>
              <td class="px-4 py-3 font-medium text-gray-900 max-w-xs">
                <span class="line-clamp-2">{{ v.name }}</span>
              </td>
              <td class="px-4 py-3 text-gray-600">{{ v.model || '—' }}</td>
              <td class="px-4 py-3">
                <span v-if="v.year" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                  {{ v.year }}
                </span>
                <span v-else class="text-gray-400">—</span>
              </td>
              <td class="px-4 py-3 text-gray-600">
                {{ v.cc ? `${v.cc} ${v.unit ?? ''}`.trim() : '—' }}
              </td>
              <td class="px-4 py-3">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 uppercase">
                  {{ v.origin || '—' }}
                </span>
              </td>
              <td class="px-4 py-3 font-medium text-gray-900 tabular-nums">
                {{ formatCIF(v.cif) }}
              </td>
              <td class="px-4 py-3 text-gray-500 text-xs max-w-[160px] truncate">
                {{ v.batch?.title ?? '—' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="meta.last_page > 1" class="border-t border-gray-200 px-4 py-3 flex items-center justify-between">
        <p class="text-xs text-gray-500">
          Showing {{ meta.from ?? 0 }}–{{ meta.to ?? 0 }} of {{ meta.total.toLocaleString() }}
        </p>
        <div class="flex items-center gap-1">
          <button
            class="px-2 py-1 rounded text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            :disabled="meta.current_page === 1"
            @click="fetchValuations(meta.current_page - 1)"
          >
            <i class="fa-solid fa-chevron-left text-xs"></i>
          </button>

          <template v-for="p in pages" :key="p">
            <span v-if="p === '...'" class="px-2 text-gray-400 text-sm">…</span>
            <button
              v-else
              class="px-3 py-1 rounded text-sm transition-colors"
              :class="p === meta.current_page
                ? 'bg-primary text-white font-medium'
                : 'text-gray-600 hover:bg-gray-100'"
              @click="fetchValuations(p as number)"
            >
              {{ p }}
            </button>
          </template>

          <button
            class="px-2 py-1 rounded text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            :disabled="meta.current_page === meta.last_page"
            @click="fetchValuations(meta.current_page + 1)"
          >
            <i class="fa-solid fa-chevron-right text-xs"></i>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- ── Import Excel Modal ──────────────────────────────────────────────── -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showImport" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50" @click="closeImport"></div>

        <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-md">
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <i class="fa-solid fa-file-excel text-green-600 text-sm"></i>
              </div>
              <h3 class="text-base font-semibold text-gray-900">Import Excel Batch</h3>
            </div>
            <button class="text-gray-400 hover:text-gray-600" @click="closeImport">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <!-- Body -->
          <div class="px-6 py-5 space-y-4">
            <!-- Error -->
            <div v-if="importError" class="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <i class="fa-solid fa-circle-exclamation mt-0.5 shrink-0"></i>
              <span>{{ importError }}</span>
            </div>

            <!-- File upload -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Excel File <span class="text-red-500">*</span></label>
              <label
                class="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-lg cursor-pointer transition-colors"
                :class="importFile ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-primary hover:bg-gray-50'"
              >
                <div v-if="!importFile" class="text-center">
                  <i class="fa-solid fa-cloud-arrow-up text-2xl text-gray-400 mb-1"></i>
                  <p class="text-sm text-gray-500">Click to upload <span class="text-primary font-medium">xlsx, xls, csv</span></p>
                </div>
                <div v-else class="text-center">
                  <i class="fa-solid fa-file-circle-check text-2xl text-green-500 mb-1"></i>
                  <p class="text-sm text-green-700 font-medium">{{ importFile.name }}</p>
                  <p class="text-xs text-gray-400">{{ (importFile.size / 1024).toFixed(0) }} KB</p>
                </div>
                <input type="file" accept=".xlsx,.xls,.csv" class="hidden" @change="onFileChange">
              </label>
            </div>

            <!-- Format hint -->
            <div class="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700 space-y-1">
              <p class="font-medium">Expected columns:</p>
              <p class="font-mono">S/N | HSC CODE | COO | Description | CC | CIF (USD)</p>
            </div>

            <!-- Batch title -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Batch Title <span class="text-red-500">*</span></label>
              <input
                v-model="importForm.title"
                type="text"
                placeholder="e.g. Used MV Database – January 2026"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              >
            </div>

            <!-- Review date -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Review Date <span class="text-red-500">*</span></label>
              <input
                v-model="importForm.reviewDate"
                type="date"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              >
            </div>
          </div>

          <!-- Footer -->
          <div class="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
            <button class="px-4 py-2 text-sm text-gray-600 hover:text-gray-900" @click="closeImport">Cancel</button>
            <button
              :disabled="importing"
              class="flex items-center gap-2 px-5 py-2 bg-primary text-white text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60"
              @click="handleImport"
            >
              <i v-if="importing" class="fa-solid fa-spinner fa-spin"></i>
              <i v-else class="fa-solid fa-upload"></i>
              {{ importing ? 'Importing...' : 'Import Batch' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ── Add Single Valuation Modal ─────────────────────────────────────── -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showAdd" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50" @click="closeAdd"></div>

        <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-lg">
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                <i class="fa-solid fa-plus text-primary text-sm"></i>
              </div>
              <h3 class="text-base font-semibold text-gray-900">Add Single Valuation</h3>
            </div>
            <button class="text-gray-400 hover:text-gray-600" @click="closeAdd">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <!-- Body -->
          <div class="px-6 py-5 space-y-4">
            <!-- Error -->
            <div v-if="addError" class="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <i class="fa-solid fa-circle-exclamation mt-0.5 shrink-0"></i>
              <span>{{ addError }}</span>
            </div>

            <!-- Batch -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Batch <span class="text-red-500">*</span></label>
              <select
                v-model="addForm.batchId"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="">Select a batch</option>
                <option v-for="b in batches" :key="b.id" :value="b.id">
                  {{ b.title }} — {{ formatDate(b.review_date) }}
                </option>
              </select>
            </div>

            <!-- Description -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">
                Description <span class="text-red-500">*</span>
              </label>
              <input
                v-model="addForm.name"
                type="text"
                placeholder="e.g. Toyota Land Cruiser, Model GX, 2020"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              >
              <p class="text-xs text-gray-400 mt-1">Format: Brand, Model, Year</p>
            </div>

            <!-- Row: HSC + Origin -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">HSC Code</label>
                <input
                  v-model="addForm.hsc"
                  type="text"
                  placeholder="e.g. 8703.23.90"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                >
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Country of Origin</label>
                <input
                  v-model="addForm.origin"
                  type="text"
                  placeholder="e.g. JP"
                  maxlength="5"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary uppercase"
                >
              </div>
            </div>

            <!-- Row: CC + CIF -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Engine CC</label>
                <input
                  v-model="addForm.cc"
                  type="text"
                  placeholder="e.g. 2500 cc"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                >
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">CIF (USD) <span class="text-red-500">*</span></label>
                <input
                  v-model="addForm.cif"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 12500.00"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                >
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
            <button class="px-4 py-2 text-sm text-gray-600 hover:text-gray-900" @click="closeAdd">Cancel</button>
            <button
              :disabled="adding"
              class="flex items-center gap-2 px-5 py-2 bg-primary text-white text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60"
              @click="handleAdd"
            >
              <i v-if="adding" class="fa-solid fa-spinner fa-spin"></i>
              <i v-else class="fa-solid fa-plus"></i>
              {{ adding ? 'Adding...' : 'Add Valuation' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
