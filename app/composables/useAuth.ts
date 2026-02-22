import type { ApiResponse } from '@/types'

interface AuthUser {
  id: number
  name: string
  email: string
}

interface LoginResponse {
  token: string
  user: AuthUser
}

const COOKIE_OPTS = { maxAge: 60 * 60 * 24 * 7, sameSite: 'lax' as const }

export const useAuth = () => {
  const { $api } = useNuxtApp()

  const token = useCookie<string | null>('auth_token', COOKIE_OPTS)
  const user = useCookie<AuthUser | null>('auth_user', COOKIE_OPTS)

  const isAuthenticated = computed(() => !!token.value)

  const login = async (email: string, password: string) => {
    const { data } = await $api.post<ApiResponse<LoginResponse>>('/web/auth/login', {
      email,
      password,
    })
    token.value = data.data.token
    user.value = data.data.user
  }

  const logout = async () => {
    try {
      await $api.post('/v1/auth/logout')
    } finally {
      token.value = null
      user.value = null
      await navigateTo('/backoffice/auth')
    }
  }

  return {
    token,
    user,
    isAuthenticated,
    login,
    logout,
  }
}
