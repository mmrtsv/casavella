// Every 5 minutes, asks the site to publish the Instagram posts programmed in Maite whose time has come.
// Pages Functions have no schedule of their own, so this small Worker gives them one (see cron/README.md).
export default {
  async scheduled(event, env, ctx) {
    const site = (env.SITE_URL || 'https://casavellarural.com').replace(/\/$/, '');
    ctx.waitUntil(fetch(site + '/api/social-cron', { method: 'POST', headers: { authorization: 'Bearer ' + env.SOCIAL_CRON_SECRET } }));
  },
};

// The cap on Google Places calls for the reviews section (functions/api/reviews.js), bound to the Pages project as
// PLACES_BUDGET. A Durable Object handles one request at a time, so the count can't be passed by simultaneous visits
// the way a KV counter can. POST { day, month, perDay, perMonth } → { ok } and, when ok, the call is counted.
export class PlacesBudget {
  constructor(state) { this.storage = state.storage; }
  async fetch(request) {
    const { day, month, perDay, perMonth } = await request.json();
    const [d = 0, m = 0] = await Promise.all([this.storage.get('d:' + day), this.storage.get('m:' + month)]);
    if (d >= perDay || m >= perMonth) return Response.json({ ok: false, day: d, month: m });
    await this.storage.put({ ['d:' + day]: d + 1, ['m:' + month]: m + 1 });
    // Earlier days and months aren't needed any more
    const old = [...(await this.storage.list()).keys()].filter(k => k !== 'd:' + day && k !== 'm:' + month);
    if (old.length) await this.storage.delete(old);
    return Response.json({ ok: true, day: d + 1, month: m + 1 });
  }
}
