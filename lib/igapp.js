// Stories with Instagram's link sticker, posted from Cloudflare. Instagram's official API can't add the sticker, so this talks to
// Instagram the way its Android app does (the private API), as the instagrapi library does (photo_upload_to_story with a
// StoryLink): the JPEG goes to rupload_igphoto, the link is checked (media/validate_reel_url) and the story is configured with
// the link sticker (media/configure_to_story).
//
// It signs in with the account's session, not its password: IG_SESSIONID is the `sessionid` cookie of instagram.com, copied once
// from a browser where the account is signed in (README, step 10). The phone it pretends to be (ids made once) and whatever
// Instagram renews (authorization, mid, claim) live in KV 'ig-app', with the account's name and the last error.
//
// Not Instagram's official API: it goes against its terms, and Instagram may ask to verify the account or restrict it. The owner
// chose it knowing that. Used by lib/instagram.js runDue for every programmed story; if it fails, the story still goes out
// through the official API, without the sticker.

const HOST = 'https://i.instagram.com';
const APP = { version: '449.0.0.52.84', code: '1079242191', bloks: '799db3e387d7a21a19c72918b8698b6cd28a1516ade363792c100ed45a0f9f0b' };
const PHONE = { android_version: 34, android_release: '14', dpi: '480dpi', resolution: '1344x2992', manufacturer: 'Google/google', device: 'husky', model: 'Pixel 8 Pro', cpu: 'husky' };
const LOCALE = 'es_ES';
const UA = `Instagram ${APP.version} Android (${PHONE.android_version}/${PHONE.android_release}; ${PHONE.dpi}; ${PHONE.resolution}; ${PHONE.manufacturer}; ${PHONE.model}; ${PHONE.device}; ${PHONE.cpu}; ${LOCALE}; ${APP.code})`;
const CAPABILITIES = [
  { value: '119.0,120.0,121.0,122.0,123.0,124.0,125.0,126.0,127.0,128.0,129.0,130.0,131.0,132.0,133.0,134.0,135.0,136.0,137.0,138.0,139.0,140.0,141.0,142.0', name: 'SUPPORTED_SDK_VERSIONS' },
  { value: '14', name: 'FACE_TRACKER_VERSION' }, { value: 'ETC2_COMPRESSION', name: 'COMPRESSION' }, { value: 'gyroscope_enabled', name: 'gyroscope' },
];

export const canApp = env => !!(env.IG_SESSIONID && env.MAITE && env.PHOTOS);
export const appState = async env => JSON.parse((await env.MAITE?.get('ig-app')) || 'null');

