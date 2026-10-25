// Two sites from one Pages project, split by host:
// maite.casavellarural.com is the back office (dist/maite/ and /api/maite/), everything else is the public web.
// Cloudflare Access guards the maite host; /api/maite/_middleware.js checks its token on every call as well.
const SHARED = /^\/(fonts|img|photos)\//;

// The public web has a page per language (build.py): / is Catalan, /es/ and /en/. The page sets the lcv-lang cookie
// with the language last seen or chosen; without it, / goes to the first of ca, es or en in the browser's languages
// (English if none). Crawlers send neither and read each page where it is.
const PAGES = { ca: '/', es: '/es/', en: '/en/' };
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|lighthouse|headless/i;

function language(request) {
  const saved = (request.headers.get('cookie') || '').match(/(?:^|;\s*)lcv-lang=(ca|es|en)\b/);
  if (saved) return saved[1];
  const accept = request.headers.get('accept-language');
  if (!accept || BOT.test(request.headers.get('user-agent') || '')) return 'ca';
  const wanted = accept.split(',').map((p, i) => {
    const [tag, ...params] = p.trim().split(';'), q = params.map(x => x.trim()).find(x => x.startsWith('q='));
    return { l: tag.slice(0, 2).toLowerCase(), q: q ? parseFloat(q.slice(2)) || 0 : 1, i };
  }).filter(x => x.q > 0).sort((a, b) => b.q - a.q || a.i - b.i);
  return (wanted.find(x => PAGES[x.l]) || { l: 'en' }).l;
}

function publicWeb(request, env, next, url) {
  const path = url.pathname;
  // The language pages load img/… and fonts/… relative to themselves (the photos from Maite too): they are the root's
  const shared = path.match(/^\/(?:es|en)(\/(?:img|fonts)\/.*)$/);
  if (shared) return env.ASSETS.fetch(new Request(new URL(shared[1], url), request));
  if (!Object.values(PAGES).includes(path) || request.method !== 'GET') return next();
  // ?lang=es (older links): the page of that language, with the rest of the query
  const asked = url.searchParams.get('lang');
  if (PAGES[asked]) {
    url.searchParams.delete('lang'); url.pathname = PAGES[asked];
    return new Response(null, { status: 301, headers: { location: url.href, 'set-cookie': `lcv-lang=${asked}; Path=/; Max-Age=31536000; SameSite=Lax` } });
  }
  if (path !== '/') return next();
  const lang = language(request);
  if (lang === 'ca') return next();
  url.pathname = PAGES[lang];
  return new Response(null, { status: 302, headers: { location: url.href, vary: 'Accept-Language, Cookie', 'cache-control': 'no-store' } });
}

export async function onRequest({ request, env, next }) {
  const url = new URL(request.url), path = url.pathname;
  const maite = url.hostname.startsWith('maite.');
  const backOffice = path === '/maite' || path.startsWith('/maite/') || path.startsWith('/api/maite/');
  if (!maite) return backOffice ? new Response('Not found', { status: 404 }) : publicWeb(request, env, next, url);
  if (path === '/robots.txt') return new Response('User-agent: *\nDisallow: /\n', { headers: { 'content-type': 'text/plain; charset=utf-8' } });
  if (path.startsWith('/api/maite/') || path.startsWith('/maite/') || SHARED.test(path)) return next();
  if (path === '/') return env.ASSETS.fetch(new Request(new URL('/maite/', url), request));
  // The Android app (android/) checks this file to open Maite full screen; it lives in dist/maite/.well-known/
  if (path === '/.well-known/assetlinks.json') return env.ASSETS.fetch(new Request(new URL('/maite/.well-known/assetlinks.json', url), request));
  return Response.redirect(url.origin + '/', 302);
}
