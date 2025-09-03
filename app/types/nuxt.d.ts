
// This ensures that TypeScript understands the shape of our Axios instance
// and knows that it's available on the NuxtApp instance.
import type { NuxtApp } from 'nuxt/app';
import type { AxiosInstance } from 'axios';

// Add the $api property to the NuxtApp interface
declare module '#app' {
    interface NuxtApp {
        $api: AxiosInstance;
    }
}

// Optional: Also add it to the Vue runtime
declare module 'vue' {
    interface ComponentCustomProperties {
        $api: AxiosInstance;
    }
}