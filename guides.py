"""Guides: articles about the surroundings, one page per language, written by build.py from content/guides/*.json.

Each guide is factual and carries its sources (the weekly SEO routine, docs/seo-rutina.md, writes and refreshes them).
Pages: /guies/<slug>/ (Catalan), /es/guias/<slug>/, /en/guides/<slug>/, an index page per language, and a block of
links in the surroundings section of the home page.

A guide file:
  { "slug": {"ca": "...", "es": "...", "en": "..."}, "published": "2026-10-25", "updated": "2026-10-25",
    "image": "montserrat-vinyes.jpg" (in img/), "minutes": 45 (by car from the house, optional),
    "title": {...}, "description": {...} (one or two sentences, also the meta description),
    "body": {...} (paragraphs separated by a blank line; "## " starts a heading, "- " a list; [text](url) links),
    "sources": [{"name": "...", "url": "..."}] }
"""
import datetime
import html
import json
import re
from pathlib import Path

LANGS = ('ca', 'es', 'en')
BASE = {'ca': '/guies/', 'es': '/es/guias/', 'en': '/en/guides/'}
HOME = {'ca': '/', 'es': '/es/', 'en': '/en/'}
LANG_NAME = {'ca': 'Català', 'es': 'Español', 'en': 'English'}
OG_LOCALE = {'ca': 'ca_ES', 'es': 'es_ES', 'en': 'en_GB'}
WORDS = {
    'ca': {'guides': "Guies de l'entorn", 'guides_intro': "Què fer a prop del Bedorc, amb les dades comprovades i les fonts.",
           'updated': 'Actualitzada el', 'sources': 'Fonts', 'book': 'Reservar', 'stay': 'Dormir a La Casa Vella',
           'stay_text': "Casa de poble de 1898 al Bedorc, amb dos apartaments i dues habitacions, a {m} minuts en cotxe.",
           'stay_text_plain': "Casa de poble de 1898 al Bedorc, amb dos apartaments i dues habitacions.",
           'by_car': 'A {m} min de casa', 'home': 'Inici', 'home_label': 'Guies', 'home_title': 'Per preparar la visita', 'lang': 'Idioma'},
    'es': {'guides': 'Guías del entorno', 'guides_intro': 'Qué hacer cerca de El Bedorc, con los datos comprobados y las fuentes.',
           'updated': 'Actualizada el', 'sources': 'Fuentes', 'book': 'Reservar', 'stay': 'Dormir en La Casa Vella',
           'stay_text': 'Casa de pueblo de 1898 en El Bedorc, con dos apartamentos y dos habitaciones, a {m} minutos en coche.',
           'stay_text_plain': 'Casa de pueblo de 1898 en El Bedorc, con dos apartamentos y dos habitaciones.',
           'by_car': 'A {m} min de casa', 'home': 'Inicio', 'home_label': 'Guías', 'home_title': 'Para preparar la visita', 'lang': 'Idioma'},
    'en': {'guides': 'Guides to the area', 'guides_intro': 'What to do near El Bedorc, with checked facts and their sources.',
           'updated': 'Updated', 'sources': 'Sources', 'book': 'Book', 'stay': 'Stay at La Casa Vella',
           'stay_text': 'An 1898 village house in El Bedorc with two apartments and two rooms, a {m}-minute drive away.',
           'stay_text_plain': 'An 1898 village house in El Bedorc with two apartments and two rooms.',
           'by_car': '{m} min from the house', 'home': 'Home', 'home_label': 'Guides', 'home_title': 'Plan your visit', 'lang': 'Language'},
}
MONTHS = {
    'ca': ['de gener', 'de febrer', 'de març', "d'abril", 'de maig', 'de juny', 'de juliol', "d'agost", 'de setembre', "d'octubre", 'de novembre', 'de desembre'],
    'es': ['de enero', 'de febrero', 'de marzo', 'de abril', 'de mayo', 'de junio', 'de julio', 'de agosto', 'de septiembre', 'de octubre', 'de noviembre', 'de diciembre'],
    'en': ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
}
e = html.escape


def date_text(iso, lang):
    d = datetime.date.fromisoformat(iso)
    return f'{d.day} {MONTHS[lang][d.month - 1]} {d.year}' if lang == 'en' else f'{d.day} {MONTHS[lang][d.month - 1]} de {d.year}'


