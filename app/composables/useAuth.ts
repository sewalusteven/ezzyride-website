import type { ApiResponse } from '@/types'

export interface AuthUser {
  id: number
  name: string
  email: string
  phone?: string | null
  role?: string | null
  permissions: string[]
}

interface LoginResponse {
  token: string
  user: AuthUser
}

const COOKIE_OPTS = { maxAge: 60 * 60 * 24 * 7, sameSite: 'lax' as const }

export const useAuth = () => {
  const { $api } = useNuxtApp()

  const token = useCookie<string | null>('auth_token', COOKIE_OPTS)
  const user  = useCookie<AuthUser | null>('auth_user', COOKIE_OPTS)

  const isAuthenticated = computed(() => !!token.value)

  /** Returns true if the logged-in user has the given permission.
   *  Super-admins store ['*'] and always return true. */
  const can = (permission: string): boolean => {
    if (!user.value) return false
    const perms = user.value.permissions ?? []
    return perms.includes('*') || perms.includes(permission)
  }

  const login = async (email: string, password: string) => {
    const { data } = await $api.post<ApiResponse<LoginResponse>>('/web/auth/login', { email, password })
    token.value = data.data.token
    user.value  = data.data.user
  }

  const logout = async () => {
    try {
      await $api.post('/v1/auth/logout')
    } finally {
      token.value = null
      user.value  = null
      await navigateTo('/auth')
    }
  }

  /** Refresh the stored user (permissions may have changed) */
  const refreshUser = async () => {
    const { data } = await $api.get<ApiResponse<AuthUser>>('/v1/auth/me')
    user.value = data.data
  }

  return {
    token,
    user,
    isAuthenticated,
    can,
    login,
    logout,
    refreshUser,
  }
}
