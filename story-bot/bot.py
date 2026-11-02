"""The story robot: posts Maite's programmed Instagram stories with the link sticker, which Instagram's official API can't add.

Every minute it asks the web (GET /api/story-bot) for the stories whose time has come, gets each one's JPEG (or draws it on
/render/render.html with Chromium when Maite doesn't have it yet), posts it through Instagram's own app protocol (instagrapi)
with a link sticker to the booking page, and says how it went (POST /api/story-bot). If it can't, Maite publishes the story
without the sticker a few hours later (lib/instagram.js), so the plan never stops.

This is not Instagram's official API: it signs in as the account, like the phone app does. Instagram may ask to verify the login
or, in the worst case, restrict the account. To keep that unlikely it keeps one session and one device (session.json), signs in
again only when Instagram asks, waits a little between calls and posts only a few stories a day. Best run from a home
connection (a Raspberry Pi or a computer that stays on); from a server, set IG_PROXY to a residential proxy.

Environment (see README.md): SITE_URL, STORY_BOT_SECRET, IG_USERNAME, IG_PASSWORD, IG_TOTP_SECRET (if the account has
two-factor authentication with an app), IG_PROXY (optional), CHROMIUM_PATH (optional, a Chromium of your own), SESSION_FILE (default ./data/session.json), DRY_RUN=1 (does
everything except posting), ONCE=1 (one round and out).
"""
import json
import os
import sys
import tempfile
import time
import urllib.parse
import urllib.request
from pathlib import Path

SITE = os.environ.get("SITE_URL", "https://casavellarural.com").rstrip("/")
SECRET = os.environ.get("STORY_BOT_SECRET", "")
USER = os.environ.get("IG_USERNAME", "")
PASSWORD = os.environ.get("IG_PASSWORD", "")
TOTP = os.environ.get("IG_TOTP_SECRET", "").replace(" ", "")
PROXY = os.environ.get("IG_PROXY", "")
SESSION = Path(os.environ.get("SESSION_FILE", "data/session.json"))
DRY = os.environ.get("DRY_RUN") == "1"
ONCE = os.environ.get("ONCE") == "1"
EVERY = 60

# Where the sticker goes on each story template (centre, as a share of the image), on a quiet part of the design
STICKER = {"StoryPoster": (0.5, 0.35), "StoryPhoto": (0.5, 0.40), "StoryReel": (0.5, 0.68), "StoryMenu": (0.5, 0.60)}


def log(*a):
    print(time.strftime("%Y-%m-%d %H:%M:%S"), *a, flush=True)


def api(method, body=None):
    req = urllib.request.Request(SITE + "/api/story-bot", method=method, headers={
        "authorization": "Bearer " + SECRET, "content-type": "application/json", "user-agent": "casavella-story-bot"},
        data=json.dumps(body).encode() if body is not None else None)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


def status(user="", error=""):
    try:
        api("POST", {"status": {"user": user, "error": error}})
    except Exception as e:  # the web is down: it will hear next minute
        log("status not sent:", e)


# ---------- The image ----------
def image_of(job, folder):
    """The story's JPEG: Maite's own, or drawn now on the web's render page"""
    out = Path(folder) / f"{job['id']}.jpg"
    if job.get("image"):
        urllib.request.urlretrieve(job["image"], out)
        return out
    from playwright.sync_api import sync_playwright
    from PIL import Image
    png = Path(folder) / f"{job['id']}.png"
    url = SITE + "/render/render#" + urllib.parse.quote(json.dumps(job["post"], ensure_ascii=False))
    with sync_playwright() as p:
        b = p.chromium.launch(args=["--no-sandbox"], executable_path=os.environ.get("CHROMIUM_PATH") or None)
        page = b.new_page(viewport={"width": 1080, "height": 1920})
        page.goto(url, wait_until="networkidle", timeout=60000)
        page.wait_for_selector("#ready", state="attached", timeout=30000)
        page.screenshot(path=str(png))
        b.close()
    Image.open(png).convert("RGB").save(out, "JPEG", quality=92)
    return out


# ---------- Instagram ----------
class Insta:
    def __init__(self):
        self.cl = None

    def login(self):
        from instagrapi import Client
        from instagrapi.exceptions import LoginRequired
        cl = Client()
        cl.delay_range = [1, 3]
        if PROXY:
            cl.set_proxy(PROXY)
        code = lambda: cl.totp_generate_code(TOTP) if TOTP else ""
        if SESSION.exists():
            cl.load_settings(SESSION)
            try:
                cl.login(USER, PASSWORD, verification_code=code())
                cl.get_timeline_feed()  # the saved session still works
            except LoginRequired:
                # A new session on the same device, so Instagram sees the phone it knows
                old = cl.get_settings()
                cl.set_settings({})
                cl.set_uuids(old["uuids"])
                cl.login(USER, PASSWORD, verification_code=code())
        else:
            cl.login(USER, PASSWORD, verification_code=code())
        SESSION.parent.mkdir(parents=True, exist_ok=True)
        cl.dump_settings(SESSION)
        self.cl = cl
        log("signed in as", USER)

    def post(self, jpg, link, tpl):
        from instagrapi.types import StoryLink
        x, y = STICKER.get(tpl, (0.5, 0.5))
        sticker = StoryLink(webUri=link, x=x, y=y, width=0.5, height=0.06)
        media = self.cl.photo_upload_to_story(Path(jpg), links=[sticker])
        self.cl.dump_settings(SESSION)
        return str(media.pk), f"https://www.instagram.com/stories/{USER}/{media.pk}/"


def round_(ig):
    jobs = api("GET").get("jobs", [])
    for job in jobs:
        log("story", job["id"], "for", job["at"], "->", job["link"])
        try:
            with tempfile.TemporaryDirectory() as folder:
                jpg = image_of(job, folder)
                if DRY:
                    log("dry run: not posted", jpg.stat().st_size, "bytes")
                    api("POST", {"id": job["id"], "ok": False, "error": "dry run"})
                    continue
                media, url = ig.post(jpg, job["link"], job["post"]["tpl"])
            api("POST", {"id": job["id"], "ok": True, "media": media, "url": url})
            log("posted", url)
        except Exception as e:
            log("failed:", repr(e))
            api("POST", {"id": job["id"], "ok": False, "error": f"{type(e).__name__}: {e}"[:300]})
            if "login" in type(e).__name__.lower() or "challenge" in type(e).__name__.lower():
                raise


def main():
    if not SECRET or not USER or not PASSWORD:
        sys.exit("Falten STORY_BOT_SECRET, IG_USERNAME o IG_PASSWORD (vegeu README.md)")
    ig = Insta()
    wait = EVERY
    while True:
        try:
            if ig.cl is None and not DRY:
                ig.login()
                status(USER, "")
            elif DRY and ig.cl is None:
                ig.cl = True
                status(USER, "")
            round_(ig)
            wait = EVERY
        except Exception as e:
            name = type(e).__name__
            log("error:", name, e)
            # Instagram asks to verify the login (a code by email or SMS, a challenge): only a person can, in the app.
            # Wait longer before trying again, so the account isn't pushed
            if any(k in name.lower() for k in ("challenge", "login", "twofactor", "feedback", "pleasewait", "badpassword")):
                status(USER, f"{name}: obre Instagram al mòbil, confirma que ets tu i reinicia el robot" if "challenge" in name.lower() else f"{name}: {e}"[:300])
                ig.cl = None
                wait = 30 * 60
            else:
                wait = min(wait * 2, 15 * 60)
        if ONCE:
            return
        time.sleep(wait)


if __name__ == "__main__":
    main()
