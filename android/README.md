# Maite per a Android

Maite com a app nativa d'Android (Kotlin i Jetpack Compose): Inici, Calendari, Reserves amb la fitxa i els documents, Preus, Descomptes, Normes, Allotjaments, Correus i Xarxes socials. Parla amb la mateixa API que la web (`/api/maite/*`), així que les dades són les mateixes. No és a Google Play: l'APK s'instal·la a mà.

La pantalla s'adapta al mòbil. En pantalles baixes com la del Titan 2 Elite (1080 × 1200) el menú és una barra lateral i el teclat físic té dreceres: 1 a 9 per anar a cada pàgina, N nova reserva, T avui, S o / cerca, R actualitza, D mode fosc, Esc enrere i ? per veure-les totes. En mòbils llargs el menú va a baix.

## Instal·lar-la

1. Passa `Maite.apk` al mòbil i obre'l. Si Android ho demana, permet instal·lar apps d'aquest origen.
2. El primer cop, l'app demana el codi de connexió. Enganxa'l i toca Connecta.
3. Inicia sessió amb Google. Només entren els correus de `APP_EMAILS`.

## Com entra a l'API

`maite.casavellarural.com` és darrere de Cloudflare Access. L'app hi entra amb un *service token* (capçaleres `CF-Access-Client-Id` i `CF-Access-Client-Secret`) i envia el token de Google de qui ha iniciat sessió a `x-maite-google`. `accessUser` a `lib/maite.js` accepta el token de servei només si `common_name` és `APP_SERVICE_ID`, i llavors comprova el token de Google: signatura, `aud` igual a `GOOGLE_APP_CLIENT_ID`, correu verificat i dins `APP_EMAILS`.

Cal configurar:

- A Cloudflare Zero Trust, un *service token* i una política *Service Auth* a l'aplicació de Maite que l'accepti.
- Secrets de Pages: `APP_SERVICE_ID` (el Client ID del token), `GOOGLE_APP_CLIENT_ID` (un client OAuth de tipus web) i `APP_EMAILS` (correus separats per comes).
- A Google Cloud, un client OAuth d'Android amb el paquet `com.casavellarural.maite` i l'empremta SHA-1 de la clau: `1B:70:93:FF:14:D2:25:17:08:D0:59:64:AA:42:E7:DD:C7:58:09:60`.

El codi de connexió és un JSON en base64 amb el token i el client web:

```bash
printf '{"id":"<client id>","secret":"<client secret>","google":"<client web>.apps.googleusercontent.com"}' | base64 -w0
```

L'app el desa xifrat al mòbil. També es poden posar els tres valors en compilar (`MAITE_CF_CLIENT_ID`, `MAITE_CF_CLIENT_SECRET`, `MAITE_GOOGLE_CLIENT_ID`) i llavors no el demana.

## Plantilles de xarxes

Les plantilles són les mateixes que a la web (`maite-app/src/social/`). L'app les dibuixa en una WebView oculta (`ui/social/Renderer.kt` i `assets/social/renderer.html`) i en fa un JPEG per descarregar o publicar. Si canvien les plantilles, les fotos o les fonts, regenera'n la còpia i fes una versió nova:

```bash
node android/tools/social-assets.mjs
```

## Fer-ne una versió nova

Cal la clau `maite.keystore` (no és al repositori), la seva contrasenya, el SDK d'Android i Java 17 o més:

```bash
cd android
export ANDROID_HOME=/ruta/al/android-sdk MAITE_KEYSTORE=/ruta/a/maite.keystore MAITE_KEYSTORE_PASSWORD=…
gradle assembleRelease          # app/build/outputs/apk/release/app-release.apk
gradle recordRoborazziDebug     # captures a app/screenshots/{titan,xiaomi}
```

Puja `versionCode` a `app/build.gradle` perquè Android l'accepti com a actualització. Si es perd la clau, cal desinstal·lar l'app, fer-ne una de nova i posar la nova empremta SHA-1 al client d'Android de Google.