const hex = n => [...crypto.getRandomValues(new Uint8Array(n))].map(b => b.toString(16).padStart(2, '0')).join('');
// The Madrid offset in seconds, as the phone would send it (3600 in winter, 7200 in summer)
function tzOffset() {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    .formatToParts(new Date()).map(x => [x.type, x.value]));
  return Math.round((Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:00Z`) - Math.floor(Date.now() / 60e3) * 60e3) / 1000);
}

// The session: the phone's ids (made once, so Instagram always sees the same phone) and the authorization from IG_SESSIONID.
// A new IG_SESSIONID (copied again) replaces whatever was renewed from the old one
async function session(env) {
  let s = await appState(env) || {};
  const from = env.IG_SESSIONID.slice(-12);
  if (!s.ids) s.ids = { uuid: crypto.randomUUID(), phone: crypto.randomUUID(), clientSession: crypto.randomUUID(), android: 'android-' + hex(8), pigeon: 'UFS-' + crypto.randomUUID() + '-0' };
  if (s.from !== from) {
    const sessionid = decodeURIComponent(env.IG_SESSIONID.trim());
    const user = (sessionid.match(/^\d+/) || [])[0];
    if (!user) throw new Error("IG_SESSIONID no sembla una sessió d'Instagram (ha de començar amb números)");
    s = { ...s, from, userId: user, auth: { ds_user_id: user, sessionid, should_use_header_over_cookies: true }, mid: '', claim: '0', rur: '', error: '' };
  }
  return s;
}
const save = (env, s) => env.MAITE.put('ig-app', JSON.stringify(s));
const authorization = s => 'Bearer IGT:2:' + btoa(JSON.stringify(s.auth));

function headers(s, extra = {}) {
  return {
    'X-IG-App-Locale': LOCALE, 'X-IG-Device-Locale': LOCALE, 'X-IG-Mapped-Locale': LOCALE,
    'X-Pigeon-Session-Id': s.ids.pigeon, 'X-Pigeon-Rawclienttime': (Date.now() / 1000).toFixed(3),
    'X-IG-Bandwidth-Speed-KBPS': '-1.000', 'X-IG-Bandwidth-TotalBytes-B': '0', 'X-IG-Bandwidth-TotalTime-MS': '0',
    'X-IG-App-Startup-Country': 'ES', 'X-Bloks-Version-Id': APP.bloks, 'X-IG-WWW-Claim': s.claim || '0',
    'X-Bloks-Is-Layout-RTL': 'false', 'X-Bloks-Is-Panorama-Enabled': 'true',
    'X-IG-Device-ID': s.ids.uuid, 'X-IG-Family-Device-ID': s.ids.phone, 'X-IG-Android-ID': s.ids.android,
    'X-IG-Timezone-Offset': String(tzOffset()), 'X-IG-Connection-Type': 'WIFI', 'X-IG-Capabilities': '3brTv10=', 'X-IG-App-ID': '567067343352427',
    'User-Agent': UA, 'Accept-Language': 'es-ES, en-US', 'Accept-Encoding': 'gzip, deflate',
    'X-FB-HTTP-Engine': 'Tigon/MNS/TCP', 'IG-INTENDED-USER-ID': s.userId, 'IG-U-DS-USER-ID': s.userId,
    ...(s.mid ? { 'X-MID': s.mid } : {}), ...(s.rur ? { 'IG-U-RUR': s.rur } : {}),
    Authorization: authorization(s), ...extra,
  };
}

// What Instagram renews on each answer, kept for the next call
function renew(s, r) {
  const h = k => r.headers.get(k);
  if (h('ig-set-authorization')) {
    try { const a = JSON.parse(atob(h('ig-set-authorization').split(':').pop())); if (a.sessionid) s.auth = { ...s.auth, ...a }; } catch { /* keep the one we have */ }
  }
  if (h('ig-set-x-mid')) s.mid = h('ig-set-x-mid');
  if (h('x-ig-set-www-claim')) s.claim = h('x-ig-set-www-claim');
  if (h('ig-set-ig-u-rur')) s.rur = h('ig-set-ig-u-rur');
}

// An error Instagram gave: whether the session no longer works (the owner has to copy it again) or it was this one call
export class AppError extends Error { constructor(msg, session = false) { super(msg); this.session = session; } }
async function answer(s, r) {
  renew(s, r);
  const d = await r.json().catch(() => ({}));
  if (r.ok && d.status !== 'fail') return d;
  const what = d.message || d.error_type || `Instagram ${r.status}`;
  const lost = r.status === 401 || /login_required|challenge_required|checkpoint|user_has_logged_out|consent_required/i.test(`${d.message} ${d.error_type}`);
  throw new AppError(what, lost);
}
// A form call signed as the app signs it (signed_body=SIGNATURE.<json>)
async function call(s, path, data) {
  const r = await fetch(`${HOST}/api/v1/${path}`, {
    method: data ? 'POST' : 'GET',
    headers: headers(s, data ? { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' } : {}),
    body: data ? 'signed_body=SIGNATURE.' + encodeURIComponent(JSON.stringify(data)).replace(/%20/g, '+') : undefined,
  });
  return answer(s, r);
}

// Checks the session and finds the account's name; keeps it, or why it doesn't work, in KV
export async function checkApp(env) {
  const s = await session(env);
  try {
    const d = await call(s, 'accounts/current_user/?edit=true');
    Object.assign(s, { user: d.user?.username || s.user || '', error: '', checked: new Date().toISOString() });
  } catch (e) {
    Object.assign(s, { error: e.session ? `${e.message}: copia de nou la sessió (IG_SESSIONID)` : '', checked: new Date().toISOString() });
  }
  await save(env, s);
  return s;
}

// Posts a story: jpeg (bytes, 1080 × 1920) with a link sticker to `link` centred at (x, y) on the image (shares of its size).
// Returns { media, url }. Throws AppError (session true when the owner has to copy the session again)
export async function postStory(env, jpeg, link, { x = 0.5, y = 0.5, width = 0.5, height = 0.06 } = {}) {
  const s = await session(env);
  try {
    const uploadId = String(Date.now());
    const name = `${uploadId}_0_${1e9 + Math.floor(Math.random() * 9e9)}`;
    const up = await fetch(`${HOST}/rupload_igphoto/${name}`, {
      method: 'POST',
      headers: headers(s, {
        'Accept-Encoding': 'gzip', 'X_FB_PHOTO_WATERFALL_ID': crypto.randomUUID(), 'X-Entity-Type': 'image/jpeg', Offset: '0',
        'X-Entity-Name': name, 'X-Entity-Length': String(jpeg.byteLength), 'Content-Type': 'application/octet-stream',
        'X-Instagram-Rupload-Params': JSON.stringify({ retry_context: '{"num_step_auto_retry":0,"num_reupload":0,"num_step_manual_retry":0}', media_type: '1',
          xsharing_user_ids: '[]', upload_id: uploadId, image_compression: JSON.stringify({ lib_name: 'moz', lib_version: '3.1.m', quality: '80' }) }),
      }),
      body: jpeg,
    });
    await answer(s, up);
    await call(s, 'media/validate_reel_url/', { url: link, _uid: s.userId, _uuid: s.ids.uuid });
    const now = Math.floor(Date.now() / 1000), w = 1080, h = 1920;
    const d = await call(s, 'media/configure_to_story/', {
      _uuid: s.ids.uuid, device_id: s.ids.android,
      supported_capabilities_new: JSON.stringify(CAPABILITIES), has_original_sound: '1', camera_session_id: s.ids.clientSession,
      scene_capture_type: '', timezone_offset: String(tzOffset()), client_shared_at: String(now - 5), media_folder: 'Camera',
      configure_mode: '1', source_type: '4', creation_surface: 'camera', imported_taken_at: now - 3 * 86400, capture_type: 'normal',
      upload_id: uploadId, client_timestamp: String(now),
      device: { manufacturer: PHONE.manufacturer, model: PHONE.model, android_version: PHONE.android_version, android_release: PHONE.android_release },
      _uid: Number(s.userId), composition_id: crypto.randomUUID(), app_attribution_android_namespace: '',
      media_transformation_info: JSON.stringify({ width: String(w), height: String(h), x_transform: '0', y_transform: '0', zoom: '1.0', rotation: '0.0', background_coverage: '0.0' }),
      original_media_type: 'photo', camera_entry_point: String(25 + Math.floor(Math.random() * 140)),
      edits: { crop_original_size: [w, h], filter_type: 0, filter_strength: 1.0 }, extra: { source_width: w, source_height: h },
      tap_models: JSON.stringify([{ x, y, z: 0, width, height, rotation: 0, type: 'story_link', is_sticker: true, selected_index: 0, tap_state: 0,
        link_type: 'web', url: link, tap_state_str_id: 'link_sticker_default' }]),
      story_sticker_ids: 'link_sticker_default',
    });
    const media = d.media || {};
    // The id comes as text («pk_user»); the number pk is too long for JavaScript and comes rounded
    const pk = String(media.id || '').split('_')[0] || String(media.pk || '');
    if (!pk) throw new AppError('Instagram no ha tornat la story');
    s.error = '';
    return { media: pk, url: s.user ? `https://www.instagram.com/stories/${s.user}/${pk}/` : '' };
  } catch (e) {
    if (e instanceof AppError && e.session) s.error = `${e.message}: copia de nou la sessió (IG_SESSIONID)`;
    throw e;
  } finally { await save(env, s); }
}

// Where the sticker goes on each story template (centre and size, as shares of the image). Instagram only keeps the area that
// can be tapped: its app draws the sticker into the image itself. So it goes over the button the design already draws:
// «CASAVELLARURAL.COM» on the poster (measured on /render/render: 88 to 524 px across, 1477 to 1560 down) and the line
// «Reserva a casavellarural.com» on the menu. The other templates have no button: the link is there but can't be seen, so
// Maite's plan only makes posters
export const STICKER = { StoryPoster: { x: 0.2834, y: 0.7908, width: 0.42, height: 0.05 }, StoryMenu: { x: 0.5, y: 0.828, width: 0.6, height: 0.045 },
  StoryPhoto: { x: 0.5, y: 0.40 }, StoryReel: { x: 0.5, y: 0.68 } };
