// POST /api/maite/docs?stay=…&id=…&name=dni.jpg  (body: the file)  Uploads one ID document for a booking to Google Drive.
// The first upload makes the booking's folder in DOCS_FOLDER, numbered after the folders already there
// ("05.01.07 - Marta Vila (20/10/2026 - 23/10/2026)"); that number is the booking's reference from then on.
// The folder is kept on the calendar event, and the documents item of the checklist is ticked.
import { STAYS, configured, calendar, json } from '../../../lib/booking.js';
import { asBooking } from '../../../lib/maite.js';
import { drive, driveConfigured } from '../../../lib/drive.js';

const TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp', 'application/pdf'];
const MAX = 15 * 1024 * 1024;
const dmy = d => d.split('-').reverse().join('/');

export async function onRequestPost({ request, env, data }) {
  const u = new URL(request.url), stay = u.searchParams.get('stay'), id = u.searchParams.get('id');
  const name = (u.searchParams.get('name') || 'document').replace(/[\\/:*?"<>|\u0000-\u001f]+/g, ' ').trim().slice(0, 120) || 'document';
  const type = (request.headers.get('content-type') || '').split(';')[0];
  if (!STAYS[stay] || !id) return json({ error: 'bad_request' }, 400);
  if (!TYPES.includes(type)) return json({ error: 'doc_type' }, 400);
  if (!configured(env, stay)) return json({ error: 'not_configured' }, 503);
  if (!driveConfigured(env)) return json({ error: 'docs_not_configured' }, 503);
  const bytes = await request.arrayBuffer();
  if (!bytes.byteLength || bytes.byteLength > MAX) return json({ error: 'doc_size' }, 400);

  const cal = await calendar(env, stay), ev = await cal.get(id);
  if (!ev || ev.status === 'cancelled') return json({ error: 'not_found' }, 404);
  const day = v => v.date || v.dateTime.slice(0, 10), b = asBooking(stay, { ...ev, first: day(ev.start), until: day(ev.end) });
  if (!['paid', 'pending', 'manual'].includes(b.kind)) return json({ error: 'kind' }, 400);

  const d = await drive(env), p = { ...ev.extendedProperties?.private };
  try {
    if (!p.docsFolder) {
      // "05.01 Documentació checkin" → bookings are 05.01.01, 05.01.02…
      const prefix = ((await d.get(env.DOCS_FOLDER)).name.match(/^[\d.]*\d/) || ['05.01'])[0];
      const taken = (await d.folders(env.DOCS_FOLDER)).map(f => f.name.startsWith(prefix + '.') ? parseInt(f.name.slice(prefix.length + 1), 10) : 0).filter(n => n > 0);
      const ref = String(Math.max(0, ...taken) + 1).padStart(2, '0');
      const folder = await d.folder(`${prefix}.${ref} - ${b.name || b.title} (${dmy(b.first)} - ${dmy(b.until)})`, env.DOCS_FOLDER);
      p.docsFolder = folder.id; p.ref = ref;
      // Saved straight away, so a second file goes to the same folder even if this upload fails
      await cal.patch(id, { extendedProperties: { private: p } });
    }
    await d.upload(p.docsFolder, name, type, bytes);
  } catch (e) { return json({ error: 'drive', detail: String(e.message || e) }, 502); }
  p.docs = 'yes'; p.checkedBy = data.user;
  const out = await cal.patch(id, { extendedProperties: { private: p } });
  return json({ ok: true, booking: asBooking(stay, { ...out, first: day(out.start), until: day(out.end) }) });
}
