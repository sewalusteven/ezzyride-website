export const useStorage = () => {
  const config = useRuntimeConfig()
  const base = config.public.storageUrl as string

  const storageUrl = (path: string | null | undefined): string => {
    if (!path) return ''
    return `${base}/${path}`
  }

  return { storageUrl }
}
