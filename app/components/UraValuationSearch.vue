<script setup lang="ts">

import type {BatchInfo, VehicleValuation} from "~/types";
import {useTaxUtilities} from "~/composables/taxUtilities";

const {search, formatCurrency, fetchLatestBatchInfo, formatDate  } = useTaxUtilities()
const selectedCar = ref<VehicleValuation>()
const vehicles = ref<VehicleValuation[]>([])
const name = ref<string>("")
const batchInfo = ref<BatchInfo>()
const loading = ref<boolean>(false)

const emit = defineEmits(['vehicleSelected'])

function lookup(name: string){
  search(name).then(response => {
    vehicles.value = response
    loading.value = false
  }).catch(() => {
    loading.value = false
    vehicles.value = []
  })
}


watch(name, (newName) => {
  if(newName.length > 2){
    loading.value = true
    lookup(newName)
  }

  if(newName.length === 0){
    vehicles.value = []
  }
})

function clearSelection(){
  selectedCar.value = undefined
  vehicles.value = []
  name.value = ""
  loading.value = false
}

function selectVehicle(vehicle: VehicleValuation){
  selectedCar.value = vehicle
  vehicles.value = []
  emit('vehicleSelected', vehicle)
}

onMounted(() => {
  fetchLatestBatchInfo().then(response => {
    batchInfo.value = response
  })
})

</script>

<template>
  <div id="ura-section" class=" space-y-6">
    <div class="bg-green-50 p-4 rounded-lg border border-green-200">
      <div class="flex items-center mb-2">
        <i class="fa-solid fa-info-circle text-green-600 mr-2"></i>
        <h4 class="font-medium text-green-800">URA Official Valuation - <span v-if="batchInfo">{{ formatDate(batchInfo.review_date, 'MMM YYYY') }}</span></h4>
      </div>
      <p class="text-sm text-green-700">Search from URA's official vehicle valuation database for the most accurate tax calculations </p>

    </div>

    <div class="relative">
      <label class="block text-gray-700 font-semibold mb-2">Search Vehicle *</label>
      <div class="relative">
        <input type="text" v-model="name" id="vehicle-search" class="w-full p-4 border-2 bg-white border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition pr-12" placeholder="Type vehicle make/model (e.g. Honda Vezel, Mazda CX5)">
        <div class="absolute right-3 top-1/2 transform -translate-y-1/2">
          <i v-if="loading" id="search-loading" class="fa-solid fa-spinner fa-spin text-gray-400 hidden"></i>
          <i v-else id="search-icon" class="fa-solid fa-search text-gray-400"></i>
        </div>
      </div>
      <p v-if="vehicles.length === 0" class="text-sm text-gray-500 mt-1">Start typing to search URA vehicle database</p>

      <!-- Search Results Dropdown -->
      <div v-else id="search-results" class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-auto">
        <!-- Sample Results -->
        <div class="p-2">
          <div class="text-xs text-gray-500 px-3 py-2 bg-gray-50 font-medium">Found {{ vehicles.length }} matches for "{{ name }}"</div>

          <div v-for="vehicle in vehicles" :key="vehicle.id" class="hover:bg-blue-50 p-3 cursor-pointer border-b border-gray-100 transition" @click="selectVehicle(vehicle)">
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <h4 class="font-medium text-secondary text-sm mb-1">{{ vehicle.name }}</h4>
                <div class="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <span><i class="fa-solid fa-calendar mr-1"></i>{{ vehicle.year }}</span>
                  <span><i class="fa-solid fa-gas-pump mr-1"></i>{{ vehicle.cc + ' '+ vehicle.unit }}</span>
                  <span><i class="fa-solid fa-car mr-1"></i>{{ vehicle.model }}</span>
                  <span><i class="fa-solid fa-globe mr-1"></i>{{ vehicle.origin }}</span>
                </div>
              </div>
              <div class="text-right ml-4">
                <div class="text-primary font-bold text-sm">{{ formatCurrency(+vehicle.cif, "USD") }}</div>
                <div class="text-xs text-gray-500">CIF Value</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- Selected Vehicle Display -->
    <div v-if="selectedCar" id="selected-vehicle" class=" bg-white p-6 rounded-lg border-2 border-primary">
      <h4 class="font-semibold text-secondary mb-4 flex items-center">
        <i class="fa-solid fa-check-circle text-primary mr-2"></i>
        Selected Vehicle
      </h4>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <span class="text-gray-600">Model:</span>
          <span id="selected-name" class="ml-2 font-medium text-secondary">{{ selectedCar.name }}</span>
        </div>
        <div>
          <span class="text-gray-600">Engine ({{ selectedCar.unit.toUpperCase() }}):</span>
          <span id="selected-cc" class="ml-2 font-medium text-secondary">{{ selectedCar.cc }}</span>
        </div>
        <div>
          <span class="text-gray-600">Origin:</span>
          <span id="selected-origin" class="ml-2 font-medium text-secondary">{{ selectedCar.origin }}</span>
        </div>
        <div>
          <span class="text-gray-600">CIF Value:</span>
          <span id="selected-cif" class="ml-2 font-medium text-primary">{{ formatCurrency(+selectedCar.cif, 'USD') }}</span>
        </div>
      </div>
      <button type="button" class="mt-4 cursor-pointer text-sm text-primary hover:text-red-600 transition" @click="clearSelection()">
        <i class="fa-solid fa-times mr-1"></i>Change Selection
      </button>
    </div>
  </div>
</template>

<style scoped>

</style>