import axios from 'axios';

export default defineNuxtPlugin(nuxtApp => {
    const config = useRuntimeConfig();
    const token = useCookie<string | null>('auth_token');

    const api = axios.create({
        baseURL: config.public.beUrl,
        headers: {
            common: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            }
        }
    });

    api.interceptors.request.use((requestConfig) => {
        if (token.value) {
            requestConfig.headers.Authorization = `Bearer ${token.value}`;
        }
        return requestConfig;
    });

    // Handle expired/invalid tokens globally
    api.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response?.status === 401 && token.value) {
                // Token expired or revoked — clear auth and redirect
                token.value = null;
                useCookie<null>('auth_user').value = null;
                if (import.meta.client) {
                    navigateTo('/auth');
                }
            }
            return Promise.reject(error);
        }
    );

    nuxtApp.provide('api', api);
});
