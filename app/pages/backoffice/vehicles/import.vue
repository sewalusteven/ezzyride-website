<script setup lang="ts">
import { Notify } from 'notiflix'

definePageMeta({ layout: 'admin-layout' })

const { $api } = useNuxtApp()

// ── Wizard state ────────────────────────────────────────────────────────────
const step = ref(1)
const loading = ref(false)

// Step 1: Upload
const importId = ref<number | null>(null)
const filename = ref('')
const totalRows = ref(0)
const headers = ref<string[]>([])
const previewData = ref<any[][]>([])
const targetFields = ref<Record<string, string>>({})
const featureFields = ref<Record<string, string>>({})
const attributeFields = ref<Record<string, string>>({})
const allFeatures = ref<{ id: number; name: string; category: string }[]>([])
const allAttributes = ref<{ id: number; name: string; type: string; unit: string | null; options: { id: number; value: string }[] }[]>([])

// Step 2: Column mapping
const columnMapping = ref<Record<number, string>>({})

// Step 3: Value mapping
const distinctValues = ref<Record<string, string[]>>({})
const brandSuggestions = ref<Record<string, { brand_id: number | null; brand_name: string; confidence: string }>>({})
const existingBrands = ref<{ id: number; name: string }[]>([])
const categorySuggestions = ref<Record<string, { id: number | null; name: string; confidence: string }>>({})
const existingCategories = ref<{ id: number; name: string }[]>([])
const enumSuggestions = ref<Record<string, Record<string, string>>>({})
const valueMapping = ref<Record<string, Record<string, string>>>({})
const newBrands = ref<string[]>([])

// Skipped columns → potential features or attributes
const skippedColumns = ref<{ index: number; header: string; sampleValues: string[]; suggestedType: 'feature' | 'attribute'; suggestedFeatureId: number | null; suggestedAttributeId: number | null }[]>([])
const skippedColumnType = ref<Record<number, 'feature' | 'attribute'>>({}) // colIndex → chosen type
const skippedFeatureMapping = ref<Record<number, string>>({}) // colIndex → featureId as string
const skippedAttributeMapping = ref<Record<number, string>>({}) // colIndex → attributeId as string
const newFeatureColumns = ref<number[]>([]) // colIndex list for columns to create as new features
const newFeatureCategory = ref<Record<number, string>>({}) // colIndex → category
const newAttributeColumns = ref<number[]>([]) // colIndex list for columns to create as new attributes
const newAttributeType = ref<Record<number, string>>({}) // colIndex → attribute type (text/number/select)
const featuresFromMapping = ref<{ id: number; name: string; category: string }[]>([])
const attributesFromMapping = ref<{ id: number; name: string; type: string; unit: string | null }[]>([])

// Features list column (delimited values like "ABS, Sunroof, AC")
const featureListValues = ref<string[]>([]) // distinct feature names extracted from the list column
const featureListMapping = ref<Record<string, number | null>>({}) // rawName → featureId
const newFeatureListItems = ref<string[]>([]) // rawNames to create as new features
const newFeatureListCategory = ref<Record<string, string>>({}) // rawName → category

// Step 4: Validation
const validationResult = ref<{ totalRows: number; validRows: number; failedRows: number; errors: any[]; warnings?: { type: string; level: string; message: string }[] } | null>(null)

// Import Templates
const templates = ref<{ id: number; name: string; createdAt: string }[]>([])
const showTemplateDropdown = ref(false)
const showSaveTemplateModal = ref(false)
const templateName = ref('')
const savingTemplate = ref(false)
const appliedTemplateData = ref<{
  valueMapping?: Record<string, any>
  featureListMapping?: Record<string, number>
  skippedColumnConfig?: Record<string, any>
} | null>(null)

// Step 5: Import progress
const importStatus = ref<{ status: string; importedRows: number; totalRows: number; skippedRows: number; failedRows: number; errorMessage: string | null; completedAt: string | null } | null>(null)
let pollTimer: ReturnType<typeof setInterval> | null = null

// ── Step 1: Upload ──────────────────────────────────────────────────────────
const fileInput = ref<HTMLInputElement | null>(null)
const dragOver = ref(false)

const handleFile = async (file: File) => {
  if (!file) return
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
  ]
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!allowedTypes.includes(file.type) && !['xlsx', 'xls', 'csv'].includes(ext ?? '')) {
    Notify.failure('Please upload an Excel (.xlsx, .xls) or CSV file.')
    return
  }
  if (file.size > 10 * 1024 * 1024) {
    Notify.failure('File must be under 10MB.')
    return
  }

  loading.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await $api.post('/v1/vehicles/bulk-import/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    const d = data.data
    importId.value       = d.id
    filename.value       = d.filename
    totalRows.value      = d.totalRows
    headers.value        = d.headers
    previewData.value    = d.previewData
    targetFields.value   = d.targetFields
    featureFields.value  = d.featureFields ?? {}
    attributeFields.value = d.attributeFields ?? {}
    allFeatures.value    = d.features ?? []
    allAttributes.value  = d.attributes ?? []

    // Initialize column mapping from suggestions
    columnMapping.value = {}
    for (const [idx, field] of Object.entries(d.suggestions as Record<string, string>)) {
      columnMapping.value[Number(idx)] = field
    }
    // Set unmapped columns to _skip
    headers.value.forEach((_, i) => {
      if (!(i in columnMapping.value)) columnMapping.value[i] = '_skip'
    })

    step.value = 2
    fetchTemplates()
  } catch (err: any) {
    Notify.failure(err.response?.data?.message ?? 'Upload failed.')
  } finally {
    loading.value = false
  }
}

const onFileSelect = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (input.files?.[0]) handleFile(input.files[0])
}

const onDrop = (e: DragEvent) => {
  dragOver.value = false
  if (e.dataTransfer?.files?.[0]) handleFile(e.dataTransfer.files[0])
}

