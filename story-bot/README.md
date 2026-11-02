# Robot de stories

Alternativa: el mateix Cloudflare ja penja les stories amb l'enllaç amb la sessió del compte (`IG_SESSIONID`, pas 10 del README principal), sense cap ordinador. Aquest robot és per si algun dia convé fer-ho des de casa.

Penja les stories programades a Maite (el pla setmanal i els recordatoris dels menús) **amb l'adhesiu d'enllaç** a la pàgina de reserva, que l'API oficial d'Instagram no deixa posar. Cada minut pregunta a la web quines stories toquen (`/api/story-bot`), en baixa la imatge (o la dibuixa a `/render/render.html` si Maite encara no la té), la penja amb l'enllaç i ho diu a Maite. A *Xarxes socials › Pla* surt si el robot està connectat.

Si el robot no pot (està aturat, Instagram demana verificar l'entrada…), Maite publica la story sense enllaç unes hores després (per defecte 3; es canvia a *Com planifica*), de manera que el pla no s'atura mai.

## Què s'ha de saber

No fa servir l'API oficial: entra al compte com ho fa l'app del mòbil (amb [instagrapi](https://github.com/subzeroid/instagrapi)). Això va contra les condicions d'Instagram. Pot passar que Instagram demani confirmar que ets tu (s'obre l'app, es confirma i es reinicia el robot) i, en el pitjor cas, que limiti o suspengui el compte. Per fer-ho poc probable: una sola sessió i un sol dispositiu guardats a `data/`, pauses entre crides i poques stories al dia. Millor des d'una connexió de casa (un Raspberry Pi o un ordinador que estigui sempre engegat) que des d'un servidor; des d'un servidor, amb `IG_PROXY` (un proxy residencial).

La contrasenya només és a la màquina del robot (`.env`), mai a Cloudflare ni al repositori.

## Posar-lo en marxa

1. Inventa un secret llarg (`openssl rand -hex 32`) i posa'l a Cloudflare Pages com a `STORY_BOT_SECRET` (Settings → Variables and secrets). Torna a desplegar.
2. A la màquina on anirà, amb Docker:

   ```bash
   git clone <aquest repositori> && cd casavella/story-bot
   cp .env.example .env    # i omple'l: el mateix secret, l'usuari i la contrasenya d'Instagram
   docker compose up -d
   docker compose logs -f  # ha de dir «signed in as …»
   ```

   Sense Docker: Python 3.11 o més nou, `pip install -r requirements.txt`, `playwright install chromium` i `python bot.py` (amb les variables de `.env.example` a l'entorn).
3. La primera vegada, Instagram potser avisa al mòbil d'una entrada nova: confirma que ets tu. Si el compte té verificació en dos passos amb una app, posa a `IG_TOTP_SECRET` la clau de configuració (no un codi de 6 xifres); amb SMS no funciona sol.
4. A Maite, *Xarxes socials › Pla*, ha de dir «Les stories surten soles amb l'enllaç».

Per provar-lo sense penjar res: `DRY_RUN=1 ONCE=1 python bot.py` (fa una volta, dibuixa la story i diu a Maite que no l'ha penjada).

## On va l'adhesiu

Al centre, en una part tranquil·la de cada plantilla (`STICKER` a `bot.py`): a la story amb cartell, a sobre del títol; a la de foto, al cel; al menú, entre els plats i el preu.
