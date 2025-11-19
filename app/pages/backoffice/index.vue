<script setup lang="ts">
definePageMeta({
  layout: 'admin-layout',
})
</script>

<template>
  <div id="dashboard-content" class="p-6">
    <!-- Stats Cards -->
    <div id="stats-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="bg-white p-4 rounded-lg border border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Total Vehicles</p>
            <p class="text-2xl font-semibold text-gray-900">127</p>
          </div>
          <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <i class="fa-solid fa-car text-blue-600"></i>
          </div>
        </div>
      </div>

      <div class="bg-white p-4 rounded-lg border border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Active Listings</p>
            <p class="text-2xl font-semibold text-gray-900">89</p>
          </div>
          <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <i class="fa-solid fa-check-circle text-green-600"></i>
          </div>
        </div>
      </div>

      <div class="bg-white p-4 rounded-lg border border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Pending Imports</p>
            <p class="text-2xl font-semibold text-gray-900">23</p>
          </div>
          <div class="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
            <i class="fa-solid fa-clock text-yellow-600"></i>
          </div>
        </div>
      </div>

      <div class="bg-white p-4 rounded-lg border border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">New Inquiries</p>
            <p class="text-2xl font-semibold text-gray-900">15</p>
          </div>
          <div class="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
            <i class="fa-solid fa-envelope text-red-600"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions & Recent Activity -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- Quick Actions -->
      <div id="quick-actions" class="bg-white p-4 rounded-lg border border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div class="space-y-2">
          <button class="w-full flex items-center px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-md">
            <i class="fa-solid fa-plus w-4 h-4 mr-3 text-primary"></i>
            Add New Vehicle
          </button>
          <button class="w-full flex items-center px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-md">
            <i class="fa-solid fa-edit w-4 h-4 mr-3 text-primary"></i>
            Update Tax Rates
          </button>
          <button class="w-full flex items-center px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-md">
            <i class="fa-solid fa-chart-line w-4 h-4 mr-3 text-primary"></i>
            Update Valuations
          </button>
          <button class="w-full flex items-center px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-md">
            <i class="fa-solid fa-file-export w-4 h-4 mr-3 text-primary"></i>
            Export Reports
          </button>
        </div>
      </div>

      <!-- Recent Activity -->
      <div id="recent-activity" class="lg:col-span-2 bg-white p-4 rounded-lg border border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div class="space-y-3">
          <div class="flex items-start space-x-3">
            <div class="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-gray-900">New vehicle added: 2020 Mazda CX-5</p>
              <p class="text-xs text-gray-500">2 hours ago</p>
            </div>
          </div>
          <div class="flex items-start space-x-3">
            <div class="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-gray-900">Tax rates updated for SUV category</p>
              <p class="text-xs text-gray-500">4 hours ago</p>
            </div>
          </div>
          <div class="flex items-start space-x-3">
            <div class="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-gray-900">New inquiry received for Honda Vezel</p>
              <p class="text-xs text-gray-500">6 hours ago</p>
            </div>
          </div>
          <div class="flex items-start space-x-3">
            <div class="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-gray-900">Vehicle sold: 2019 Toyota Harrier</p>
              <p class="text-xs text-gray-500">1 day ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Vehicles Table -->
    <div id="vehicles-table" class="bg-white rounded-lg border border-gray-200">
      <div class="p-4 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900">Recent Vehicles</h3>
          <button class="px-3 py-1 text-sm bg-primary text-white rounded-md hover:bg-red-700">
            View All
          </button>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
          <tr>
            <td class="px-4 py-3">
              <div class="flex items-center">
                <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg" alt="Car" class="w-10 h-10 rounded-md object-cover mr-3">
                <div>
                  <p class="text-sm font-medium text-gray-900">Mazda CX-5</p>
                  <p class="text-xs text-gray-500">45,000 km</p>
                </div>
              </div>
            </td>
            <td class="px-4 py-3 text-sm text-gray-900">2020</td>
            <td class="px-4 py-3 text-sm text-gray-900">UGX 65M</td>
            <td class="px-4 py-3">
              <span class="inline-flex px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">Available</span>
            </td>
            <td class="px-4 py-3">
              <button class="text-indigo-600 hover:text-indigo-900 text-sm mr-2">Edit</button>
              <button class="text-red-600 hover:text-red-900 text-sm">Delete</button>
            </td>
          </tr>
          <tr>
            <td class="px-4 py-3">
              <div class="flex items-center">
                <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg" alt="Car" class="w-10 h-10 rounded-md object-cover mr-3">
                <div>
                  <p class="text-sm font-medium text-gray-900">Honda Vezel</p>
                  <p class="text-xs text-gray-500">32,000 km</p>
                </div>
              </div>
            </td>
            <td class="px-4 py-3 text-sm text-gray-900">2021</td>
            <td class="px-4 py-3 text-sm text-gray-900">UGX 55M</td>
            <td class="px-4 py-3">
              <span class="inline-flex px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full">Pending</span>
            </td>
            <td class="px-4 py-3">
              <button class="text-indigo-600 hover:text-indigo-900 text-sm mr-2">Edit</button>
              <button class="text-red-600 hover:text-red-900 text-sm">Delete</button>
            </td>
          </tr>
          <tr>
            <td class="px-4 py-3">
              <div class="flex items-center">
                <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg" alt="Car" class="w-10 h-10 rounded-md object-cover mr-3">
                <div>
                  <p class="text-sm font-medium text-gray-900">Toyota Harrier</p>
                  <p class="text-xs text-gray-500">52,000 km</p>
                </div>
              </div>
            </td>
            <td class="px-4 py-3 text-sm text-gray-900">2019</td>
            <td class="px-4 py-3 text-sm text-gray-900">UGX 72M</td>
            <td class="px-4 py-3">
              <span class="inline-flex px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">Sold</span>
            </td>
            <td class="px-4 py-3">
              <button class="text-indigo-600 hover:text-indigo-900 text-sm mr-2">View</button>
              <button class="text-gray-400 text-sm">Archive</button>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Tax Settings Panel -->
    <div id="tax-settings-panel" class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      <div class="bg-white p-4 rounded-lg border border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Current Tax Rates</h3>
        <div class="space-y-3">
          <div class="flex justify-between items-center py-2 border-b border-gray-100">
            <span class="text-sm text-gray-600">Import Duty</span>
            <div class="flex items-center space-x-2">
              <span class="text-sm font-medium">25%</span>
              <button class="text-indigo-600 hover:text-indigo-900 text-xs">Edit</button>
            </div>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-gray-100">
            <span class="text-sm text-gray-600">Excise Duty</span>
            <div class="flex items-center space-x-2">
              <span class="text-sm font-medium">35%</span>
              <button class="text-indigo-600 hover:text-indigo-900 text-xs">Edit</button>
            </div>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-gray-100">
            <span class="text-sm text-gray-600">VAT</span>
            <div class="flex items-center space-x-2">
              <span class="text-sm font-medium">18%</span>
              <button class="text-indigo-600 hover:text-indigo-900 text-xs">Edit</button>
            </div>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-gray-100">
            <span class="text-sm text-gray-600">Infrastructure Levy</span>
            <div class="flex items-center space-x-2">
              <span class="text-sm font-medium">1.5%</span>
              <button class="text-indigo-600 hover:text-indigo-900 text-xs">Edit</button>
            </div>
          </div>
          <div class="flex justify-between items-center py-2">
            <span class="text-sm text-gray-600">Environmental Levy</span>
            <div class="flex items-center space-x-2">
              <span class="text-sm font-medium">Fixed</span>
              <button class="text-indigo-600 hover:text-indigo-900 text-xs">Edit</button>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white p-4 rounded-lg border border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Valuation Updates</h3>
        <div class="space-y-3">
          <div class="flex justify-between items-center py-2 border-b border-gray-100">
            <div>
              <p class="text-sm font-medium text-gray-900">Mazda CX-5 (2020)</p>
              <p class="text-xs text-gray-500">Last updated: Aug 15, 2023</p>
            </div>
            <button class="text-indigo-600 hover:text-indigo-900 text-xs">Update</button>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-gray-100">
            <div>
              <p class="text-sm font-medium text-gray-900">Honda Vezel (2021)</p>
              <p class="text-xs text-gray-500">Last updated: Aug 10, 2023</p>
            </div>
            <button class="text-indigo-600 hover:text-indigo-900 text-xs">Update</button>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-gray-100">
            <div>
              <p class="text-sm font-medium text-gray-900">Toyota Harrier (2019)</p>
              <p class="text-xs text-gray-500">Last updated: Aug 8, 2023</p>
            </div>
            <button class="text-indigo-600 hover:text-indigo-900 text-xs">Update</button>
          </div>
          <div class="flex justify-between items-center py-2">
            <div>
              <p class="text-sm font-medium text-gray-900">Subaru Outback (2020)</p>
              <p class="text-xs text-gray-500">Last updated: Aug 5, 2023</p>
            </div>
            <button class="text-indigo-600 hover:text-indigo-900 text-xs">Update</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>