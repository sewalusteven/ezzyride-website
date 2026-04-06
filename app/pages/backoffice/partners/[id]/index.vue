<script setup lang="ts">
import { Notify } from 'notiflix'
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/vue'
import { createHighlighter } from 'shiki'

definePageMeta({ layout: 'admin-layout' })

const { $api } = useNuxtApp()
const route = useRoute()
const partnerId = route.params.id

// ── Partner state ────────────────────────────────────────────────────────────
const partner = ref<any>(null)
const loading = ref(true)
const saving  = ref(false)
const activeTab = ref(0)

const fetchPartner = async () => {
  loading.value = true
  try {
    const { data } = await $api.get(`/v1/partners/${partnerId}`)
    partner.value = data.data
  } catch {
    Notify.failure('Failed to load partner.')
  } finally {
    loading.value = false
  }
}

// ── Overview ─────────────────────────────────────────────────────────────────
const editForm = ref({ name: '', contact_name: '', contact_email: '', contact_phone: '', notes: '', is_local: true, default_currency: 'UGX' })
const editing  = ref(false)

const startEdit = () => {
  editForm.value = {
    name: partner.value.name ?? '',
    contact_name: partner.value.contactName ?? '',
    contact_email: partner.value.contactEmail ?? '',
    contact_phone: partner.value.contactPhone ?? '',
    notes: partner.value.notes ?? '',
    is_local: partner.value.isLocal ?? true,
    default_currency: partner.value.defaultCurrency ?? 'UGX',
  }
  editing.value = true
}

const saveOverview = async () => {
  saving.value = true
  try {
    await $api.patch(`/v1/partners/${partnerId}`, editForm.value)
    Notify.success('Partner updated.')
    editing.value = false
    fetchPartner()
  } catch (e: any) {
    Notify.failure(e.response?.data?.message ?? 'Failed to update.')
  } finally {
    saving.value = false
  }
}

const toggleActive = async () => {
  try {
    await $api.patch(`/v1/partners/${partnerId}`, { is_active: !partner.value.isActive })
    partner.value.isActive = !partner.value.isActive
    Notify.success(partner.value.isActive ? 'Partner activated.' : 'Partner deactivated.')
  } catch {
    Notify.failure('Failed to update status.')
  }
}

const regenerateKey = async () => {
  if (!confirm('Regenerate API key? The old key will stop working immediately.')) return
  try {
    const { data } = await $api.post(`/v1/partners/${partnerId}/regenerate-key`)
    regeneratedKey.value = data.data.apiKey
    showKeyModal.value = true
    fetchPartner()
  } catch {
    Notify.failure('Failed to regenerate key.')
  }
}

const regeneratedKey = ref('')
const showKeyModal   = ref(false)
const copyKey = () => { navigator.clipboard.writeText(regeneratedKey.value); Notify.success('Copied!') }

// ── Currency rates (for edit dropdown) ───────────────────────────────────────
const currencyRates = ref<{ id: number; currency_code: string; currency_name: string }[]>([])
const fetchCurrencyRates = async () => {
  try {
    const { data } = await $api.get('/v1/currency-rates')
    currencyRates.value = data.data
  } catch { /* ignore */ }
}

// ── Configuration (Payment Terms & Callback) ─────────────────────────────────
const configForm = ref({
  deposit_percentage: null as number | null,
  deposit_notes: '',
  purchase_callback_url: '',
})
const savingConfig = ref(false)
const configLoaded = ref(false)

const initConfig = () => {
  if (!partner.value) return
  configForm.value = {
    deposit_percentage: partner.value.depositPercentage ?? null,
    deposit_notes: partner.value.depositNotes ?? '',
    purchase_callback_url: partner.value.purchaseCallbackUrl ?? '',
  }
  configLoaded.value = true
}

const saveConfig = async () => {
  savingConfig.value = true
  try {
    await $api.patch(`/v1/partners/${partnerId}`, configForm.value)
    Notify.success('Configuration saved.')
    fetchPartner()
  } catch (e: any) {
    Notify.failure(e.response?.data?.message ?? 'Failed to save configuration.')
  } finally {
    savingConfig.value = false
  }
}

// ── Field Mapping ────────────────────────────────────────────────────────────
const mappingOptions = ref<any>(null)
const fieldRows = ref<{ partnerField: string; internalField: string }[]>([])
const savingFields = ref(false)

const fetchMappingOptions = async () => {
  if (mappingOptions.value) return
  try {
    const { data } = await $api.get('/v1/partners/mapping-options')
    mappingOptions.value = data.data
  } catch {
    Notify.failure('Failed to load mapping options.')
  }
}

const initFieldRows = () => {
  const hm = partner.value?.headerMapping ?? {}
  fieldRows.value = Object.entries(hm).map(([k, v]) => ({ partnerField: k, internalField: v as string }))
  if (fieldRows.value.length === 0) fieldRows.value.push({ partnerField: '', internalField: '' })
}

const addFieldRow    = () => fieldRows.value.push({ partnerField: '', internalField: '' })
const removeFieldRow = (i: number) => fieldRows.value.splice(i, 1)

const saveFieldMapping = async () => {
  savingFields.value = true
  try {
    const mapping: Record<string, string> = {}
    for (const row of fieldRows.value) {
      if (row.partnerField.trim() && row.internalField) {
        mapping[row.partnerField.trim()] = row.internalField
      }
    }
    await $api.put(`/v1/partners/${partnerId}/header-mapping`, { header_mapping: mapping })
    Notify.success('Field mapping saved.')
    fetchPartner()
  } catch (e: any) {
    Notify.failure(e.response?.data?.message ?? 'Failed to save.')
  } finally {
    savingFields.value = false
  }
}

// ── Value Mapping ────────────────────────────────────────────────────────────
const enumFields = ['transmission', 'fuel_type', 'drive_type', 'status', 'category'] as const
const valueRows = ref<Record<string, { from: string; to: string }[]>>({})
const savingValues = ref(false)

const enumOptions: Record<string, string[]> = {
  transmission: ['automatic', 'manual', 'cvt'],
  fuel_type: ['petrol', 'diesel', 'hybrid', 'electric'],
  drive_type: ['fwd', 'rwd', 'awd', '4wd'],
  status: ['draft', 'in_transit', 'available', 'reserved', 'sold'],
}

const initValueRows = () => {
  const vm = partner.value?.valueMapping ?? {}
  valueRows.value = {}
  for (const field of enumFields) {
    const entries = vm[field] ?? {}
    valueRows.value[field] = Object.entries(entries).map(([from, to]) => ({ from, to: to as string }))
  }

  // Init feature mapping from existing partner data
  const flm = partner.value?.featureListMapping ?? {}
  featureListMapping.value = {}
  for (const [name, fId] of Object.entries(flm)) {
    featureListMapping.value[name] = fId as number
  }
}

const addValueRow    = (field: string) => { if (!valueRows.value[field]) valueRows.value[field] = []; valueRows.value[field].push({ from: '', to: '' }) }
const removeValueRow = (field: string, i: number) => valueRows.value[field].splice(i, 1)

// ── Brand Detection (wizard-style) ───────────────────────────────────────────
const brandValues = ref<string[]>([])
const brandMapping = ref<Record<string, string>>({}) // raw brand → system brand name
const brandSuggestions = ref<Record<string, { brand_id: number | null; brand_name: string; confidence: 'exact' | 'fuzzy' | 'none' }>>({})
const newBrands = ref<string[]>([])
const detectionBrands = ref<{ id: number; name: string }[]>([])
const brandsDetected = ref(false)

const setBrandMapping = (raw: string, brandName: string) => {
  brandMapping.value[raw] = brandName
  const idx = newBrands.value.indexOf(raw)
  if (idx >= 0) newBrands.value.splice(idx, 1)
}
const toggleNewBrand = (raw: string) => {
  const idx = newBrands.value.indexOf(raw)
  if (idx >= 0) {
    newBrands.value.splice(idx, 1)
  } else {
    newBrands.value.push(raw)
    brandMapping.value[raw] = ''
  }
}

const brandMappedCount = computed(() =>
  brandValues.value.filter(b => brandMapping.value[b] || newBrands.value.includes(b)).length
)

// ── Feature & Attribute Detection (wizard-style) ────────────────────────────
const featureListValues = ref<string[]>([])
const featureListMapping = ref<Record<string, number | null>>({})
const newFeatureListItems = ref<string[]>([])
const newFeatureListCategory = ref<Record<string, string>>({})
const featureDetectionFeatures = ref<{ id: number; name: string; category: string }[]>([])
const featureDetectionAttributes = ref<{ id: number; name: string; type: string; unit: string | null }[]>([])
const detectingFeatures = ref(false)
const featuresDetected = ref(false)
const detectFeaturesPayload = ref('')

// Unmapped fields (extra partner columns)
interface UnmappedField { field: string; sampleValues: string[]; suggestedType: 'feature' | 'attribute'; suggestedFeatureId: number | null; suggestedAttributeId: number | null }
const unmappedFields = ref<UnmappedField[]>([])
const unmappedFieldType = ref<Record<string, 'feature' | 'attribute'>>({})
const unmappedFeatureMapping = ref<Record<string, string>>({})
const unmappedAttributeMapping = ref<Record<string, string>>({})
const newFeatureFields = ref<string[]>([])
const newFeatureFieldCategory = ref<Record<string, string>>({})
const newAttributeFields = ref<string[]>([])
const newAttributeFieldType = ref<Record<string, string>>({})

const featureCategories = ['comfort', 'safety', 'technology', 'exterior', 'performance']
const attributeTypes = ['text', 'number', 'select']

