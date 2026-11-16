"""The pages for what the house offers: apartments, rooms and the restaurant (content/pages/*.json), in Catalan, Spanish
and English, with the look of the guides (guides.page). Prices, discounts, check-in times and the restaurant's open days
come from /api/settings when the site is built, and a small script refreshes them from the same place when the page
opens, so a change made in Maite shows without a new build."""
import datetime
import html
import json
import urllib.request

import guides

LANGS = guides.LANGS
HOME = guides.HOME
e = html.escape

W = {
    'ca': {'from': 'des de {p} € la nit', 'prices': 'Preus i condicions', 'night': 'la nit', 'guests': 'fins a {n} persones',
           'disc': 'Un {p} % menys a partir de {n} nits.', 'times': "Entrada a partir de les {i} h i sortida fins a les {o} h.",
           'cancel': "Cancel·lació gratuïta fins a {f} dies abans de l'entrada; fins a {d} dies abans es retorna el {p} %.",
           'days': 'Pròxims dies oberts', 'no_days': "Ara mateix no hi ha cap dia anunciat: els publiquem a la web i a Instagram.",
           'at': 'a les {h} h', 'book': 'Reservar', 'table': 'Reservar taula', 'event': 'Organitzar un esdeveniment', 'see': 'Veure les fotos a la pàgina principal'},
    'es': {'from': 'desde {p} € la noche', 'prices': 'Precios y condiciones', 'night': 'la noche', 'guests': 'hasta {n} personas',
           'disc': 'Un {p} % menos a partir de {n} noches.', 'times': 'Entrada a partir de las {i} h y salida hasta las {o} h.',
           'cancel': 'Cancelación gratuita hasta {f} días antes de la entrada; hasta {d} días antes se devuelve el {p} %.',
           'days': 'Próximos días abiertos', 'no_days': 'Ahora mismo no hay ningún día anunciado: los publicamos en la web y en Instagram.',
           'at': 'a las {h} h', 'book': 'Reservar', 'table': 'Reservar mesa', 'event': 'Organizar un evento', 'see': 'Ver las fotos en la página principal'},
    'en': {'from': 'from €{p} a night', 'prices': 'Prices and conditions', 'night': 'a night', 'guests': 'up to {n} guests',
           'disc': '{p}% off from {n} nights.', 'times': 'Check-in from {i}, check-out by {o}.',
           'cancel': 'Free cancellation up to {f} days before arrival; up to {d} days before, {p}% is refunded.',
           'days': 'Next open days', 'no_days': 'No days are announced right now: we publish them on the website and on Instagram.',
           'at': 'at {h}', 'book': 'Book', 'table': 'Book a table', 'event': 'Plan an event', 'see': 'See the photos on the home page'},
}
WEEKDAYS = {
    'ca': ['dilluns', 'dimarts', 'dimecres', 'dijous', 'divendres', 'dissabte', 'diumenge'],
    'es': ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'],
    'en': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
}


def settings(site):
    try:
        req = urllib.request.Request(f'{site}/api/settings', headers={'User-Agent': 'casavella-build'})
        with urllib.request.urlopen(req, timeout=10) as r:
            return json.load(r)
    except Exception:
        return None


def hour(t, lang):
    h, m = t.split(':')
    return t if lang == 'en' else (str(int(h)) if m == '00' else f'{int(h)}.{m}')


def day_text(iso, lang):
    d = datetime.datetime.fromisoformat(iso)
    when = W[lang]['at'].format(h=hour(iso[11:16], lang))
    if lang == 'en':
        return f'{WEEKDAYS[lang][d.weekday()]} {d.day} {guides.MONTHS[lang][d.month - 1]}, {when}'
    return f'{WEEKDAYS[lang][d.weekday()].capitalize()} {d.day} {guides.MONTHS[lang][d.month - 1]}, {when}'


def conditions(s, lang):
    """The prices section of a stays page, from /api/settings."""
    w, out = W[lang], []
    for t in sorted(s.get('discounts') or [], key=lambda t: t['nights']):
        out.append(w['disc'].format(p=t['pct'], n=t['nights']))
    r, c = s.get('rules') or {}, s.get('cancel') or {}
    if r.get('checkin') and r.get('checkout'):
        out.append(w['times'].format(i=hour(r['checkin'], lang), o=hour(r['checkout'], lang)))
    if c.get('fullDays'):
        out.append(w['cancel'].format(f=c['fullDays'], d=c.get('partialDays', 0), p=c.get('partialPct', 0)))
    return ''.join(f'<li>{e(x)}</li>' for x in out)


SCRIPT = '''<script>
fetch('/api/settings').then(r => r.ok ? r.json() : null).then(s => {
  if (!s) return;
  document.querySelectorAll('[data-from]').forEach(el => { const v = s.stays && s.stays[el.dataset.from]; if (v) el.querySelector('b').textContent = v.from; });
}).catch(() => {});
</script>'''


# Days written at build time drop off the list once they have passed, until the next build
DAYS_SCRIPT = '''<script>
(() => {
  const list = document.getElementById('days'); if (!list) return;
  const now = new Date();
  list.querySelectorAll('[data-at]').forEach(li => { if (new Date(li.dataset.at) < now) li.remove(); });
  if (!list.children.length) { list.hidden = true; document.getElementById('noDays').hidden = false; }
})();
</script>'''


