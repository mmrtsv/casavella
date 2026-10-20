// New booking (phone, WhatsApp, in person), close dates, and cancel with refund: same requests and checks as before
import { useEffect, useRef, useState } from 'react';
import { Button, Spinner } from '@heroui/react';
import { Dialog } from '../parts/Sheet';
import { Check, Choice, Field } from '../parts/fields';
import { done } from '../parts/toast';
import { api } from '../lib/api';
import { addDays, euro, nightsBetween, range, TODAY } from '../lib/dates';
import { getState, reload, setBooking, stayName, useStore } from '../lib/store';
import { closeBlock, closeBook, closeCancel, useUI } from '../lib/ui';
import { policyText, refundDue } from '../lib/words';
import type { Booking } from '../lib/types';

function Err({ msg }: { msg: string }) { return msg ? <p role="alert" className="mt-1 rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{msg}</p> : null; }
function Save({ busy, children, onPress, variant = 'primary' }: { busy: boolean; children: React.ReactNode; onPress: () => void; variant?: 'primary' | 'danger' }) {
  return <Button variant={variant} isPending={busy} onPress={onPress}>{busy && <Spinner size="sm" color="current" />}{children}</Button>;
}

const SOURCES = [{ id: 'phone', name: 'Telèfon' }, { id: 'whatsapp', name: 'WhatsApp' }, { id: 'email', name: 'Correu' }, { id: 'door', name: 'En persona' }, { id: 'other', name: 'Altres' }];

export function NewBooking() {
  const draft = useUI(u => u.book);
  const stays = useStore(s => s.stays);
  const empty = { stay: '', first: '', until: '', name: '', guests: '2', phone: '', email: '', amount: '', source: 'phone', arrival: '', notes: '' };
  const [f, setF] = useState(empty);
  const [settled, setSettled] = useState(false);
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const touched = useRef(false), seq = useRef(0);
  const set = (k: keyof typeof empty) => (v: string) => setF(x => ({ ...x, [k]: v }));
  useEffect(() => {
    if (!draft) return;
    const first = draft.first || TODAY;
    setF({ ...empty, stay: draft.stay || stays[0]?.id || '', first, until: draft.until || addDays(first, 1) });
    setSettled(false); setErr(''); touched.current = false;
  }, [draft]);
  const max = stays.find(s => s.id === f.stay)?.max || 2;
  useEffect(() => { if (+f.guests > max) setF(x => ({ ...x, guests: String(max) })); }, [max]);
  // Suggests the web price for those nights (special prices and discounts included); it can be changed freely
  useEffect(() => {
    if (!draft || !f.stay || !f.first || !(f.until > f.first) || touched.current) return;
    const n = ++seq.current;
    api<{ total: number }>(`quote?stay=${f.stay}&in=${f.first}&out=${f.until}`).then(q => { if (n === seq.current && !touched.current) setF(x => ({ ...x, amount: String(q.total / 100) })); }).catch(() => {});
  }, [draft, f.stay, f.first, f.until]);
  const submit = async () => {
    setBusy(true); setErr('');
    try { const d = await api<{ booking: Booking }>('bookings', { method: 'POST', body: { ...f, settled } }); setBooking(d.booking); closeBook(); done('Reserva desada'); await reload(); }
    catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };
  return (
    <Dialog isOpen={!!draft} onClose={closeBook} title="Nova reserva" subtitle="Telèfon, WhatsApp o en persona. Bloqueja les nits a la web."
      footer={<><Button variant="ghost" onPress={closeBook}>Cancel·la</Button><Save busy={busy} onPress={submit}>Desa la reserva</Save></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Choice label="Allotjament" value={f.stay} onChange={set('stay')} items={stays.map(s => ({ id: s.id, name: s.name }))} className="sm:col-span-2" />
        <Field label="Check-in" type="date" value={f.first} onChange={v => setF(x => ({ ...x, first: v, until: x.until <= v ? addDays(v, 1) : x.until }))} />
        <Field label="Check-out" type="date" value={f.until} onChange={set('until')} />
        <Field label="Nom" value={f.name} onChange={set('name')} />
        <Choice label="Persones" value={f.guests} onChange={set('guests')} items={Array.from({ length: max }, (_, i) => ({ id: String(i + 1), name: String(i + 1) }))} />
        <Field label="Telèfon" type="tel" value={f.phone} onChange={set('phone')} inputMode="tel" />
        <Field label="Correu" type="email" value={f.email} onChange={set('email')} inputMode="email" />
        <Field label="Import (€)" value={f.amount} onChange={v => { touched.current = true; set('amount')(v); }} inputMode="decimal" help="El preu de la web per a aquestes nits. Es pot canviar." />
        <Choice label="Via" value={f.source} onChange={set('source')} items={SOURCES} />
        <div className="sm:col-span-2"><Check isSelected={settled} onChange={setSettled}>Ja està cobrada</Check></div>
        <Field label="Arribada prevista" value={f.arrival} onChange={set('arrival')} placeholder="Cap a les 18 h" />
        <Field label="Comentaris" value={f.notes} onChange={set('notes')} area />
      </div>
      <Err msg={err} />
    </Dialog>
  );
}

export function BlockDates() {
  const draft = useUI(u => u.block);
  const stays = useStore(s => s.stays);
  const [pick, setPick] = useState<string[]>([]);
  const [first, setFirst] = useState(''); const [until, setUntil] = useState(''); const [note, setNote] = useState('');
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!draft) return;
    const a = draft.first || TODAY;
    setPick(draft.stays || []); setFirst(a); setUntil(draft.until || addDays(a, 1)); setNote(''); setErr('');
  }, [draft]);
  const all = stays.length > 0 && pick.length === stays.length;
  const submit = async () => {
    setErr('');
    if (!pick.length) return setErr('Tria almenys un allotjament');
    if (!note.trim()) return setErr('Escriu el motiu');
    setBusy(true);
    try { await api('block', { method: 'POST', body: { stays: pick, first, until, note } }); closeBlock(); done('Nits tancades'); await reload(); }
    catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };
  return (
    <Dialog isOpen={!!draft} onClose={closeBlock} title="Tancar dates" subtitle="Si alguna nit ja està ocupada, no es tanca res." size="sm"
      footer={<><Button variant="ghost" onPress={closeBlock}>Cancel·la</Button><Save busy={busy} onPress={submit}>Tanca les nits</Save></>}>
      <div className="grid gap-2.5">
        {stays.map(s => <Check key={s.id} isSelected={pick.includes(s.id)} onChange={v => setPick(p => v ? [...p, s.id] : p.filter(x => x !== s.id))}>{s.name}</Check>)}
        <Check isSelected={all} onChange={v => setPick(v ? stays.map(s => s.id) : [])}><b className="font-semibold">Tota la casa</b></Check>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Primera nit" type="date" value={first} onChange={v => { setFirst(v); if (until <= v) setUntil(addDays(v, 1)); }} />
        <Field label="Fins al dia" type="date" value={until} onChange={setUntil} />
        <Field label="Motiu" value={note} onChange={setNote} placeholder="Obres, família, vacances…" className="sm:col-span-2" isRequired />
      </div>
      <Err msg={err} />
    </Dialog>
  );
}

