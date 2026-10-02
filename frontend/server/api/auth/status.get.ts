// Check auth status - accepts shared app-auth or app-specific auth_token
export default defineEventHandler(async (event) => {
  const cookies = parseCookies(event)
  const config = useRuntimeConfig()

  const sharedAuth = cookies['app-auth']
  const appAuth = cookies['auth_token']

  const isAuthenticated = (sharedAuth && sharedAuth === config.authPassword) ||
                          (appAuth === 'authenticated')

  return { authenticated: isAuthenticated }
})