// ── Step 2: Save column mapping ─────────────────────────────────────────────
const saveColumnMapping = async () => {
  loading.value = true
  try {
    const { data } = await $api.patch(`/v1/vehicles/bulk-import/${importId.value}/mapping`, {
      column_mapping: columnMapping.value,
    })
    const d = data.data
    distinctValues.value      = d.distinctValues
    brandSuggestions.value    = d.brandSuggestions
    categorySuggestions.value = d.categorySuggestions ?? {}
    enumSuggestions.value     = d.enumSuggestions
    existingBrands.value      = d.brands
    existingCategories.value  = d.categories ?? []
    featuresFromMapping.value = d.features ?? []

    // Skipped columns with feature/attribute suggestions
    skippedColumns.value = d.skippedColumns ?? []
    skippedColumnType.value = {}
    skippedFeatureMapping.value = {}
    skippedAttributeMapping.value = {}
    newFeatureColumns.value = []
    newFeatureCategory.value = {}
    newAttributeColumns.value = []
    newAttributeType.value = {}
    attributesFromMapping.value = d.attributes ?? []

    // Pre-fill suggested types and matches
    for (const col of skippedColumns.value) {
      skippedColumnType.value[col.index] = col.suggestedType ?? 'attribute'
      if (col.suggestedType === 'feature' && col.suggestedFeatureId) {
        skippedFeatureMapping.value[col.index] = String(col.suggestedFeatureId)
      } else if (col.suggestedType === 'attribute' && col.suggestedAttributeId) {
        skippedAttributeMapping.value[col.index] = String(col.suggestedAttributeId)
      }
    }

    // Initialize value mapping from suggestions
    valueMapping.value = {}
    newBrands.value = []

    // Brands
    if (distinctValues.value.brand) {
      valueMapping.value.brand = {}
      for (const raw of distinctValues.value.brand) {
        const suggestion = brandSuggestions.value[raw]
        if (suggestion?.brand_id) {
          valueMapping.value.brand[raw] = suggestion.brand_name
        }
      }
    }

    // Categories
    if (distinctValues.value.category) {
      valueMapping.value.category = {}
      for (const raw of distinctValues.value.category) {
        const suggestion = categorySuggestions.value[raw]
        if (suggestion?.id) {
          valueMapping.value.category[raw] = suggestion.name
        }
      }
    }

    // Enums — always init the object so v-model works, then overlay suggestions
    for (const field of ['transmission', 'fuel_type', 'drive_type', 'status']) {
      if (distinctValues.value[field]?.length) {
        valueMapping.value[field] = {}
        // Pre-fill with any auto-detected suggestions
        if (enumSuggestions.value[field]) {
          valueMapping.value[field] = { ...enumSuggestions.value[field] }
        }
      }
    }

    // Feature list values (from _features_list column)
    featureListValues.value = d.featureListValues ?? []
    featureListMapping.value = {}
    newFeatureListItems.value = []
    newFeatureListCategory.value = {}
    const flSuggestions = d.featureListSuggestions ?? {}
    for (const name of featureListValues.value) {
      if (flSuggestions[name]) {
        featureListMapping.value[name] = flSuggestions[name]
      }
    }

    // ── Apply template overrides (if a template was loaded in Step 2) ────
    if (appliedTemplateData.value) {
      const tpl = appliedTemplateData.value

      // Overlay stored value mappings onto the suggestion-initialized ones
      if (tpl.valueMapping) {
        for (const [field, mappings] of Object.entries(tpl.valueMapping)) {
          if (field === '_features_list') continue // handled separately
          if (typeof mappings !== 'object' || mappings === null) continue
          // Only overlay values that exist in the current file's distinct values
          if (!valueMapping.value[field]) valueMapping.value[field] = {}
          for (const [rawVal, mappedVal] of Object.entries(mappings as Record<string, string>)) {
            // Apply if this raw value exists in current file's distinct values for this field
            if (distinctValues.value[field]?.includes(rawVal)) {
              valueMapping.value[field][rawVal] = mappedVal
            }
          }
        }
      }

      // Overlay stored feature list mapping
      if (tpl.featureListMapping) {
        for (const [name, fId] of Object.entries(tpl.featureListMapping)) {
          // Only apply if this feature name exists in current file's extracted list
          if (featureListValues.value.some(v => v.toLowerCase() === name.toLowerCase())) {
            featureListMapping.value[name] = fId as number
          }
        }
      }

      // Overlay stored skipped column config (match by header name)
      if (tpl.skippedColumnConfig) {
        for (const col of skippedColumns.value) {
          const headerName = headers.value[col.index]
          if (!headerName) continue
          const config = (tpl.skippedColumnConfig as Record<string, any>)[headerName]
          if (!config) continue
          if (config.type) skippedColumnType.value[col.index] = config.type
          if (config.type === 'feature' && config.featureId) {
            skippedFeatureMapping.value[col.index] = String(config.featureId)
          } else if (config.type === 'attribute' && config.attributeId) {
            skippedAttributeMapping.value[col.index] = String(config.attributeId)
          }
        }
      }

      appliedTemplateData.value = null // consumed
    }

    step.value = 3
  } catch (err: any) {
    Notify.failure(err.response?.data?.message ?? 'Failed to save mapping.')
  } finally {
    loading.value = false
  }
}

const mappedFieldCount = computed(() => {
  return Object.values(columnMapping.value).filter(v => v !== '_skip').length
})

// Check if any feature or attribute columns are mapped
const hasFeatureOrAttrMappings = computed(() => {
  return Object.values(columnMapping.value).some(v =>
    v.startsWith('feature:') || v.startsWith('attribute:')
  )
})

// ── Step 3: Save value mapping ──────────────────────────────────────────────
const toggleNewBrand = (raw: string) => {
  const idx = newBrands.value.indexOf(raw)
  if (idx >= 0) {
    newBrands.value.splice(idx, 1)
  } else {
    newBrands.value.push(raw)
    if (valueMapping.value.brand) {
      delete valueMapping.value.brand[raw]
    }
  }
}

const featureCategories = ['comfort', 'safety', 'technology', 'exterior', 'performance']
const attributeTypes = ['text', 'number', 'select']

const setSkippedColumnType = (colIndex: number, type: 'feature' | 'attribute') => {
  skippedColumnType.value[colIndex] = type
  // Clear mappings from the other type
  if (type === 'feature') {
    delete skippedAttributeMapping.value[colIndex]
    const aIdx = newAttributeColumns.value.indexOf(colIndex)
    if (aIdx >= 0) { newAttributeColumns.value.splice(aIdx, 1); delete newAttributeType.value[colIndex] }
  } else {
    delete skippedFeatureMapping.value[colIndex]
    const fIdx = newFeatureColumns.value.indexOf(colIndex)
    if (fIdx >= 0) { newFeatureColumns.value.splice(fIdx, 1); delete newFeatureCategory.value[colIndex] }
  }
}

const toggleNewFeatureColumn = (colIndex: number) => {
  const idx = newFeatureColumns.value.indexOf(colIndex)
  if (idx >= 0) {
    newFeatureColumns.value.splice(idx, 1)
    delete newFeatureCategory.value[colIndex]
  } else {
    newFeatureColumns.value.push(colIndex)
    newFeatureCategory.value[colIndex] = 'comfort'
    delete skippedFeatureMapping.value[colIndex]
  }
}

const toggleNewAttributeColumn = (colIndex: number) => {
  const idx = newAttributeColumns.value.indexOf(colIndex)
  if (idx >= 0) {
    newAttributeColumns.value.splice(idx, 1)
    delete newAttributeType.value[colIndex]
  } else {
    newAttributeColumns.value.push(colIndex)
    newAttributeType.value[colIndex] = 'text'
    delete skippedAttributeMapping.value[colIndex]
  }
}

const setSkippedFeatureMapping = (colIndex: number, featureId: string) => {
  if (featureId) {
    skippedFeatureMapping.value[colIndex] = featureId
  } else {
    delete skippedFeatureMapping.value[colIndex]
  }
  const idx = newFeatureColumns.value.indexOf(colIndex)
  if (idx >= 0) { newFeatureColumns.value.splice(idx, 1); delete newFeatureCategory.value[colIndex] }
}

const setSkippedAttributeMapping = (colIndex: number, attributeId: string) => {
  if (attributeId) {
    skippedAttributeMapping.value[colIndex] = attributeId
  } else {
    delete skippedAttributeMapping.value[colIndex]
  }
  const idx = newAttributeColumns.value.indexOf(colIndex)
  if (idx >= 0) { newAttributeColumns.value.splice(idx, 1); delete newAttributeType.value[colIndex] }
}

// Feature list item helpers
const setFeatureListMapping = (rawName: string, featureId: string) => {
  if (featureId) {
    featureListMapping.value[rawName] = Number(featureId)
  } else {
    delete featureListMapping.value[rawName]
  }
  // Remove from new list if previously marked
  const idx = newFeatureListItems.value.indexOf(rawName)
  if (idx >= 0) { newFeatureListItems.value.splice(idx, 1); delete newFeatureListCategory.value[rawName] }
}

const toggleNewFeatureListItem = (rawName: string) => {
  const idx = newFeatureListItems.value.indexOf(rawName)
  if (idx >= 0) {
    newFeatureListItems.value.splice(idx, 1)
    delete newFeatureListCategory.value[rawName]
  } else {
    newFeatureListItems.value.push(rawName)
    newFeatureListCategory.value[rawName] = 'comfort'
    delete featureListMapping.value[rawName]
  }
}

