// POST /api/maite/chat  { messages: [{ role: 'user' | 'assistant', text }] }  The conversation so far, the last message the
// user's. Returns { text, proposals }: Claude's answer from Maite's data and what it proposes to change (lib/chat.js). The
// conversation is kept on each device, not here.
import { json } from '../../../lib/booking.js';
import { chat } from '../../../lib/chat.js';

export async function onRequestPost({ request, env, data }) {
  if (!env.ANTHROPIC_API_KEY) return json({ error: 'ai_not_configured' }, 503);
  let b;
  try { b = await request.json(); } catch { return json({ error: 'bad_request' }, 400); }
  const list = Array.isArray(b.messages) ? b.messages.filter(m => (m.role === 'user' || m.role === 'assistant') && typeof m.text === 'string' && m.text.trim()) : [];
  if (!list.length || list[list.length - 1].role !== 'user') return json({ error: 'bad_request' }, 400);
  // The API wants the first message to be the user's
  while (list.length && list[0].role !== 'user') list.shift();
  try { return json(await chat(env, list, data?.user)); }
  catch (e) { return json({ error: e.code || 'ai_chat', detail: e.code ? undefined : String(e.message).slice(0, 200) }, e.code === 'ai_busy' ? 429 : 502); }
}
