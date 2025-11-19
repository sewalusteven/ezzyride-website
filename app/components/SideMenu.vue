<script setup lang="ts">

</script>

<template>
  <aside id="sidebar" class="fixed left-0 top-0 w-64 h-full bg-white border-r border-gray-200 z-50">
    <div class="p-4 border-b border-gray-200">
      <div class="flex items-center">
        <span class="text-primary font-bold text-xl">InitialD</span>
        <span class="text-secondary font-semibold text-sm ml-1">Admin</span>
      </div>
    </div>

    <nav class="p-2">
      <div class="space-y-1">
                <span class="flex items-center px-3 py-2 text-gray-900 bg-gray-100 rounded-md text-sm font-medium cursor-pointer">
                    <i class="fa-solid fa-chart-line w-4 h-4 mr-3"></i>
                    Dashboard
                </span>
        <span class="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md text-sm cursor-pointer">
                    <i class="fa-solid fa-car w-4 h-4 mr-3"></i>
                    Vehicles
                </span>
        <span class="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md text-sm cursor-pointer">
                    <i class="fa-solid fa-calculator w-4 h-4 mr-3"></i>
                    Tax Settings
                </span>
        <span class="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md text-sm cursor-pointer">
                    <i class="fa-solid fa-chart-bar w-4 h-4 mr-3"></i>
                    Valuations
                </span>
        <span class="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md text-sm cursor-pointer">
                    <i class="fa-solid fa-envelope w-4 h-4 mr-3"></i>
                    Inquiries
                </span>
        <span class="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md text-sm cursor-pointer">
                    <i class="fa-solid fa-users w-4 h-4 mr-3"></i>
                    Users
                </span>
        <span class="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md text-sm cursor-pointer">
                    <i class="fa-solid fa-cog w-4 h-4 mr-3"></i>
                    Settings
                </span>
      </div>
    </nav>
  </aside>
</template>

<style scoped>

</style>