#!/usr/bin/env python3
"""Build the standalone website for the domain from index.html.

index.html is the review version (published as a Claude artifact). This script
writes dist/ with a complete HTML document, SEO and social tags, and without the
review tools (draft banner, design switcher, phone preview).

Each language gets its own page, already translated with the page's I18N dictionary, so
search engines and AI crawlers read it without running JavaScript: / (Catalan), /es/ and /en/.
Next to them: robots.txt, sitemap.xml and the structured data (JSON-LD) in each page's head.
llms.txt is a Pages Function (functions/llms.txt.js) because it reads the live prices.

Usage:  python3 build.py [https://casavellarural.com]
Then upload the dist/ folder to Netlify, Cloudflare Pages or any static host.
"""
import datetime
import html
import json
import re
import shutil
import sys
from pathlib import Path

import guides

ROOT = Path(__file__).resolve().parent
DIST = ROOT / 'dist'
SITE_URL = (sys.argv[1] if len(sys.argv) > 1 else 'https://casavellarural.com').rstrip('/')

LANGS = ('ca', 'es', 'en')
PATHS = {'ca': '/', 'es': '/es/', 'en': '/en/'}
OG_LOCALE = {'ca': 'ca_ES', 'es': 'es_ES', 'en': 'en_GB'}
TITLE = {
    'ca': 'La Casa Vella, casa rural al Bedorc, a prop de Montserrat',
    'es': 'La Casa Vella, casa rural en El Bedorc, cerca de Montserrat',
    'en': 'La Casa Vella, rural guesthouse in El Bedorc near Montserrat',
}
DESCRIPTION = {
    'ca': ("Casa de poble de 1898 al Bedorc (Anoia), entre vinyes i amb Montserrat a l'horitzó. "
           "Dos apartaments, dues habitacions amb bany privat i restaurant."),
    'es': ("Casa de pueblo de 1898 en El Bedorc (Anoia), entre viñas y con Montserrat en el horizonte. "
           "Dos apartamentos, dos habitaciones con baño privado y restaurante."),
    'en': ("An 1898 village house in El Bedorc (Anoia, Barcelona), among vineyards with Montserrat on the horizon. "
           "Two apartments, two rooms with private bathroom and a restaurant."),
}
OG_IMAGE = 'img/hero-vinyes-cel.jpg'

# Ad tags. They load only after the guest accepts cookies; while all are empty
# the page loads no tags and shows no cookie banner.
META_PIXEL_ID = '1825787501907485'  # Meta Events Manager, the web dataset «casavellarural.com»
GOOGLE_TAG_ID = 'G-LQ02L5RK73'  # Google tag: the GA4 property; Google Ads (AW-18519911811) is configured from the conversion below
GOOGLE_ADS_CONVERSION = 'AW-18519911811/r1CdCI6Xx6kdEIPb_f5E'  # Google Ads, the booking conversion «Reserva»
# PostHog (EU), the site's own analytics: full tracking and session recordings for guests who accept
# cookies, a cookieless count for those who reject them. The project token is public by design.
POSTHOG_KEY = 'phc_wKuEYoNuGTakEhSHMUcAtm8Ms9xsKTpkMfSXuxiAQj69'
# IndexNow key, public by design: served at /<key>.txt (see indexnow.py).
INDEXNOW_KEY = '02b241b7ed2c744a840d88e0cff40c2c'


