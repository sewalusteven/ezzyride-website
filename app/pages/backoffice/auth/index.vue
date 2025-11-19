<script setup lang="ts">
definePageMeta({
  layout: 'auth-layout',
})
</script>

<template>
  <form id="login-form" class="space-y-6">
    <!-- Email Field -->
    <div id="email-field">
      <label class="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
      <div class="relative">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <i class="fa-solid fa-envelope text-gray-400"></i>
        </div>
        <input type="email" class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition duration-200" placeholder="admin@initialdinvestments.com" required>
      </div>
    </div>

    <!-- Password Field -->
    <div id="password-field">
      <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
      <div class="relative">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <i class="fa-solid fa-lock text-gray-400"></i>
        </div>
        <input type="password" id="password-input" class="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition duration-200" placeholder="Enter your password" required>
        <button type="button" id="toggle-password" class="absolute inset-y-0 right-0 pr-3 flex items-center">
          <i class="fa-solid fa-eye text-gray-400 hover:text-gray-600"></i>
        </button>
      </div>
    </div>

    <!-- Remember Me & Forgot Password -->
    <div id="login-options" class="flex items-center justify-between">
      <label class="flex items-center">
        <input type="checkbox" class="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary">
        <span class="ml-2 text-sm text-gray-600">Remember me</span>
      </label>
      <span class="text-sm text-primary hover:text-red-700 cursor-pointer">Forgot password?</span>
    </div>

    <!-- Login Button -->
    <button type="submit" id="login-button" class="w-full bg-gradient-to-r from-primary to-secondary hover:from-red-700 hover:to-blue-800 text-white font-medium py-3 px-4 rounded-lg transition duration-300 transform hover:scale-105">
      <i class="fa-solid fa-sign-in-alt mr-2"></i>
      Sign In to Dashboard
    </button>

  </form>
</template>

<style scoped>

</style>