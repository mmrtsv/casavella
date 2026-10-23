// Two sites from one Pages project, split by host:
// maite.casavellarural.com is the back office (dist/maite/ and /api/maite/), everything else is the public web.
// Cloudflare Access guards the maite host; /api/maite/_middleware.js checks its token on every call as well.
const SHARED = /^\/(fonts|img|photos)\//;

export async function onRequest({ request, env, next }) {
  const url = new URL(request.url), path = url.pathname;
  const maite = url.hostname.startsWith('maite.');
  const backOffice = path === '/maite' || path.startsWith('/maite/') || path.startsWith('/api/maite/');
  if (!maite) return backOffice ? new Response('Not found', { status: 404 }) : next();
  if (path.startsWith('/api/maite/') || path.startsWith('/maite/') || SHARED.test(path)) return next();
  if (path === '/') return env.ASSETS.fetch(new Request(new URL('/maite/', url), request));
  // The Android app (android/) checks this file to open Maite full screen; it lives in dist/maite/.well-known/
  if (path === '/.well-known/assetlinks.json') return env.ASSETS.fetch(new Request(new URL('/maite/.well-known/assetlinks.json', url), request));
  return Response.redirect(url.origin + '/', 302);
}
