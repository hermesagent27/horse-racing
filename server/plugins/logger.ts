export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', (event) => {
    console.log(`[Request] ${event.method} ${event.path}`)
  })
})