const detectFeatures = async () => {
  let vehicles: any[]
  try {
    vehicles = JSON.parse(detectFeaturesPayload.value)
    if (!Array.isArray(vehicles) || vehicles.length === 0) {
      Notify.failure('Paste a JSON array of sample vehicles.')
      return
    }
  } catch {
    Notify.failure('Invalid JSON. Paste a valid array of vehicle objects.')
    return
  }

  detectingFeatures.value = true
  try {
    const { data } = await $api.post(`/v1/partners/${partnerId}/detect-features`, { vehicles })
    const result = data.data

    featureListValues.value = result.featureListValues ?? []
    featureDetectionFeatures.value = result.features ?? []
    featureDetectionAttributes.value = result.attributes ?? []
    unmappedFields.value = result.unmappedFields ?? []
    detectionBrands.value = result.brands ?? []

    // Brand detection: merge existing mapping then overlay suggestions
    brandValues.value = result.brandValues ?? []
    brandSuggestions.value = result.brandSuggestions ?? {}
    const existingBrandMap = result.existingBrandMapping ?? {}
    brandMapping.value = {}
    newBrands.value = []
    for (const raw of brandValues.value) {
      if (existingBrandMap[raw]) {
        brandMapping.value[raw] = existingBrandMap[raw]
      } else {
        const suggestion = brandSuggestions.value[raw]
        if (suggestion?.confidence === 'exact' || suggestion?.confidence === 'fuzzy') {
          brandMapping.value[raw] = suggestion.brand_name
        } else {
          brandMapping.value[raw] = ''
        }
      }
    }
    brandsDetected.value = brandValues.value.length > 0

    // Merge: existing mapping first, then overlay suggestions
    const existing = result.existingMapping ?? {}
    const suggestions = result.featureSuggestions ?? {}
    featureListMapping.value = {}
    newFeatureListItems.value = []
    newFeatureListCategory.value = {}
    for (const name of featureListValues.value) {
      const key = name.toLowerCase()
      if (existing[key]) {
        featureListMapping.value[name] = existing[key]
      } else if (suggestions[name]) {
        featureListMapping.value[name] = suggestions[name]
      } else {
        featureListMapping.value[name] = null
      }
    }

    // Init unmapped field suggestions
    unmappedFieldType.value = {}
    unmappedFeatureMapping.value = {}
    unmappedAttributeMapping.value = {}
    newFeatureFields.value = []
    newFeatureFieldCategory.value = {}
    newAttributeFields.value = []
    newAttributeFieldType.value = {}
    for (const uf of unmappedFields.value) {
      unmappedFieldType.value[uf.field] = uf.suggestedType
      if (uf.suggestedFeatureId) unmappedFeatureMapping.value[uf.field] = String(uf.suggestedFeatureId)
      if (uf.suggestedAttributeId) unmappedAttributeMapping.value[uf.field] = String(uf.suggestedAttributeId)
    }

    featuresDetected.value = true
  } catch (e: any) {
    Notify.failure(e.response?.data?.message ?? 'Failed to detect features.')
  } finally {
    detectingFeatures.value = false
  }
}

const featureMappedCount = computed(() =>
  featureListValues.value.filter(n => featureListMapping.value[n] || newFeatureListItems.value.includes(n)).length
)

// Feature list item helpers
const setFeatureListMapping = (name: string, featureId: string) => {
  featureListMapping.value[name] = featureId ? Number(featureId) : null
  const idx = newFeatureListItems.value.indexOf(name)
  if (idx >= 0) { newFeatureListItems.value.splice(idx, 1); delete newFeatureListCategory.value[name] }
}
const toggleNewFeatureListItem = (name: string) => {
  const idx = newFeatureListItems.value.indexOf(name)
  if (idx >= 0) {
    newFeatureListItems.value.splice(idx, 1)
    delete newFeatureListCategory.value[name]
  } else {
    newFeatureListItems.value.push(name)
    newFeatureListCategory.value[name] = 'comfort'
    featureListMapping.value[name] = null
  }
}

// Unmapped field helpers
const setUnmappedFieldType = (field: string, type: 'feature' | 'attribute') => {
  unmappedFieldType.value[field] = type
  if (type === 'feature') {
    delete unmappedAttributeMapping.value[field]
    const aIdx = newAttributeFields.value.indexOf(field)
    if (aIdx >= 0) { newAttributeFields.value.splice(aIdx, 1); delete newAttributeFieldType.value[field] }
  } else {
    delete unmappedFeatureMapping.value[field]
    const fIdx = newFeatureFields.value.indexOf(field)
    if (fIdx >= 0) { newFeatureFields.value.splice(fIdx, 1); delete newFeatureFieldCategory.value[field] }
  }
}
const toggleNewFeatureField = (field: string) => {
  const idx = newFeatureFields.value.indexOf(field)
  if (idx >= 0) { newFeatureFields.value.splice(idx, 1); delete newFeatureFieldCategory.value[field] }
  else { newFeatureFields.value.push(field); newFeatureFieldCategory.value[field] = 'comfort'; delete unmappedFeatureMapping.value[field] }
}
const toggleNewAttributeField = (field: string) => {
  const idx = newAttributeFields.value.indexOf(field)
  if (idx >= 0) { newAttributeFields.value.splice(idx, 1); delete newAttributeFieldType.value[field] }
  else { newAttributeFields.value.push(field); newAttributeFieldType.value[field] = 'text'; delete unmappedAttributeMapping.value[field] }
}

const saveValueMapping = async () => {
  savingValues.value = true
  try {
    const vm: Record<string, Record<string, string>> = {}
    for (const field of enumFields) {
      // Skip brand — handled by detection UI
      if (field === 'brand') continue
      const rows = valueRows.value[field] ?? []
      const m: Record<string, string> = {}
      for (const r of rows) {
        if (r.from.trim() && r.to) m[r.from.trim()] = r.to
      }
      if (Object.keys(m).length > 0) vm[field] = m
    }

    // Merge brand mappings from detection (raw → system brand name)
    const brandMap: Record<string, string> = {}
    for (const [raw, mapped] of Object.entries(brandMapping.value)) {
      if (mapped && !newBrands.value.includes(raw)) brandMap[raw] = mapped
    }
    // Also include manual brand rows (from the old rows if any remain)
    for (const r of (valueRows.value['brand'] ?? [])) {
      if (r.from.trim() && r.to) brandMap[r.from.trim()] = r.to
    }
    if (Object.keys(brandMap).length > 0) vm['brand'] = brandMap

    // Feature list mapping (only matched items)
    const flm: Record<string, number> = {}
    for (const [name, fId] of Object.entries(featureListMapping.value)) {
      if (fId) flm[name.toLowerCase()] = fId
    }

    // New feature list items to create
    const newFlItems = newFeatureListItems.value.map(name => ({
      name,
      category: newFeatureListCategory.value[name] || 'comfort',
    }))

    // New features from unmapped fields
    const newFeatures = newFeatureFields.value.map(field => ({
      field,
      name: field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      category: newFeatureFieldCategory.value[field] || 'comfort',
    }))

    // New attributes from unmapped fields
    const newAttributes = newAttributeFields.value.map(field => ({
      field,
      name: field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      type: newAttributeFieldType.value[field] || 'text',
    }))

    // Existing unmapped field → feature/attribute mappings
    const unmappedFieldMapping: Record<string, string> = {}
    for (const [field, fId] of Object.entries(unmappedFeatureMapping.value)) {
      if (fId && !newFeatureFields.value.includes(field)) unmappedFieldMapping[field] = `feature:${fId}`
    }
    for (const [field, aId] of Object.entries(unmappedAttributeMapping.value)) {
      if (aId && !newAttributeFields.value.includes(field)) unmappedFieldMapping[field] = `attribute:${aId}`
    }

    await $api.put(`/v1/partners/${partnerId}/value-mapping`, {
      value_mapping: vm,
      feature_list_mapping: Object.keys(flm).length > 0 ? flm : null,
      new_feature_list_items: newFlItems.length > 0 ? newFlItems : null,
      new_features: newFeatures.length > 0 ? newFeatures : null,
      new_attributes: newAttributes.length > 0 ? newAttributes : null,
      unmapped_field_mapping: Object.keys(unmappedFieldMapping).length > 0 ? unmappedFieldMapping : null,
      new_brands: newBrands.value.length > 0 ? newBrands.value : null,
    })
    Notify.success('Value mapping saved.')
    fetchPartner()
    featuresDetected.value = false
    brandsDetected.value = false
  } catch (e: any) {
    Notify.failure(e.response?.data?.message ?? 'Failed to save.')
  } finally {
    savingValues.value = false
  }
}

// ── Partner Vehicles / Stock ──────────────────────────────────────────────────
interface PartnerVehicle {
  id: number; reference: string; externalReference: string | null; model: string; year: number
  brand: { id: number; name: string } | null
  category: { id: number; name: string } | null
  primaryImage: string | null
  transmission: string; fuelType: string; mileage: number | null
  sellingPrice: string | null; status: string; isPublished: boolean; createdAt: string
}
const partnerVehicles = ref<PartnerVehicle[]>([])
const pvMeta = ref<{ current_page: number; last_page: number; total: number; per_page: number }>({ current_page: 1, last_page: 1, total: 0, per_page: 15 })
const pvLoading = ref(false)
const pvSearch = ref('')
const pvFilterStatus = ref('')
const pvPerPage = ref(15)
const pvSearchTimer = ref<ReturnType<typeof setTimeout> | null>(null)
const pvLoaded = ref(false)

const { storageUrl } = useStorage()
const fmtUGX = (n: any) => n ? new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(Number(n)) : '—'
const fmtNum = (n: any) => n ? Number(n).toLocaleString() : '—'
const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600', in_transit: 'bg-blue-100 text-blue-700',
  available: 'bg-green-100 text-green-700', reserved: 'bg-yellow-100 text-yellow-700',
  sold: 'bg-red-100 text-red-600',
}
const statusLabel: Record<string, string> = {
  draft: 'Draft', in_transit: 'In Transit', available: 'Available', reserved: 'Reserved', sold: 'Sold',
}

const fetchPartnerVehicles = async (page = 1) => {
  pvLoading.value = true
  try {
    const params: Record<string, any> = { page, limit: pvPerPage.value, partner_id: partnerId }
    if (pvSearch.value.trim()) params.search = pvSearch.value.trim()
    if (pvFilterStatus.value) params.status = pvFilterStatus.value
    const { data } = await $api.get('/v1/vehicles', { params })
    partnerVehicles.value = data.data
    pvMeta.value = data.meta
    pvLoaded.value = true
  } finally {
    pvLoading.value = false
  }
}

const onPvSearch = () => {
  if (pvSearchTimer.value) clearTimeout(pvSearchTimer.value)
  pvSearchTimer.value = setTimeout(() => fetchPartnerVehicles(1), 400)
}

watch([pvFilterStatus, pvPerPage], () => fetchPartnerVehicles(1))

const pvPages = computed(() => {
  const total = pvMeta.value.last_page, cur = pvMeta.value.current_page
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const arr: (number | '...')[] = [1]
  if (cur > 3) arr.push('...')
  for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) arr.push(i)
  if (cur < total - 2) arr.push('...')
  arr.push(total)
  return arr
})

// ── Sync Log ─────────────────────────────────────────────────────────────────
const syncs = ref<any[]>([])
const syncMeta = ref<any>({ current_page: 1, last_page: 1 })
const loadingSyncs = ref(false)
const expandedSync = ref<number | null>(null)
const syncDetail   = ref<any>(null)

const fetchSyncs = async (page = 1) => {
  loadingSyncs.value = true
  try {
    const { data } = await $api.get(`/v1/partners/${partnerId}/syncs`, { params: { page } })
    syncs.value    = data.data.data ?? data.data
    syncMeta.value = data.data.meta ?? data.meta ?? syncMeta.value
  } finally {
    loadingSyncs.value = false
  }
}

