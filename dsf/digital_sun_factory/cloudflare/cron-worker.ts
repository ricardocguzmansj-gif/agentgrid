export interface Env {
  SITE_URL: string;
  CRON_SECRET: string;
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env) {
    const endpoint = `${env.SITE_URL}/api/cron/followups`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.CRON_SECRET}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Follow-up cron failed with status ${response.status}`);
    }
  },
};