export function Cancel() {
  const key = useUI(u => u.cancel);
  const b = key ? getState().bookings.get(key) : undefined;
  const settings = useStore(s => s.settings);
  const [refund, setRefund] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const paid = b?.kind === 'paid';
  const pol = b?.policy || settings?.cancel;
  const before = b ? nightsBetween(TODAY, b.first) : 0;
  const due = b && paid && pol && b.amount != null ? refundDue(pol, b.amount, before) : null;
  useEffect(() => { setRefund(due != null ? String(due / 100) : ''); setErr(''); }, [key]);
  const submit = async () => {
    if (!b) return;
    setBusy(true); setErr('');
    try {
      const d = await api<{ refunded: number }>('cancel', { method: 'POST', body: { stay: b.stay, id: b.id, refund: paid ? Math.round(Number(refund || 0) * 100) : 0 } });
      closeCancel(); done(d.refunded ? `Cancel·lada. Retornats ${euro(d.refunded)}.` : 'Reserva cancel·lada'); await reload();
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };
  return (
    <Dialog isOpen={!!b} onClose={closeCancel} title="Cancel·lar la reserva" size="sm"
      footer={<><Button variant="ghost" onPress={closeCancel}>No</Button><Save variant="danger" busy={busy} onPress={submit}>Cancel·la la reserva</Save></>}>
      {b && <>
        <p className="text-sm">{b.name || b.title}, {stayName(b.stay)}. Les nits del {range(b.first, b.until)} quedaran lliures.</p>
        {paid && pol && (
          <p className="mt-3 rounded-2xl bg-default/60 px-4 py-3 text-sm text-muted">
            {before <= 0 ? 'Arriba avui o ja és aquí.' : `Falten ${before === 1 ? '1 dia' : before + ' dies'} per al check-in.`} {b.policy ? 'Política que va acceptar' : 'Política actual'}: {policyText(pol)}{due != null ? ` Toca retornar ${euro(due)}.` : ''}
          </p>
        )}
        {paid && <Field label="Retornar a la targeta (€)" value={refund} onChange={setRefund} inputMode="decimal" help="0 si no se li retorna res." className="mt-4" />}
        <Err msg={err} />
      </>}
    </Dialog>
  );
}