const viewSyncErrors = async (syncId: number) => {
  if (expandedSync.value === syncId) { expandedSync.value = null; return }
  try {
    const { data } = await $api.get(`/v1/partners/${partnerId}/syncs/${syncId}`)
    syncDetail.value = data.data
    expandedSync.value = syncId
  } catch {
    Notify.failure('Failed to load sync details.')
  }
}

const fmtDate = (s: string) => new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const fieldLabel = (key: string) => key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

// ── Documentation ───────────────────────────────────────────────────────────
const docLang = ref('php')
const docLangs = [
  { id: 'php',    label: 'PHP (Laravel)',        icon: 'fa-brands fa-php' },
  { id: 'java',   label: 'Java (Spring)',         icon: 'fa-brands fa-java' },
  { id: 'node',   label: 'Node.js (Express)',     icon: 'fa-brands fa-node-js' },
  { id: 'python', label: 'Python (Django/Flask)', icon: 'fa-brands fa-python' },
  { id: 'go',     label: 'Golang',                icon: 'fa-solid fa-code' },
]

const apiBase = 'https://api.ezzyride.com'

const docSnippets = computed(() => {
  const keyPlaceholder = partner.value?.apiKeyPrefix ? `${partner.value.apiKeyPrefix}••••••••YOUR_FULL_KEY` : 'YOUR_API_KEY'
  return {
    php: `<?php

namespace App\\Http\\Controllers;

use Illuminate\\Support\\Facades\\Http;

class VehicleSyncController extends Controller
{
    public function sync()
    {
        $apiKey  = '${keyPlaceholder}';
        $baseUrl = '${apiBase}';

        $vehicles = [
            [
                'external_reference' => 'SBT-12345',
                'brand'              => 'Toyota',
                'model'              => 'Land Cruiser',
                'year'               => 2022,
                'transmission'       => 'Automatic',
                'fuel_type'          => 'Diesel',
                'mileage'            => 45000,
                'engine_cc'          => 2800,
                'selling_price'      => 85000000,
                'status'             => 'In Stock',
                'features'           => 'Sunroof|Leather Seats|Navigation',
                'images'             => [
                    'https://img.example.com/vehicles/SBT-12345/front.jpg',
                    'https://img.example.com/vehicles/SBT-12345/interior.jpg',
                ],
                'videoUrl'           => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            ],
            // ... more vehicles
        ];

        $response = Http::withHeaders([
            'X-Api-Key'    => $apiKey,
            'Content-Type' => 'application/json',
            'Accept'       => 'application/json',
        ])->post("{$baseUrl}/partner-api/v1/sync", [
            'vehicles' => $vehicles,
        ]);

        if ($response->successful()) {
            $result = $response->json('data');
            logger()->info('Sync complete', [
                'imported' => $result['imported_count'],
                'failed'   => $result['failed_count'],
            ]);
        } else {
            logger()->error('Sync failed', [
                'status' => $response->status(),
                'body'   => $response->body(),
            ]);
        }

        return $response->json();
    }
}`,
    java: `package com.example.sync;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.*;

@Service
public class VehicleSyncService {

    private final String apiKey = "${keyPlaceholder}";
    private final String baseUrl = "${apiBase}";
    private final RestTemplate rest = new RestTemplate();

    public Map<String, Object> syncVehicles() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Api-Key", apiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        List<Map<String, Object>> vehicles = new ArrayList<>();
        vehicles.add(Map.of(
            "external_reference", "SBT-12345",
            "brand",              "Toyota",
            "model",              "Land Cruiser",
            "year",               2022,
            "transmission",       "Automatic",
            "fuel_type",          "Diesel",
            "mileage",            45000,
            "engine_cc",          2800,
            "selling_price",      85000000,
            "status",             "In Stock",
            "features",           "Sunroof|Leather Seats|Navigation",
            "images",             List.of("https://img.example.com/vehicles/SBT-12345/front.jpg", "https://img.example.com/vehicles/SBT-12345/interior.jpg"),
            "videoUrl",           "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        ));

        Map<String, Object> body = Map.of("vehicles", vehicles);

        HttpEntity<Map<String, Object>> entity =
            new HttpEntity<>(body, headers);

        ResponseEntity<Map> response = rest.exchange(
            baseUrl + "/partner-api/v1/sync",
            HttpMethod.POST,
            entity,
            Map.class
        );

        System.out.println("Status: " + response.getStatusCode());
        return response.getBody();
    }
}`,
    node: `const axios = require('axios');

const API_KEY  = '${keyPlaceholder}';
const BASE_URL = '${apiBase}';

async function syncVehicles() {
  const vehicles = [
    {
      external_reference: 'SBT-12345',
      brand:              'Toyota',
      model:              'Land Cruiser',
      year:               2022,
      transmission:       'Automatic',
      fuel_type:          'Diesel',
      mileage:            45000,
      engine_cc:          2800,
      selling_price:      85000000,
      status:             'In Stock',
      features:           'Sunroof|Leather Seats|Navigation',
      images:             ['https://img.example.com/vehicles/SBT-12345/front.jpg', 'https://img.example.com/vehicles/SBT-12345/interior.jpg'],
      videoUrl:           'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    },
    // ... more vehicles
  ];

  try {
    const { data } = await axios.post(
      \`\${BASE_URL}/partner-api/v1/sync\`,
      { vehicles },
      {
        headers: {
          'X-Api-Key':    API_KEY,
          'Content-Type': 'application/json',
          'Accept':       'application/json',
        },
      }
    );

    console.log('Imported:', data.data.imported_count);
    console.log('Failed:',   data.data.failed_count);
    return data;
  } catch (err) {
    console.error('Sync error:', err.response?.data || err.message);
    throw err;
  }
}

module.exports = { syncVehicles };`,
    python: `import os
import requests

API_KEY  = "${keyPlaceholder}"
BASE_URL = "${apiBase}"

def sync_vehicles():
    vehicles = [
        {
            "external_reference": "SBT-12345",
            "brand":              "Toyota",
            "model":              "Land Cruiser",
            "year":               2022,
            "transmission":       "Automatic",
            "fuel_type":          "Diesel",
            "mileage":            45000,
            "engine_cc":          2800,
            "selling_price":      85000000,
            "status":             "In Stock",
            "features":           "Sunroof|Leather Seats|Navigation",
            "images":             ["https://img.example.com/vehicles/SBT-12345/front.jpg", "https://img.example.com/vehicles/SBT-12345/interior.jpg"],
            "videoUrl":           "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        },
        # ... more vehicles
    ]

    response = requests.post(
        f"{BASE_URL}/partner-api/v1/sync",
        json={"vehicles": vehicles},
        headers={
            "X-Api-Key":    API_KEY,
            "Content-Type": "application/json",
            "Accept":       "application/json",
        },
    )

    if response.ok:
        result = response.json()["data"]
        print(f"Imported: {result['imported_count']}")
        print(f"Failed:   {result['failed_count']}")
    else:
        print(f"Error {response.status_code}: {response.text}")

    return response.json()`,
    go: `package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

const baseURL = "${apiBase}"

type Vehicle struct {
	ExternalReference string \`json:"external_reference"\`
	Brand             string \`json:"brand"\`
	Model             string \`json:"model"\`
	Year              int    \`json:"year"\`
	Transmission      string \`json:"transmission"\`
	FuelType          string \`json:"fuel_type"\`
	Mileage           int    \`json:"mileage"\`
	EngineCC          int    \`json:"engine_cc"\`
	SellingPrice      int    \`json:"selling_price"\`
	Status            string \`json:"status"\`
	Features          string \`json:"features"\`
}

func syncVehicles() error {
	apiKey := "${keyPlaceholder}"

	vehicles := []Vehicle{
		{
			ExternalReference: "SBT-12345",
			Brand:             "Toyota",
			Model:             "Land Cruiser",
			Year:              2022,
			Transmission:      "Automatic",
			FuelType:          "Diesel",
			Mileage:           45000,
			EngineCC:          2800,
			SellingPrice:      85000000,
			Status:            "In Stock",
			Features:          "Sunroof|Leather Seats|Navigation",
			Images:            []string{"https://img.example.com/vehicles/SBT-12345/front.jpg", "https://img.example.com/vehicles/SBT-12345/interior.jpg"},
			VideoUrl:          "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
		},
	}

	payload := map[string]interface{}{"vehicles": vehicles}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", baseURL+"/partner-api/v1/sync", bytes.NewReader(body))
	req.Header.Set("X-Api-Key", apiKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	fmt.Printf("Status: %d\\nBody: %s\\n", resp.StatusCode, string(respBody))
	return nil
}`,
  }
})

// ── Syntax highlighting for doc snippets ─────────────────────────────────────
const highlightedDocSnippets = ref<Record<string, string>>({})
const docHighlighterReady = ref(false)

const shikiLangMap: Record<string, string> = {
  php: 'php', java: 'java', node: 'javascript', python: 'python', go: 'go',
}

const initDocHighlighter = async () => {
  if (docHighlighterReady.value) return
  const highlighter = await createHighlighter({
    themes: ['github-dark'],
    langs: ['php', 'java', 'javascript', 'python', 'go'],
  })
  const snips = docSnippets.value
  for (const langId of Object.keys(snips)) {
    highlightedDocSnippets.value[langId] = highlighter.codeToHtml(snips[langId], {
      lang: shikiLangMap[langId] ?? 'text',
      theme: 'github-dark',
    })
  }
  docHighlighterReady.value = true
}

// ── Tab change handler ───────────────────────────────────────────────────────
watch(activeTab, (tab) => {
  if (tab === 1) { fetchMappingOptions(); initFieldRows() }
  if (tab === 2) { fetchMappingOptions(); initValueRows() }
  if (tab === 3 && !configLoaded.value) initConfig()
  if (tab === 4 && !pvLoaded.value) fetchPartnerVehicles()
  if (tab === 5) fetchSyncs()
  if (tab === 6) initDocHighlighter()
})

onMounted(() => { fetchPartner(); fetchCurrencyRates() })
</script>

