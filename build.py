#!/usr/bin/env python3
"""Build the standalone website for the domain from index.html.

index.html is the review version (published as a Claude artifact). This script
writes dist/ with a complete HTML document, SEO and social tags, and without the
review tools (draft banner, design switcher, phone preview).

Usage:  python3 build.py [https://www.your-domain.com]
Then upload the dist/ folder to Netlify, Cloudflare Pages or any static host.
"""
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DIST = ROOT / 'dist'
SITE_URL = (sys.argv[1] if len(sys.argv) > 1 else '').rstrip('/')

TITLE = 'La Casa Vella, allotjament rural al Bedorc'
DESCRIPTION = ("Casa de poble familiar de 1898 al Bedorc, entre vinyes i amb Montserrat a l'horitzó. "
               "Dos apartaments, dues habitacions i restaurant.")
OG_IMAGE = 'img/hero-vinyes-cel.jpg'


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

og_image = f'{SITE_URL}/{OG_IMAGE}' if SITE_URL else OG_IMAGE
canonical = f'<link rel="canonical" href="{SITE_URL}/">\n' if SITE_URL else ''
head = f'''<!doctype html>
<html lang="ca" data-variant="5">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{TITLE}</title>
<meta name="description" content="{DESCRIPTION}">
{canonical}<link rel="icon" type="image/png" href="img/iso-dark.png">
<meta property="og:type" content="website">
<meta property="og:title" content="{TITLE}">
<meta property="og:description" content="{DESCRIPTION}">
<meta property="og:image" content="{og_image}">
<meta name="twitter:card" content="summary_large_image">
<style>:root{{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}}body{{margin:0}}img{{max-width:100%}}[hidden]{{display:none!important}}</style>
'''
# Everything up to and including </style> goes in <head>, the rest in <body>
split = src.index('</style>') + len('</style>')
page = head + src[:split] + '\n</head>\n<body>\n' + src[split:].lstrip() + '\n</body>\n</html>\n'

if DIST.exists():
    shutil.rmtree(DIST)
DIST.mkdir()
(DIST / 'index.html').write_text(page, encoding='utf-8')
for folder in ('img', 'fonts'):
    shutil.copytree(ROOT / folder, DIST / folder)
# Cloudflare Pages headers: the Stripe payment form (another origin) loads our brand font
(DIST / '_headers').write_text('/fonts/*\n  Access-Control-Allow-Origin: *\n', encoding='utf-8')
print(f'Built {DIST} ({len(page) // 1024} KB html)')