# ---- Structured data: the facts the page states, for search engines and AI assistants ----
# No aggregateRating: Google ignores (and can penalise) ratings a business marks up about itself,
# and the Google Maps reviews are not collected on this site. Prices are the usual ones from Maite.
PHONE = '+34 667 40 98 59'
EMAIL = 'info@casavellarural.com'
MAPS = 'https://www.google.com/maps/search/?api=1&query=La+Casa+Vella+El+Bedorc&query_place_id=ChIJK6vlrrVlpBIRBAeTHj5ufvE'
INSTAGRAM = 'https://www.instagram.com/casavellarural/'
STAYS = [  # id, type, name, max guests, beds
    ('montserrat', 'Apartment', 'Montserrat', 3, {'ca': '1 dormitori i sofà llit', 'es': '1 dormitorio y sofá cama', 'en': '1 bedroom and a sofa bed'}),
    ('la-pineda', 'Apartment', 'La Pineda', 3, {'ca': 'Dormitori doble', 'es': 'Dormitorio doble', 'en': 'Double bedroom'}),
    ('les-vinyes', 'HotelRoom', 'Les Vinyes', 2, {'ca': 'Llit doble', 'es': 'Cama doble', 'en': 'Double bed'}),
    ('figarot', 'HotelRoom', 'Figarot', 2, {'ca': 'Llit doble', 'es': 'Cama doble', 'en': 'Double bed'}),
]
AMENITIES = {
    'ca': ['Wifi gratuït', 'Aparcament gratuït', 'Aire condicionat', 'Calefacció', 'Bany privat', 'Smart TV', 'Nevera',
           'Cuina equipada (apartaments)', 'Tovalloles i roba de llit', 'Jardí amb terrassa', 'Restaurant'],
    'es': ['Wifi gratuito', 'Aparcamiento gratuito', 'Aire acondicionado', 'Calefacción', 'Baño privado', 'Smart TV', 'Nevera',
           'Cocina equipada (apartamentos)', 'Toallas y ropa de cama', 'Jardín con terraza', 'Restaurante'],
    'en': ['Free wifi', 'Free parking', 'Air conditioning', 'Heating', 'Private bathroom', 'Smart TV', 'Fridge',
           'Equipped kitchen (apartments)', 'Towels and bed linen', 'Garden with terrace', 'Restaurant'],
}
KIND = {'Apartment': {'ca': 'Apartament', 'es': 'Apartamento', 'en': 'Apartment'},
        'HotelRoom': {'ca': 'Habitació', 'es': 'Habitación', 'en': 'Room'}}


def structured_data(lang):
    site, url = SITE_URL, SITE_URL + PATHS[lang]
    img = lambda f: f'{site}/img/{f}'
    address = {'@type': 'PostalAddress', 'streetAddress': 'Carrer Munné Orpí, 23', 'addressLocality': 'El Bedorc',
               'postalCode': '08784', 'addressRegion': 'Barcelona', 'addressCountry': 'ES'}
    lodging = {
        '@type': 'LodgingBusiness', '@id': f'{site}/#lodging', 'name': 'La Casa Vella', 'url': url,
        'description': DESCRIPTION[lang], 'telephone': PHONE, 'email': EMAIL,
        'image': [img('hero-vinyes-cel.jpg'), img('escala-entrada.jpg'), img('apt-sala-2.jpg'), img('hab-armari.jpg'), img('restaurant-barra.jpg')],
        'logo': img('logo-dark.png'), 'address': address,
        'geo': {'@type': 'GeoCoordinates', 'latitude': 41.4981, 'longitude': 1.7205},
        'hasMap': MAPS, 'sameAs': [INSTAGRAM],
        'priceRange': '70-110 €', 'currenciesAccepted': 'EUR',
        'checkinTime': '15:00', 'checkoutTime': '11:00', 'numberOfRooms': 4,
        'amenityFeature': [{'@type': 'LocationFeatureSpecification', 'name': a, 'value': True} for a in AMENITIES[lang]],
        'containsPlace': [{
            '@type': t, '@id': f'{site}/#{k}', 'name': f'{KIND[t][lang]} {n}', 'url': f'{url}#{k}',
            'occupancy': {'@type': 'QuantitativeValue', 'maxValue': m}, 'bed': b[lang],
        } for k, t, n, m, b in STAYS],
        'containedInPlace': {'@type': 'Place', 'name': 'El Bedorc, Piera (Anoia)'},
    }
    restaurant = {
        '@type': 'Restaurant', '@id': f'{site}/#restaurant', 'name': 'La Casa Vella', 'url': f'{url}#restaurant',
        'telephone': PHONE, 'address': address, 'image': img('restaurant-barra.jpg'),
        'acceptsReservations': f'{url}#taula', 'containedInPlace': {'@id': f'{site}/#lodging'},
    }
    website = {'@type': 'WebSite', '@id': f'{site}/#website', 'url': f'{site}/', 'name': 'La Casa Vella', 'inLanguage': list(LANGS)}
    page = {'@type': 'WebPage', '@id': url, 'url': url, 'name': TITLE[lang], 'description': DESCRIPTION[lang],
            'inLanguage': lang, 'isPartOf': {'@id': f'{site}/#website'}, 'about': {'@id': f'{site}/#lodging'}}
    data = {'@context': 'https://schema.org', '@graph': [lodging, restaurant, website, page]}
    return json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')