<template>
  <div class="p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <NuxtLink to="/backoffice/partners" class="text-gray-400 hover:text-gray-600">
          <i class="fa-solid fa-arrow-left"></i>
        </NuxtLink>
        <div v-if="partner">
          <h1 class="text-xl font-bold text-gray-900">{{ partner.name }}</h1>
          <p class="text-sm text-gray-500 mt-0.5">{{ partner.vehiclesCount }} vehicles synced</p>
        </div>
      </div>
    </div>

    <div v-if="loading" class="py-16 text-center text-gray-400">
      <i class="fa-solid fa-spinner fa-spin text-2xl mb-2 block"></i>
    </div>

    <template v-else-if="partner">
      <div class="p-2 bg-white rounded shadow">
        <TabGroup :selectedIndex="activeTab" @change="(i: number) => activeTab = i">
          <TabList class="flex gap-1 border-b border-gray-200 mb-6">
            <Tab v-for="t in ['Overview', 'Field Mapping', 'Value Mapping', 'Configuration', 'Vehicles', 'Sync Log', 'Documentation']" :key="t" as="template" v-slot="{ selected }">
              <button class="cursor-pointer px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px"
                      :class="selected ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'">
                {{ t }}
              </button>
            </Tab>
          </TabList>

          <TabPanels>
            <!-- ══ Overview ══════════════════════════════════════════════════════ -->
            <TabPanel>
              <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <!-- Info card -->
                <div class="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6">
                  <div class="flex items-center justify-between mb-4">
                    <h3 class="font-semibold text-gray-900">Partner Details</h3>
                    <button v-if="!editing" @click="startEdit" class="text-xs text-primary hover:text-red-700 font-medium flex items-center gap-1">
                      <i class="fa-solid fa-pen text-[10px]"></i> Edit
                    </button>
                  </div>
                  <template v-if="!editing">
                    <dl class="space-y-3 text-sm">
                      <div class="flex"><dt class="w-32 text-gray-500 shrink-0">Name</dt><dd class="text-gray-800 font-medium">{{ partner.name }}</dd></div>
                      <div class="flex"><dt class="w-32 text-gray-500 shrink-0">Type</dt>
                        <dd>
                          <span class="text-xs font-medium px-2 py-0.5 rounded-full"
                            :class="partner.isLocal ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'">
                            {{ partner.isLocal ? 'Local' : 'International' }}
                          </span>
                          <span v-if="!partner.isLocal" class="text-xs text-gray-500 ml-1">{{ partner.defaultCurrency }}</span>
                        </dd>
                      </div>
                      <div class="flex"><dt class="w-32 text-gray-500 shrink-0">Contact</dt><dd class="text-gray-800">{{ partner.contactName || '—' }}</dd></div>
                      <div class="flex"><dt class="w-32 text-gray-500 shrink-0">Email</dt><dd class="text-gray-800">{{ partner.contactEmail || '—' }}</dd></div>
                      <div class="flex"><dt class="w-32 text-gray-500 shrink-0">Phone</dt><dd class="text-gray-800">{{ partner.contactPhone || '—' }}</dd></div>
                      <div class="flex"><dt class="w-32 text-gray-500 shrink-0">Notes</dt><dd class="text-gray-600 whitespace-pre-wrap">{{ partner.notes || '—' }}</dd></div>
                    </dl>
                  </template>
                  <template v-else>
                    <div class="space-y-3">
                      <div><label class="text-xs font-medium text-gray-600">Name</label><input v-model="editForm.name" class="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
                      <div>
                        <label class="text-xs font-medium text-gray-600 mb-1.5 block">Partner Type</label>
                        <div class="flex gap-4">
                          <label class="flex items-center gap-2 cursor-pointer"><input type="radio" :value="true" v-model="editForm.is_local" class="text-primary focus:ring-primary" /><span class="text-sm text-gray-700">Local (UGX)</span></label>
                          <label class="flex items-center gap-2 cursor-pointer"><input type="radio" :value="false" v-model="editForm.is_local" class="text-primary focus:ring-primary" /><span class="text-sm text-gray-700">International</span></label>
                        </div>
                      </div>
                      <div v-if="!editForm.is_local">
                        <label class="text-xs font-medium text-gray-600">Default Currency</label>
                        <select v-model="editForm.default_currency" class="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                          <option v-for="r in currencyRates" :key="r.currency_code" :value="r.currency_code">{{ r.currency_code }} — {{ r.currency_name }}</option>
                        </select>
                        <p v-if="currencyRates.length === 0" class="text-xs text-amber-600 mt-1">No currencies configured. Add them in Settings &rarr; Currency Rates.</p>
                      </div>
                      <div><label class="text-xs font-medium text-gray-600">Contact Person</label><input v-model="editForm.contact_name" class="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
                      <div class="grid grid-cols-2 gap-3">
                        <div><label class="text-xs font-medium text-gray-600">Email</label><input v-model="editForm.contact_email" type="email" class="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
                        <div><label class="text-xs font-medium text-gray-600">Phone</label><input v-model="editForm.contact_phone" class="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
                      </div>
                      <div><label class="text-xs font-medium text-gray-600">Notes</label><textarea v-model="editForm.notes" rows="3" class="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"></textarea></div>
                      <div class="flex justify-end gap-2">
                        <button @click="editing = false" class="text-sm text-gray-500 hover:text-gray-700 px-3 py-2">Cancel</button>
                        <button @click="saveOverview" :disabled="saving" class="bg-primary hover:bg-red-700 disabled:opacity-60 text-white font-medium py-2 px-4 rounded-lg text-sm">Save</button>
                      </div>
                    </div>
                  </template>
                </div>

                <!-- Sidebar cards -->
                <div class="space-y-4">
                  <!-- Status -->
                  <div class="bg-white border border-gray-200 rounded-xl p-5">
                    <h4 class="text-xs font-semibold text-gray-500 uppercase mb-3">Status</h4>
                    <div class="flex items-center justify-between">
                    <span class="text-sm font-medium" :class="partner.isActive ? 'text-green-700' : 'text-gray-500'">
                      {{ partner.isActive ? 'Active' : 'Inactive' }}
                    </span>
                      <button @click="toggleActive" class="text-xs px-3 py-1 rounded-md border transition-colors"
                              :class="partner.isActive ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'">
                        {{ partner.isActive ? 'Deactivate' : 'Activate' }}
                      </button>
                    </div>
                  </div>

                  <!-- API Key -->
                  <div class="bg-white border border-gray-200 rounded-xl p-5">
                    <h4 class="text-xs font-semibold text-gray-500 uppercase mb-3">API Key</h4>
                    <div class="flex items-center gap-2 mb-3">
                      <code class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{{ partner.apiKeyPrefix }}••••••••••••</code>
                    </div>
                    <button @click="regenerateKey" class="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1">
                      <i class="fa-solid fa-rotate text-[10px]"></i> Regenerate Key
                    </button>
                  </div>

                  <!-- Stats -->
                  <div class="bg-white border border-gray-200 rounded-xl p-5">
                    <h4 class="text-xs font-semibold text-gray-500 uppercase mb-3">Stats</h4>
                    <dl class="space-y-2 text-sm">
                      <div class="flex justify-between"><dt class="text-gray-500">Vehicles</dt><dd class="font-medium text-gray-800">{{ partner.vehiclesCount }}</dd></div>
                      <div class="flex justify-between"><dt class="text-gray-500">Total Syncs</dt><dd class="font-medium text-gray-800">{{ partner.syncsCount }}</dd></div>
                      <div class="flex justify-between"><dt class="text-gray-500">Created</dt><dd class="text-gray-600 text-xs">{{ fmtDate(partner.createdAt) }}</dd></div>
                    </dl>
                  </div>
                </div>
              </div>
            </TabPanel>

            <!-- ══ Field Mapping ═════════════════════════════════════════════════ -->
            <TabPanel>
              <div class="bg-white border border-gray-200 rounded-xl p-6">
                <div class="flex items-center justify-between mb-4">
                  <div>
                    <h3 class="font-semibold text-gray-900">Field Mapping</h3>
                    <p class="text-xs text-gray-500 mt-0.5">Map the partner's field names to your internal field names.</p>
                  </div>
                </div>

                <div class="space-y-2 mb-4">
                  <div class="flex items-center gap-3 text-xs font-medium text-gray-500 uppercase px-1">
                    <span class="flex-1">Partner Field Name</span>
                    <span class="w-8"></span>
                    <span class="flex-1">Maps To</span>
                    <span class="w-8"></span>
                  </div>
                  <div v-for="(row, i) in fieldRows" :key="i" class="flex items-center gap-3">
                    <input v-model="row.partnerField" type="text" placeholder="e.g. maker"
                           class="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono" />
                    <i class="fa-solid fa-arrow-right text-gray-300 text-xs w-4 text-center shrink-0"></i>
                    <select v-model="row.internalField"
                            class="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                      <option value="">— Select —</option>
                      <option v-for="(label, field) in (mappingOptions?.targetFields ?? {})" :key="field" :value="field">{{ label }}</option>
                    </select>
                    <button @click="removeFieldRow(i)" class="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md shrink-0">
                      <i class="fa-solid fa-trash text-xs"></i>
                    </button>
                  </div>
                </div>

                <div class="flex items-center justify-between">
                  <button @click="addFieldRow" class="text-xs text-primary hover:text-red-700 font-medium flex items-center gap-1">
                    <i class="fa-solid fa-plus text-[10px]"></i> Add Row
                  </button>
                  <button @click="saveFieldMapping" :disabled="savingFields"
                          class="bg-primary hover:bg-red-700 disabled:opacity-60 text-white font-medium py-2 px-5 rounded-lg text-sm flex items-center gap-2">
                    <i v-if="savingFields" class="fa-solid fa-spinner fa-spin"></i>
                    Save Field Mapping
                  </button>
                </div>
              </div>
            </TabPanel>

            <!-- ══ Value Mapping ═════════════════════════════════════════════════ -->
            <TabPanel>
              <div class="space-y-5">
                <!-- Enum fields -->
                <div v-for="field in enumFields" :key="field" class="bg-white border border-gray-200 rounded-xl p-6">
                  <div class="flex items-center justify-between mb-3">
                    <h3 class="font-semibold text-gray-900 text-sm">{{ fieldLabel(field) }}</h3>
                    <button @click="addValueRow(field)" class="text-xs text-primary hover:text-red-700 font-medium flex items-center gap-1">
                      <i class="fa-solid fa-plus text-[10px]"></i> Add
                    </button>
                  </div>
                  <div v-if="!valueRows[field]?.length" class="text-xs text-gray-400 py-2">No mappings configured.</div>
                  <div v-else class="space-y-2">
                    <div v-for="(row, i) in valueRows[field]" :key="i" class="flex items-center gap-3">
                      <input v-model="row.from" type="text" placeholder="Partner's value"
                             class="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono" />
                      <i class="fa-solid fa-arrow-right text-gray-300 text-xs shrink-0"></i>
                      <template v-if="field === 'category'">
                        <select v-model="row.to" class="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                          <option value="">— Select —</option>
                          <option v-for="c in (mappingOptions?.categories ?? [])" :key="c.id" :value="c.name">{{ c.name }}</option>
                        </select>
                      </template>
                      <template v-else>
                        <select v-model="row.to" class="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                          <option value="">— Select —</option>
                          <option v-for="opt in (enumOptions[field] ?? [])" :key="opt" :value="opt">{{ fieldLabel(opt) }}</option>
                        </select>
                      </template>
                      <button @click="removeValueRow(field, i)" class="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md shrink-0">
                        <i class="fa-solid fa-trash text-xs"></i>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- ── Brand, Feature & Attribute Detection ────────────────────── -->
                <div class="bg-white border border-gray-200 rounded-xl p-6">
                  <div class="mb-3">
                    <h3 class="font-semibold text-gray-900 text-sm">
                      <i class="fa-solid fa-wand-magic-sparkles text-primary mr-1.5"></i>
                      Brand, Feature &amp; Attribute Detection
                    </h3>
                    <p class="text-xs text-gray-500 mt-0.5">
                      Paste a sample JSON array of the partner's vehicles to auto-detect brands, features, attributes, and unmapped fields.
                    </p>
                  </div>

                  <!-- Existing mapping summary -->
                  <div v-if="!featuresDetected && Object.keys(featureListMapping).length > 0" class="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p class="text-xs text-green-700 font-medium mb-1">{{ Object.keys(featureListMapping).length }} feature mappings currently configured.</p>
                    <p class="text-xs text-green-600">Run detection again with sample data to review or update them.</p>
                  </div>

                  <!-- Paste sample data -->
                  <div v-if="!featuresDetected" class="space-y-3">
                    <textarea
                      v-model="detectFeaturesPayload"
                      rows="5"
                      placeholder='[{"stock_no": "AP-001", "equipment": "AC|Sunroof|ABS", ...}, ...]'
                      class="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 bg-gray-50"
                    ></textarea>
                    <button @click="detectFeatures" :disabled="detectingFeatures || !detectFeaturesPayload.trim()"
                            class="bg-secondary hover:bg-gray-800 disabled:opacity-40 text-white font-medium py-2 px-4 rounded-lg text-sm flex items-center gap-2">
                      <i :class="detectingFeatures ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-magnifying-glass'" class="text-xs"></i>
                      Detect Brands, Features &amp; Attributes
                    </button>
                  </div>

                  <template v-if="featuresDetected">
                    <div class="flex items-center justify-end mb-4">
                      <button @click="featuresDetected = false; brandsDetected = false" class="text-xs text-gray-500 hover:text-gray-700 font-medium">
                        <i class="fa-solid fa-rotate-left text-[10px] mr-1"></i> Re-detect
                      </button>
                    </div>

                    <!-- ── Brand Matching ─────────────────────────────────────── -->
                    <div v-if="brandsDetected && brandValues.length" class="mb-5">
                      <h4 class="font-semibold text-gray-900 text-sm mb-1">
                        <i class="fa-solid fa-car text-primary mr-1.5"></i>
                        Brand Matching
                      </h4>
                      <p class="text-xs text-gray-500 mb-3">
                        Found <strong>{{ brandValues.length }}</strong> distinct brands.
                        <span class="text-green-600">{{ brandMappedCount }} mapped</span>.
                        Match them to existing brands or create new ones.
                      </p>
                      <div class="space-y-2 max-h-[24rem] overflow-y-auto">
                        <div v-for="raw in brandValues" :key="raw"
                          class="flex items-center gap-3 p-3 rounded-lg border"
                          :class="newBrands.includes(raw) ? 'border-green-200 bg-green-50' :
                            brandSuggestions[raw]?.confidence === 'exact' ? 'border-gray-100 bg-gray-50' :
                            brandSuggestions[raw]?.confidence === 'fuzzy' ? 'border-yellow-200 bg-yellow-50' :
                            brandMapping[raw] ? 'border-green-100 bg-green-50' : 'border-red-200 bg-red-50'"
                        >
                          <span class="text-sm font-medium text-gray-800 w-40 shrink-0 truncate font-mono" :title="raw">{{ raw }}</span>
                          <i class="fa-solid text-xs shrink-0"
                            :class="newBrands.includes(raw) ? 'fa-plus text-green-500' :
                              brandSuggestions[raw]?.confidence === 'exact' ? 'fa-check text-green-500' :
                              brandSuggestions[raw]?.confidence === 'fuzzy' ? 'fa-question text-yellow-500' :
                              brandMapping[raw] ? 'fa-check text-green-500' : 'fa-times text-red-500'"
                          ></i>

                          <!-- Select existing brand -->
                          <select
                            v-if="!newBrands.includes(raw)"
                            :value="brandMapping[raw] ?? ''"
                            @change="setBrandMapping(raw, ($event.target as HTMLSelectElement).value)"
                            class="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                          >
                            <option value="">— Select brand —</option>
                            <option v-for="b in detectionBrands" :key="b.id" :value="b.name">{{ b.name }}</option>
                          </select>
                          <!-- Creating as new -->
                          <span v-else class="flex-1 text-sm text-green-700 font-medium">Will create "{{ raw }}"</span>

                          <button
                            @click="toggleNewBrand(raw)"
                            class="text-xs px-2.5 py-1 rounded-md shrink-0 transition-colors"
                            :class="newBrands.includes(raw) ? 'bg-gray-200 text-gray-600 hover:bg-gray-300' : 'bg-green-100 text-green-700 hover:bg-green-200'"
                          >
                            {{ newBrands.includes(raw) ? 'Cancel' : '+ New' }}
                          </button>
                        </div>
                      </div>
                    </div>

                    <!-- ── Features from list column ─────────────────────────── -->
                    <div v-if="featureListValues.length" class="mb-5">
                      <h4 class="font-semibold text-gray-900 text-sm mb-1">
                        <i class="fa-solid fa-list text-primary mr-1.5"></i>
                        Features from List Column
                      </h4>
                      <p class="text-xs text-gray-500 mb-3">
                        Found <strong>{{ featureListValues.length }}</strong> unique feature names.
                        <span class="text-green-600">{{ featureMappedCount }} mapped</span>.
                        Match them to existing features or create new ones.
                      </p>
                      <div class="space-y-2 max-h-[24rem] overflow-y-auto">
                        <div v-for="name in featureListValues" :key="name"
                          class="flex items-center gap-3 p-3 rounded-lg border"
                          :class="newFeatureListItems.includes(name) ? 'border-green-200 bg-green-50' :
                            featureListMapping[name] ? 'border-green-100 bg-green-50' : 'border-gray-100 bg-gray-50'"
                        >
                          <span class="text-sm font-medium text-gray-800 w-40 shrink-0 truncate font-mono" :title="name">{{ name }}</span>
                          <i class="fa-solid text-xs shrink-0"
                            :class="newFeatureListItems.includes(name) ? 'fa-plus text-green-500' :
                              featureListMapping[name] ? 'fa-check text-green-500' : 'fa-minus text-gray-300'"
                          ></i>

                          <!-- Match to existing -->
                          <select
                            v-if="!newFeatureListItems.includes(name)"
                            :value="featureListMapping[name] ? String(featureListMapping[name]) : ''"
                            @change="setFeatureListMapping(name, ($event.target as HTMLSelectElement).value)"
                            class="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300/30"
                          >
                            <option value="">— Skip —</option>
                            <option v-for="f in featureDetectionFeatures" :key="f.id" :value="String(f.id)">
                              {{ f.name }} ({{ f.category }})
                            </option>
                          </select>

                          <!-- Creating as new -->
                          <template v-else>
                            <span class="text-sm text-green-700 font-medium shrink-0">Create as</span>
                            <select
                              v-model="newFeatureListCategory[name]"
                              class="border border-green-200 bg-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300/30"
                            >
                              <option v-for="cat in featureCategories" :key="cat" :value="cat">
                                {{ cat.charAt(0).toUpperCase() + cat.slice(1) }}
                              </option>
                            </select>
                          </template>

                          <button
                            @click="toggleNewFeatureListItem(name)"
                            class="text-xs px-2.5 py-1 rounded-md shrink-0 transition-colors"
                            :class="newFeatureListItems.includes(name) ? 'bg-gray-200 text-gray-600 hover:bg-gray-300' : 'bg-green-100 text-green-700 hover:bg-green-200'"
                          >
                            {{ newFeatureListItems.includes(name) ? 'Cancel' : '+ New' }}
                          </button>
                        </div>
                      </div>
                    </div>

                    <!-- ── Unmapped fields → features or attributes ──────────── -->
                    <div v-if="unmappedFields.length">
                      <h4 class="font-semibold text-gray-900 text-sm mb-1">
                        <i class="fa-solid fa-tags text-primary mr-1.5"></i>
                        Unmapped Fields
                      </h4>
                      <p class="text-xs text-gray-500 mb-3">
                        These {{ unmappedFields.length }} fields from the partner's data are not mapped. Assign them as <strong>attributes</strong> (values like "5", "Leather") or <strong>features</strong> (Yes/No toggles).
                      </p>
                      <div class="space-y-3 max-h-[24rem] overflow-y-auto">
                        <div v-for="uf in unmappedFields" :key="uf.field"
                          class="p-3 rounded-lg border"
                          :class="(newFeatureFields.includes(uf.field) || newAttributeFields.includes(uf.field)) ? 'border-green-200 bg-green-50' :
                            (unmappedFeatureMapping[uf.field] || unmappedAttributeMapping[uf.field]) ? 'border-green-100 bg-green-50' : 'border-gray-100 bg-gray-50'"
                        >
                          <div class="flex items-center gap-3">
                            <!-- Field info -->
                            <div class="w-36 shrink-0">
                              <span class="text-sm font-medium text-gray-800 block truncate font-mono" :title="uf.field">{{ uf.field }}</span>
                              <span class="text-[10px] text-gray-400 font-mono block truncate">{{ uf.sampleValues.join(', ') || '—' }}</span>
                            </div>

                            <!-- Type toggle -->
                            <div class="flex rounded-md border border-gray-200 overflow-hidden shrink-0">
                              <button
                                @click="setUnmappedFieldType(uf.field, 'attribute')"
                                class="px-2.5 py-1 text-xs font-medium transition-colors"
                                :class="unmappedFieldType[uf.field] === 'attribute' ? 'bg-blue-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'"
                              >Attribute</button>
                              <button
                                @click="setUnmappedFieldType(uf.field, 'feature')"
                                class="px-2.5 py-1 text-xs font-medium transition-colors border-l border-gray-200"
                                :class="unmappedFieldType[uf.field] === 'feature' ? 'bg-purple-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'"
                              >Feature</button>
                            </div>

                            <i class="fa-solid text-xs shrink-0"
                              :class="(newFeatureFields.includes(uf.field) || newAttributeFields.includes(uf.field)) ? 'fa-plus text-green-500' :
                                (unmappedFeatureMapping[uf.field] || unmappedAttributeMapping[uf.field]) ? 'fa-check text-green-500' : 'fa-minus text-gray-300'"
                            ></i>

                            <!-- ── Attribute mode ── -->
                            <template v-if="unmappedFieldType[uf.field] === 'attribute'">
                              <select
                                v-if="!newAttributeFields.includes(uf.field)"
                                :value="unmappedAttributeMapping[uf.field] ?? ''"
                                @change="unmappedAttributeMapping[uf.field] = ($event.target as HTMLSelectElement).value"
                                class="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300/30"
                              >
                                <option value="">— Skip —</option>
                                <option v-for="a in featureDetectionAttributes" :key="a.id" :value="String(a.id)">
                                  {{ a.name }}{{ a.unit ? ` (${a.unit})` : '' }}
                                </option>
                              </select>
                              <template v-else>
                                <span class="text-sm text-green-700 font-medium shrink-0">Create as</span>
                                <select v-model="newAttributeFieldType[uf.field]"
                                  class="border border-green-200 bg-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300/30">
                                  <option v-for="t in attributeTypes" :key="t" :value="t">{{ t.charAt(0).toUpperCase() + t.slice(1) }}</option>
                                </select>
                              </template>
                              <button @click="toggleNewAttributeField(uf.field)"
                                class="text-xs px-2.5 py-1 rounded-md shrink-0 transition-colors"
                                :class="newAttributeFields.includes(uf.field) ? 'bg-gray-200 text-gray-600 hover:bg-gray-300' : 'bg-green-100 text-green-700 hover:bg-green-200'">
                                {{ newAttributeFields.includes(uf.field) ? 'Cancel' : '+ New' }}
                              </button>
                            </template>

                            <!-- ── Feature mode ── -->
                            <template v-else>
                              <select
                                v-if="!newFeatureFields.includes(uf.field)"
                                :value="unmappedFeatureMapping[uf.field] ?? ''"
                                @change="unmappedFeatureMapping[uf.field] = ($event.target as HTMLSelectElement).value"
                                class="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300/30"
                              >
                                <option value="">— Skip —</option>
                                <option v-for="f in featureDetectionFeatures" :key="f.id" :value="String(f.id)">
                                  {{ f.name }} ({{ f.category }})
                                </option>
                              </select>
                              <template v-else>
                                <span class="text-sm text-green-700 font-medium shrink-0">Create as</span>
                                <select v-model="newFeatureFieldCategory[uf.field]"
                                  class="border border-green-200 bg-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300/30">
                                  <option v-for="cat in featureCategories" :key="cat" :value="cat">{{ cat.charAt(0).toUpperCase() + cat.slice(1) }}</option>
                                </select>
                              </template>
                              <button @click="toggleNewFeatureField(uf.field)"
                                class="text-xs px-2.5 py-1 rounded-md shrink-0 transition-colors"
                                :class="newFeatureFields.includes(uf.field) ? 'bg-gray-200 text-gray-600 hover:bg-gray-300' : 'bg-green-100 text-green-700 hover:bg-green-200'">
                                {{ newFeatureFields.includes(uf.field) ? 'Cancel' : '+ New' }}
                              </button>
                            </template>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- No extra data message -->
                    <div v-if="!brandValues.length && !featureListValues.length && !unmappedFields.length" class="text-center py-6">
                      <i class="fa-solid fa-check-circle text-green-500 text-2xl mb-2"></i>
                      <p class="text-sm text-gray-600">No brand mismatches, features, or unmapped fields detected in the sample data.</p>
                    </div>
                  </template>
                </div>

                <div class="flex justify-end">
                  <button @click="saveValueMapping" :disabled="savingValues"
                          class="bg-primary hover:bg-red-700 disabled:opacity-60 text-white font-medium py-2.5 px-6 rounded-lg text-sm flex items-center gap-2">
                    <i v-if="savingValues" class="fa-solid fa-spinner fa-spin"></i>
                    Save Value Mappings
                  </button>
                </div>
              </div>
            </TabPanel>

            <!-- ══ Configuration ════════════════════════════════════════════════ -->
            <TabPanel>
              <div class="space-y-5">
                <!-- Payment Terms -->
                <div class="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 class="font-semibold text-gray-900 mb-1">
                    <i class="fa-solid fa-hand-holding-dollar text-primary mr-1.5"></i>
                    Payment Terms
                  </h3>
                  <p class="text-xs text-gray-500 mb-4">Configure the CIF deposit percentage this partner accepts. This is shown to potential buyers as the initial deposit amount.</p>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-xs font-medium text-gray-600 mb-1">Deposit Percentage (% of CIF)</label>
                      <div class="flex items-center gap-2">
                        <input v-model.number="configForm.deposit_percentage" type="number" min="0" max="100" placeholder="e.g. 40"
                               class="w-32 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        <span class="text-sm text-gray-500">%</span>
                      </div>
                      <p class="text-[11px] text-gray-400 mt-1">The percentage of the CIF price required as initial deposit to begin the shipping process.</p>
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-gray-600 mb-1">Payment Terms Notes</label>
                      <textarea v-model="configForm.deposit_notes" rows="3" placeholder="e.g. 40% deposit to initiate shipping, balance due before arrival at Mombasa port"
                                class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"></textarea>
                    </div>
                  </div>

                  <!-- Preview -->
                  <div v-if="configForm.deposit_percentage" class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p class="text-xs font-medium text-blue-700 mb-1">
                      <i class="fa-solid fa-info-circle mr-1"></i> Deposit Preview
                    </p>
                    <p class="text-sm text-blue-600">
                      This partner requires <strong>{{ configForm.deposit_percentage }}%</strong> of the CIF price as initial deposit.
                      <template v-if="configForm.deposit_notes"> — {{ configForm.deposit_notes }}</template>
                    </p>
                  </div>
                </div>

                <!-- Purchase Callback -->
                <div class="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 class="font-semibold text-gray-900 mb-1">
                    <i class="fa-solid fa-link text-primary mr-1.5"></i>
                    Purchase Callback
                  </h3>
                  <p class="text-xs text-gray-500 mb-4">When a customer requests to purchase a vehicle from this partner, we send a notification to this URL so they can initiate the process on their end.</p>

                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Callback URL</label>
                    <input v-model="configForm.purchase_callback_url" type="url" placeholder="https://partner-system.com/api/purchase-request"
                           class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    <p class="text-[11px] text-gray-400 mt-1">We will POST to this URL with the vehicle's external reference, customer details, and purchase intent.</p>
                  </div>

                  <!-- Payload preview -->
                  <div class="mt-4">
                    <p class="text-xs font-medium text-gray-600 mb-2">Request Payload We Send</p>
                    <div class="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                      <pre class="text-sm text-gray-300 font-mono">{
  <span class="text-green-400">"event"</span>: <span class="text-amber-400">"purchase_request"</span>,
  <span class="text-green-400">"external_reference"</span>: <span class="text-amber-400">"DM-AE-00123"</span>,
  <span class="text-green-400">"vehicle_reference"</span>: <span class="text-amber-400">"EZR-2026-00042"</span>,
  <span class="text-green-400">"vehicle"</span>: <span class="text-amber-400">"Toyota Land Cruiser 2022"</span>,
  <span class="text-green-400">"customer"</span>: {
    <span class="text-green-400">"name"</span>:  <span class="text-amber-400">"John Doe"</span>,
    <span class="text-green-400">"email"</span>: <span class="text-amber-400">"john@example.com"</span>,
    <span class="text-green-400">"phone"</span>: <span class="text-amber-400">"+256700123456"</span>
  },
  <span class="text-green-400">"application_reference"</span>: <span class="text-amber-400">"IMP-2026-00015"</span>,
  <span class="text-green-400">"requested_at"</span>: <span class="text-amber-400">"2026-04-05T10:30:00+03:00"</span>
}</pre>
                    </div>
                  </div>

                  <!-- Expected response -->
                  <div class="mt-4">
                    <p class="text-xs font-medium text-gray-600 mb-2">Expected Response</p>
                    <div class="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                      <pre class="text-sm text-gray-300 font-mono">{
  <span class="text-green-400">"success"</span>: <span class="text-blue-400">true</span>,
  <span class="text-green-400">"message"</span>: <span class="text-amber-400">"Purchase request received"</span>,
  <span class="text-green-400">"partner_reference"</span>: <span class="text-amber-400">"PR-2026-0042"</span>  <span class="text-gray-500">// optional — your internal reference</span>
}</pre>
                    </div>
                    <p class="text-xs font-medium text-gray-600 mt-3 mb-2">If Vehicle No Longer Available</p>
                    <div class="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                      <pre class="text-sm text-gray-300 font-mono">{
  <span class="text-green-400">"success"</span>: <span class="text-blue-400">false</span>,
  <span class="text-green-400">"reason"</span>: <span class="text-amber-400">"sold"</span>,          <span class="text-gray-500">// "sold", "reserved", or "unavailable"</span>
  <span class="text-green-400">"message"</span>: <span class="text-amber-400">"Vehicle already sold"</span>  <span class="text-gray-500">// optional</span>
}</pre>
                    </div>
                    <p class="text-[11px] text-gray-400 mt-1">Vehicle marked as sold/reserved, unpublished, import app cancelled, admin notified.</p>
                  </div>
                </div>

                <div class="flex justify-end">
                  <button @click="saveConfig" :disabled="savingConfig"
                          class="bg-primary hover:bg-red-700 disabled:opacity-60 text-white font-medium py-2.5 px-6 rounded-lg text-sm flex items-center gap-2">
                    <i v-if="savingConfig" class="fa-solid fa-spinner fa-spin"></i>
                    Save Configuration
                  </button>
                </div>
              </div>
            </TabPanel>

            <!-- ══ Vehicles / Stock ═══════════════════════════════════════════════ -->
            <TabPanel>
              <div class="space-y-4">
                <!-- Filters -->
                <div class="flex items-center gap-3 flex-wrap">
                  <div class="relative flex-1 min-w-[220px]">
                    <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                    <input v-model="pvSearch" type="text" placeholder="Search by ref, model, brand…"
                           class="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                           @input="onPvSearch">
                  </div>
                  <select v-model="pvFilterStatus" class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary outline-none">
                    <option value="">All Statuses</option>
                    <option value="draft">Draft</option>
                    <option value="in_transit">In Transit</option>
                    <option value="available">Available</option>
                    <option value="reserved">Reserved</option>
                    <option value="sold">Sold</option>
                  </select>
                  <span class="text-xs text-gray-400 ml-auto">{{ pvMeta.total }} vehicle{{ pvMeta.total !== 1 ? 's' : '' }}</span>
                </div>

                <!-- Table -->
                <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                      <thead class="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide min-w-[130px] whitespace-nowrap">Ref</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Vehicle</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Year</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Transmission</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Mileage</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Fuel</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Asking Price</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Status</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Actions</th>
                      </tr>
                      </thead>
                      <tbody class="divide-y divide-gray-100">
                      <!-- Skeleton -->
                      <tr v-if="pvLoading" v-for="n in 5" :key="n" class="animate-pulse">
                        <td class="px-4 py-3"><div class="h-4 w-24 bg-gray-200 rounded"></div></td>
                        <td class="px-4 py-3"><div class="flex items-center gap-3"><div class="w-10 h-10 bg-gray-200 rounded-md"></div><div class="space-y-1.5"><div class="h-4 w-32 bg-gray-200 rounded"></div><div class="h-3 w-20 bg-gray-200 rounded"></div></div></div></td>
                        <td class="px-4 py-3"><div class="h-4 w-10 bg-gray-200 rounded"></div></td>
                        <td class="px-4 py-3"><div class="h-4 w-20 bg-gray-200 rounded"></div></td>
                        <td class="px-4 py-3"><div class="h-4 w-20 bg-gray-200 rounded"></div></td>
                        <td class="px-4 py-3"><div class="h-4 w-14 bg-gray-200 rounded"></div></td>
                        <td class="px-4 py-3"><div class="h-4 w-24 bg-gray-200 rounded"></div></td>
                        <td class="px-4 py-3"><div class="h-5 w-20 bg-gray-200 rounded-full"></div></td>
                        <td class="px-4 py-3"><div class="h-4 w-16 bg-gray-200 rounded"></div></td>
                      </tr>
                      <!-- Empty -->
                      <tr v-else-if="partnerVehicles.length === 0">
                        <td colspan="9" class="px-4 py-16 text-center text-gray-400">
                          <i class="fa-solid fa-car text-3xl mb-3 block opacity-30"></i>
                          <p class="text-sm">No vehicles from this partner yet</p>
                          <p class="text-xs text-gray-400 mt-1">Vehicles will appear here after a successful sync.</p>
                        </td>
                      </tr>
                      <!-- Rows -->
                      <tr v-else v-for="v in partnerVehicles" :key="v.id" class="hover:bg-gray-50/50 transition-colors">
                        <td class="px-4 py-3">
                          <span class="font-mono text-xs font-semibold text-secondary tracking-wide block">{{ v.reference }}</span>
                          <span v-if="v.externalReference" class="font-mono text-[10px] text-gray-400 block mt-0.5">{{ v.externalReference }}</span>
                        </td>
                        <td class="px-4 py-3">
                          <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-md bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                              <img v-if="v.primaryImage" :src="storageUrl(v.primaryImage)" class="w-full h-full object-cover" alt="">
                              <i v-else class="fa-solid fa-car text-gray-300 text-sm"></i>
                            </div>
                            <div>
                              <p class="font-medium text-gray-900 whitespace-nowrap">{{ v.brand?.name }} {{ v.model }}</p>
                              <p class="text-xs text-gray-400">{{ v.category?.name ?? '—' }}</p>
                            </div>
                          </div>
                        </td>
                        <td class="px-4 py-3 text-gray-700 whitespace-nowrap">{{ v.year }}</td>
                        <td class="px-4 py-3 text-gray-700 whitespace-nowrap capitalize">{{ v.transmission }}</td>
                        <td class="px-4 py-3 text-gray-700 whitespace-nowrap">{{ v.mileage ? fmtNum(v.mileage) + ' km' : '—' }}</td>
                        <td class="px-4 py-3 text-gray-700 whitespace-nowrap capitalize">{{ v.fuelType }}</td>
                        <td class="px-4 py-3 text-gray-700 whitespace-nowrap font-medium">{{ fmtUGX(v.sellingPrice) }}</td>
                        <td class="px-4 py-3 whitespace-nowrap">
                          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" :class="statusColors[v.status] ?? 'bg-gray-100 text-gray-600'">
                            {{ statusLabel[v.status] ?? v.status }}
                          </span>
                        </td>
                        <td class="px-4 py-3 whitespace-nowrap">
                          <div class="flex items-center gap-1.5">
                            <NuxtLink :to="`/backoffice/vehicles/${v.id}`" class="p-1.5 text-gray-400 hover:text-secondary hover:bg-blue-50 rounded-md transition-colors" title="View"><i class="fa-solid fa-eye text-sm"></i></NuxtLink>
                            <NuxtLink :to="`/backoffice/vehicles/${v.id}/edit`" class="p-1.5 text-gray-400 hover:text-primary hover:bg-red-50 rounded-md transition-colors" title="Edit"><i class="fa-solid fa-pen text-sm"></i></NuxtLink>
                          </div>
                        </td>
                      </tr>
                      </tbody>
                    </table>
                  </div>
                  <!-- Pagination -->
                  <div v-if="pvMeta.last_page > 1" class="px-4 py-3 border-t border-gray-100 flex items-center justify-between gap-3">
                    <p class="text-xs text-gray-500">
                      <template v-if="pvMeta.total > 0">Showing {{ ((pvMeta.current_page - 1) * pvMeta.per_page) + 1 }}–{{ Math.min(pvMeta.current_page * pvMeta.per_page, pvMeta.total) }} of {{ pvMeta.total }}</template>
                    </p>
                    <div class="flex items-center gap-1">
                      <button @click="fetchPartnerVehicles(pvMeta.current_page - 1)" :disabled="pvMeta.current_page <= 1"
                              class="px-2.5 py-1.5 text-xs border border-gray-200 rounded-md disabled:opacity-40 hover:bg-gray-50 transition-colors">
                        <i class="fa-solid fa-chevron-left text-[10px]"></i>
                      </button>
                      <template v-for="p in pvPages" :key="p">
                        <span v-if="p === '...'" class="px-1.5 text-xs text-gray-400">…</span>
                        <button v-else @click="fetchPartnerVehicles(p as number)"
                                class="px-2.5 py-1.5 text-xs border rounded-md transition-colors"
                                :class="p === pvMeta.current_page ? 'bg-primary text-white border-primary' : 'border-gray-200 hover:bg-gray-50'">
                          {{ p }}
                        </button>
                      </template>
                      <button @click="fetchPartnerVehicles(pvMeta.current_page + 1)" :disabled="pvMeta.current_page >= pvMeta.last_page"
                              class="px-2.5 py-1.5 text-xs border border-gray-200 rounded-md disabled:opacity-40 hover:bg-gray-50 transition-colors">
                        <i class="fa-solid fa-chevron-right text-[10px]"></i>
                      </button>
                    </div>
                    <div class="flex items-center gap-1.5">
                      <label class="text-xs text-gray-400">Per page</label>
                      <select v-model.number="pvPerPage" class="px-2 py-1 border border-gray-200 rounded text-xs text-gray-600 focus:ring-1 focus:ring-primary outline-none">
                        <option :value="15">15</option>
                        <option :value="25">25</option>
                        <option :value="50">50</option>
                        <option :value="100">100</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </TabPanel>

            <!-- ══ Sync Log ══════════════════════════════════════════════════════ -->
            <TabPanel>
              <div class="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div v-if="loadingSyncs && syncs.length === 0" class="py-16 text-center text-gray-400">
                  <i class="fa-solid fa-spinner fa-spin text-2xl mb-2 block"></i>
                </div>
                <div v-else-if="syncs.length === 0" class="py-16 text-center">
                  <i class="fa-solid fa-clock-rotate-left text-4xl text-gray-200 mb-3"></i>
                  <p class="text-gray-500 font-medium">No syncs yet</p>
                  <p class="text-sm text-gray-400 mt-1">Syncs will appear here when the partner sends vehicles via API.</p>
                </div>
                <table v-else class="w-full text-sm">
                  <thead>
                  <tr class="bg-gray-50 text-gray-500 text-xs uppercase">
                    <th class="text-left px-5 py-3">ID</th>
                    <th class="text-center px-5 py-3">Status</th>
                    <th class="text-center px-5 py-3">Total</th>
                    <th class="text-center px-5 py-3">Imported</th>
                    <th class="text-center px-5 py-3">Failed</th>
                    <th class="text-left px-5 py-3">Started</th>
                    <th class="px-5 py-3"></th>
                  </tr>
                  </thead>
                  <tbody>
                  <template v-for="s in syncs" :key="s.id">
                    <tr class="border-t border-gray-100 hover:bg-gray-50/50">
                      <td class="px-5 py-3 text-gray-700 font-mono text-xs">#{{ s.id }}</td>
                      <td class="px-5 py-3 text-center">
                        <span class="text-xs font-medium px-2 py-0.5 rounded-full"
                              :class="s.status === 'completed' ? 'bg-green-100 text-green-700' : s.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'">
                          {{ s.status }}
                        </span>
                      </td>
                      <td class="px-5 py-3 text-center text-gray-700">{{ s.totalVehicles }}</td>
                      <td class="px-5 py-3 text-center text-green-600 font-medium">{{ s.importedCount }}</td>
                      <td class="px-5 py-3 text-center" :class="s.failedCount > 0 ? 'text-red-600 font-medium' : 'text-gray-400'">{{ s.failedCount }}</td>
                      <td class="px-5 py-3 text-xs text-gray-500">{{ s.startedAt ? fmtDate(s.startedAt) : '—' }}</td>
                      <td class="px-5 py-3 text-right">
                        <button v-if="s.failedCount > 0" @click="viewSyncErrors(s.id)"
                                class="text-xs text-primary hover:text-red-700 font-medium">
                          {{ expandedSync === s.id ? 'Hide' : 'Errors' }}
                        </button>
                      </td>
                    </tr>
                    <!-- Expanded errors -->
                    <tr v-if="expandedSync === s.id && syncDetail?.errors?.length" class="bg-red-50/50">
                      <td colspan="7" class="px-5 py-3">
                        <div class="space-y-1.5 max-h-60 overflow-y-auto">
                          <div v-for="(err, eIdx) in syncDetail.errors" :key="eIdx" class="text-xs text-red-700 flex gap-2">
                            <span class="text-red-400 shrink-0">Row {{ err.index + 1 }}:</span>
                            <span>{{ err.message }}</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </template>
                  </tbody>
                </table>
              </div>

              <!-- Sync pagination -->
              <div v-if="syncMeta.last_page > 1" class="flex items-center justify-center gap-1.5 mt-4">
                <button class="px-2.5 py-1.5 text-sm rounded-md border border-gray-300 disabled:opacity-40"
                        :disabled="syncMeta.current_page === 1" @click="fetchSyncs(syncMeta.current_page - 1)">&lsaquo;</button>
                <span class="text-xs text-gray-500">{{ syncMeta.current_page }} / {{ syncMeta.last_page }}</span>
                <button class="px-2.5 py-1.5 text-sm rounded-md border border-gray-300 disabled:opacity-40"
                        :disabled="syncMeta.current_page === syncMeta.last_page" @click="fetchSyncs(syncMeta.current_page + 1)">&rsaquo;</button>
              </div>
            </TabPanel>

            <!-- ══ Documentation ═══════════════════════════════════════════════ -->
            <TabPanel>
              <div class="space-y-5">
                <!-- Endpoint info -->
                <div class="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 class="font-semibold text-gray-900 mb-3">API Endpoint</h3>
                  <div class="bg-gray-900 rounded-lg p-4 overflow-x-auto mb-4">
                  <pre class="text-sm text-gray-300 font-mono"><span class="text-blue-400">POST</span> {{ apiBase }}/partner-api/v1/sync
