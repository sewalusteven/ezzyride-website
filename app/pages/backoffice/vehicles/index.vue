<script setup lang="ts">
definePageMeta({
  layout: 'admin-layout',
})
</script>

<template>
  <div id="vehicles-content" class="p-6">
    <div id="vehicles-header" class="flex items-center justify-between mb-6">
      <div class="flex items-center space-x-4">
        <div class="relative ">
          <i class="fa-solid fa-search absolute left-1 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          <input type="text" placeholder="Search vehicles..." class="pl-10 bg-white pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
        </div>
        <select class="px-3 py-2 border bg-white border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
          <option>All Status</option>
          <option>Available</option>
          <option>Sold</option>
          <option>Pending</option>
        </select>
        <select class="px-3 py-2 border bg-white border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
          <option>All Brands</option>
          <option>Mazda</option>
          <option>Honda</option>
          <option>Toyota</option>
        </select>
      </div>
      <button class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-red-700 flex items-center">
        <i class="fa-solid fa-plus mr-2"></i>
        Add New Vehicle
      </button>
    </div>

    <div id="vehicles-table-container" class="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mileage</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fuel</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
          <tr class="hover:bg-gray-50">
            <td class="px-4 py-3 whitespace-nowrap">
              <div class="flex items-center gap-2">
                <img class="h-10 w-10 rounded-md object-cover" src="https://storage.googleapis.com/uxpilot-auth.appspot.com/18fb42b5a4-d11b08aff7a5433e0861.png" alt="Mazda CX-5">
                <div class="ml-3">
                  <div class="text-sm font-medium text-gray-900">2020 Mazda CX-5</div>
                  <div class="text-sm text-gray-500">Automatic</div>
                </div>
              </div>
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">2020</td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">45,000 km</td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">Petrol</td>
            <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">UGX 65M</td>
            <td class="px-4 py-3 whitespace-nowrap">
              <span class="inline-flex px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">Available</span>
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-sm font-medium">
              <div class="flex space-x-1">
                <button class="text-primary hover:text-red-700" title="View Details">
                  <i class="fa-solid fa-eye"></i>
                </button>
                <button class="text-blue-600 hover:text-blue-800" title="Edit">
                  <i class="fa-solid fa-edit"></i>
                </button>
                <button class="text-red-600 hover:text-red-800" title="Delete">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>
            </td>
          </tr>
          <tr class="hover:bg-gray-50">
            <td class="px-4 py-3 whitespace-nowrap">
              <div class="flex gap-2 items-center">
                <img class="h-10 w-10 rounded-md object-cover" src="https://storage.googleapis.com/uxpilot-auth.appspot.com/8b8972e7d4-6ac4fdf1fd78d5b59121.png" alt="Honda Vezel">
                <div class="ml-3">
                  <div class="text-sm font-medium text-gray-900">2021 Honda Vezel</div>
                  <div class="text-sm text-gray-500">CVT</div>
                </div>
              </div>
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">2021</td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">32,000 km</td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">Hybrid</td>
            <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">UGX 55M</td>
            <td class="px-4 py-3 whitespace-nowrap">
              <span class="inline-flex px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full">Pending</span>
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-sm font-medium">
              <div class="flex space-x-1">
                <button class="text-primary hover:text-red-700" title="View Details">
                  <i class="fa-solid fa-eye"></i>
                </button>
                <button class="text-blue-600 hover:text-blue-800" title="Edit">
                  <i class="fa-solid fa-edit"></i>
                </button>
                <button class="text-red-600 hover:text-red-800" title="Delete">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>
            </td>
          </tr>
          <tr class="hover:bg-gray-50">
            <td class="px-4 py-3 whitespace-nowrap">
              <div class="flex gap-2 items-center">
                <img class="h-10 w-10 rounded-md object-cover" src="https://storage.googleapis.com/uxpilot-auth.appspot.com/0da086a912-aff652a26ade4fdb6cd2.png" alt="Toyota Harrier">
                <div class="ml-3">
                  <div class="text-sm font-medium text-gray-900">2019 Toyota Harrier</div>
                  <div class="text-sm text-gray-500">Automatic</div>
                </div>
              </div>
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">2019</td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">52,000 km</td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">Petrol</td>
            <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-500">UGX 72M</td>
            <td class="px-4 py-3 whitespace-nowrap">
              <span class="inline-flex px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">Sold</span>
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-sm font-medium">
              <div class="flex space-x-1">
                <button class="text-primary hover:text-red-700" title="View Details">
                  <i class="fa-solid fa-eye"></i>
                </button>
                <button class="text-gray-400" title="Archived" disabled>
                  <i class="fa-solid fa-archive"></i>
                </button>
              </div>
            </td>
          </tr>
          <tr class="hover:bg-gray-50">
            <td class="px-4 py-3 whitespace-nowrap">
              <div class="flex gap-2 items-center">
                <img class="h-10 w-10 rounded-md object-cover" src="https://storage.googleapis.com/uxpilot-auth.appspot.com/143da8583f-6b42766a8a1d6c178523.png" alt="Mazda CX-8">
                <div class="ml-3">
                  <div class="text-sm font-medium text-gray-900">2020 Mazda CX-8</div>
                  <div class="text-sm text-gray-500">Automatic</div>
                </div>
              </div>
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">2020</td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">38,000 km</td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">Diesel</td>
            <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">UGX 78M</td>
            <td class="px-4 py-3 whitespace-nowrap">
              <span class="inline-flex px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">Available</span>
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-sm font-medium">
              <div class="flex space-x-1">
                <button class="text-primary hover:text-red-700" title="View Details">
                  <i class="fa-solid fa-eye"></i>
                </button>
                <button class="text-blue-600 hover:text-blue-800" title="Edit">
                  <i class="fa-solid fa-edit"></i>
                </button>
                <button class="text-red-600 hover:text-red-800" title="Delete">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>
            </td>
          </tr>
          <tr class="hover:bg-gray-50">
            <td class="px-4 py-3 whitespace-nowrap">
              <div class="flex gap-2 items-center">
                <img class="h-10 w-10 rounded-md object-cover" src="https://storage.googleapis.com/uxpilot-auth.appspot.com/c52cc169de-f75d84c274e991de3fd3.png" alt="blue Honda CR-V SUV crossover vehicle" />
                <div class="ml-3">
                  <div class="text-sm font-medium text-gray-900">2021 Honda CR-V</div>
                  <div class="text-sm text-gray-500">CVT</div>
                </div>
              </div>
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">2021</td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">28,500 km</td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">Petrol</td>
            <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">UGX 68M</td>
            <td class="px-4 py-3 whitespace-nowrap">
              <span class="inline-flex px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">Available</span>
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-sm font-medium">
              <div class="flex space-x-1">
                <button class="text-primary hover:text-red-700" title="View Details">
                  <i class="fa-solid fa-eye"></i>
                </button>
                <button class="text-blue-600 hover:text-blue-800" title="Edit">
                  <i class="fa-solid fa-edit"></i>
                </button>
                <button class="text-red-600 hover:text-red-800" title="Delete">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
      <div class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
        <div class="flex-1 flex justify-between sm:hidden">
          <button class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">Previous</button>
          <button class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">Next</button>
        </div>
        <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p class="text-sm text-gray-700">Showing <span class="font-medium">1</span> to <span class="font-medium">5</span> of <span class="font-medium">127</span> results</p>
          </div>
          <div>
            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                <i class="fa-solid fa-chevron-left"></i>
              </button>
              <button class="bg-primary border-primary text-white relative inline-flex items-center px-4 py-2 border text-sm font-medium">1</button>
              <button class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                <i class="fa-solid fa-chevron-right"></i>
              </button>

            </nav>

          </div>

        </div>

      </div>

    </div>

  </div>
</template>

<style scoped>

</style>