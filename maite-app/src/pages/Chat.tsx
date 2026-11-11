// Pregunta: a conversation with Claude about the house (functions/api/maite/chat.js, lib/chat.js). Claude answers from Maite's
// data and proposes changes; each proposal has its button and nothing changes until it is pressed. A price or a minimum stay
// goes through the same call as Preus (/api/maite/days); a page opens in Maite, on the tab where it's done. The conversation and
// the past ones (Converses anteriors, the last 30) stay on this device.
import { useEffect, useRef, useState } from 'react';
import { Button, Spinner, TextArea, TextField } from '@heroui/react';
import { Send } from 'lucide-react';
import { api } from '../lib/api';
import { day, stamp } from '../lib/dates';
import { type Page } from '../lib/route';
import { openAt } from '../lib/ui';
import { reload } from '../lib/store';
import { done, toastError } from '../parts/toast';

type Proposal = { kind: 'price' | 'min' | 'open'; label: string; why: string; stays?: string[]; dates?: string[]; price?: number | null; min?: number; page?: Page; tab?: string | null; item?: string | null; done?: boolean };
type Msg = { role: 'user' | 'assistant'; text: string; proposals?: Proposal[] };
const KEY = 'maite-chat';
const read = (): Msg[] => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } };
const keep = (m: Msg[]) => { try { localStorage.setItem(KEY, JSON.stringify(m.slice(-60))); } catch { /* private window */ } };
// A past conversation: when it started and its messages; its title is the first question
type Past = { at: string; msgs: Msg[] };
const PAST = 'maite-chat-past';
const readPast = (): Past[] => { try { return JSON.parse(localStorage.getItem(PAST) || '[]'); } catch { return []; } };
const keepPast = (l: Past[]) => { try { localStorage.setItem(PAST, JSON.stringify(l.slice(0, 30))); } catch { /* private window */ } };
const AT = 'maite-chat-at';
const readAt = () => { try { return localStorage.getItem(AT) || new Date().toISOString(); } catch { return new Date().toISOString(); } };