const setCategoryMapping = (raw: string, categoryName: string) => {
  if (!valueMapping.value.category) valueMapping.value.category = {}
  valueMapping.value.category[raw] = categoryName
}

const setBrandMapping = (raw: string, brandName: string) => {
  if (!valueMapping.value.brand) valueMapping.value.brand = {}
  valueMapping.value.brand[raw] = brandName
  const idx = newBrands.value.indexOf(raw)
  if (idx >= 0) newBrands.value.splice(idx, 1)
}

const saveValueMapping = async () => {
  loading.value = true
  try {
    // Build new_features from columns marked as "create new" feature
    const newFeatures = newFeatureColumns.value.map(colIdx => {
      const col = skippedColumns.value.find(c => c.index === colIdx)
      return {
        name: col?.header ?? `Feature ${colIdx}`,
        category: newFeatureCategory.value[colIdx] || 'comfort',
      }
    })

    // Build new_attributes from columns marked as "create new" attribute
    const newAttributes = newAttributeColumns.value.map(colIdx => {
      const col = skippedColumns.value.find(c => c.index === colIdx)
      return {
        name: col?.header ?? `Attribute ${colIdx}`,
        type: newAttributeType.value[colIdx] || 'text',
      }
    })

    // Build updated column mapping: promote matched skipped columns
    const updatedColumnMapping = { ...columnMapping.value }

    // Promote existing feature matches
    for (const [colIdx, featureId] of Object.entries(skippedFeatureMapping.value)) {
      if (featureId) {
        updatedColumnMapping[Number(colIdx)] = `feature:${featureId}`
      }
    }

    // Promote existing attribute matches
    for (const [colIdx, attributeId] of Object.entries(skippedAttributeMapping.value)) {
      if (attributeId) {
        updatedColumnMapping[Number(colIdx)] = `attribute:${attributeId}`
      }
    }

    // Build feature_list_mapping (only matched items, not new ones)
    const flMapping: Record<string, number> = {}
    for (const [name, fId] of Object.entries(featureListMapping.value)) {
      if (fId) flMapping[name] = fId
    }

    // Build new_feature_list_items
    const newFlItems = newFeatureListItems.value.map(name => ({
      name,
      category: newFeatureListCategory.value[name] || 'comfort',
    }))

    const { data } = await $api.patch(`/v1/vehicles/bulk-import/${importId.value}/value-mapping`, {
      value_mapping: valueMapping.value,
      column_mapping: updatedColumnMapping,
      new_brands: newBrands.value,
      new_features: newFeatures,
      new_attributes: newAttributes,
      feature_list_mapping: flMapping,
      new_feature_list_items: newFlItems,
    })

    // After creation, map new brands to themselves in value mapping
    if (newBrands.value.length > 0) {
      for (const raw of newBrands.value) {
        if (!valueMapping.value.brand) valueMapping.value.brand = {}
        valueMapping.value.brand[raw] = raw
      }
    }

    // After creation, promote new feature columns using created IDs
    const createdFeatures: { id: number; name: string }[] = data.data?.createdFeatures ?? []
    if (createdFeatures.length > 0) {
      for (const colIdx of newFeatureColumns.value) {
        const col = skippedColumns.value.find(c => c.index === colIdx)
        if (!col) continue
        const created = createdFeatures.find(f => f.name.toLowerCase() === col.header.toLowerCase())
        if (created) {
          updatedColumnMapping[colIdx] = `feature:${created.id}`
        }
      }
    }

    // After creation, promote new attribute columns using created IDs
    const createdAttributes: { id: number; name: string }[] = data.data?.createdAttributes ?? []
    if (createdAttributes.length > 0) {
      for (const colIdx of newAttributeColumns.value) {
        const col = skippedColumns.value.find(c => c.index === colIdx)
        if (!col) continue
        const created = createdAttributes.find(a => a.name.toLowerCase() === col.header.toLowerCase())
        if (created) {
          updatedColumnMapping[colIdx] = `attribute:${created.id}`
        }
      }
    }

    // Re-save with final column mapping if we created anything new
    if (newBrands.value.length > 0 || newFeatureColumns.value.length > 0 || newAttributeColumns.value.length > 0 || newFlItems.length > 0) {
      // Pass the full feature list mapping so it's preserved (not wiped by empty object)
      const fullFlMapping: Record<string, number> = {}
      for (const [name, fId] of Object.entries(featureListMapping.value)) {
        if (fId) fullFlMapping[name] = fId
      }
      await $api.patch(`/v1/vehicles/bulk-import/${importId.value}/value-mapping`, {
        value_mapping: valueMapping.value,
        column_mapping: updatedColumnMapping,
        new_brands: [],
        new_features: [],
        new_attributes: [],
        feature_list_mapping: fullFlMapping,
        new_feature_list_items: [],
      })
    }

    // Update local column mapping state
    columnMapping.value = updatedColumnMapping

    step.value = 4
    runValidation()
  } catch (err: any) {
    Notify.failure(err.response?.data?.message ?? 'Failed to save value mapping.')
  } finally {
    loading.value = false
  }
}

// ── Step 4: Validate ────────────────────────────────────────────────────────
const runValidation = async () => {
  loading.value = true
  try {
    const { data } = await $api.post(`/v1/vehicles/bulk-import/${importId.value}/validate`)
    validationResult.value = data.data
  } catch (err: any) {
    Notify.failure(err.response?.data?.message ?? 'Validation failed.')
  } finally {
    loading.value = false
  }
}

// ── Step 5: Execute import ──────────────────────────────────────────────────
const executeImport = async (skipInvalid: boolean = true) => {
  loading.value = true
  try {
    await $api.post(`/v1/vehicles/bulk-import/${importId.value}/execute`, {
      skip_invalid: skipInvalid,
    })
    step.value = 5
    startPolling()
  } catch (err: any) {
    Notify.failure(err.response?.data?.message ?? 'Failed to start import.')
  } finally {
    loading.value = false
  }
}

const startPolling = () => {
  pollTimer = setInterval(async () => {
    try {
      const { data } = await $api.get(`/v1/vehicles/bulk-import/${importId.value}/status`)
      importStatus.value = data.data
      if (['completed', 'failed'].includes(data.data.status)) {
        if (pollTimer) clearInterval(pollTimer)
        pollTimer = null
      }
    } catch { /* ignore polling errors */ }
  }, 2000)
}

// ── Import Templates ─────────────────────────────────────────────────────────
const fetchTemplates = async () => {
  try {
    const { data } = await $api.get('/v1/import-templates')
    templates.value = (data.data ?? []).map((t: any) => ({
      id: t.id,
      name: t.name,
      createdAt: t.created_at,
    }))
  } catch { /* ignore */ }
}

const saveAsTemplate = async () => {
  if (!templateName.value.trim()) return
  savingTemplate.value = true
  try {
    // Build header-based mapping (headerName → field) instead of index-based
    const headerMapping: Record<string, string> = {}
    for (const [idx, field] of Object.entries(columnMapping.value)) {
      const headerName = headers.value[Number(idx)]
      if (headerName && field !== '_skip') {
        headerMapping[headerName] = field
      }
    }

    // Build skipped column config (headerName → { type, featureId?, attributeId?, newFeature?, newAttribute? })
    const skippedColumnConfig: Record<string, any> = {}
    for (const col of skippedColumns.value) {
      const headerName = headers.value[col.index]
      if (!headerName) continue
      const type = skippedColumnType.value[col.index]
      if (!type) continue
      const config: any = { type }
      if (type === 'feature') {
        if (skippedFeatureMapping.value[col.index]) config.featureId = skippedFeatureMapping.value[col.index]
        if (newFeatureColumns.value.includes(col.index)) config.createNew = true
      } else {
        if (skippedAttributeMapping.value[col.index]) config.attributeId = skippedAttributeMapping.value[col.index]
        if (newAttributeColumns.value.includes(col.index)) config.createNew = true
      }
      skippedColumnConfig[headerName] = config
    }

    await $api.post('/v1/import-templates', {
      name: templateName.value.trim(),
      header_mapping: headerMapping,
      value_mapping: valueMapping.value,
      feature_list_mapping: featureListMapping.value,
      skipped_column_config: skippedColumnConfig,
    })
    Notify.success('Template saved!')
    showSaveTemplateModal.value = false
    templateName.value = ''
    fetchTemplates()
  } catch (err: any) {
    Notify.failure(err.response?.data?.message ?? 'Failed to save template.')
  } finally {
    savingTemplate.value = false
  }
}

