// Login API endpoint
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
  
  // Set auth cookie with longer expiration (30 days)
  setCookie(event, 'auth_token', 'authenticated', {
    httpOnly: true,
    secure: true, // Always secure in production
    sameSite: 'lax', // Changed from strict to lax for better UX
    maxAge: 60 * 60 * 24 * 30 // 30 days
  })
  
  return { success: true }
})
