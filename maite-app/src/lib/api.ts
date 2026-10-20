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
    let msg = ERRORS[d.error] || (d.detail ? 'Error: ' + d.detail : 'Alguna cosa no ha anat bé. Torna-ho a provar.');
    if (d.with?.length) msg += ': ' + (d.with as Booking[]).map(b => `${stayNameOf(b.stay)}, ${b.kind === 'block' ? 'tancat' : b.name || b.title} (${range(b.first, b.until)})`).join('; ');
    throw new ApiError(msg, d.error);
  }
  return d as T;
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