const applyTemplate = async (templateId: number) => {
  showTemplateDropdown.value = false
  loading.value = true
  try {
    const { data } = await $api.get(`/v1/import-templates/${templateId}/apply`)
    const t = data.data
    const headerMapping: Record<string, string> = t.headerMapping ?? {}

    // Map header names back to column indices
    const newMapping: Record<number, string> = {}
    for (const [headerName, field] of Object.entries(headerMapping)) {
      const idx = headers.value.findIndex(h => h === headerName)
      if (idx >= 0) newMapping[idx] = field as string
    }
    // Set unmapped columns to _skip
    headers.value.forEach((_, i) => {
      if (!(i in newMapping)) newMapping[i] = '_skip'
    })
    columnMapping.value = newMapping

    // Store template data for Step 3 (value mapping, feature list, skipped columns)
    appliedTemplateData.value = {
      valueMapping: t.valueMapping ?? {},
      featureListMapping: t.featureListMapping ?? {},
      skippedColumnConfig: t.skippedColumnConfig ?? {},
    }

    Notify.success('Template applied! Review the mapping and continue.')
  } catch (err: any) {
    Notify.failure(err.response?.data?.message ?? 'Failed to apply template.')
  } finally {
    loading.value = false
  }
}

const deleteTemplate = async (templateId: number) => {
  if (!confirm('Delete this template?')) return
  try {
    await $api.delete(`/v1/import-templates/${templateId}`)
    Notify.success('Template deleted.')
    fetchTemplates()
  } catch (err: any) {
    Notify.failure(err.response?.data?.message ?? 'Failed to delete template.')
  }
}

const resetWizard = () => {
  step.value = 1
  importId.value = null
  filename.value = ''
  totalRows.value = 0
  headers.value = []
  previewData.value = []
  columnMapping.value = {}
  distinctValues.value = {}
  brandSuggestions.value = {}
  enumSuggestions.value = {}
  valueMapping.value = {}
  newBrands.value = []
  categorySuggestions.value = {}
  existingCategories.value = []
  skippedColumns.value = []
  skippedColumnType.value = {}
  skippedFeatureMapping.value = {}
  skippedAttributeMapping.value = {}
  newFeatureColumns.value = []
  newFeatureCategory.value = {}
  newAttributeColumns.value = []
  newAttributeType.value = {}
  featuresFromMapping.value = []
  attributesFromMapping.value = []
  featureListValues.value = []
  featureListMapping.value = {}
  newFeatureListItems.value = []
  newFeatureListCategory.value = {}
  featureFields.value = {}
  attributeFields.value = {}
  allFeatures.value = []
  allAttributes.value = []
  validationResult.value = null
  importStatus.value = null
  appliedTemplateData.value = null
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
}

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})

const progressPercent = computed(() => {
  if (!importStatus.value || !importStatus.value.totalRows) return 0
  const done = importStatus.value.importedRows + importStatus.value.skippedRows + importStatus.value.failedRows
  return Math.round((done / importStatus.value.totalRows) * 100)
})

// Error display pagination
const errorPage = ref(1)
const errorsPerPage = 10
const paginatedErrors = computed(() => {
  if (!validationResult.value?.errors) return []
  const start = (errorPage.value - 1) * errorsPerPage
  return validationResult.value.errors.slice(start, start + errorsPerPage)
})
const totalErrorPages = computed(() => {
  if (!validationResult.value?.errors) return 0
  return Math.ceil(validationResult.value.errors.length / errorsPerPage)
})

// Helper: get feature name by id
const featureName = (id: number) => {
  const f = featuresFromMapping.value.find(f => f.id === id) || allFeatures.value.find(f => f.id === id)
  return f?.name ?? `Feature #${id}`
}
</script>

