# Buscar (Find My en Android)

App de Android mínima para usar Buscar de Apple desde un móvil Android. Apple no tiene API pública de Buscar, así que la app abre la web oficial, `https://www.icloud.com/find`, en una WebView que guarda la sesión: inicias sesión con el Apple ID y el código de doble factor una vez y la próxima vez entra directa.

Desde ahí se ven en el mapa los iPhone, iPad, Mac, Apple Watch y AirPods de la cuenta y de Compartir en familia, y se puede hacer sonar un dispositivo, activar el modo perdido o borrarlo.

Lo que no hace: los AirTags y los objetos de la pestaña Objetos no están en iCloud.com, solo en un iPhone, iPad o Mac. Tampoco avisa si te dejas algo.

## Cómo está hecha

Un solo `MainActivity.kt`, sin librerías aparte de Android:

- Las páginas de `icloud.com` y `apple.com` se quedan dentro; cualquier otro enlace se abre en el navegador.
- Acepta cookies de terceros, porque el inicio de sesión de Apple es un marco de `idmsa.apple.com` dentro de iCloud.
- Se presenta como Chrome (quita `; wv` del user agent), porque Apple rechaza algunas WebViews.
- Solo HTTPS. Sin copia de seguridad de Android, para que la sesión no salga del móvil.

## Compilar

Hace falta Java 17, Gradle 8 y el SDK de Android (plataforma 35):

```bash
cd android-findmy
export ANDROID_HOME=/ruta/al/android-sdk
gradle assembleRelease    # app/build/outputs/apk/release/app-release.apk
```

Sin `BUSCAR_KEYSTORE` el APK se firma con la clave de depuración del ordenador que compila. Para poder instalar versiones nuevas encima sin desinstalar, firma siempre con la misma clave:

```bash
keytool -genkeypair -keystore buscar.keystore -alias buscar -keyalg RSA -keysize 2048 -validity 10000
export BUSCAR_KEYSTORE=/ruta/a/buscar.keystore BUSCAR_KEYSTORE_PASSWORD=…
gradle assembleRelease
```

La clave no va al repositorio (`.gitignore`).