export default function Chat() {
  const [msgs, setMsgs] = useState<Msg[]>(read);
  const [past, setPast] = useState<Past[]>(readPast);
  const [at, setAt] = useState(readAt);
  useEffect(() => { try { localStorage.setItem(AT, at); } catch { /* private window */ } }, [at]);
  useEffect(() => { keepPast(past); }, [past]);
  // The conversation on screen goes to the past ones (newest first), and next takes its place: a new one, or a past one reopened
  function swap(next: Past | null) {
    const rest = past.filter(x => x !== next);
    setPast(msgs.length ? [{ at, msgs }, ...rest] : rest);
    setMsgs(next?.msgs || []); setAt(next?.at || new Date().toISOString());
  }
  const [text, setText] = useState(''), [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { keep(msgs); end.current?.scrollIntoView({ block: 'end' }); }, [msgs]);

  async function send() {
    const q = text.trim();
    if (!q || busy) return;
    const next = [...msgs, { role: 'user' as const, text: q }];
    setMsgs(next); setText(''); setBusy(true);
    try {
      const r = await api<{ text: string; proposals: Proposal[] }>('chat', { method: 'POST', body: { messages: next.map(m => ({ role: m.role, text: m.text })) } });
      setMsgs([...next, { role: 'assistant', text: r.text, proposals: r.proposals }]);
    } catch (e) { toastError(e); setMsgs(msgs); setText(q); }
    setBusy(false);
  }
  async function act(i: number, j: number) {
    const p = msgs[i].proposals![j];
    if (p.kind === 'open') { openAt(p.page!, p.tab || '', p.item || ''); return; }
    try {
      await api('days', { method: 'POST', body: { stays: p.stays, dates: p.dates, ...(p.kind === 'price' ? { price: p.price } : { min: p.min }) } });
      await reload(); done('Fet');
      setMsgs(msgs.map((m, k) => k !== i ? m : { ...m, proposals: m.proposals!.map((x, l) => l === j ? { ...x, done: true } : x) }));
    } catch (e) { toastError(e); }
  }

  return (
    <div className="fade-in mx-auto flex max-w-3xl flex-col gap-4">
      <section className="card p-4 sm:p-5" aria-label="Conversa">
        {!msgs.length && <p className="text-sm text-muted">Pregunta el que vulguis de la casa: reserves, el restaurant, preus, Instagram o els números.</p>}
        <ol className="space-y-4">
          {msgs.map((m, i) => (
            <li key={i} className={m.role === 'user' ? 'flex justify-end' : ''}>
              <div className={m.role === 'user' ? 'max-w-[85%] rounded-2xl bg-default px-4 py-2.5 text-sm whitespace-pre-wrap' : 'text-sm whitespace-pre-wrap'}>{m.text}</div>
              {m.proposals?.map((p, j) => <ProposalRow key={j} p={p} onPress={() => act(i, j)} />)}
            </li>
          ))}
          {busy && <li className="flex items-center gap-2 text-sm text-muted"><Spinner size="sm" />Mirant-ho</li>}
        </ol>
        <div ref={end} />
      </section>
      <div className="card flex items-end gap-2 p-3">
        <TextField aria-label="Pregunta" value={text} onChange={setText} fullWidth className="flex-1">
          <TextArea rows={2} placeholder="Com anem de reserves pel pont de desembre?" onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} />
        </TextField>
        <Button isIconOnly aria-label="Envia" isPending={busy} isDisabled={!text.trim()} onPress={send}><Send size={16} /></Button>
      </div>
      {msgs.length > 0 && <div className="flex justify-end"><Button size="sm" variant="ghost" isDisabled={busy} onPress={() => swap(null)}>Conversa nova</Button></div>}
      {past.length > 0 && (
        <section className="card" aria-label="Converses anteriors">
          <h2 className="border-b border-separator px-4 py-3 text-base font-semibold sm:px-5">Converses anteriors</h2>
          <ol className="divide-y divide-separator">{past.map((c, i) => (
            <li key={i}>
              <button type="button" disabled={busy} onClick={() => swap(c)} className="block w-full px-4 py-3 text-left outline-none hover:bg-default/40 focus-visible:ring-2 focus-visible:ring-focus sm:px-5">
                <span className="block truncate text-sm">{c.msgs.find(m => m.role === 'user')?.text || 'Conversa'}</span>
                <span className="block text-xs text-muted">{stamp(c.at)}</span>
              </button>
            </li>))}</ol>
        </section>
      )}
    </div>
  );
}

// One proposal under Claude's answer: what and why, and its button
function ProposalRow({ p, onPress }: { p: Proposal; onPress: () => Promise<void> | void }) {
  const [busy, setBusy] = useState(false);
  const nights = p.dates?.length ? (p.dates.length === 1 ? day(p.dates[0], { day: 'numeric', month: 'long' }) : `${p.dates.length} nits, del ${day(p.dates[0], { day: 'numeric', month: 'long' })} al ${day(p.dates[p.dates.length - 1], { day: 'numeric', month: 'long' })}`) : '';
  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 rounded-2xl bg-default/60 px-4 py-3">
      <div className="min-w-0 flex-1 basis-56">
        <div className="text-sm font-medium">{p.label}</div>
        <div className="text-xs text-muted">{p.why}</div>
        {nights && <div className="text-xs text-muted">{nights}</div>}
      </div>
      {p.done ? <span className="text-sm text-accent">Fet</span>
        : <Button size="sm" variant={p.kind === 'open' ? 'secondary' : 'primary'} isPending={busy} onPress={async () => { setBusy(true); await onPress(); setBusy(false); }}>
          {busy && <Spinner size="sm" color="current" />}{p.kind === 'open' ? 'Obre-ho' : 'Fes-ho'}
        </Button>}
    </div>
  );
}
