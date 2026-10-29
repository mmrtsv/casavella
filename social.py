#!/usr/bin/env python3
"""Gather this week's social data for the Claude social team (docs/social/README.md).

Writes docs/social/datos/<date>.json and .md with three things:
  1. Outlier videos on YouTube (Shorts and short videos) for the search phrases in
     docs/social/contexto.md: views against the median of the channel's own recent uploads.
     With YOUTUBE_API_KEY (YouTube Data API v3, free) it also has the date, likes and comments;
     without it, it reads YouTube's public listings with yt-dlp (views only).
  2. La Casa Vella's own Instagram posts, with INSTAGRAM_TOKEN (the same token Maite uses).
  3. The TikTok and Instagram links in docs/social/enlaces.md, with the author and title from
     TikTok's public oEmbed.

Usage:  python3 social.py            (pip install yt-dlp, if there is no YOUTUBE_API_KEY)
"""
import json
import os
import re
import statistics
import subprocess
import sys
import urllib.parse
import urllib.request
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SOCIAL = ROOT / 'docs' / 'social'
TODAY = date.today()
YT_KEY = os.environ.get('YOUTUBE_API_KEY')
IG_TOKEN = os.environ.get('INSTAGRAM_TOKEN')
PER_PHRASE = 15        # videos per search phrase
CHANNEL_SAMPLE = 20    # recent uploads that make a channel's median
MAX_CHANNELS = 40


def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'casavella-social'}), timeout=30) as r:
        return json.load(r)


def context_lists():
    """The search phrases and the exclusions, from the bullet lists in contexto.md."""
    text = (SOCIAL / 'contexto.md').read_text(encoding='utf-8')
    section = text.split('## Búsquedas y exclusiones', 1)[1]
    search, exclude = section.split('Excluir', 1)
    bullets = lambda t: [m.strip() for m in re.findall(r'^- (.+)$', t, re.M)]
    return bullets(search), [w.lower() for w in bullets(exclude)]


# YouTube with the Data API ---------------------------------------------------------------------

def api(path, **params):
    return get(f'https://www.googleapis.com/youtube/v3/{path}?' + urllib.parse.urlencode({**params, 'key': YT_KEY}))


def api_videos(ids):
    out = []
    for i in range(0, len(ids), 50):
        out += api('videos', part='snippet,statistics,contentDetails', id=','.join(ids[i:i + 50]))['items']
    return out


def api_search(phrase):
    after = (datetime.now(timezone.utc) - timedelta(days=30)).strftime('%Y-%m-%dT%H:%M:%SZ')
    res = api('search', part='id', q=phrase, type='video', videoDuration='short', publishedAfter=after,
              regionCode='ES', maxResults=PER_PHRASE, order='viewCount')
    return [i['id']['videoId'] for i in res['items']]


def api_channel_median(channel_id):
    ch = api('channels', part='contentDetails,statistics', id=channel_id)['items']
    if not ch:
        return None, None
    uploads = ch[0]['contentDetails']['relatedPlaylists']['uploads']
    items = api('playlistItems', part='contentDetails', playlistId=uploads, maxResults=CHANNEL_SAMPLE)['items']
    views = [int(v['statistics'].get('viewCount', 0)) for v in api_videos([i['contentDetails']['videoId'] for i in items])]
    subs = ch[0]['statistics'].get('subscriberCount')
    return (statistics.median(views) if views else None), (int(subs) if subs else None)


def youtube_api(phrases):
    ids = {}
    for p in phrases:
        for vid in api_search(p):
            ids.setdefault(vid, p)
    videos = []
    for v in api_videos(list(ids)):
        s, st = v['snippet'], v['statistics']
        videos.append({
            'url': f'https://www.youtube.com/watch?v={v["id"]}', 'title': s['title'],
            'description': s.get('description', '')[:300], 'channel': s['channelTitle'], 'channel_id': s['channelId'],
            'published': s['publishedAt'][:10], 'phrase': ids[v['id']],
            'views': int(st.get('viewCount', 0)), 'likes': int(st['likeCount']) if 'likeCount' in st else None,
            'comments': int(st['commentCount']) if 'commentCount' in st else None,
        })
    return videos, api_channel_median