def inline(text):
    text = e(text, quote=False)
    text = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', text)
    return re.sub(r'\[([^\]]+)\]\((https?://[^)\s]+|/[^)\s]*)\)',
                  lambda m: f'<a href="{m.group(2)}"' + (' target="_blank" rel="noopener"' if m.group(2).startswith('http') else '') + f'>{m.group(1)}</a>', text)


def body_html(text):
    out = []
    for block in re.split(r'\n\s*\n', text.strip()):
        lines = [l.strip() for l in block.strip().split('\n')]
        if lines[0].startswith('## '):
            out.append(f'<h2>{inline(lines[0][3:])}</h2>')
            lines = lines[1:]
            if not lines:
                continue
        if all(l.startswith('- ') for l in lines):
            out.append('<ul>' + ''.join(f'<li>{inline(l[2:])}</li>' for l in lines) + '</ul>')
        else:
            out.append(f'<p>{inline(" ".join(lines))}</p>')
    return '\n'.join(out)


STYLE = '''
@font-face { font-family: "Le Monde Livre"; src: url(/fonts/LeMondeLivre.woff2) format("woff2"); font-weight: 400 600; font-display: swap; }
@font-face { font-family: "Halyard Display"; src: url(/fonts/HalyardDisplay.woff2) format("woff2"); font-weight: 300 700; font-display: swap; }
:root { --ground: #f7f5f0; --paper: #ffffff; --ink: #1a3f20; --text: #26302a; --muted: #5f6a5f; --line: #e3dfd5; --basil: #2e6d2e; --sage: #79a57a;
  --display: "Le Monde Livre", Georgia, serif; --body: "Halyard Display", "Helvetica Neue", Arial, sans-serif; color-scheme: light; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--ground); color: var(--text); font: 300 17px/1.7 var(--body); }
a { color: inherit; }
img { max-width: 100%; display: block; }
h1, h2, h3 { font-family: var(--display); font-weight: 400; line-height: 1.12; text-wrap: balance; margin: 0; color: var(--ink); }
.wrap { width: 100%; max-width: 1240px; margin-inline: auto; padding-inline: max(16px, env(safe-area-inset-left, 0px)); }
.label { font-weight: 600; font-size: 11.5px; letter-spacing: .26em; text-transform: uppercase; color: var(--basil); }
.btn { display: inline-flex; align-items: center; justify-content: center; font: 600 11.5px/1 var(--body); letter-spacing: .22em; text-transform: uppercase; padding: 16px 26px; border: 1px solid currentColor; color: var(--ink); text-decoration: none; }
.btn.solid { background: var(--basil); color: #f3efe4; border-color: var(--basil); }
header.top { background: rgba(15, 38, 20, .95); color: #f3efe4; }
header.top .wrap { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-block: 12px; }
.logo { display: flex; align-items: center; gap: 10px; text-decoration: none; color: #f3efe4; }
.logo .iso { width: 34px; height: 34px; background: #f3efe4; -webkit-mask: url(/img/iso-dark.png) center / contain no-repeat; mask: url(/img/iso-dark.png) center / contain no-repeat; }
.logo .name { font-family: var(--display); font-size: 21px; letter-spacing: .16em; text-transform: uppercase; line-height: 1; }
header.top .btn { color: #f3efe4; border-color: rgba(243, 239, 228, .7); padding: 12px 18px; }
.article { max-width: 760px; padding-block: clamp(40px, 7vw, 80px); }
.article .label a { text-decoration: none; }
.article h1 { font-size: clamp(34px, 5vw, 56px); text-transform: uppercase; letter-spacing: .02em; line-height: 1.02; margin-top: 12px; }
.lede { font-family: var(--display); font-size: clamp(20px, 2.4vw, 26px); line-height: 1.4; color: var(--ink); margin: 20px 0 8px; }
.meta { font-size: 14px; color: var(--muted); margin: 0 0 28px; }
.cover { aspect-ratio: 3 / 2; width: 100%; height: auto; object-fit: cover; margin-bottom: 36px; }
@media (max-width: 420px) { .logo .name { font-size: 17px; } }
.article h2 { font-size: clamp(26px, 3vw, 34px); margin: 44px 0 12px; }
.article ul { padding-left: 1.1em; }
.article li + li { margin-top: 6px; }
.sources { font-size: 15px; color: var(--muted); }
.sources a { word-break: break-word; }
.stay-cta { margin-top: 56px; padding: 32px; background: var(--paper); border: 1px solid var(--line); display: grid; gap: 14px; justify-items: start; }
.stay-cta h2 { margin: 0 !important; }
.stay-cta p { margin: 0; color: var(--muted); }
.list { display: grid; margin-top: 32px; border-top: 1px solid var(--line); }
.list article { padding-block: 24px; border-bottom: 1px solid var(--line); display: grid; gap: 8px; }
.list h2 { font-size: 28px; margin: 0; }
.list h2 a { text-decoration: none; }
.list p { margin: 0; color: var(--muted); }
footer { background: #1a3f20; color: #e3ddd0; font-size: 14px; padding-block: 40px; }
footer .wrap { display: flex; flex-wrap: wrap; gap: 12px 32px; justify-content: space-between; }
footer a { color: #e3ddd0; }
footer .langs { display: flex; gap: 16px; }
'''


