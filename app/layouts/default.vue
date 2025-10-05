<script setup lang="ts">

import Header from "~/components/Header.vue";
import Footer from "~/components/Footer.vue";
import "@fortawesome/fontawesome-free/css/all.min.css"

useSeoMeta({
  title: 'EzzyRide Uganda | URA Tax Calculator',
  description: 'This site allows you to calculate the Uganda Revenue Authority (URA) Vehicle Taxes',
})

</script>

<template>
  <div class="font-roboto text-gray-800 bg-gray-50">
    <Header />
    <slot />
    <Footer />
</div>
</template>

<style scoped>

</style>