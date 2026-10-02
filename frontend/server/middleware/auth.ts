// Unified auth middleware - accepts shared app-auth cookie from marketplace
// or app-specific auth_token cookie from direct login
export default defineEventHandler(async (event) => {
  const path = event.path || event.node?.req?.url || ''

  // Skip auth for these paths
  const publicPaths = ['/login', '/api/auth/login', '/_nuxt', '/__nuxt', '/favicon.ico']
  const isPublic = publicPaths.some(p => path.startsWith(p))

  if (isPublic) {
    return
  }

  const cookies = parseCookies(event)
  const config = useRuntimeConfig()

  // Check shared marketplace cookie first, then app-specific
  const sharedAuth = cookies['app-auth']
  const appAuth = cookies['auth_token']

  const validShared = sharedAuth && sharedAuth === config.authPassword
  const validApp = appAuth && appAuth === 'authenticated'

  if (!validShared && !validApp) {
    // Return 401 for API routes, redirect for pages
    if (path.startsWith('/api/')) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    // Redirect to login for page routes
    return sendRedirect(event, '/login', 302)
  }
})