def load(root):
    folder = root / 'content' / 'guides'
    guides = [json.loads(p.read_text(encoding='utf-8')) for p in sorted(folder.glob('*.json'))] if folder.exists() else []
    return sorted(guides, key=lambda g: g['published'], reverse=True)


def url(g, lang):
    return BASE[lang] + g['slug'][lang] + '/'


def page(site, lang, title, description, canonical, alternates, ld, main, image=None):
    alt = ''.join(f'<link rel="alternate" hreflang="{l}" href="{site}{u}">\n' for l, u in alternates.items())
    alt += f'<link rel="alternate" hreflang="x-default" href="{site}{alternates["ca"]}">\n'
    langs = ''.join(f'<a href="{u}" hreflang="{l}" lang="{l}">{LANG_NAME[l]}</a>' for l, u in alternates.items() if l != lang)
    w = WORDS[lang]
    return f'''<!doctype html>
<html lang="{lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{e(title)}</title>
<meta name="description" content="{e(description)}">
<link rel="canonical" href="{site}{canonical}">
{alt}<link rel="icon" type="image/png" href="/img/iso-dark.png">
<meta property="og:type" content="article">
<meta property="og:site_name" content="La Casa Vella">
<meta property="og:url" content="{site}{canonical}">
<meta property="og:locale" content="{OG_LOCALE[lang]}">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(description)}">
<meta property="og:image" content="{site}/img/{image or 'hero-vinyes-cel.jpg'}">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')}</script>
<style>{STYLE}</style>
</head>
<body>
<header class="top"><div class="wrap"><a class="logo" href="{HOME[lang]}" aria-label="La Casa Vella, {w['home'].lower()}"><span class="iso" aria-hidden="true"></span><span class="name">La Casa Vella</span></a><a class="btn" href="{HOME[lang]}#reservar">{w['book']}</a></div></header>
<main class="wrap article">
{main}
</main>
<footer><div class="wrap">
<div>Carrer Munné Orpí, 23, 08784 El Bedorc (Barcelona)<br><a href="tel:+34667409859">+34 667 40 98 59</a><br><!--email_off--><a href="mailto:info@casavellarural.com">info@casavellarural.com</a><!--/email_off--></div>
<nav class="langs" aria-label="{w['lang']}">{langs}</nav>
</div></footer>
</body>
</html>
'''


