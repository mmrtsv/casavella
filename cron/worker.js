// Every 5 minutes, asks the site to publish the Instagram posts programmed in Maite whose time has come.
// Pages Functions have no schedule of their own, so this small Worker gives them one (see cron/README.md).
export default {
  async scheduled(event, env, ctx) {
    const site = (env.SITE_URL || 'https://casavellarural.com').replace(/\/$/, '');
    ctx.waitUntil(fetch(site + '/api/social-cron', { method: 'POST', headers: { authorization: 'Bearer ' + env.SOCIAL_CRON_SECRET } }));
  },
};
