export default defineNuxtRouteMiddleware((to) => {
  const token = useCookie<string | null>('auth_token')

  const isBackoffice = to.path.startsWith('/backoffice')
  const isAuthPage = to.path === '/backoffice/auth'

  if (isBackoffice && !isAuthPage && !token.value) {
    return navigateTo('/backoffice/auth')
  }

  if (isAuthPage && token.value) {
    return navigateTo('/backoffice')
  }
})
