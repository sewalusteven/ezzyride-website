export default defineNuxtRouteMiddleware((to) => {
  const token = useCookie<string | null>('auth_token')

  const isBackoffice = to.path.startsWith('/backoffice')
  const isAuthPage = to.path.startsWith('/auth')

  if (isBackoffice && !token.value) {
    return navigateTo('/auth')
  }

  if (isAuthPage && token.value) {
    return navigateTo('/backoffice')
  }
})
