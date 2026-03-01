<script setup lang="ts">
definePageMeta({ layout: 'admin-layout' })
const { $api } = useNuxtApp()
const route  = useRoute()
const router = useRouter()
const id     = route.params.id as string

interface Brand    { id: number; name: string }
interface Category { id: number; name: string }
interface Feature  { id: number; name: string; icon: string | null; category: string }
interface Attribute{ id: number; name: string; type: string; unit: string | null; options: {id:number;value:string}[] }
interface VehicleImage { id: number; path: string; is_primary: boolean; url?: string }

const brands     = ref<Brand[]>([])
const categories = ref<Category[]>([])
const features   = ref<Feature[]>([])
const attributes = ref<Attribute[]>([])
const loading    = ref(true)
const saving     = ref(false)
const error      = ref('')

// Existing images
const existingImages = ref<VehicleImage[]>([])
const deletingImageIds = ref<Set<number>>(new Set())
// New images to upload
const newImageFiles    = ref<File[]>([])
const newImagePreviews = ref<string[]>([])

const form = ref({
  brand_id: '' as string | number,
  vehicle_category_id: '' as string | number,
  model: '',
  year: new Date().getFullYear(),
  vin: '',
  colour: '',
  engine_cc: '' as string | number,
  mileage: '' as string | number,
  transmission: 'automatic',
  fuel_type: 'petrol',
  drive_type: 'fwd',
  seating_capacity: '' as string | number,
  youtube_url: '',
  description: '',
  status: 'draft',
  is_published: false,
  cost_price: '' as string | number,
  cif_usd: '' as string | number,
  selling_price: '' as string | number,
  feature_ids: [] as number[],
  vehicle_attributes: [] as { attribute_id: number; value: string }[],
})

onMounted(async () => {
  try {
    const [vehicleRes, b, c, f, a] = await Promise.all([
      $api.get(`/v1/vehicles/${id}`),
      $api.get('/v1/config/vehicle-brands'),
      $api.get('/v1/config/vehicle-categories'),
      $api.get('/v1/config/features'),
      $api.get('/v1/config/attributes'),
    ])
    brands.value     = b.data.data.filter((x: any) => x.is_active)
    categories.value = c.data.data.filter((x: any) => x.is_active)
    features.value   = f.data.data.filter((x: any) => x.is_active)
    attributes.value = a.data.data.filter((x: any) => x.is_active)

    const v = vehicleRes.data.data
    // Resource returns isPrimary (camelCase); normalise for local use
    existingImages.value = (v.images ?? []).map((img: any) => ({
      id: img.id,
      path: img.path,
      is_primary: img.isPrimary ?? img.is_primary ?? false,
    }))

    // Populate form — resource returns camelCase + nested brand/category objects
    form.value.brand_id             = v.brand?.id ?? ''
    form.value.vehicle_category_id  = v.category?.id ?? ''
    form.value.model                = v.model ?? ''
    form.value.year                 = v.year ?? new Date().getFullYear()
    form.value.vin                  = v.vin ?? ''
    form.value.colour               = v.colour ?? ''
    form.value.engine_cc            = v.engineCc ?? ''
    form.value.mileage              = v.mileage ?? ''
    form.value.transmission         = v.transmission ?? 'automatic'
    form.value.fuel_type            = v.fuelType ?? 'petrol'
    form.value.drive_type           = v.driveType ?? 'fwd'
    form.value.seating_capacity     = v.seatingCapacity ?? ''
    form.value.youtube_url          = v.youtubeUrl ?? ''
    form.value.description          = v.description ?? ''
    form.value.status               = v.status ?? 'draft'
    form.value.is_published         = v.isPublished ?? false
    form.value.cost_price           = v.costPrice ?? ''
    form.value.cif_usd              = v.cifUsd ?? ''
    form.value.selling_price        = v.sellingPrice ?? ''
    form.value.feature_ids          = (v.features ?? []).map((f: any) => f.id)

    // Build attribute rows — merge loaded values with full attribute list
    const loadedAttrs: Record<number, string> = {}
    ;(v.attributes ?? []).forEach((a: any) => { loadedAttrs[a.attributeId] = a.value })
    form.value.vehicle_attributes = attributes.value.map(attr => ({
      attribute_id: attr.id,
      value: loadedAttrs[attr.id] ?? '',
    }))
  } finally {
    loading.value = false
  }
})

