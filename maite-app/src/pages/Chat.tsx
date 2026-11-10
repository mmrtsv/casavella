// Pregunta: a conversation with Claude about the house (functions/api/maite/chat.js, lib/chat.js). Claude answers from Maite's
// data and proposes changes; each proposal has its button and nothing changes until it is pressed. A price or a minimum stay
// goes through the same call as Preus (/api/maite/days); a page opens in Maite. The conversation stays on this device.
import { useEffect, useRef, useState } from 'react';
import { Button, Spinner, TextArea, TextField } from '@heroui/react';
import { Send } from 'lucide-react';
import { api } from '../lib/api';
import { day } from '../lib/dates';
import { go, type Page } from '../lib/route';
import { reload } from '../lib/store';
import { done, toastError } from '../parts/toast';

type Proposal = { kind: 'price' | 'min' | 'open'; label: string; why: string; stays?: string[]; dates?: string[]; price?: number | null; min?: number; page?: Page; done?: boolean };
type Msg = { role: 'user' | 'assistant'; text: string; proposals?: Proposal[] };
const KEY = 'maite-chat';
const read = (): Msg[] => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } };
const keep = (m: Msg[]) => { try { localStorage.setItem(KEY, JSON.stringify(m.slice(-60))); } catch { /* private window */ } };

export default function Chat() {
  const [msgs, setMsgs] = useState<Msg[]>(read);
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
    if (p.kind === 'open') { go(p.page!); return; }
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
      {msgs.length > 0 && <div className="flex justify-end"><Button size="sm" variant="ghost" isDisabled={busy} onPress={() => setMsgs([])}>Comença de nou</Button></div>}
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
