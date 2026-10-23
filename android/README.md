# Maite per a Android

Una app d'Android que obre Maite a pantalla completa, amb la icona de La Casa Vella. És una *Trusted Web Activity*: per dins fa servir el motor de Chrome, així que és la mateixa Maite que la web (també l'inici de sessió amb Google de Cloudflare Access) i s'actualitza sola cada cop que es publica. No és a Google Play: l'APK s'instal·la a mà.

## Instal·lar-la

1. Passa `Maite.apk` al mòbil (per correu, Drive o cable) i obre'l.
2. Si Android ho demana, permet instal·lar apps d'aquest origen (Configuració > Aplicacions > Accés especial > Instal·lar apps desconegudes).
3. Obre Maite i inicia sessió amb Google, com a la web. Cal tenir Chrome instal·lat (ve de sèrie).

## Pantalla completa

L'app comprova `https://maite.casavellarural.com/.well-known/assetlinks.json` (a `maite-app/public/.well-known/`, servit per `functions/_middleware.js`), que diu quina clau signa l'app. Si Cloudflare Access no deixa llegir aquest fitxer sense iniciar sessió, l'app funciona igual però amb una barra d'adreça petita a dalt. A Cloudflare Zero Trust, l'aplicació de Maite necessita una política *Bypass* per al camí `/.well-known/assetlinks.json`.

## Fer-ne una versió nova

Només cal si canvia la icona, el nom o l'adreça: el contingut ve de la web. Cal la clau `maite.keystore` (no és al repositori) i la seva contrasenya, el SDK d'Android i Java 17 o més:

```bash
cd android
export ANDROID_HOME=/ruta/al/android-sdk MAITE_KEYSTORE=/ruta/a/maite.keystore MAITE_KEYSTORE_PASSWORD=…
gradle assembleRelease      # app/build/outputs/apk/release/app-release.apk
```

Puja `versionCode` a `app/build.gradle` perquè Android l'accepti com a actualització. Si es perd la clau, se'n pot fer una de nova, però cal desinstal·lar l'app abans i posar la nova empremta SHA-256 a `assetlinks.json`.
