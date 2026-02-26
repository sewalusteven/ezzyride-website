<script setup lang="ts">
</script>

<template>
<div class="font-inter bg-light-gray text-gray-900 text-sm min-h-screen">
  <SideMenu />
  <main id="main-content" class="ml-64">
    <AdminHeader />
    <slot />
  </main>
</div>
</template>

<style scoped>

</style>