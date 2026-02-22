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

    nuxtApp.provide('api', api);
});
