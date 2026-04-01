export default {
  async scheduled(_event, env) {
    await fetch(`${env.APP_URL}/api/cron/automations`, {
      headers: { 'x-cron-secret': env.CLOUDFLARE_CRON_SECRET }
    })
  }
}