# ---- Agenda: what is on nearby in the coming weeks, from content/agenda.json (kept up to date by the weekly SEO routine,
# docs/seo-rutina.md). Each item has its source; the past ones drop out on each build. Nothing to show, no block. ----
AGENDA_HEAD = {
    'ca': ('Aquestes setmanes', 'Què passa a prop', 'Més informació'),
    'es': ('Estas semanas', 'Qué pasa cerca', 'Más información'),
    'en': ('These weeks', "What's on nearby", 'More information'),
}
MONTHS = {
    'ca': ['de gener', 'de febrer', 'de març', "d'abril", 'de maig', 'de juny', 'de juliol', "d'agost", 'de setembre', "d'octubre", 'de novembre', 'de desembre'],
    'es': ['de enero', 'de febrero', 'de marzo', 'de abril', 'de mayo', 'de junio', 'de julio', 'de agosto', 'de septiembre', 'de octubre', 'de noviembre', 'de diciembre'],
    'en': ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
}


def when(item, lang):
    a = datetime.date.fromisoformat(item['from'])
    b = datetime.date.fromisoformat(item.get('to') or item['from'])
    day = lambda d: f'{d.day} {MONTHS[lang][d.month - 1]}'
    to = ' to ' if lang == 'en' else ' al '
    if a == b:
        return day(a)
    return f'{a.day}{to}{day(b)}' if (a.year, a.month) == (b.year, b.month) else f'{day(a)}{to}{day(b)}'



def agenda(lang, today):
    items = json.loads((ROOT / 'content' / 'agenda.json').read_text(encoding='utf-8'))['items']
    items = sorted((i for i in items if (i.get('to') or i['from']) >= today), key=lambda i: i['from'])[:6]
    if not items:
        return ''
    label, title, more = AGENDA_HEAD[lang]
    e = html.escape
    cards = ''.join(
        f'      <article><span class="label">{e(when(i, lang))}</span><h3>{e(i["title"][lang])}</h3>'
        f'<p>{e(i["text"][lang])} ({e(i["place"])}{", " + str(i["minutes"]) + " min" if i.get("minutes") else ""})</p>'
        f'<p><a href="{e(i["url"])}" target="_blank" rel="noopener">{more}</a></p></article>\n' for i in items)
    return (f'    <div class="seal-head"><span class="label">{label}</span><h3>{title}</h3></div>\n'
            f'    <div class="near agenda">\n{cards}    </div>\n')


def translate(body, words):
    """What the page's script does in the browser for Spanish and English, done here so the HTML is already translated:
    every text node and the same attributes, looked up in I18N with the Catalan text (spaces collapsed) as the key."""
    def text(m):
        raw = m.group(1)
        lead, key, trail = re.match(r'^(\s*)([\s\S]*?)(\s*)$', html.unescape(raw)).groups()
        key = re.sub(r'\s+', ' ', key)
        return '>' + (lead + html.escape(words[key], quote=False) + trail if key in words else raw) + '<'

    def attr(m):
        value = html.unescape(m.group(3))
        return m.group(1) + m.group(2) + (html.escape(words[value]) if value in words else m.group(3)) + m.group(2)

    out = []
    # Scripts and styles stay as they are
    for i, part in enumerate(re.split(r'(<script\b.*?</script>|<style\b.*?</style>)', body, flags=re.S)):
        if i % 2 == 0:
            part = re.sub(r'>([^<]+)<', text, part)
            part = re.sub(r'(\s(?:placeholder|aria-label|alt|title|data-script|data-placeholder)=)(["\'])(.*?)\2', attr, part)
        out.append(part)
    return ''.join(out)


