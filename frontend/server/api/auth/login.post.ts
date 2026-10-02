// Login API endpoint - sets both shared and app-specific cookies
export default defineEventHandler(async (event) => {
  if (event.method !== 'POST') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method Not Allowed'
    })
  }

  const { password } = await readBody(event)
  const config = useRuntimeConfig()

  // Check password against env var
  if (password !== config.authPassword) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid password'
    })
  }

  // Set shared marketplace cookie (works across subdomains)
  setCookie(event, 'app-auth', password, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    domain: process.env.COOKIE_DOMAIN || undefined,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/'
  })

  // Also set app-specific cookie for backward compatibility
  setCookie(event, 'auth_token', 'authenticated', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30 // 30 days
  })

  return { success: true }
})
