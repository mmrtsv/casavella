#!/usr/bin/env python3
"""Tell IndexNow (Bing, which ChatGPT searches with, plus Yandex and Seznam) that the site's pages changed.

Sends every URL in dist/sitemap.xml. Run it after a deploy to main has gone live, so the key file
(/<INDEXNOW_KEY>.txt, written by build.py) is reachable. Google doesn't use IndexNow: it reads the
sitemap from Search Console.

Usage:  python3 indexnow.py
"""
import json
import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent
# build.py builds the site when imported, so the key is read from its source.
INDEXNOW_KEY = re.search(r"^INDEXNOW_KEY = '(\w+)'", (ROOT / 'build.py').read_text(encoding='utf-8'), re.M).group(1)
SITE_URL = 'https://casavellarural.com'
urls = re.findall(r'<loc>([^<]+)</loc>', (ROOT / 'dist' / 'sitemap.xml').read_text(encoding='utf-8'))
body = json.dumps({'host': SITE_URL.split('//')[1], 'key': INDEXNOW_KEY,
                   'keyLocation': f'{SITE_URL}/{INDEXNOW_KEY}.txt', 'urlList': urls}).encode()
req = urllib.request.Request('https://api.indexnow.org/indexnow', data=body,
                             headers={'Content-Type': 'application/json; charset=utf-8'})
with urllib.request.urlopen(req, timeout=30) as r:
    print(f'IndexNow: {r.status} for {len(urls)} URLs')
