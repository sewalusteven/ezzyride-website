<script setup lang="ts">
import {ref} from "vue";

const mobileMenu = ref<boolean>(false);
</script>

<template>
  <header id="header" class="fixed w-full top-0 z-50 bg-white shadow-md">
    <div class="container mx-auto px-4 py-3">
      <div class="flex items-center justify-between">
        <!-- Logo -->
        <div class="flex items-center">
                    <span class="flex items-center cursor-pointer">
                        <span class="text-primary font-bold text-3xl font-montserrat">Ezzy</span>
                        <span class="text-secondary font-semibold text-xl ml-1 font-montserrat">Ride</span>
                    </span>
        </div>

        <!-- Desktop Navigation -->
        <nav class="hidden md:flex items-center space-x-6">
<!--          <router-link to="/" class="text-secondary hover:text-primary font-medium transition duration-300 cursor-pointer">Home</router-link>-->
<!--          <router-link to="/vehicles" class="text-secondary hover:text-primary font-medium transition duration-300 cursor-pointer">Vehicles</router-link>-->
<!--          <router-link to="/tax-calculator" class="text-secondary hover:text-primary font-medium transition duration-300 cursor-pointer">Tax Calculator</router-link>-->
<!--          <router-link to="/valuations" class="text-secondary hover:text-primary font-medium transition duration-300 cursor-pointer">Valuations</router-link>-->
<!--          <router-link to="/import-assistance" class="text-secondary hover:text-primary font-medium transition duration-300 cursor-pointer">Import Assistance</router-link>-->
<!--          <router-link to="/about" class="text-secondary hover:text-primary font-medium transition duration-300 cursor-pointer">About Us</router-link>-->
        </nav>

        <!-- Contact Button -->
        <div class="hidden md:block">
<!--          <router-link to="contact" class="bg-primary hover:bg-red-700 text-white font-medium py-2 px-5 rounded-full transition duration-300 cursor-pointer">Contact Us</router-link>-->
        </div>

        <!-- Mobile Menu Button -->
        <div class="md:hidden">
<!--          <button @click="mobileMenu = !mobileMenu" id="mobile-menu-button" class="text-secondary cursor-pointer focus:outline-none">-->
<!--            <i class="fa-solid fa-bars text-2xl"></i>-->
<!--          </button>-->
        </div>
      </div>

      <!-- Mobile Menu -->
      <div v-if="mobileMenu" id="mobile-menu" class="md:hidden duration-200 ease-in-out bg-white absolute top-full left-0 w-full shadow-md">
        <div class="container mx-auto px-4 py-3">
          <nav class="flex flex-col space-y-3">
<!--            <router-link to="/" class="text-secondary hover:text-primary font-medium py-2 transition duration-300 cursor-pointer">Home</router-link>-->
<!--            <router-link to="/vehicles" class="text-secondary hover:text-primary font-medium py-2 transition duration-300 cursor-pointer">Vehicles</router-link>-->
<!--            <router-link to="/tax-calculator" class="text-secondary hover:text-primary font-medium py-2 transition duration-300 cursor-pointer">Tax Calculator</router-link>-->
<!--            <router-link to="/valuations" class="text-secondary hover:text-primary font-medium py-2 transition duration-300 cursor-pointer">Valuations</router-link>-->
<!--            <router-link to="import-assistance" class="text-secondary hover:text-primary font-medium py-2 transition duration-300 cursor-pointer">Import Assistance</router-link>-->
<!--            <router-link to="/about" class="text-secondary hover:text-primary font-medium py-2 transition duration-300 cursor-pointer">About Us</router-link>-->
<!--            <router-link to="/contact" class="bg-primary hover:bg-red-700 text-white font-medium py-2 px-4 rounded-full transition duration-300 inline-block cursor-pointer">Contact Us</router-link>-->
          </nav>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>

</style>