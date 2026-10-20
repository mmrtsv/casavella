// GET /photos/<id>.jpg  Photos uploaded in Maite, from R2. Each upload gets a new name, so they cache forever.
export async function onRequestGet({ params, env }) {
  if (!env.PHOTOS || !/^[0-9a-f-]{36}\.(jpg|webp|png)$/.test(params.name)) return new Response('Not found', { status: 404 });
  const obj = await env.PHOTOS.get(params.name);
  if (!obj) return new Response('Not found', { status: 404 });
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('etag', obj.httpEtag);
  headers.set('cache-control', 'public, max-age=31536000, immutable');
  return new Response(obj.body, { headers });
}