<template>
  <div class="p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-xl font-bold text-gray-900">Import Vehicles</h1>
        <p class="text-sm text-gray-500 mt-0.5">Upload a spreadsheet to bulk-import vehicles into inventory</p>
      </div>
      <NuxtLink to="/backoffice/vehicles" class="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1.5">
        <i class="fa-solid fa-arrow-left text-xs"></i> Back to Vehicles
      </NuxtLink>
    </div>

    <!-- Step indicator -->
    <div class="flex items-center gap-2 mb-8">
      <template v-for="(s, i) in ['Upload', 'Map Columns', 'Map Values', 'Validate', 'Import']" :key="i">
        <div class="flex items-center gap-2">
          <div
            class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            :class="step > i + 1 ? 'bg-green-500 text-white' : step === i + 1 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'"
          >
            <i v-if="step > i + 1" class="fa-solid fa-check text-[10px]"></i>
            <span v-else>{{ i + 1 }}</span>
          </div>
          <span class="text-xs font-medium hidden sm:inline" :class="step === i + 1 ? 'text-gray-900' : 'text-gray-400'">{{ s }}</span>
        </div>
        <div v-if="i < 4" class="flex-1 h-px bg-gray-200"></div>
      </template>
    </div>

    <!-- Step 1: Upload -->
    <div v-if="step === 1" class="bg-white border border-gray-200 rounded-xl p-8">
      <div
        class="border-2 border-dashed rounded-xl p-12 text-center transition-colors"
        :class="dragOver ? 'border-primary bg-red-50' : 'border-gray-300 hover:border-gray-400'"
        @dragover.prevent="dragOver = true"
        @dragleave.prevent="dragOver = false"
        @drop.prevent="onDrop"
      >
        <i class="fa-solid fa-cloud-arrow-up text-4xl mb-4" :class="dragOver ? 'text-primary' : 'text-gray-300'"></i>
        <p class="text-gray-600 font-medium mb-1">Drag and drop your file here</p>
        <p class="text-sm text-gray-400 mb-4">Excel (.xlsx, .xls) or CSV — max 10MB</p>
        <button
          @click="fileInput?.click()"
          :disabled="loading"
          class="bg-primary hover:bg-red-700 disabled:opacity-60 text-white font-medium py-2.5 px-6 rounded-lg text-sm transition-colors"
        >
          <i v-if="loading" class="fa-solid fa-spinner fa-spin mr-2"></i>
          <i v-else class="fa-solid fa-folder-open mr-2"></i>
          {{ loading ? 'Parsing file…' : 'Browse Files' }}
        </button>
        <input ref="fileInput" type="file" accept=".xlsx,.xls,.csv" class="hidden" @change="onFileSelect" />
      </div>
    </div>

    <!-- Step 2: Column Mapping -->
    <div v-if="step === 2" class="space-y-5">
      <div class="bg-white border border-gray-200 rounded-xl p-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="font-semibold text-gray-900">Map Columns</h2>
            <p class="text-xs text-gray-500 mt-0.5">
              {{ filename }} — {{ totalRows }} rows detected.
              Tell us what each column in your file represents.
            </p>
          </div>
          <div class="flex items-center gap-3">
            <div v-if="templates.length > 0" class="relative">
              <button
                @click="showTemplateDropdown = !showTemplateDropdown"
                class="text-xs font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <i class="fa-solid fa-file-import"></i> Load Template
                <i class="fa-solid fa-chevron-down text-[8px]"></i>
              </button>
              <div v-if="showTemplateDropdown" class="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 w-64 py-1">
                <div v-for="t in templates" :key="t.id" class="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 group">
                  <button @click="applyTemplate(t.id)" class="flex-1 text-left text-sm text-gray-700 truncate">{{ t.name }}</button>
                  <button @click.stop="deleteTemplate(t.id)" class="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <i class="fa-solid fa-trash-can text-xs"></i>
                  </button>
                </div>
              </div>
            </div>
            <span class="text-xs font-medium text-primary bg-red-50 px-2.5 py-1 rounded-full">
              {{ mappedFieldCount }} fields mapped
            </span>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-gray-50 text-gray-500 text-xs uppercase">
                <th class="text-left px-4 py-2.5">Your Column</th>
                <th class="text-left px-4 py-2.5">Sample Data</th>
                <th class="text-left px-4 py-2.5 w-64">Maps To</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(header, idx) in headers" :key="idx" class="border-t border-gray-100">
                <td class="px-4 py-3 font-medium text-gray-800">{{ header || `Column ${idx + 1}` }}</td>
                <td class="px-4 py-3 text-gray-500 text-xs font-mono max-w-[200px] truncate">
                  {{ previewData.slice(0, 3).map(r => r[idx]).filter(Boolean).join(', ') || '—' }}
                </td>
                <td class="px-4 py-3">
                  <select
                    v-model="columnMapping[idx]"
                    class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    :class="columnMapping[idx] === '_skip' ? 'text-gray-400' : 'text-gray-800'"
                  >
                    <option value="_skip">— Skip —</option>
                    <optgroup label="Core Fields">
                      <option v-for="(label, field) in targetFields" :key="field" :value="field"
                        :disabled="Object.values(columnMapping).includes(field) && columnMapping[idx] !== field">
                        {{ label }}
                      </option>
                    </optgroup>
                    <optgroup v-if="Object.keys(featureFields).length" label="Features (Yes/No columns)">
                      <option v-for="(label, field) in featureFields" :key="field" :value="field"
                        :disabled="Object.values(columnMapping).includes(field) && columnMapping[idx] !== field">
                        {{ label }}
                      </option>
                    </optgroup>
                    <optgroup v-if="Object.keys(attributeFields).length" label="Attributes">
                      <option v-for="(label, field) in attributeFields" :key="field" :value="field"
                        :disabled="Object.values(columnMapping).includes(field) && columnMapping[idx] !== field">
                        {{ label }}
                      </option>
                    </optgroup>
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Preview -->
      <div class="bg-white border border-gray-200 rounded-xl p-6">
        <h3 class="text-sm font-semibold text-gray-700 mb-3">Preview (first {{ Math.min(5, previewData.length) }} rows)</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-xs">
            <thead>
              <tr class="bg-gray-50 text-gray-500 uppercase">
                <th class="px-3 py-2 text-left">#</th>
                <th v-for="(header, idx) in headers" :key="idx" class="px-3 py-2 text-left">
                  <span :class="columnMapping[idx] !== '_skip' ? 'text-primary font-bold' : 'text-gray-400'">
                    {{ columnMapping[idx] !== '_skip' ? (targetFields[columnMapping[idx]] ?? featureFields[columnMapping[idx]] ?? attributeFields[columnMapping[idx]] ?? header) : header }}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, rIdx) in previewData.slice(0, 5)" :key="rIdx" class="border-t border-gray-100">
                <td class="px-3 py-2 text-gray-400">{{ rIdx + 1 }}</td>
                <td v-for="(cell, cIdx) in row" :key="cIdx" class="px-3 py-2 text-gray-700 font-mono max-w-[150px] truncate">
                  {{ cell ?? '' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="flex justify-between">
        <button @click="resetWizard" class="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1.5">
          <i class="fa-solid fa-arrow-left text-xs"></i> Start Over
        </button>
        <button
          @click="saveColumnMapping"
          :disabled="loading || mappedFieldCount === 0"
          class="bg-primary hover:bg-red-700 disabled:opacity-60 text-white font-medium py-2.5 px-6 rounded-lg text-sm transition-colors flex items-center gap-2"
        >
          <i v-if="loading" class="fa-solid fa-spinner fa-spin"></i>
          Next: Map Values <i class="fa-solid fa-arrow-right text-xs"></i>
        </button>
      </div>
    </div>

    <!-- Step 3: Value Mapping -->
    <div v-if="step === 3" class="space-y-5">

      <!-- Brand matching -->
      <div v-if="distinctValues.brand?.length" class="bg-white border border-gray-200 rounded-xl p-6">
        <h2 class="font-semibold text-gray-900 mb-1">Brand Matching</h2>
        <p class="text-xs text-gray-500 mb-4">Match the brand names in your file to existing brands, or create new ones.</p>

        <div class="space-y-2">
          <div v-for="raw in distinctValues.brand" :key="raw"
            class="flex items-center gap-3 p-3 rounded-lg border"
            :class="newBrands.includes(raw) ? 'border-green-200 bg-green-50' :
              brandSuggestions[raw]?.confidence === 'exact' ? 'border-gray-100 bg-gray-50' :
              brandSuggestions[raw]?.confidence === 'fuzzy' ? 'border-yellow-200 bg-yellow-50' :
              'border-red-200 bg-red-50'"
          >
            <span class="text-sm font-medium text-gray-800 w-36 shrink-0">{{ raw }}</span>
            <i class="fa-solid text-xs shrink-0"
              :class="newBrands.includes(raw) ? 'fa-plus text-green-500' :
                brandSuggestions[raw]?.confidence === 'exact' ? 'fa-check text-green-500' :
                brandSuggestions[raw]?.confidence === 'fuzzy' ? 'fa-question text-yellow-500' :
                'fa-times text-red-500'"
            ></i>
            <select
              v-if="!newBrands.includes(raw)"
              :value="valueMapping.brand?.[raw] ?? ''"
              @change="setBrandMapping(raw, ($event.target as HTMLSelectElement).value)"
              class="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">— Select brand —</option>
              <option v-for="b in existingBrands" :key="b.id" :value="b.name">{{ b.name }}</option>
            </select>
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

      <!-- Category / Body Type matching -->
      <div v-if="distinctValues.category?.length" class="bg-white border border-gray-200 rounded-xl p-6">
        <h2 class="font-semibold text-gray-900 mb-1">Body Type / Category Matching</h2>
        <p class="text-xs text-gray-500 mb-4">Match body types in your file to existing vehicle categories.</p>

        <div class="space-y-2">
          <div v-for="raw in distinctValues.category" :key="raw"
            class="flex items-center gap-3 p-3 rounded-lg border"
            :class="categorySuggestions[raw]?.confidence === 'exact' ? 'border-gray-100 bg-gray-50' :
              categorySuggestions[raw]?.confidence === 'fuzzy' ? 'border-yellow-200 bg-yellow-50' :
              'border-red-200 bg-red-50'"
          >
            <span class="text-sm font-medium text-gray-800 w-36 shrink-0">{{ raw }}</span>
            <i class="fa-solid text-xs shrink-0"
              :class="categorySuggestions[raw]?.confidence === 'exact' ? 'fa-check text-green-500' :
                categorySuggestions[raw]?.confidence === 'fuzzy' ? 'fa-question text-yellow-500' :
                'fa-times text-red-500'"
            ></i>
            <select
              :value="valueMapping.category?.[raw] ?? ''"
              @change="setCategoryMapping(raw, ($event.target as HTMLSelectElement).value)"
              class="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">— Select category —</option>
              <option v-for="c in existingCategories" :key="c.id" :value="c.name">{{ c.name }}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Transmission mapping -->
      <div v-if="distinctValues.transmission?.length" class="bg-white border border-gray-200 rounded-xl p-6">
        <h2 class="font-semibold text-gray-900 mb-1">Transmission Mapping</h2>
        <p class="text-xs text-gray-500 mb-4">Map transmission values in your file to our format.</p>
        <div class="space-y-2">
          <div v-for="raw in distinctValues.transmission" :key="raw" class="flex items-center gap-3">
            <span class="text-sm font-mono text-gray-700 w-36 shrink-0">{{ raw }}</span>
            <i class="fa-solid fa-arrow-right text-xs text-gray-300"></i>
            <select
              v-model="valueMapping.transmission[raw]"
              class="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">— Select —</option>
              <option value="automatic">Automatic</option>
              <option value="manual">Manual</option>
              <option value="cvt">CVT</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Fuel type mapping -->
      <div v-if="distinctValues.fuel_type?.length" class="bg-white border border-gray-200 rounded-xl p-6">
        <h2 class="font-semibold text-gray-900 mb-1">Fuel Type Mapping</h2>
        <p class="text-xs text-gray-500 mb-4">Map fuel type values in your file to our format.</p>
        <div class="space-y-2">
          <div v-for="raw in distinctValues.fuel_type" :key="raw" class="flex items-center gap-3">
            <span class="text-sm font-mono text-gray-700 w-36 shrink-0">{{ raw }}</span>
            <i class="fa-solid fa-arrow-right text-xs text-gray-300"></i>
            <select
              v-model="valueMapping.fuel_type[raw]"
              class="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">— Select —</option>
              <option value="petrol">Petrol</option>
              <option value="diesel">Diesel</option>
              <option value="hybrid">Hybrid</option>
              <option value="electric">Electric</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Drive type mapping -->
      <div v-if="distinctValues.drive_type?.length" class="bg-white border border-gray-200 rounded-xl p-6">
        <h2 class="font-semibold text-gray-900 mb-1">Drive Type Mapping</h2>
        <p class="text-xs text-gray-500 mb-4">Map drive type values in your file to our format.</p>
        <div class="space-y-2">
          <div v-for="raw in distinctValues.drive_type" :key="raw" class="flex items-center gap-3">
            <span class="text-sm font-mono text-gray-700 w-36 shrink-0">{{ raw }}</span>
            <i class="fa-solid fa-arrow-right text-xs text-gray-300"></i>
            <select
              v-model="valueMapping.drive_type[raw]"
              class="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">— Select —</option>
              <option value="fwd">FWD (Front Wheel Drive)</option>
              <option value="rwd">RWD (Rear Wheel Drive)</option>
              <option value="awd">AWD (All Wheel Drive)</option>
              <option value="4wd">4WD (Four Wheel Drive)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Status mapping -->
      <div v-if="distinctValues.status?.length" class="bg-white border border-gray-200 rounded-xl p-6">
        <h2 class="font-semibold text-gray-900 mb-1">Status Mapping</h2>
        <p class="text-xs text-gray-500 mb-4">Map vehicle statuses in your file to our format.</p>
        <div class="space-y-2">
          <div v-for="raw in distinctValues.status" :key="raw" class="flex items-center gap-3">
            <span class="text-sm font-mono text-gray-700 w-36 shrink-0">{{ raw }}</span>
            <i class="fa-solid fa-arrow-right text-xs text-gray-300"></i>
            <select
              v-model="valueMapping.status[raw]"
              class="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">— Select —</option>
              <option value="draft">Draft</option>
              <option value="in_transit">In Transit</option>
              <option value="available">Available</option>
              <option value="reserved">Reserved</option>
              <option value="sold">Sold</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Feature list matching (from comma/pipe-separated column) -->
      <div v-if="featureListValues.length" class="bg-white border border-gray-200 rounded-xl p-6">
        <h2 class="font-semibold text-gray-900 mb-1">
          <i class="fa-solid fa-list text-primary mr-1.5"></i>
          Features from List Column
        </h2>
        <p class="text-xs text-gray-500 mb-4">
          We found {{ featureListValues.length }} unique feature names in the features/extras column. Match them to existing features or create new ones.
        </p>
        <div class="space-y-2">
          <div v-for="name in featureListValues" :key="name"
            class="flex items-center gap-3 p-3 rounded-lg border"
            :class="newFeatureListItems.includes(name) ? 'border-green-200 bg-green-50' :
              featureListMapping[name] ? 'border-green-100 bg-green-50' : 'border-gray-100 bg-gray-50'"
          >
            <span class="text-sm font-medium text-gray-800 w-40 shrink-0 truncate" :title="name">{{ name }}</span>
            <i class="fa-solid text-xs shrink-0"
              :class="newFeatureListItems.includes(name) ? 'fa-plus text-green-500' :
                featureListMapping[name] ? 'fa-check text-green-500' : 'fa-minus text-gray-300'"
            ></i>

            <!-- Match to existing feature -->
            <select
              v-if="!newFeatureListItems.includes(name)"
              :value="featureListMapping[name] ? String(featureListMapping[name]) : ''"
              @change="setFeatureListMapping(name, ($event.target as HTMLSelectElement).value)"
              class="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300/30"
            >
              <option value="">— Skip —</option>
              <option v-for="f in featuresFromMapping" :key="f.id" :value="String(f.id)">
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

      <!-- Skipped columns → potential features or attributes -->
      <div v-if="skippedColumns.length" class="bg-white border border-gray-200 rounded-xl p-6">
        <h2 class="font-semibold text-gray-900 mb-1">
          <i class="fa-solid fa-tags text-primary mr-1.5"></i>
          Unmapped Columns
        </h2>
        <p class="text-xs text-gray-500 mb-4">
          These {{ skippedColumns.length }} columns were skipped. Match them as <strong>attributes</strong> (values like "5", "Leather") or <strong>features</strong> (Yes/No toggles like ABS, Sunroof).
        </p>
        <div class="space-y-3">
          <div v-for="col in skippedColumns" :key="col.index"
            class="p-3 rounded-lg border"
            :class="(newFeatureColumns.includes(col.index) || newAttributeColumns.includes(col.index)) ? 'border-green-200 bg-green-50' :
              (skippedFeatureMapping[col.index] || skippedAttributeMapping[col.index]) ? 'border-green-100 bg-green-50' : 'border-gray-100 bg-gray-50'"
          >
            <div class="flex items-center gap-3">
              <!-- Column info -->
              <div class="w-36 shrink-0">
                <span class="text-sm font-medium text-gray-800 block truncate" :title="col.header">{{ col.header }}</span>
                <span class="text-[10px] text-gray-400 font-mono block truncate">{{ col.sampleValues.join(', ') || '—' }}</span>
              </div>

              <!-- Type toggle -->
              <div class="flex rounded-md border border-gray-200 overflow-hidden shrink-0">
                <button
                  @click="setSkippedColumnType(col.index, 'attribute')"
                  class="px-2.5 py-1 text-xs font-medium transition-colors"
                  :class="skippedColumnType[col.index] === 'attribute' ? 'bg-blue-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'"
                >Attribute</button>
                <button
                  @click="setSkippedColumnType(col.index, 'feature')"
                  class="px-2.5 py-1 text-xs font-medium transition-colors border-l border-gray-200"
                  :class="skippedColumnType[col.index] === 'feature' ? 'bg-purple-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'"
                >Feature</button>
              </div>

              <i class="fa-solid text-xs shrink-0"
                :class="(newFeatureColumns.includes(col.index) || newAttributeColumns.includes(col.index)) ? 'fa-plus text-green-500' :
                  (skippedFeatureMapping[col.index] || skippedAttributeMapping[col.index]) ? 'fa-check text-green-500' : 'fa-minus text-gray-300'"
              ></i>

              <!-- ── Attribute mode ── -->
              <template v-if="skippedColumnType[col.index] === 'attribute'">
                <!-- Match to existing attribute -->
                <select
                  v-if="!newAttributeColumns.includes(col.index)"
                  :value="skippedAttributeMapping[col.index] ?? ''"
                  @change="setSkippedAttributeMapping(col.index, ($event.target as HTMLSelectElement).value)"
                  class="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300/30"
                >
                  <option value="">— Skip —</option>
                  <option v-for="a in attributesFromMapping" :key="a.id" :value="String(a.id)">
                    {{ a.name }}{{ a.unit ? ` (${a.unit})` : '' }}
                  </option>
                </select>
                <!-- Creating as new attribute -->
                <template v-else>
                  <span class="text-sm text-green-700 font-medium shrink-0">Create as</span>
                  <select
                    v-model="newAttributeType[col.index]"
                    class="border border-green-200 bg-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300/30"
                  >
                    <option v-for="t in attributeTypes" :key="t" :value="t">
                      {{ t.charAt(0).toUpperCase() + t.slice(1) }}
                    </option>
                  </select>
                </template>
                <button
                  @click="toggleNewAttributeColumn(col.index)"
                  class="text-xs px-2.5 py-1 rounded-md shrink-0 transition-colors"
                  :class="newAttributeColumns.includes(col.index) ? 'bg-gray-200 text-gray-600 hover:bg-gray-300' : 'bg-green-100 text-green-700 hover:bg-green-200'"
                >
                  {{ newAttributeColumns.includes(col.index) ? 'Cancel' : '+ New' }}
                </button>
              </template>

              <!-- ── Feature mode ── -->
              <template v-else>
                <!-- Match to existing feature -->
                <select
                  v-if="!newFeatureColumns.includes(col.index)"
                  :value="skippedFeatureMapping[col.index] ?? ''"
                  @change="setSkippedFeatureMapping(col.index, ($event.target as HTMLSelectElement).value)"
                  class="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300/30"
                >
                  <option value="">— Skip —</option>
                  <option v-for="f in featuresFromMapping" :key="f.id" :value="String(f.id)">
                    {{ f.name }} ({{ f.category }})
                  </option>
                </select>
                <!-- Creating as new feature -->
                <template v-else>
                  <span class="text-sm text-green-700 font-medium shrink-0">Create as</span>
                  <select
                    v-model="newFeatureCategory[col.index]"
                    class="border border-green-200 bg-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300/30"
                  >
                    <option v-for="cat in featureCategories" :key="cat" :value="cat">
                      {{ cat.charAt(0).toUpperCase() + cat.slice(1) }}
                    </option>
                  </select>
                </template>
                <button
                  @click="toggleNewFeatureColumn(col.index)"
                  class="text-xs px-2.5 py-1 rounded-md shrink-0 transition-colors"
                  :class="newFeatureColumns.includes(col.index) ? 'bg-gray-200 text-gray-600 hover:bg-gray-300' : 'bg-green-100 text-green-700 hover:bg-green-200'"
                >
                  {{ newFeatureColumns.includes(col.index) ? 'Cancel' : '+ New' }}
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- No value mapping needed -->
      <div v-if="!distinctValues.brand?.length && !distinctValues.category?.length && !distinctValues.transmission?.length && !distinctValues.fuel_type?.length && !distinctValues.drive_type?.length && !distinctValues.status?.length && !featureListValues.length && !skippedColumns.length"
        class="bg-white border border-gray-200 rounded-xl p-8 text-center">
        <i class="fa-solid fa-check-circle text-green-500 text-3xl mb-3"></i>
        <p class="text-gray-600 font-medium">No value mapping needed</p>
        <p class="text-sm text-gray-400 mt-1">All mapped columns contain simple values that don't need translation.</p>
      </div>

      <!-- Feature/attribute summary info -->
      <div v-if="hasFeatureOrAttrMappings" class="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div class="flex items-start gap-3">
          <i class="fa-solid fa-circle-info text-blue-500 mt-0.5"></i>
          <div>
            <p class="text-sm text-blue-800 font-medium">Feature & Attribute Columns Detected</p>
            <p class="text-xs text-blue-600 mt-0.5">
              <strong>Feature</strong> columns are imported as Yes/No toggles (values like "Yes", "Y", "1" are treated as enabled).
              <strong>Attribute</strong> columns import their actual values (e.g. "5 seats", "Leather").
            </p>
          </div>
        </div>
      </div>

      <div class="flex justify-between">
        <button @click="step = 2" class="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1.5">
          <i class="fa-solid fa-arrow-left text-xs"></i> Back
        </button>
        <button
          @click="saveValueMapping"
          :disabled="loading"
          class="bg-primary hover:bg-red-700 disabled:opacity-60 text-white font-medium py-2.5 px-6 rounded-lg text-sm transition-colors flex items-center gap-2"
        >
          <i v-if="loading" class="fa-solid fa-spinner fa-spin"></i>
          Next: Validate <i class="fa-solid fa-arrow-right text-xs"></i>
        </button>
      </div>
    </div>

    <!-- Step 4: Validation -->
    <div v-if="step === 4" class="space-y-5">
      <div v-if="loading" class="bg-white border border-gray-200 rounded-xl p-12 text-center">
        <i class="fa-solid fa-spinner fa-spin text-3xl text-primary mb-3"></i>
        <p class="text-gray-600 font-medium">Validating your data…</p>
      </div>

      <template v-else-if="validationResult">
        <!-- Summary -->
        <div class="grid grid-cols-3 gap-4">
          <div class="bg-white border border-gray-200 rounded-xl p-5 text-center">
            <p class="text-2xl font-bold text-gray-900">{{ validationResult.totalRows }}</p>
            <p class="text-xs text-gray-500 mt-1">Total Rows</p>
          </div>
          <div class="bg-white border border-green-200 rounded-xl p-5 text-center">
            <p class="text-2xl font-bold text-green-600">{{ validationResult.validRows }}</p>
            <p class="text-xs text-gray-500 mt-1">Valid</p>
          </div>
          <div class="bg-white border rounded-xl p-5 text-center" :class="validationResult.failedRows > 0 ? 'border-red-200' : 'border-gray-200'">
            <p class="text-2xl font-bold" :class="validationResult.failedRows > 0 ? 'text-red-600' : 'text-gray-400'">{{ validationResult.failedRows }}</p>
            <p class="text-xs text-gray-500 mt-1">Invalid</p>
          </div>
        </div>

        <!-- Errors table -->
        <div v-if="validationResult.failedRows > 0" class="bg-white border border-gray-200 rounded-xl p-6">
          <h3 class="text-sm font-semibold text-red-700 mb-3">
            <i class="fa-solid fa-triangle-exclamation mr-1.5"></i>
            {{ validationResult.failedRows }} rows with errors
          </h3>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-red-50 text-red-700 text-xs uppercase">
                  <th class="text-left px-4 py-2.5">Row</th>
                  <th class="text-left px-4 py-2.5">Field</th>
                  <th class="text-left px-4 py-2.5">Value</th>
                  <th class="text-left px-4 py-2.5">Error</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="errRow in paginatedErrors" :key="errRow.row">
                  <tr v-for="(err, eIdx) in errRow.errors" :key="`${errRow.row}-${eIdx}`" class="border-t border-gray-100">
                    <td v-if="eIdx === 0" :rowspan="errRow.errors.length" class="px-4 py-2 text-gray-700 font-medium">{{ errRow.row }}</td>
                    <td class="px-4 py-2 text-gray-600 font-mono text-xs">{{ err.field }}</td>
                    <td class="px-4 py-2 text-gray-500 font-mono text-xs">{{ err.value ?? '(empty)' }}</td>
                    <td class="px-4 py-2 text-red-600 text-xs">{{ err.message }}</td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
          <!-- Pagination -->
          <div v-if="totalErrorPages > 1" class="flex items-center justify-center gap-2 mt-4">
            <button @click="errorPage = Math.max(1, errorPage - 1)" :disabled="errorPage === 1"
              class="px-2.5 py-1 text-xs rounded border border-gray-200 disabled:opacity-40">Prev</button>
            <span class="text-xs text-gray-500">{{ errorPage }} / {{ totalErrorPages }}</span>
            <button @click="errorPage = Math.min(totalErrorPages, errorPage + 1)" :disabled="errorPage === totalErrorPages"
              class="px-2.5 py-1 text-xs rounded border border-gray-200 disabled:opacity-40">Next</button>
          </div>
        </div>

        <!-- All valid -->
        <div v-if="validationResult.failedRows === 0" class="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <i class="fa-solid fa-circle-check text-green-500 text-3xl mb-2"></i>
          <p class="text-green-800 font-medium">All {{ validationResult.validRows }} rows are valid and ready to import!</p>
        </div>

        <!-- Data Quality Warnings -->
        <div v-if="validationResult.warnings?.length" class="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <h3 class="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-2">
            <i class="fa-solid fa-lightbulb text-amber-500"></i>
            Data Quality Insights
          </h3>
          <div class="space-y-2">
            <div v-for="(w, wIdx) in validationResult.warnings" :key="wIdx"
              class="flex items-start gap-2.5 text-sm"
            >
              <i class="fa-solid mt-0.5 text-xs shrink-0"
                :class="w.level === 'warning' ? 'fa-triangle-exclamation text-amber-500' : 'fa-circle-info text-blue-400'"
              ></i>
              <span :class="w.level === 'warning' ? 'text-amber-800' : 'text-amber-700'">{{ w.message }}</span>
            </div>
          </div>
          <p class="text-xs text-amber-500 mt-3">These are informational only and won't block your import.</p>
        </div>

        <div class="flex justify-between">
          <button @click="step = 3" class="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1.5">
            <i class="fa-solid fa-arrow-left text-xs"></i> Back
          </button>
          <div class="flex gap-3">
            <button
              @click="showSaveTemplateModal = true"
              class="border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium py-2.5 px-4 rounded-lg text-sm transition-colors flex items-center gap-2"
            >
              <i class="fa-solid fa-floppy-disk"></i> Save as Template
            </button>
            <button
              v-if="validationResult.validRows > 0"
              @click="executeImport(true)"
              :disabled="loading"
              class="bg-primary hover:bg-red-700 disabled:opacity-60 text-white font-medium py-2.5 px-6 rounded-lg text-sm transition-colors flex items-center gap-2"
            >
              <i v-if="loading" class="fa-solid fa-spinner fa-spin"></i>
              <i v-else class="fa-solid fa-play"></i>
              Import {{ validationResult.validRows }} valid rows
              <span v-if="validationResult.failedRows > 0" class="text-xs opacity-75">(skip {{ validationResult.failedRows }} invalid)</span>
            </button>
          </div>
        </div>
      </template>
    </div>

    <!-- Step 5: Import Progress -->
    <div v-if="step === 5" class="bg-white border border-gray-200 rounded-xl p-8">

      <!-- In progress -->
      <div v-if="!importStatus || importStatus.status === 'importing'" class="text-center">
        <i class="fa-solid fa-cog fa-spin text-4xl text-primary mb-4"></i>
        <p class="text-gray-800 font-semibold text-lg mb-2">Importing vehicles…</p>
        <div class="max-w-md mx-auto">
          <div class="bg-gray-200 rounded-full h-3 overflow-hidden mb-2">
            <div class="bg-primary h-3 rounded-full transition-all duration-500" :style="{ width: progressPercent + '%' }"></div>
          </div>
          <p class="text-sm text-gray-500">
            {{ importStatus?.importedRows ?? 0 }} imported,
            {{ importStatus?.skippedRows ?? 0 }} skipped
            — {{ progressPercent }}%
          </p>
        </div>
      </div>

      <!-- Completed -->
      <div v-else-if="importStatus.status === 'completed'" class="text-center">
        <i class="fa-solid fa-circle-check text-5xl text-green-500 mb-4"></i>
        <p class="text-gray-800 font-bold text-xl mb-2">Import Complete!</p>
        <div class="flex justify-center gap-6 text-sm mb-6">
          <div class="text-center">
            <p class="text-2xl font-bold text-green-600">{{ importStatus.importedRows }}</p>
            <p class="text-gray-500">Imported</p>
          </div>
          <div v-if="importStatus.skippedRows > 0" class="text-center">
            <p class="text-2xl font-bold text-yellow-500">{{ importStatus.skippedRows }}</p>
            <p class="text-gray-500">Skipped</p>
          </div>
          <div v-if="importStatus.failedRows > 0" class="text-center">
            <p class="text-2xl font-bold text-red-500">{{ importStatus.failedRows }}</p>
            <p class="text-gray-500">Failed</p>
          </div>
        </div>
        <p class="text-xs text-gray-400 mb-6">All imported vehicles are set to <strong>Draft</strong> status. Review and publish them from the vehicle list.</p>
        <div class="flex justify-center gap-3">
          <NuxtLink to="/backoffice/vehicles"
            class="bg-primary hover:bg-red-700 text-white font-medium py-2.5 px-6 rounded-lg text-sm transition-colors">
            <i class="fa-solid fa-list mr-2"></i> View Vehicles
          </NuxtLink>
          <button @click="resetWizard"
            class="border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium py-2.5 px-6 rounded-lg text-sm transition-colors">
            <i class="fa-solid fa-upload mr-2"></i> Import Another
          </button>
        </div>
      </div>

      <!-- Failed -->
      <div v-else-if="importStatus.status === 'failed'" class="text-center">
        <i class="fa-solid fa-circle-xmark text-5xl text-red-500 mb-4"></i>
        <p class="text-gray-800 font-bold text-xl mb-2">Import Failed</p>
        <p class="text-sm text-red-600 mb-6">{{ importStatus.errorMessage ?? 'An unexpected error occurred.' }}</p>
        <div class="flex justify-center gap-3">
          <button @click="resetWizard"
            class="bg-primary hover:bg-red-700 text-white font-medium py-2.5 px-6 rounded-lg text-sm transition-colors">
            <i class="fa-solid fa-redo mr-2"></i> Try Again
          </button>
        </div>
      </div>
    </div>

    <!-- Save Template Modal -->
    <Teleport to="body">
      <div v-if="showSaveTemplateModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/40" @click="showSaveTemplateModal = false"></div>
        <div class="relative bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
          <h3 class="font-semibold text-gray-900 mb-1">Save Import Template</h3>
          <p class="text-xs text-gray-500 mb-4">Save your current column and value mappings for reuse on future imports.</p>
          <input
            v-model="templateName"
            type="text"
            placeholder="e.g. Japan Auction Sheet"
            maxlength="100"
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 mb-4"
            @keydown.enter="saveAsTemplate"
          />
          <div class="flex justify-end gap-2">
            <button @click="showSaveTemplateModal = false" class="text-sm text-gray-500 hover:text-gray-700 px-3 py-2">Cancel</button>
            <button
              @click="saveAsTemplate"
              :disabled="!templateName.trim() || savingTemplate"
              class="bg-primary hover:bg-red-700 disabled:opacity-60 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors flex items-center gap-2"
            >
              <i v-if="savingTemplate" class="fa-solid fa-spinner fa-spin"></i>
              <i v-else class="fa-solid fa-floppy-disk"></i>
              Save Template
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>