def cut(html, start_pattern, end_marker):
    """Remove the block that starts at start_pattern and ends after end_marker."""
    start = html.find(start_pattern)
    if start < 0:
        return html
    end = html.index(end_marker, start) + len(end_marker)
    return html[:start] + html[end:]


src = (ROOT / 'index.html').read_text(encoding='utf-8')

# Review-only pieces
src = re.sub(r'<div class="draft"[^>]*>.*?</div>\n', '', src, count=1)
src = cut(src, '<div class="phone-view"', '</div>\n</div>\n')
src = cut(src, '<div class="rail"', '</div>\n')
src = cut(src, '<div class="variants"', '</div>\n')
src = src.replace('<meta name="claude:viewport-fit-sides" content="cover">\n', '')
src = re.sub(r'<title>.*?</title>\n', '', src, count=1)

ads = json.dumps({'meta': META_PIXEL_ID, 'google': GOOGLE_TAG_ID, 'conversion': GOOGLE_ADS_CONVERSION, 'posthog': POSTHOG_KEY})
i18n = src[src.index('const I18N = ') + len('const I18N = '):]
i18n = i18n[:i18n.index('\n} };\n') + 4].replace('{ es: {', '{"es": {', 1).replace('\n}, en: {', '\n}, "en": {', 1)
WORDS = {'ca': {}, **json.loads(i18n)}
GUIDES_MARK = '    <!-- guides: build.py puts here the links to the guides (content/guides/) -->\n'
GUIDE_BLOCKS = {}
AGENDA_MARK = '    <!-- agenda: build.py puts here what is on nearby in the coming weeks (content/agenda.json) -->\n'
# Everything up to and including </style> goes in <head>, the rest in <body>
split = src.index('</style>') + len('</style>')


def page(lang):
    url = SITE_URL + PATHS[lang]
    alternates = ''.join(f'<link rel="alternate" hreflang="{l}" href="{SITE_URL}{PATHS[l]}">\n' for l in LANGS)
    alternates += f'<link rel="alternate" hreflang="x-default" href="{SITE_URL}/">\n'
    title, description = html.escape(TITLE[lang]), html.escape(DESCRIPTION[lang])
    head = f'''<!doctype html>
<html lang="{lang}" data-variant="5">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{description}">
<link rel="canonical" href="{url}">
{alternates}<link rel="icon" type="image/png" href="/img/iso-dark.png">
<link rel="preload" as="image" href="/img/hero-vinyes-cel.jpg" fetchpriority="high">
<link rel="preload" as="font" type="font/woff2" href="/fonts/HalyardDisplay.woff2" crossorigin>
<meta property="og:type" content="website">
<meta property="og:site_name" content="La Casa Vella">
<meta property="og:url" content="{url}">
<meta property="og:locale" content="{OG_LOCALE[lang]}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{description}">
<meta property="og:image" content="{SITE_URL}/{OG_IMAGE}">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">{structured_data(lang)}</script>
<script>window.ADS = {ads}; window.PAGE_LANG = '{lang}'; window.LANG_PAGES = {json.dumps(PATHS)};</script>
<style>:root{{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}}body{{margin:0}}img{{max-width:100%}}[hidden]{{display:none!important}}</style>
'''
    body = src[split:].lstrip()
    body = body.replace(AGENDA_MARK, agenda(lang, datetime.date.today().isoformat())).replace(GUIDES_MARK, GUIDE_BLOCKS.get(lang, ''))
    if lang != 'ca':
        body = translate(body, WORDS[lang])
    doc = head + src[:split] + '\n</head>\n<body>\n' + body + '\n</body>\n</html>\n'
    # /es/ and /en/ are one folder down: the page's own files are at the root
    return re.sub(r'(src="|href="|url\()(img|fonts)/', r'\1/\2/', doc)


if DIST.exists():
    shutil.rmtree(DIST)
DIST.mkdir()
GUIDE_PAGES, GUIDE_BLOCKS = guides.build(ROOT, DIST, SITE_URL)
for lang in LANGS:
    folder = DIST / PATHS[lang].strip('/')
    folder.mkdir(exist_ok=True)
    (folder / 'index.html').write_text(page(lang), encoding='utf-8')