def build(root, dist, site):
    """Write the guide pages and indexes; return (sitemap entries [(path by lang dict, lastmod)], home block by lang)."""
    guides = load(root)
    entries, blocks = [], {l: '' for l in LANGS}
    if not guides:
        return entries, blocks
    publisher = {'@type': 'Organization', '@id': f'{site}/#lodging', 'name': 'La Casa Vella', 'url': f'{site}/'}
    for g in guides:
        alternates = {l: url(g, l) for l in LANGS}
        entries.append((alternates, g.get('updated') or g['published']))
        for lang in LANGS:
            w = WORDS[lang]
            m = g.get('minutes')
            sources = ''.join(f'<li><a href="{e(s["url"])}" target="_blank" rel="noopener">{e(s["name"])}</a></li>' for s in g['sources'])
            stay = w['stay_text'].format(m=m) if m else w['stay_text_plain']
            main = (f'<p class="label"><a href="{BASE[lang]}">{w["guides"]}</a></p>\n<h1>{e(g["title"][lang])}</h1>\n'
                    f'<p class="lede">{e(g["description"][lang])}</p>\n'
                    f'<p class="meta">{w["updated"]} {date_text(g.get("updated") or g["published"], lang)}</p>\n'
                    f'<img class="cover" src="/img/{e(g["image"])}" alt="" width="1200" height="800">\n'
                    f'{body_html(g["body"][lang])}\n'
                    f'<h2>{w["sources"]}</h2>\n<ul class="sources">{sources}</ul>\n'
                    f'<aside class="stay-cta"><h2>{w["stay"]}</h2><p>{e(stay)}</p><a class="btn solid" href="{HOME[lang]}#reservar">{w["book"]}</a></aside>')
            ld = {'@context': 'https://schema.org', '@graph': [
                {'@type': 'Article', '@id': f'{site}{url(g, lang)}#article', 'headline': g['title'][lang], 'description': g['description'][lang],
                 'inLanguage': lang, 'datePublished': g['published'], 'dateModified': g.get('updated') or g['published'],
                 'image': f'{site}/img/{g["image"]}', 'mainEntityOfPage': f'{site}{url(g, lang)}', 'author': publisher, 'publisher': publisher,
                 'citation': [s['url'] for s in g['sources']]},
                {'@type': 'BreadcrumbList', 'itemListElement': [
                    {'@type': 'ListItem', 'position': 1, 'name': 'La Casa Vella', 'item': f'{site}{HOME[lang]}'},
                    {'@type': 'ListItem', 'position': 2, 'name': w['guides'], 'item': f'{site}{BASE[lang]}'},
                    {'@type': 'ListItem', 'position': 3, 'name': g['title'][lang], 'item': f'{site}{url(g, lang)}'}]}]}
            out = dist / url(g, lang).strip('/')
            out.mkdir(parents=True, exist_ok=True)
            (out / 'index.html').write_text(page(site, lang, f'{g["title"][lang]} (La Casa Vella)', g['description'][lang], url(g, lang),
                                                 alternates, ld, main, g['image']), encoding='utf-8')
    for lang in LANGS:
        w = WORDS[lang]
        items = ''.join(f'<article><span class="label">{date_text(g.get("updated") or g["published"], lang)}</span>'
                        f'<h2><a href="{url(g, lang)}">{e(g["title"][lang])}</a></h2><p>{e(g["description"][lang])}</p></article>' for g in guides)
        main = f'<h1>{w["guides"]}</h1>\n<p class="lede">{w["guides_intro"]}</p>\n<div class="list">{items}</div>'
        ld = {'@context': 'https://schema.org', '@type': 'CollectionPage', 'name': w['guides'], 'inLanguage': lang, 'url': f'{site}{BASE[lang]}',
              'hasPart': [{'@type': 'Article', 'headline': g['title'][lang], 'url': f'{site}{url(g, lang)}'} for g in guides]}
        out = dist / BASE[lang].strip('/')
        out.mkdir(parents=True, exist_ok=True)
        (out / 'index.html').write_text(page(site, lang, f'{w["guides"]} (La Casa Vella)', w['guides_intro'], BASE[lang], BASE, ld, main), encoding='utf-8')
        cards = ''.join(f'      <article><span class="label">{w["by_car"].format(m=g["minutes"]) if g.get("minutes") else w["home_label"]}</span>'
                        f'<h3><a href="{url(g, lang)}">{e(g["title"][lang])}</a></h3><p>{e(g["description"][lang])}</p></article>\n' for g in guides[:6])
        blocks[lang] = (f'    <div class="seal-head"><span class="label">{w["home_label"]}</span><h3>{w["home_title"]}</h3></div>\n'
                        f'    <div class="near guides">\n{cards}    </div>\n')
    entries.append((dict(BASE), max(g.get('updated') or g['published'] for g in guides)))
    return entries, blocks