<span class="text-gray-500">Headers:</span>
  <span class="text-green-400">X-Api-Key</span>:    <span class="text-amber-400">{{ partner.apiKeyPrefix }}••••••••(your full key)</span>
  <span class="text-green-400">Content-Type</span>: application/json</pre>
                  </div>
                  <div class="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                    <i class="fa-solid fa-triangle-exclamation mt-0.5 shrink-0"></i>
                    <span>Your API key starts with <code class="font-mono bg-amber-100 px-1 rounded">{{ partner.apiKeyPrefix }}</code>. If you've lost the full key, use the <strong>Regenerate</strong> button in the Overview tab.</span>
                  </div>
                </div>

                <!-- Quick-start snippets -->
                <div class="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 class="font-semibold text-gray-900 mb-3">Quick Start</h3>
                  <p class="text-sm text-gray-500 mb-4">Replace the API key placeholder with your actual key. Maximum 500 vehicles per request.</p>

                  <div class="flex gap-1 flex-wrap mb-4">
                    <button v-for="lang in docLangs" :key="lang.id" @click="docLang = lang.id"
                            class="px-2.5 py-1.5 text-xs rounded-md font-medium transition-colors flex items-center gap-1.5"
                            :class="docLang === lang.id ? 'bg-secondary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'">
                      <i :class="lang.icon"></i>
                      {{ lang.label }}
                    </button>
                  </div>

                  <div class="bg-gray-900 rounded-lg p-4 overflow-x-auto shiki-wrapper">
                    <div v-if="docHighlighterReady && highlightedDocSnippets[docLang]" v-html="highlightedDocSnippets[docLang]"></div>
                    <pre v-else class="text-sm text-gray-300 font-mono whitespace-pre">{{ docSnippets[docLang] }}</pre>
                  </div>
                </div>

                <!-- Key details -->
                <div class="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 class="font-semibold text-gray-900 mb-3">How It Works</h3>
                  <ul class="space-y-2 text-sm text-gray-600">
                    <li class="flex gap-2"><i class="fa-solid fa-circle-check text-green-500 mt-0.5 shrink-0"></i><strong>Upsert:</strong> Vehicles with the same <code class="bg-gray-100 px-1 rounded text-xs font-mono">external_reference</code> are updated, not duplicated.</li>
                    <li class="flex gap-2"><i class="fa-solid fa-circle-check text-green-500 mt-0.5 shrink-0"></i><strong>Field mapping:</strong> Your field names are translated via the mapping configured in the "Field Mapping" tab.</li>
                    <li class="flex gap-2"><i class="fa-solid fa-circle-check text-green-500 mt-0.5 shrink-0"></i><strong>Value mapping:</strong> Enum values are mapped via the "Value Mapping" tab configuration.</li>
                    <li class="flex gap-2"><i class="fa-solid fa-circle-check text-green-500 mt-0.5 shrink-0"></i><strong>Smart pricing:</strong> Accepts formatted strings like "UGX 85,000,000" or "85.5M".</li>
                    <li class="flex gap-2"><i class="fa-solid fa-circle-check text-green-500 mt-0.5 shrink-0"></i><strong>Features:</strong> Send as pipe-, comma-, or semicolon-delimited string. Feature names are matched to system features via the feature mapping in the "Value Mapping" tab — paste a sample payload to auto-detect and map them.</li>
                    <li class="flex gap-2"><i class="fa-solid fa-circle-check text-green-500 mt-0.5 shrink-0"></i><strong>Images:</strong> Include an <code class="bg-gray-100 px-1 rounded text-xs font-mono">images</code> array of publicly accessible image URLs on each vehicle. The first image becomes the primary. Images are only downloaded on first sync — subsequent syncs skip vehicles that already have images.</li>
                    <li class="flex gap-2"><i class="fa-solid fa-circle-check text-green-500 mt-0.5 shrink-0"></i><strong>Video:</strong> Include a <code class="bg-gray-100 px-1 rounded text-xs font-mono">videoUrl</code> field with a YouTube or video link. Updated on every sync if present.</li>
                  </ul>
                </div>

                <!-- Purchase Callback Endpoint -->
                <div class="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 class="font-semibold text-gray-900 mb-3">
                    <i class="fa-solid fa-bell text-primary mr-1.5"></i>
                    Purchase Callback (Optional)
                  </h3>
                  <p class="text-sm text-gray-500 mb-4">
                    When a customer on EzzyRide requests to purchase one of your vehicles, we can notify your system automatically.
                    Provide a callback URL in the <strong>Configuration</strong> tab, and we will send a <code class="bg-gray-100 px-1 rounded text-xs font-mono">POST</code> request with the following payload:
                  </p>
                  <div class="bg-gray-900 rounded-lg p-4 overflow-x-auto mb-4">
                    <pre class="text-sm text-gray-300 font-mono"><span class="text-blue-400">POST</span> <span class="text-amber-400">{{ partner?.purchaseCallbackUrl || 'https://your-system.com/api/purchase-callback' }}</span>