for folder in ('img', 'fonts'):
    shutil.copytree(ROOT / folder, DIST / folder)

# A real "not found": without 404.html, Cloudflare Pages answers any unknown address with the home page and a 200,
# which search engines index as duplicates of it
not_found = guides.page(
    SITE_URL, 'ca', 'Pàgina no trobada (La Casa Vella)', 'Aquesta pàgina no existeix.', '/', guides.HOME,
    {'@context': 'https://schema.org', '@type': 'WebPage', 'name': 'Pàgina no trobada'},
    '<h1>Aquesta pàgina no existeix</h1>\n<p class="lede">Potser l\'adreça ha canviat. '
    '<a href="/">La Casa Vella</a>, <a href="/es/">en castellano</a>, <a href="/en/">in English</a>.</p>')
not_found = re.sub(r'<link rel="(canonical|alternate)"[^>]*>\n', '', not_found).replace('<head>\n', '<head>\n<meta name="robots" content="noindex">\n', 1)
(DIST / '404.html').write_text(not_found, encoding='utf-8')

# Crawlers: everyone may read the web, AI assistants included (named so a later default can't block them); not the API.
AI_BOTS = ('GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'Perplexity-User', 'ClaudeBot', 'Claude-User',
           'Claude-SearchBot', 'Google-Extended', 'Applebot-Extended', 'Bingbot', 'Googlebot', 'CCBot', 'Meta-ExternalAgent')
(DIST / 'robots.txt').write_text(
    ''.join(f'User-agent: {b}\n' for b in AI_BOTS) + 'Allow: /\nDisallow: /api/\n\n'
    'User-agent: *\nAllow: /\nDisallow: /api/\n\n'
    f'Sitemap: {SITE_URL}/sitemap.xml\n', encoding='utf-8')
# IndexNow (Bing, which ChatGPT searches with, Yandex, Seznam): the key file proves the site is ours; indexnow.py sends the URLs.
(DIST / f'{INDEXNOW_KEY}.txt').write_text(INDEXNOW_KEY, encoding='utf-8')
today = datetime.date.today().isoformat()
links = ''.join(f'    <xhtml:link rel="alternate" hreflang="{l}" href="{SITE_URL}{PATHS[l]}"/>\n' for l in LANGS)
links += f'    <xhtml:link rel="alternate" hreflang="x-default" href="{SITE_URL}/"/>\n'
(DIST / 'sitemap.xml').write_text(
    '<?xml version="1.0" encoding="UTF-8"?>\n'
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
    + ''.join(f'  <url>\n    <loc>{SITE_URL}{PATHS[l]}</loc>\n    <lastmod>{today}</lastmod>\n{links}  </url>\n' for l in LANGS)
    + ''.join(f'  <url>\n    <loc>{SITE_URL}{alt[l]}</loc>\n    <lastmod>{lastmod}</lastmod>\n'
              + ''.join(f'    <xhtml:link rel="alternate" hreflang="{k}" href="{SITE_URL}{alt[k]}"/>\n' for k in LANGS)
              + f'    <xhtml:link rel="alternate" hreflang="x-default" href="{SITE_URL}{alt["ca"]}"/>\n  </url>\n'
              for alt, lastmod in GUIDE_PAGES for l in LANGS)
    + '</urlset>\n', encoding='utf-8')
# Cloudflare Pages headers: the Stripe payment form (another origin) loads our brand font
# Maite (the back office on maite.casavellarural.com) is built by Vite into dist/maite/ afterwards (npm run build).
# Its page is never cached, its hashed assets forever; neither is indexed.
(DIST / '_headers').write_text(
    '/fonts/*\n  Access-Control-Allow-Origin: *\n'
    '/maite/*\n  X-Robots-Tag: noindex\n'
    '/maite/\n  Cache-Control: no-store\n'
    '/maite/index.html\n  Cache-Control: no-store\n'
    '/maite/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n', encoding='utf-8')
print(f'Built {DIST}: ' + ', '.join(f'{PATHS[l]} ({len(page(l)) // 1024} KB)' for l in LANGS))