def build(root, dist, site):
    """Write the pages; return the sitemap entries [(path by lang dict, lastmod)] and the footer links by lang."""
    folder = root / 'content' / 'pages'
    pages = [json.loads(p.read_text(encoding='utf-8')) for p in sorted(folder.glob('*.json'))] if folder.exists() else []
    s = settings(site) or {}
    entries, links = [], {l: [] for l in LANGS}
    for pg in pages:
        alternates = {l: pg['path'][l] for l in LANGS}
        entries.append((alternates, pg['updated']))
        for lang in LANGS:
            w = W[lang]
            links[lang].append((pg['path'][lang], pg['nav'][lang]))
            parts, items = [], []
            for st in pg.get('stays', []):
                v = (s.get('stays') or {}).get(st['key'], {})
                price = (f'<p class="meta" data-from="{st["key"]}">' + e(w['from']).replace('{p}', f'<b>{v["from"]}</b>') + '</p>') if v.get('from') else ''
                feats = ''.join(f'<li>{e(f)}</li>' for f in st['feats'][lang])
                parts.append(f'<h2 id="{st["key"]}">{e(st["name"])}</h2>\n{price}\n<p>{e(st["text"][lang])}</p>\n<ul>{feats}</ul>\n'
                             f'<img class="cover" src="/img/{e(st["image"])}" alt="{e(st["alt"][lang])}" width="1200" height="800" loading="lazy">')
                items.append({'@type': pg['ld_type'], '@id': f'{site}/#{st["key"]}', 'name': st['name'], 'description': st['text'][lang],
                              'url': f'{site}{pg["path"][lang]}#{st["key"]}', 'image': f'{site}/img/{st["image"]}',
                              'occupancy': {'@type': 'QuantitativeValue', 'maxValue': st['guests']},
                              'amenityFeature': [{'@type': 'LocationFeatureSpecification', 'name': f, 'value': True} for f in st['feats'][lang]],
                              'containedInPlace': {'@type': 'LodgingBusiness', '@id': f'{site}/#lodging'}})
            extra, cta = '', ''
            if pg.get('stays'):
                cond = conditions(s, lang)
                extra = f'<h2>{w["prices"]}</h2>\n<ul>{cond}</ul>' if cond else ''
                cta = f'<a class="btn solid" href="{HOME[lang]}#reservar">{w["book"]}</a>'
            if pg.get('restaurant'):
                now = datetime.datetime.now().isoformat()[:16]
                days = [d for d in ((s.get('restaurant') or {}).get('open') or []) if d >= now]
                lis = ''.join(f'<li data-at="{d}">{e(day_text(d, lang))}</li>' for d in days[:6])
                extra = (f'<h2>{w["days"]}</h2>\n' + (f'<ul id="days">{lis}</ul><p id="noDays" hidden>{w["no_days"]}</p>' if lis else f'<p>{w["no_days"]}</p>'))
                cta = (f'<a class="btn solid" href="{HOME[lang]}#taula">{w["table"]}</a>'
                       f'<a class="btn" href="{HOME[lang]}#esdeveniment">{w["event"]}</a>')
            photos = ''.join(f'<img class="cover" src="/img/{e(p["src"])}" alt="{e(p["alt"][lang])}" width="1200" height="800" loading="lazy">'
                             for p in pg.get('photos', []))
            main = (f'<p class="label"><a href="{HOME[lang]}#{pg["anchor"]}">{e(pg["label"][lang])}</a></p>\n<h1>{e(pg["title"][lang])}</h1>\n'
                    f'<p class="lede">{e(pg["description"][lang])}</p>\n'
                    f'<img class="cover" src="/img/{e(pg["image"])}" alt="{e(pg["image_alt"][lang])}" width="1200" height="800">\n'
                    f'{guides.body_html(pg["body"][lang])}\n' + '\n'.join(parts) + f'\n{photos}\n{extra}\n'
                    f'<aside class="stay-cta"><h2>{e(pg["cta"][lang])}</h2><p>{e(pg["cta_text"][lang])}</p><div class="cta-btns">{cta}</div></aside>\n'
                    + (SCRIPT if pg.get('stays') else DAYS_SCRIPT if pg.get('restaurant') else ''))
            url = f'{site}{pg["path"][lang]}'
            graph = [{'@type': 'WebPage', '@id': f'{url}#page', 'url': url, 'name': pg['title'][lang], 'description': pg['description'][lang],
                      'inLanguage': lang, 'dateModified': pg['updated'], 'isPartOf': {'@id': f'{site}/#website'},
                      'about': {'@id': f'{site}/#restaurant' if pg.get('restaurant') else f'{site}/#lodging'}},
                     {'@type': 'BreadcrumbList', 'itemListElement': [
                         {'@type': 'ListItem', 'position': 1, 'name': 'La Casa Vella', 'item': f'{site}{HOME[lang]}'},
                         {'@type': 'ListItem', 'position': 2, 'name': pg['nav'][lang], 'item': url}]}]
            if items:
                graph.append({'@type': 'ItemList', 'name': pg['title'][lang], 'itemListElement': [
                    {'@type': 'ListItem', 'position': i + 1, 'item': it} for i, it in enumerate(items)]})
            ld = {'@context': 'https://schema.org', '@graph': graph}
            out = dist / pg['path'][lang].strip('/')
            out.mkdir(parents=True, exist_ok=True)
            html_doc = guides.page(site, lang, f'{pg["title"][lang]} (La Casa Vella)', pg['description'][lang], pg['path'][lang],
                                   alternates, ld, main, pg['image']).replace('<meta property="og:type" content="article">', '<meta property="og:type" content="website">')
            (out / 'index.html').write_text(html_doc, encoding='utf-8')
    return entries, links