const toggleFeature = (fid: number) => {
  const idx = form.value.feature_ids.indexOf(fid)
  if (idx > -1) form.value.feature_ids.splice(idx, 1)
  else form.value.feature_ids.push(fid)
}

const onImagePick = (e: Event) => {
  const files = (e.target as HTMLInputElement).files
  if (!files) return
  Array.from(files).forEach(file => {
    newImageFiles.value.push(file)
    const reader = new FileReader()
    reader.onload = ev => newImagePreviews.value.push(ev.target?.result as string)
    reader.readAsDataURL(file)
  })
}

const removeNewImage = (i: number) => {
  newImageFiles.value.splice(i, 1)
  newImagePreviews.value.splice(i, 1)
}

const toggleDeleteExisting = (imgId: number) => {
  if (deletingImageIds.value.has(imgId)) deletingImageIds.value.delete(imgId)
  else deletingImageIds.value.add(imgId)
}

const setPrimary = async (imgId: number) => {
  try {
    await $api.patch(`/v1/vehicles/${id}/images/${imgId}/primary`)
    existingImages.value.forEach(img => { img.is_primary = img.id === imgId })
  } catch {}
}

const submit = async () => {
  error.value = ''
  saving.value = true
  try {
    const payload: Record<string, any> = { ...form.value }
    payload.vehicle_attributes = form.value.vehicle_attributes.filter(a => a.value !== '' && a.value !== null && String(a.value).trim() !== '')

    await $api.patch(`/v1/vehicles/${id}`, payload)

    // Delete marked images
    for (const imgId of deletingImageIds.value) {
      await $api.delete(`/v1/vehicles/${id}/images/${imgId}`)
    }

    // Upload new images
    if (newImageFiles.value.length) {
      const fd = new FormData()
      newImageFiles.value.forEach(f => fd.append('images[]', f))
      await $api.post(`/v1/vehicles/${id}/images`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    }

    router.push(`/backoffice/vehicles/${id}`)
  } catch (err: any) {
    const errs = err.response?.data?.data
    error.value = errs ? Object.values(errs).flat().join(' · ') : (err.response?.data?.message ?? 'Failed to save vehicle')
    saving.value = false
  }
}

const featuresByCategory = computed(() => {
  const cats: Record<string, Feature[]> = {}
  features.value.forEach(f => {
    if (!cats[f.category]) cats[f.category] = []
    cats[f.category]!.push(f)
  })
  return cats
})

const attrByIdx = (aid: number) => form.value.vehicle_attributes.find(a => a.attribute_id === aid)
const { storageUrl } = useStorage()

const keepCount = computed(() =>
  existingImages.value.filter(img => !deletingImageIds.value.has(img.id)).length
)
</script>

<template>
  <div class="p-6  mx-auto space-y-5">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <NuxtLink :to="`/backoffice/vehicles/${id}`" class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
        <i class="fa-solid fa-arrow-left"></i>
      </NuxtLink>
      <div>
        <h2 class="text-xl font-semibold text-gray-900">Edit Vehicle</h2>
        <p class="text-sm text-gray-500 mt-0.5">Update vehicle information and settings</p>
      </div>
      <div class="ml-auto flex items-center gap-3">
        <NuxtLink :to="`/backoffice/vehicles/${id}`" class="px-4 py-2 border border-gray-300 text-gray-600 rounded-md text-sm hover:bg-gray-50">Cancel</NuxtLink>
        <button :disabled="saving || loading" @click="submit" class="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-60 transition-colors">
          <i v-if="saving" class="fa-solid fa-spinner fa-spin"></i>
          <i v-else class="fa-solid fa-floppy-disk"></i>
          {{ saving ? 'Saving…' : 'Save Changes' }}
        </button>
      </div>
    </div>

    <div v-if="error" class="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
      <i class="fa-solid fa-circle-exclamation mt-0.5 shrink-0"></i>
      <span>{{ error }}</span>
    </div>

    <div v-if="loading" class="py-16 text-center text-gray-400">
      <i class="fa-solid fa-spinner fa-spin text-2xl mb-2 block"></i>
      <p class="text-sm">Loading vehicle…</p>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div class="col-span-2 space-y-5">

        <!-- 1. Basic Info -->
        <div class="bg-white rounded-lg border border-gray-200">
          <div class="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <div class="w-8 h-8 rounded-md bg-secondary/10 flex items-center justify-center shrink-0">
              <i class="fa-solid fa-car text-secondary text-sm"></i>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 text-sm">Basic Information</h3>
              <p class="text-xs text-gray-400">Identity and core details</p>
            </div>
          </div>
          <div class="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Brand <span class="text-red-500">*</span></label>
              <select v-model="form.brand_id" class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none">
                <option value="">Select brand…</option>
                <option v-for="b in brands" :key="b.id" :value="b.id">{{ b.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Model <span class="text-red-500">*</span></label>
              <input v-model="form.model" type="text" placeholder="e.g. CX-5, Harrier" class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Body Type <span class="text-red-500">*</span></label>
              <select v-model="form.vehicle_category_id" class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none">
                <option value="">Select type…</option>
                <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Year <span class="text-red-500">*</span></label>
              <input v-model.number="form.year" type="number" min="1980" :max="new Date().getFullYear() + 1" class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none [&::-webkit-inner-spin-button]:appearance-none">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">VIN</label>
              <input v-model="form.vin" type="text" placeholder="17-character VIN" class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Colour</label>
              <input v-model="form.colour" type="text" placeholder="e.g. Pearl White" class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none">
            </div>
          </div>
        </div>

        <!-- 2. Specifications -->
        <div class="bg-white rounded-lg border border-gray-200">
          <div class="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <div class="w-8 h-8 rounded-md bg-orange-100 flex items-center justify-center shrink-0">
              <i class="fa-solid fa-gears text-orange-600 text-sm"></i>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 text-sm">Specifications</h3>
              <p class="text-xs text-gray-400">Mechanical and performance details</p>
            </div>
          </div>
          <div class="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Transmission <span class="text-red-500">*</span></label>
              <select v-model="form.transmission" class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none">
                <option value="automatic">Automatic</option>
                <option value="manual">Manual</option>
                <option value="cvt">CVT</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Fuel Type <span class="text-red-500">*</span></label>
              <select v-model="form.fuel_type" class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none">
                <option value="petrol">Petrol</option>
                <option value="diesel">Diesel</option>
                <option value="hybrid">Hybrid</option>
                <option value="electric">Electric</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Drive Type <span class="text-red-500">*</span></label>
              <select v-model="form.drive_type" class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none">
                <option value="fwd">FWD</option>
                <option value="rwd">RWD</option>
                <option value="awd">AWD</option>
                <option value="4wd">4WD</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Engine CC</label>
              <div class="flex rounded-md border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-primary">
                <input v-model.number="form.engine_cc" type="number" min="0" placeholder="e.g. 2000" class="flex-1 px-3 py-2.5 text-sm border-0 outline-none bg-white [&::-webkit-inner-spin-button]:appearance-none">
                <span class="px-3 py-2.5 bg-gray-50 border-l border-gray-300 text-xs text-gray-500 flex items-center">cc</span>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Mileage</label>
              <div class="flex rounded-md border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-primary">
                <input v-model.number="form.mileage" type="number" min="0" placeholder="e.g. 45000" class="flex-1 px-3 py-2.5 text-sm border-0 outline-none bg-white [&::-webkit-inner-spin-button]:appearance-none">
                <span class="px-3 py-2.5 bg-gray-50 border-l border-gray-300 text-xs text-gray-500 flex items-center">km</span>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Seating Capacity</label>
              <input v-model.number="form.seating_capacity" type="number" min="1" max="20" placeholder="e.g. 5" class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none [&::-webkit-inner-spin-button]:appearance-none">
            </div>
          </div>
        </div>

        <!-- 3. Dynamic Attributes -->
        <div v-if="attributes.length" class="bg-white rounded-lg border border-gray-200">
          <div class="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <div class="w-8 h-8 rounded-md bg-purple-100 flex items-center justify-center shrink-0">
              <i class="fa-solid fa-list-check text-purple-600 text-sm"></i>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 text-sm">Additional Attributes</h3>
              <p class="text-xs text-gray-400">Configurable specs for this vehicle</p>
            </div>
          </div>
          <div class="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div v-for="attr in attributes" :key="attr.id">
              <label class="block text-sm font-medium text-gray-700 mb-1.5">
                {{ attr.name }}
                <span v-if="attr.unit" class="text-xs text-gray-400 font-normal">({{ attr.unit }})</span>
              </label>
              <select v-if="attr.type === 'select'" :value="attrByIdx(attr.id)?.value ?? ''" @change="(e) => { const a = attrByIdx(attr.id); if(a) a.value = (e.target as HTMLSelectElement).value }" class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none">
                <option value="">— select —</option>
                <option v-for="opt in attr.options" :key="opt.id" :value="opt.value">{{ opt.value }}</option>
              </select>
              <div v-else-if="attr.type === 'number'" class="flex rounded-md border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-primary">
                <input :value="attrByIdx(attr.id)?.value ?? ''" @input="(e) => { const a = attrByIdx(attr.id); if(a) a.value = (e.target as HTMLInputElement).value }" type="number" class="flex-1 px-3 py-2.5 text-sm border-0 outline-none bg-white [&::-webkit-inner-spin-button]:appearance-none">
                <span v-if="attr.unit" class="px-3 py-2.5 bg-gray-50 border-l border-gray-300 text-xs text-gray-500 flex items-center">{{ attr.unit }}</span>
              </div>
              <input v-else :value="attrByIdx(attr.id)?.value ?? ''" @input="(e) => { const a = attrByIdx(attr.id); if(a) a.value = (e.target as HTMLInputElement).value }" type="text" class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none">
            </div>
          </div>
        </div>

        <!-- 4. Features -->
        <div v-if="features.length" class="bg-white rounded-lg border border-gray-200">
          <div class="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <div class="w-8 h-8 rounded-md bg-green-100 flex items-center justify-center shrink-0">
              <i class="fa-solid fa-star text-green-600 text-sm"></i>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 text-sm">Features & Equipment</h3>
              <p class="text-xs text-gray-400">Toggle all features this vehicle has</p>
            </div>
          </div>
          <div class="p-5 space-y-4">
            <div v-for="(catFeatures, cat) in featuresByCategory" :key="cat">
              <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 capitalize">{{ cat }}</p>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="f in catFeatures" :key="f.id"
                  type="button"
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
                  :class="form.feature_ids.includes(f.id) ? 'bg-secondary text-white border-secondary' : 'bg-white text-gray-600 border-gray-300 hover:border-secondary hover:text-secondary'"
                  @click="toggleFeature(f.id)"
                >
                  <i v-if="f.icon" :class="`fa-solid ${f.icon}`"></i>
                  {{ f.name }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 5. Description -->
        <div class="bg-white rounded-lg border border-gray-200">
          <div class="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <div class="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center shrink-0">
              <i class="fa-solid fa-align-left text-gray-600 text-sm"></i>
            </div>
            <h3 class="font-semibold text-gray-900 text-sm">Description</h3>
          </div>
          <div class="p-5 space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Vehicle Description</label>
              <textarea v-model="form.description" rows="5" placeholder="Describe the vehicle's condition, history, special features…" class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none resize-none"></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">YouTube URL <span class="text-gray-400 font-normal">(optional)</span></label>
              <input v-model="form.youtube_url" type="url" placeholder="https://youtube.com/watch?v=..." class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none">
            </div>
          </div>
        </div>

        <!-- 6. Images -->
        <div class="bg-white rounded-lg border border-gray-200">
          <div class="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <div class="w-8 h-8 rounded-md bg-blue-100 flex items-center justify-center shrink-0">
              <i class="fa-solid fa-images text-blue-600 text-sm"></i>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 text-sm">Images</h3>
              <p class="text-xs text-gray-400">
                {{ keepCount }} kept
                <span v-if="deletingImageIds.size"> · <span class="text-red-500">{{ deletingImageIds.size }} marked for deletion</span></span>
                <span v-if="newImageFiles.length"> · {{ newImageFiles.length }} new to upload</span>
              </p>
            </div>
          </div>
          <div class="p-5 space-y-4">
            <!-- Existing images -->
            <div v-if="existingImages.length">
              <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Current Images</p>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div
                  v-for="img in existingImages" :key="img.id"
                  class="relative group rounded-md overflow-hidden aspect-square bg-gray-100 cursor-pointer"
                  :class="deletingImageIds.has(img.id) ? 'opacity-40 ring-2 ring-red-400' : ''"
                >
                  <img :src="storageUrl(img.path)" class="w-full h-full object-cover">
                  <span v-if="img.is_primary && !deletingImageIds.has(img.id)" class="absolute top-1 left-1 text-[10px] bg-primary text-white px-1.5 py-0.5 rounded font-medium">Primary</span>
                  <span v-if="deletingImageIds.has(img.id)" class="absolute inset-0 flex items-center justify-center bg-red-500/20">
                    <i class="fa-solid fa-trash text-red-600 text-xl"></i>
                  </span>
                  <!-- Hover actions -->
                  <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col gap-1 items-center justify-center transition-opacity p-2">
                    <button
                      v-if="!img.is_primary && !deletingImageIds.has(img.id)"
                      type="button"
                      class="text-[10px] bg-white text-gray-800 px-2 py-1 rounded font-medium w-full text-center hover:bg-gray-100"
                      @click.stop="setPrimary(img.id)"
                    >Set Primary</button>
                    <button
                      type="button"
                      class="text-[10px] px-2 py-1 rounded font-medium w-full text-center"
                      :class="deletingImageIds.has(img.id) ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-red-500 text-white hover:bg-red-600'"
                      @click.stop="toggleDeleteExisting(img.id)"
                    >
                      {{ deletingImageIds.has(img.id) ? 'Keep' : 'Remove' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- New images -->
            <div v-if="newImagePreviews.length">
              <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">New Images (to be uploaded)</p>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div v-for="(src, i) in newImagePreviews" :key="i" class="relative group rounded-md overflow-hidden aspect-square bg-gray-100">
                  <img :src="src" class="w-full h-full object-cover">
                  <button type="button" class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity" @click="removeNewImage(i)">
                    <i class="fa-solid fa-trash text-white"></i>
                  </button>
                </div>
              </div>
            </div>

            <!-- Upload area -->
            <label class="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 cursor-pointer hover:border-primary hover:bg-red-50/30 transition-colors">
              <i class="fa-solid fa-cloud-arrow-up text-3xl text-gray-400 mb-3"></i>
              <p class="text-sm text-gray-600 font-medium">Click to add more images</p>
              <p class="text-xs text-gray-400 mt-1">PNG, JPG — up to 10MB each</p>
              <input type="file" multiple accept="image/*" class="hidden" @change="onImagePick">
            </label>
          </div>
        </div>

      </div>

      <!-- Right sidebar -->
      <div class="space-y-4">
        <!-- Pricing -->
        <div class="bg-white rounded-lg border border-gray-200">
          <div class="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <div class="w-8 h-8 rounded-md bg-yellow-100 flex items-center justify-center shrink-0">
              <i class="fa-solid fa-coins text-yellow-600 text-sm"></i>
            </div>
            <h3 class="font-semibold text-gray-900 text-sm">Pricing</h3>
          </div>
          <div class="p-5 space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">CIF Value</label>
              <div class="flex rounded-md border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-primary">
                <span class="px-3 py-2.5 bg-gray-50 border-r border-gray-300 text-xs text-gray-500 flex items-center font-medium">USD</span>
                <input v-model.number="form.cif_usd" type="number" min="0" placeholder="0" class="flex-1 px-3 py-2.5 text-sm border-0 outline-none bg-white [&::-webkit-inner-spin-button]:appearance-none">
              </div>
              <p class="text-xs text-gray-400 mt-1">CIF price paid abroad</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Cost Price <span class="text-xs text-gray-400 font-normal">(internal)</span></label>
              <div class="flex rounded-md border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-primary">
                <span class="px-3 py-2.5 bg-gray-50 border-r border-gray-300 text-xs text-gray-500 flex items-center font-medium">UGX</span>
                <input v-model.number="form.cost_price" type="number" min="0" placeholder="0" class="flex-1 px-3 py-2.5 text-sm border-0 outline-none bg-white [&::-webkit-inner-spin-button]:appearance-none">
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Asking / Selling Price</label>
              <div class="flex rounded-md border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-primary">
                <span class="px-3 py-2.5 bg-gray-50 border-r border-gray-300 text-xs text-gray-500 flex items-center font-medium">UGX</span>
                <input v-model.number="form.selling_price" type="number" min="0" placeholder="0" class="flex-1 px-3 py-2.5 text-sm border-0 outline-none bg-white [&::-webkit-inner-spin-button]:appearance-none">
              </div>
              <p class="text-xs text-gray-400 mt-1">Shown on website listing</p>
            </div>
          </div>
        </div>

        <!-- Status & Publishing -->
        <div class="bg-white rounded-lg border border-gray-200">
          <div class="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <div class="w-8 h-8 rounded-md bg-red-100 flex items-center justify-center shrink-0">
              <i class="fa-solid fa-toggle-on text-primary text-sm"></i>
            </div>
            <h3 class="font-semibold text-gray-900 text-sm">Status & Publishing</h3>
          </div>
          <div class="p-5 space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <select v-model="form.status" class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none">
                <option value="draft">Draft</option>
                <option value="in_transit">In Transit</option>
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
                <option value="sold">Sold</option>
              </select>
            </div>
            <label class="flex items-center justify-between cursor-pointer">
              <div>
                <p class="text-sm font-medium text-gray-700">Publish to Website</p>
                <p class="text-xs text-gray-400">Visible on the public listing</p>
              </div>
              <div class="relative w-10 h-6">
                <input v-model="form.is_published" type="checkbox" class="sr-only">
                <div class="w-10 h-6 rounded-full transition-colors" :class="form.is_published ? 'bg-primary' : 'bg-gray-300'"></div>
                <div class="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform" :class="form.is_published ? 'translate-x-5' : 'translate-x-1'"></div>
              </div>
            </label>
            <p v-if="form.is_published" class="text-xs text-green-600 bg-green-50 border border-green-200 rounded-md p-2">
              <i class="fa-solid fa-circle-check mr-1"></i>
              Vehicle is live on the website.
            </p>
            <p v-else class="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-md p-2">
              <i class="fa-solid fa-eye-slash mr-1"></i>
              Vehicle is hidden from the public listing.
            </p>
          </div>
        </div>

        <!-- Danger zone: delete -->
        <div class="bg-white rounded-lg border border-red-200">
          <div class="px-5 py-4 border-b border-red-100">
            <h3 class="font-semibold text-red-700 text-sm">Danger Zone</h3>
          </div>
          <div class="p-5">
            <p class="text-xs text-gray-500 mb-3">Deleting a vehicle archives it and removes it from the inventory list. This action can be undone by an administrator.</p>
            <NuxtLink :to="`/backoffice/vehicles/${id}`" class="block text-center text-xs text-gray-400 hover:text-gray-600 transition-colors">
              Cancel and go back to vehicle
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