# YouTube without a key: public listings through yt-dlp --------------------------------------------

def ytdlp(url, n):
    r = subprocess.run(['yt-dlp', '--flat-playlist', '--playlist-end', str(n), '-J', url],
                       capture_output=True, text=True, timeout=180)
    try:
        return [e for e in (json.loads(r.stdout) or {}).get('entries') or [] if e]
    except json.JSONDecodeError:
        return []


def ytdlp_channel_median(channel_id):
    views = []
    for tab in ('shorts', 'videos'):
        views += [e['view_count'] for e in ytdlp(f'https://www.youtube.com/channel/{channel_id}/{tab}', CHANNEL_SAMPLE)
                  if e.get('view_count') is not None]
    return (statistics.median(views) if views else None), None


def youtube_public(phrases):
    videos, seen = [], set()
    for p in phrases:
        # sp=EgQIBBgB: uploaded this month, under 4 minutes.
        url = 'https://www.youtube.com/results?' + urllib.parse.urlencode({'search_query': p, 'sp': 'EgQIBBgB'})
        for e in ytdlp(url, PER_PHRASE):
            if e.get('id') in seen or not e.get('channel_id'):
                continue
            seen.add(e['id'])
            videos.append({
                'url': f'https://www.youtube.com/watch?v={e["id"]}', 'title': e.get('title') or '',
                'description': (e.get('description') or '')[:300], 'channel': e.get('channel'),
                'channel_id': e['channel_id'], 'published': None, 'phrase': p,
                'views': e.get('view_count'), 'likes': None, 'comments': None,
            })
    return videos, ytdlp_channel_median


def youtube(phrases, exclude):
    if YT_KEY:
        videos, channel_median = youtube_api(phrases)
    else:
        try:
            subprocess.run(['yt-dlp', '--version'], capture_output=True, check=True)
        except (OSError, subprocess.CalledProcessError):
            sys.exit('Falta yt-dlp (pip install yt-dlp) o la variable YOUTUBE_API_KEY.')
        videos, channel_median = youtube_public(phrases)
    videos = [v for v in videos if v['views'] is not None
              and not any(w in (v['title'] + ' ' + v['description']).lower() for w in exclude)]
    medians = {}
    for cid in list(dict.fromkeys(v['channel_id'] for v in sorted(videos, key=lambda v: -v['views'])))[:MAX_CHANNELS]:
        medians[cid] = channel_median(cid)
    for v in videos:
        median, subs = medians.get(v['channel_id'], (None, None))
        v['channel_median'] = median
        v['subscribers'] = subs
        v['ratio'] = round(v['views'] / median, 1) if median else None
        v['engagement_per_1k'] = (round(1000 * ((v['likes'] or 0) + (v['comments'] or 0)) / v['views'], 1)
                                  if v['views'] and v['likes'] is not None else None)
    return sorted(videos, key=lambda v: (v['ratio'] or 0, v['views']), reverse=True)


# Own Instagram ---------------------------------------------------------------------------------

def instagram():
    if not IG_TOKEN:
        return None
    base = 'https://graph.instagram.com/v23.0'
    fields = 'id,caption,media_type,permalink,timestamp,like_count,comments_count'
    posts = get(f'{base}/me/media?fields={fields}&limit=30&access_token={IG_TOKEN}').get('data', [])
    for p in posts:
        p['caption'] = (p.get('caption') or '')[:120]
        try:
            ins = get(f'{base}/{p["id"]}/insights?metric=reach,saved,shares,views&access_token={IG_TOKEN}')
            p.update({m['name']: m['values'][0]['value'] for m in ins.get('data', [])})
        except Exception:
            pass  # Insights need instagram_business_manage_insights; likes and comments still count.
    likes = [p.get('like_count') or 0 for p in posts]
    median = statistics.median(likes) if likes else 0
    for p in posts:
        p['ratio'] = round((p.get('like_count') or 0) / median, 1) if median else None
    return posts


# Links dropped by hand -------------------------------------------------------------------------

