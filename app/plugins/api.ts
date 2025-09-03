import axios from 'axios';

export default defineNuxtPlugin(nuxtApp => {
    const config = useRuntimeConfig();

    // Create an Axios instance
    const api = axios.create({
        baseURL: config.public.beUrl,
        headers: {
            common: {
                'Content-Type': 'application/json'
            }
        }
    });

    // Attach the instance to the Nuxt app
    nuxtApp.provide('api', api);
});