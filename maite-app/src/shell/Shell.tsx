// The frame: glass sidebar (desktop), glass top bar, glass tab bar (phone). Pages render in the scrolling column.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Button } from '@heroui/react';
import { House, CalendarDays, Table2, UtensilsCrossed, Tag, Percent, ScrollText, BedDouble, Mail, LayoutGrid, Search, Moon, Sun, Command, MoreHorizontal } from 'lucide-react';
import { Glass } from '../lib/glass';
import { go, usePage, type Page } from '../lib/route';
import { setTheme, useTheme } from '../lib/theme';
import { useStore } from '../lib/store';

export const NAV: { page: Page; label: string; short?: string; icon: typeof CalendarDays; hint: string }[] = [
  { page: 'home', label: 'Inici', icon: House, hint: "El que passa avui i el que falta per fer" },
  { page: 'calendar', label: 'Calendari', icon: CalendarDays, hint: 'Ocupació de les properes setmanes' },
  { page: 'bookings', label: 'Reserves', icon: Table2, hint: 'Totes les reserves i la seva llista' },
  { page: 'restaurant', label: 'Restaurant', icon: UtensilsCrossed, hint: 'Taules reservades, dies oberts i places' },
  { page: 'prices', label: 'Preus', icon: Tag, hint: 'Preu per nit i dies especials' },
  { page: 'discounts', label: 'Descomptes', icon: Percent, hint: 'Descomptes per estada llarga' },
  { page: 'stays', label: 'Allotjaments', icon: BedDouble, hint: 'Textos, capacitat i fotos de la web' },
  { page: 'rules', label: 'Normes', icon: ScrollText, hint: 'Estada, antelació, horaris i cancel·lació' },
  { page: 'emails', label: 'Correus', icon: Mail, hint: 'Els correus que reben els hostes i la casa' },
  { page: 'social', label: 'Xarxes socials', icon: LayoutGrid, hint: "Plantilles d'Instagram, la graella del perfil i els copies" },
];

function ThemeButton() {
  const theme = useTheme();
  return (
    <Button isIconOnly variant="ghost" size="sm" aria-label={theme === 'dark' ? 'Mode clar' : 'Mode fosc'} onPress={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </Button>
  );
}

// The brand isotype: light drawing on dark, dark drawing on light
function Iso({ size }: { size: number }) {
  const theme = useTheme();
  return <img src={theme === 'dark' ? '/img/iso-light.png' : '/img/iso-dark.png'} alt="" width={size} height={size} style={{ width: size, height: size }} className="shrink-0" />;
}

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <Iso size={32} />
      <div className="leading-tight">
        <div className="text-[15px] font-semibold tracking-tight">Maite</div>
        <div className="text-xs text-muted">La Casa Vella</div>
      </div>
    </div>
  );
}

function Sidebar({ onSearch }: { onSearch: () => void }) {
  const page = usePage();
  const user = useStore(s => s.user);
  return (
    <Glass as="aside" radius={28} strength="strong" className="sticky top-4 hidden h-[calc(100dvh-2rem)] w-64 shrink-0 lg:block" aria-label="Menú">
      <div className="flex h-full flex-col p-4">
        <div className="px-2 pt-1 pb-5"><Logo /></div>
        <button type="button" onClick={onSearch}
          className="mb-4 flex h-10 items-center gap-2 rounded-xl bg-default/70 px-3 text-sm text-muted outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-focus">
          <Search size={16} aria-hidden="true" /><span className="flex-1 text-left">Cerca o vés a…</span>
          <kbd className="flex items-center gap-0.5 rounded-md border border-border px-1.5 text-xs"><Command size={11} aria-hidden="true" />K</kbd>
        </button>
        <nav className="flex flex-col gap-0.5" aria-label="Seccions">
          {NAV.map(({ page: p, label, icon: Icon }) => {
            const on = p === page;
            return (
              <a key={p} href={'#/' + p} onClick={e => { e.preventDefault(); go(p); }} aria-current={on ? 'page' : undefined}
                className={`group flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-focus ${on ? 'bg-accent/15 text-foreground' : 'text-muted hover:bg-default/60 hover:text-foreground'}`}>
                <Icon size={18} aria-hidden="true" className={on ? 'text-accent' : ''} />{label}
              </a>
            );
          })}
        </nav>
        <div className="mt-auto flex items-center gap-2 border-t border-separator px-2 pt-4">
          <div className="min-w-0 flex-1 truncate text-xs text-muted" title={user}>{user}</div>
          <ThemeButton />
        </div>
      </div>
    </Glass>
  );
}