def links():
    f = SOCIAL / 'enlaces.md'
    if not f.exists():
        return []
    out = []
    for url in dict.fromkeys(re.findall(r'https://(?:www\.)?(?:tiktok\.com|instagram\.com)/\S+', f.read_text(encoding='utf-8'))):
        url = url.rstrip(').,>')
        item = {'url': url}
        if 'tiktok.com' in url:
            try:
                o = get('https://www.tiktok.com/oembed?url=' + urllib.parse.quote(url, safe=''))
                item.update(author=o.get('author_unique_id') or o.get('author_name'), title=o.get('title'))
            except Exception:
                pass
        out.append(item)
    return out


# Report ----------------------------------------------------------------------------------------

def num(n):
    return 'sin dato' if n is None else f'{n:,}'.replace(',', '.') if isinstance(n, int) else str(n).replace('.', ',')


def cell(t):
    return (t or '').replace('|', '/').replace('\n', ' ').strip()


def report(videos, ig, dropped):
    src = 'YouTube Data API' if YT_KEY else 'listados públicos de YouTube (sin fecha ni likes: falta YOUTUBE_API_KEY)'
    md = [f'# Datos de redes, {TODAY.isoformat()}', '', f'Fuente de YouTube: {src}.', '',
          '## Outliers de YouTube', '',
          'Veces: visualizaciones del vídeo dividido por la mediana de los últimos vídeos de su canal.', '',
          '| Vídeo | Canal | Veces | Visualizaciones | Mediana del canal | Interacción por 1.000 | Fecha | Búsqueda |',
          '|---|---|---|---|---|---|---|---|']
    for v in videos[:25]:
        md.append(f'| [{cell(v["title"])[:70]}]({v["url"]}) | {cell(v["channel"])} | {num(v["ratio"])} | {num(v["views"])} '
                  f'| {num(int(v["channel_median"]) if v["channel_median"] else None)} | {num(v["engagement_per_1k"])} '
                  f'| {v["published"] or "sin dato"} | {v["phrase"]} |')
    md += ['', '## Instagram de la casa', '']
    if ig is None:
        md.append('Sin datos: falta INSTAGRAM_TOKEN.')
    else:
        md += ['Veces: likes del post dividido por la mediana de los últimos 30 posts.', '',
               '| Post | Fecha | Likes | Comentarios | Alcance | Guardados | Compartidos | Veces |', '|---|---|---|---|---|---|---|---|']
        for p in sorted(ig, key=lambda p: -(p['ratio'] or 0)):
            md.append(f'| [{cell(p["caption"])[:60] or p["media_type"]}]({p["permalink"]}) | {p["timestamp"][:10]} '
                      f'| {num(p.get("like_count"))} | {num(p.get("comments_count"))} | {num(p.get("reach"))} '
                      f'| {num(p.get("saved"))} | {num(p.get("shares"))} | {num(p["ratio"])} |')
    md += ['', '## Enlaces de TikTok e Instagram', '']
    if not dropped:
        md.append('Ninguno en docs/social/enlaces.md esta semana.')
    for d in dropped:
        md.append(f'- {d["url"]}' + (f' ({cell(d.get("author"))}: {cell(d.get("title"))[:100]})' if d.get('author') else ''))
    return '\n'.join(md) + '\n'


def main():
    phrases, exclude = context_lists()
    videos = youtube(phrases, exclude)
    ig = instagram()
    dropped = links()
    out = SOCIAL / 'datos'
    out.mkdir(exist_ok=True)
    (out / f'{TODAY}.json').write_text(json.dumps({'date': str(TODAY), 'youtube_api': bool(YT_KEY), 'youtube': videos,
                                                   'instagram': ig, 'links': dropped}, ensure_ascii=False, indent=1), encoding='utf-8')
    (out / f'{TODAY}.md').write_text(report(videos, ig, dropped), encoding='utf-8')
    print(f'{len(videos)} vídeos de YouTube, {len(ig or [])} posts propios, {len(dropped)} enlaces: docs/social/datos/{TODAY}.md')


if __name__ == '__main__':
    main()
