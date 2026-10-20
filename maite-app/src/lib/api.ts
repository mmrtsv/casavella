// The same calls to /api/maite/* as before; errors become readable Catalan messages
import { ERRORS } from './words';
import { range } from './dates';
import type { Booking } from './types';

export class ApiError extends Error { constructor(msg: string, public code?: string) { super(msg); } }
let stayNameOf: (id: string) => string = id => id;
export const setStayNames = (fn: (id: string) => string) => { stayNameOf = fn; };

export async function api<T = any>(path: string, opt: { method?: string; body?: unknown } = {}): Promise<T> {
  const r = await fetch('/api/maite/' + path, { method: opt.method, headers: { 'content-type': 'application/json' }, body: opt.body === undefined ? undefined : JSON.stringify(opt.body) });
  const d = await r.json().catch(() => ({ error: 'server' }));
  if (!r.ok) {
    let msg = ERRORS[d.error] || (d.detail ? 'Error: ' + d.detail : `Alguna cosa no ha anat bé (error ${r.status}). Torna-ho a provar.`);
    if (d.with?.length) msg += ': ' + (d.with as Booking[]).map(b => `${stayNameOf(b.stay)}, ${b.kind === 'block' ? 'tancat' : b.name || b.title} (${range(b.first, b.until)})`).join('; ');
    throw new ApiError(msg, d.error);
  }
  return d as T;
}

// ID documents go to the booking's Drive folder one by one. Photos from a phone are made smaller first; PDFs go as they are.
export async function uploadDoc(b: Pick<Booking, 'stay' | 'id'>, file: File): Promise<Booking> {
  let body: Blob = file, type = file.type || 'application/octet-stream', name = file.name;
  if (type.startsWith('image/')) {
    try {
      const bmp = await createImageBitmap(file), k = Math.min(1, 2400 / Math.max(bmp.width, bmp.height));
      const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
      c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
      body = await new Promise<Blob>(ok => c.toBlob(x => ok(x!), 'image/jpeg', .88)); type = 'image/jpeg'; name = name.replace(/\.[^.]+$/, '') + '.jpg';
    } catch (e) { /* a format the browser cannot open (some HEIC): send it as it is */ }
  }
  const r = await fetch(`/api/maite/docs?stay=${encodeURIComponent(b.stay)}&id=${encodeURIComponent(b.id)}&name=${encodeURIComponent(name)}`, { method: 'POST', headers: { 'content-type': type }, body });
  const d = await r.json().catch(() => ({ error: 'server' }));
  if (!r.ok) throw new ApiError(ERRORS[d.error] || `No s'ha pogut pujar ${file.name} (error ${r.status})`, d.error);
  return d.booking;
}

// Photos are resized in the browser (longest side 2000 px, JPEG) before going up
export async function uploadPhoto(file: File): Promise<string> {
  const bmp = await createImageBitmap(file), k = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
  const blob = await new Promise<Blob>(ok => c.toBlob(b => ok(b!), 'image/jpeg', .85));
  const r = await fetch('/api/maite/photos', { method: 'POST', headers: { 'content-type': 'image/jpeg' }, body: blob });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new ApiError(ERRORS[d.error] || "No s'ha pogut pujar la foto", d.error);
  return d.src;
}
