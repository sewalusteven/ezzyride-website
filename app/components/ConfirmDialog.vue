<script setup lang="ts">
import { Dialog, DialogPanel, DialogTitle, TransitionRoot, TransitionChild } from '@headlessui/vue'

defineProps<{
  show: boolean
  title: string
  message: string
  confirmLabel?: string
}>()

const emit = defineEmits<{ confirm: []; cancel: [] }>()
</script>

<template>
  <TransitionRoot :show="show" as="template">
    <Dialog as="div" class="relative z-[300]" @close="emit('cancel')">
      <TransitionChild
        as="template"
        enter="ease-out duration-200" enter-from="opacity-0" enter-to="opacity-100"
        leave="ease-in duration-150" leave-from="opacity-100" leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black/40" />
      </TransitionChild>
      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4">
          <TransitionChild
            as="template"
            enter="ease-out duration-200" enter-from="opacity-0 scale-95" enter-to="opacity-100 scale-100"
            leave="ease-in duration-150" leave-from="opacity-100 scale-100" leave-to="opacity-0 scale-95"
          >
            <DialogPanel class="bg-white rounded-lg w-full max-w-sm shadow-xl p-6">
              <div class="flex items-start gap-4 mb-4">
                <div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <i class="fa-solid fa-triangle-exclamation text-red-600"></i>
                </div>
                <div>
                  <DialogTitle class="font-semibold text-gray-900 text-sm">{{ title }}</DialogTitle>
                  <p class="text-sm text-gray-500 mt-1">{{ message }}</p>
                </div>
              </div>
              <div class="flex justify-end gap-3">
                <button
                  class="cursor-pointer px-4 py-2 border border-gray-300 text-gray-600 rounded-md text-sm hover:bg-gray-50 transition-colors"
                  @click="emit('cancel')"
                >Cancel</button>
                <button
                  class="cursor-pointer px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                  @click="emit('confirm')"
                >{{ confirmLabel ?? 'Delete' }}</button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
