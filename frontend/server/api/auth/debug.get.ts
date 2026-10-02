// Temporary debug — DELETE after fixing
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const raw = getCookie(event, 'app-auth')
  const cookies = (event.node?.req?.headers?.cookie ?? '')
  return {
    getCookieValue: raw ?? null,
    getCookieLength: raw?.length ?? 0,
    getCookieCharCodes: raw ? raw.split('').map(c => c.charCodeAt(0)) : [],
    configAuthPasswordLength: config.authPassword?.length ?? 0,
    configAuthPasswordCharCodes: config.authPassword ? String(config.authPassword).split('').map(c => c.charCodeAt(0)) : [],
    matches: raw === config.authPassword,
    rawCookieHeader: cookies,
    cookieDomain: process.env.COOKIE_DOMAIN ?? null,
    appPasswordSet: !!process.env.APP_PASSWORD,
    authPasswordSet: !!process.env.AUTH_PASSWORD,
    nodeEnv: process.env.NODE_ENV
  }
})
