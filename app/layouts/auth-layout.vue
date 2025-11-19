<script setup lang="ts">
import "@fortawesome/fontawesome-free/css/all.min.css"
</script>

<template>
<div class="font-inter bg-light text-gray-900 text-sm">
  <div id="login-container" class="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary via-accent to-primary">
    <!-- Background Pattern -->
    <div class="absolute inset-0 opacity-10">
      <div class="absolute inset-0 bg-pattern"></div>
    </div>

  <!-- Login Card -->
  <div id="login-card" class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative z-10">
    <!-- Logo Section -->
    <div id="logo-section" class="text-center mb-8">
      <div class="flex items-center justify-center mb-4">
        <div class="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
          <i class="fa-solid fa-car text-white text-2xl"></i>
        </div>
      </div>
      <div class="flex items-center justify-center mb-2">
        <span class="text-primary font-bold text-2xl">EzzyRide</span>
        <span class="text-secondary font-semibold text-lg ml-1">Admin</span>
      </div>
      <p class="text-gray-500 text-sm">Backend Management Portal</p>
    </div>

    <!-- Login Form -->
    <slot />

    <!-- Security Notice -->
    <div id="security-notice" class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div class="flex items-start">
        <i class="fa-solid fa-info-circle text-blue-600 mt-0.5 mr-2"></i>
        <div class="text-sm text-blue-800">
          <p class="font-medium mb-1">Secure Access</p>
          <p>This portal is for authorized personnel only. All login attempts are monitored and logged.</p>
        </div>
      </div>
    </div>

    <!-- Footer Links -->
    <div id="footer-links" class="mt-8 text-center space-y-2">
      <p class="text-xs text-gray-500">Need help accessing your account?</p>
      <div class="flex justify-center space-x-4 text-xs">
        <span class="text-primary hover:text-red-700 cursor-pointer">Contact IT Support</span>
        <span class="text-gray-300">|</span>
        <span class="text-primary hover:text-red-700 cursor-pointer">System Status</span>
      </div>
    </div>
  </div>

  <!-- Background Decorative Elements -->
  <div id="bg-decoration" class="absolute inset-0 pointer-events-none">
    <div class="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
    <div class="absolute bottom-20 right-20 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
    <div class="absolute top-1/2 left-10 w-24 h-24 bg-white/10 rounded-full blur-lg"></div>
    <div class="absolute bottom-32 left-1/3 w-28 h-28 bg-white/5 rounded-full blur-xl"></div>
  </div>
</div>
</div>
</template>

<style scoped>
.bg-pattern {
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  background-size: 60px 60px;
}
</style>