<span class="text-gray-500">Headers:</span>
  <span class="text-green-400">Content-Type</span>: application/json

{
  <span class="text-green-400">"event"</span>: <span class="text-amber-400">"purchase_request"</span>,
  <span class="text-green-400">"external_reference"</span>: <span class="text-amber-400">"YOUR-STOCK-REF"</span>,
  <span class="text-green-400">"vehicle_reference"</span>: <span class="text-amber-400">"EZR-2026-00042"</span>,
  <span class="text-green-400">"vehicle"</span>: <span class="text-amber-400">"Toyota Land Cruiser 2022"</span>,
  <span class="text-green-400">"customer"</span>: {
    <span class="text-green-400">"name"</span>:  <span class="text-amber-400">"John Doe"</span>,
    <span class="text-green-400">"email"</span>: <span class="text-amber-400">"john@example.com"</span>,
    <span class="text-green-400">"phone"</span>: <span class="text-amber-400">"+256700123456"</span>
  },
  <span class="text-green-400">"application_reference"</span>: <span class="text-amber-400">"IMP-2026-00015"</span>,
  <span class="text-green-400">"requested_at"</span>: <span class="text-amber-400">"2026-04-05T10:30:00+03:00"</span>
}</pre>
                  </div>
                  <p class="text-sm text-gray-500 mb-3">Your endpoint should respond with:</p>
                  <div class="bg-gray-900 rounded-lg p-4 overflow-x-auto mb-4">
                    <pre class="text-sm text-gray-300 font-mono">{
  <span class="text-green-400">"success"</span>: <span class="text-blue-400">true</span>,
  <span class="text-green-400">"message"</span>: <span class="text-amber-400">"Purchase request received"</span>,
  <span class="text-green-400">"partner_reference"</span>: <span class="text-amber-400">"PR-2026-0042"</span>  <span class="text-gray-500">// optional</span>
}</pre>
                  </div>
                  <p class="text-sm text-gray-500 mb-3">If the vehicle is no longer available:</p>
                  <div class="bg-gray-900 rounded-lg p-4 overflow-x-auto mb-4">
                    <pre class="text-sm text-gray-300 font-mono">{
  <span class="text-green-400">"success"</span>: <span class="text-blue-400">false</span>,
  <span class="text-green-400">"reason"</span>: <span class="text-amber-400">"sold"</span>,          <span class="text-gray-500">// "sold", "reserved", or "unavailable"</span>
  <span class="text-green-400">"message"</span>: <span class="text-amber-400">"Vehicle already sold"</span>  <span class="text-gray-500">// optional</span>
}</pre>
                  </div>
                  <div class="flex items-start gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-3">
                    <i class="fa-solid fa-circle-info mt-0.5 shrink-0"></i>
                    <span>We use the <code class="font-mono bg-blue-100 px-1 rounded text-xs">external_reference</code> field (your stock number) to identify the vehicle. Make sure your system can look up vehicles by this reference.</span>
                  </div>
                  <div class="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                    <i class="fa-solid fa-triangle-exclamation mt-0.5 shrink-0"></i>
                    <span>If you respond with <code class="font-mono bg-amber-100 px-1 rounded text-xs">"success": false</code> and a reason of <code class="font-mono bg-amber-100 px-1 rounded text-xs">sold</code>, <code class="font-mono bg-amber-100 px-1 rounded text-xs">reserved</code>, or <code class="font-mono bg-amber-100 px-1 rounded text-xs">unavailable</code>, we will mark the vehicle accordingly, unpublish it from the website, and cancel the import application.</span>
                  </div>
                </div>

                <!-- Link to full docs -->
                <div class="text-center">
                  <NuxtLink to="/partner-integrations" target="_blank"
                            class="inline-flex items-center gap-2 text-sm text-primary hover:text-red-700 font-medium">
                    <i class="fa-solid fa-arrow-up-right-from-square text-xs"></i>
                    View Full Documentation
                  </NuxtLink>
                </div>
              </div>
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </div>
    </template>

    <!-- Regenerated Key Modal -->
    <Teleport to="body">
      <div v-if="showKeyModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/40" @click="showKeyModal = false"></div>
        <div class="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 text-center">
          <i class="fa-solid fa-key text-3xl text-amber-500 mb-2"></i>
          <h3 class="font-semibold text-gray-900 text-lg">New API Key</h3>
          <p class="text-sm text-gray-500 mt-1 mb-4">Copy this key now. It will <strong>not</strong> be shown again.</p>
          <div class="bg-gray-900 rounded-lg p-4 mb-4">
            <code class="text-xs text-green-400 break-all select-all">{{ regeneratedKey }}</code>
          </div>
          <div class="flex justify-center gap-3">
            <button @click="copyKey" class="bg-primary hover:bg-red-700 text-white font-medium py-2 px-5 rounded-lg text-sm flex items-center gap-2">
              <i class="fa-solid fa-copy"></i> Copy
            </button>
            <button @click="showKeyModal = false" class="border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium py-2 px-5 rounded-lg text-sm">Done</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.shiki-wrapper :deep(pre) {
  background: transparent !important;
  margin: 0;
  padding: 0;
  font-size: 0.8125rem;
  line-height: 1.6;
}
.shiki-wrapper :deep(code) {
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
}
</style>
