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
  
  // Set auth cookie (HTTP-only, secure)
  setCookie(event, 'auth_token', 'authenticated', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  })
  
  return { success: true }
})
