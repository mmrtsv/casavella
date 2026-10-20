// Command palette (Cmd/Ctrl+K): go to a page, start an action, or open a booking by guest, phone or email
import { useEffect, useMemo, useState } from 'react';
import { ListBox, Modal, SearchField, Kbd, type Key } from '@heroui/react';
import { CalendarPlus, Lock, Moon, User } from 'lucide-react';
import { Glass } from '../lib/glass';
import { useMounted } from '../parts/Sheet';
import { NAV } from './Shell';
import { go } from '../lib/route';
import { allBookings, keyOf, shortName, useStore } from '../lib/store';
import { openBlock, openBook, openDetail, setPalette, useUI } from '../lib/ui';
import { setTheme, useTheme } from '../lib/theme';
import { isBooking, who } from '../lib/words';
import { range, TODAY } from '../lib/dates';

interface Item { id: string; label: string; hint?: string; icon: React.ReactNode; run: () => void; group: string }

export default function Palette() {
  const open = useUI(u => u.palette);
  const theme = useTheme();
  useStore(s => s.version);
  const [q, setQ] = useState('');
  useEffect(() => { if (!open) setQ(''); }, [open]);

  const items = useMemo<Item[]>(() => {
    const base: Item[] = [
      ...NAV.map(n => ({ id: 'go-' + n.page, label: n.label, hint: n.hint, icon: <n.icon size={16} />, run: () => go(n.page), group: 'Seccions' })),
      { id: 'book', label: 'Nova reserva', hint: 'Telèfon, WhatsApp o en persona', icon: <CalendarPlus size={16} />, run: () => openBook(), group: 'Accions' },
      { id: 'block', label: 'Tancar dates', hint: 'Un allotjament o tota la casa', icon: <Lock size={16} />, run: () => openBlock(), group: 'Accions' },
      { id: 'theme', label: theme === 'dark' ? 'Mode clar' : 'Mode fosc', icon: <Moon size={16} />, run: () => setTheme(theme === 'dark' ? 'light' : 'dark'), group: 'Accions' },
    ];
    const t = q.trim().toLowerCase();
    const people = allBookings().filter(isBooking)
      .filter(b => !t || [b.name, b.phone, b.email, shortName(b.stay)].join(' ').toLowerCase().includes(t))
      .sort((a, b) => Math.abs(+new Date(a.first) - +new Date(TODAY)) - Math.abs(+new Date(b.first) - +new Date(TODAY)))
      .slice(0, t ? 8 : 4)
      .map(b => ({ id: 'b-' + keyOf(b), label: who(b), hint: `${shortName(b.stay)}, ${range(b.first, b.until)}`, icon: <User size={16} />, run: () => openDetail(keyOf(b)), group: 'Reserves' }));
    return [...base.filter(i => !t || (i.label + ' ' + (i.hint || '')).toLowerCase().includes(t)), ...people];
  }, [q, theme]);

  const mounted = useMounted(open);
  const run = (key: Key) => { const it = items.find(i => i.id === key); if (it) { setPalette(false); setTimeout(it.run, 0); } };
  if (!mounted) return null;
  return (
    <Modal.Backdrop isOpen={open} onOpenChange={setPalette} variant="blur" className="!bg-black/40">
      <Modal.Container placement="top" size="md">
        <Modal.Dialog aria-label="Cerca i accions" className="!mt-[12vh] !bg-transparent !p-0 !shadow-none w-full sm:max-w-xl">
          <Glass radius={24} strength="strong" className="w-full">
            <div className="p-2">
              <SearchField aria-label="Cerca" value={q} onChange={setQ} onSubmit={() => items[0] && run(items[0].id)} autoFocus fullWidth>
                <SearchField.Group className="h-12 !rounded-2xl">
                  <SearchField.SearchIcon />
                  <SearchField.Input placeholder="Cerca una secció, una acció o un hoste…" className="text-base" />
                  <SearchField.ClearButton />
                </SearchField.Group>
              </SearchField>
              <ListBox aria-label="Resultats" items={items} onAction={run} className="mt-2 max-h-[52vh] overflow-y-auto"
                renderEmptyState={() => <p className="p-6 text-center text-sm text-muted">Res no coincideix.</p>}>
                {it => (
                  <ListBox.Item id={it.id} textValue={it.label} className="rounded-xl">
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-default text-muted">{it.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{it.label}</span>
                      {it.hint && <span className="block truncate text-xs text-muted">{it.hint}</span>}
                    </span>
                    <span className="text-xs text-muted">{it.group}</span>
                  </ListBox.Item>
                )}
              </ListBox>
              <div className="flex items-center gap-3 border-t border-separator px-3 pt-2 pb-1 text-xs text-muted">
                <span className="inline-flex items-center gap-1"><Kbd variant="light">↑↓</Kbd> moure</span>
                <span className="inline-flex items-center gap-1"><Kbd variant="light">↵</Kbd> obrir</span>
                <span className="inline-flex items-center gap-1"><Kbd variant="light">Esc</Kbd> tancar</span>
              </div>
            </div>
          </Glass>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
