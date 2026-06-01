// Auth middleware - protects all routes except login
export default defineEventHandler(async (event) => {
  const path = event.path || event.node?.req?.url || ''
  
  // Skip auth for these paths
  const publicPaths = ['/login', '/api/auth/login', '/_nuxt', '/__nuxt', '/favicon.ico']
  const isPublic = publicPaths.some(p => path.startsWith(p))
  
  if (isPublic) {
    return
  }
  
  // Check for auth cookie
  const cookies = parseCookies(event)
  const authToken = cookies.auth_token
  
  if (!authToken || authToken !== 'authenticated') {
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
