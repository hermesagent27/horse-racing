// Check auth status - accepts shared app-auth or app-specific auth_token
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  const sharedAuth = getCookie(event, 'app-auth')
  const appAuth = getCookie(event, 'auth_token')

  const isAuthenticated = (sharedAuth && sharedAuth === config.authPassword) ||
                          (appAuth === 'authenticated')

  return { authenticated: isAuthenticated }
})
