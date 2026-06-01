// Check auth status
export default defineEventHandler(async (event) => {
  const cookies = parseCookies(event)
  const isAuthenticated = cookies.auth_token === 'authenticated'
  
  return { authenticated: isAuthenticated }
})