function TopBar({ title, actions, onSearch }: { title: string; actions?: ReactNode; onSearch: () => void }) {
  return (
    <Glass as="header" radius={22} className="glass-dense sticky top-2 z-30 lg:top-4">
      <div className="flex min-h-14 items-center gap-2 px-3 py-2 sm:px-4">
        <div className="lg:hidden"><Iso size={28} /></div>
        <h1 className="mr-auto truncate text-lg font-semibold tracking-tight sm:text-xl">{title}</h1>
        <div className="flex items-center gap-1.5">{actions}</div>
        <div className="flex items-center lg:hidden">
          <Button isIconOnly variant="ghost" size="sm" aria-label="Cerca" onPress={onSearch}><Search size={18} /></Button>
          <ThemeButton />
        </div>
      </div>
    </Glass>
  );
}

function TabBar() {
  const page = usePage();
  const [more, setMore] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const inMore: Page[] = ['restaurant', 'stays', 'discounts', 'rules', 'emails', 'social'], main = NAV.filter(n => !inMore.includes(n.page)), extra = NAV.filter(n => inMore.includes(n.page));
  const extraOn = extra.some(n => n.page === page);
  useEffect(() => {
    if (!more) return;
    const close = (e: Event) => { if (e instanceof KeyboardEvent ? e.key === 'Escape' : !moreRef.current?.contains(e.target as Node)) setMore(false); };
    addEventListener('keydown', close); addEventListener('pointerdown', close);
    moreRef.current?.querySelector('a')?.focus();
    return () => { removeEventListener('keydown', close); removeEventListener('pointerdown', close); };
  }, [more]);
  const item = (on: boolean, Icon: typeof CalendarDays, label: string) => (
    <><span className={`grid h-7 w-12 place-items-center rounded-full transition-colors duration-150 ${on ? 'bg-accent/20 text-accent' : ''}`}><Icon size={19} aria-hidden="true" /></span><span>{label}</span></>
  );
  const cell = 'flex h-16 flex-col items-center justify-center gap-1 rounded-[22px] text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-focus';
  return (
    <div ref={moreRef} className="fixed inset-x-3 bottom-[max(.75rem,env(safe-area-inset-bottom))] z-40 lg:hidden">
      {more && (
        <Glass radius={22} strength="strong" className="absolute right-0 bottom-[calc(100%+.5rem)] w-56 fade-in">
          <nav aria-label="Més seccions" className="p-1.5">
            {extra.map(({ page: p, label, icon: Icon }) => (
              <a key={p} href={'#/' + p} onClick={e => { e.preventDefault(); go(p); setMore(false); }} aria-current={p === page ? 'page' : undefined}
                className={`flex h-12 items-center gap-3 rounded-2xl px-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-focus ${p === page ? 'bg-accent/15' : 'hover:bg-default/60'}`}>
                <Icon size={18} aria-hidden="true" className={p === page ? 'text-accent' : 'text-muted'} />{label}
              </a>
            ))}
          </nav>
        </Glass>
      )}
      <Glass as="nav" radius={26} strength="strong" className="glass-dense" aria-label="Seccions">
        <div className="grid grid-cols-5">
          {main.map(({ page: p, label, short, icon: Icon }) => {
            const on = p === page;
            return (
              <a key={p} href={'#/' + p} onClick={e => { e.preventDefault(); go(p); }} aria-current={on ? 'page' : undefined} className={`${cell} ${on ? 'text-foreground' : 'text-muted'}`}>
                {item(on, Icon, short || label)}
              </a>
            );
          })}
          <button type="button" aria-expanded={more} aria-haspopup="true" onClick={() => setMore(m => !m)} className={`${cell} ${extraOn || more ? 'text-foreground' : 'text-muted'}`}>
            {item(extraOn, MoreHorizontal, 'Més')}
          </button>
        </div>
      </Glass>
    </div>
  );
}

export function Shell({ title, actions, children, onSearch }: { title: string; actions?: ReactNode; children: ReactNode; onSearch: () => void }) {
  return (
    <div className="mx-auto flex max-w-[1600px] gap-4 px-2 sm:px-4 lg:py-4">
      <Sidebar onSearch={onSearch} />
      <div className="min-w-0 flex-1 pb-28 lg:pb-8">
        <TopBar title={title} actions={actions} onSearch={onSearch} />
        <main className="pt-4 sm:pt-6">{children}</main>
      </div>
      <TabBar />
    </div>
  );
}
