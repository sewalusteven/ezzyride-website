<script setup lang="ts">
import { VueTelInput } from 'vue-tel-input'
import 'vue-tel-input/vue-tel-input.css'

defineOptions({ name: 'PhoneInput' })

const props = defineProps<{
  modelValue: string
  placeholder?: string
  required?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'validate': [valid: boolean]
}>()

const phone = ref(props.modelValue)
const isValid = ref(true)

watch(() => props.modelValue, (v) => { phone.value = v })

const onInput = (formattedNumber: string, phoneObject: any) => {
  const number = phoneObject?.number || formattedNumber || ''
  emit('update:modelValue', number)
  isValid.value = phoneObject?.valid ?? true
  emit('validate', isValid.value)
}
</script>

<template>
  <div class="phone-input-wrapper">
    <VueTelInput
      v-model="phone"
      :preferred-countries="['ug', 'ke', 'tz', 'rw', 'gb', 'us', 'ae', 'jp']"
      :default-country="'ug'"
      :input-options="{
        placeholder: placeholder || '+256 700 000 000',
        required: required ?? false,
        styleClasses: 'w-full text-sm',
      }"
      :dropdown-options="{
        showSearchBox: true,
        showFlags: true,
        showDialCodeInSelection: true,
      }"
      mode="international"
      valid-characters-only
      @on-input="onInput"
    />
    <p v-if="phone && !isValid" class="text-xs text-red-500 mt-1">Please enter a valid phone number</p>
  </div>
</template>

<style>
.phone-input-wrapper .vue-tel-input {
  border: 1px solid #e5e7eb !important;
  border-radius: 0.5rem;
}
.phone-input-wrapper .vue-tel-input:focus-within {
  border-color: #dc2626 !important;
  box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.2) !important;
}
.phone-input-wrapper .vti__input {
  padding: 0.625rem 0.75rem !important;
  font-size: 0.875rem !important;
  border: none !important;
  outline: none !important;
  background: transparent !important;
}
.phone-input-wrapper .vti__dropdown {
  border-right: 1px solid #e5e7eb;
  padding: 0 0.5rem;
  background: transparent;
}
.phone-input-wrapper .vti__dropdown:hover {
  background: #f9fafb;
}
.phone-input-wrapper .vti__dropdown.open {
  background: #f3f4f6;
}
.phone-input-wrapper .vti__dropdown-list {
  z-index: 9999 !important;
  position: absolute !important;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  box-shadow: 0 10px 25px -5px rgba(0,0,0,0.15);
  background: white;
  max-height: 250px;
  overflow-y: auto;
}
.phone-input-wrapper .vti__dropdown-list.below {
  top: 100%;
  margin-top: 4px;
}
.phone-input-wrapper .vti__dropdown-item {
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  cursor: pointer;
}
.phone-input-wrapper .vti__dropdown-item:hover,
.phone-input-wrapper .vti__dropdown-item.highlighted {
  background: #eff6ff;
}
.phone-input-wrapper .vti__search_box {
  border: 1px solid #e5e7eb !important;
  border-radius: 0.375rem;
  margin: 0.5rem;
  padding: 0.375rem 0.5rem;
  font-size: 0.8125rem;
  width: calc(100% - 1rem);
  outline: none;
}
.phone-input-wrapper .vti__search_box:focus {
  border-color: #dc2626 !important;
}
</style>
