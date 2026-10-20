// Correus: the emails guests and the house receive, rendered from the real templates with example data. Read only.
import { useEffect, useRef, useState } from 'react';
import { Skeleton, Tabs } from '@heroui/react';
import { House, User } from 'lucide-react';
import { api } from '../lib/api';
import { toastError } from '../parts/toast';

type Email = { id: string; name: string; for: 'guest' | 'house'; when: string; subject: string; html: string; text: string };
const TO = { guest: "A l'hoste", house: 'A la Casa Vella' };

export default function Emails() {
  const [list, setList] = useState<Email[] | null>(null);
  const [id, setId] = useState('');
  const [view, setView] = useState<'html' | 'text'>('html');
  useEffect(() => { api<{ emails: Email[] }>('emails').then(d => { setList(d.emails); setId(d.emails[0]?.id || ''); }).catch(toastError); }, []);
  if (!list) return <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]"><Skeleton className="h-80 rounded-3xl" /><Skeleton className="h-[640px] rounded-3xl" /></div>;
  const e = list.find(x => x.id === id) || list[0];

  return (
    <div className="fade-in grid items-start gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
      <nav aria-label="Correus" className="lg:sticky lg:top-24">
        <p className="mb-3 text-sm text-muted">Els correus que s'envien sols. Aquí només es poden llegir; el contingut és d'exemple, amb els horaris i la política d'ara.</p>
        <ul className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
          {list.map(x => {
            const on = x.id === e.id, Icon = x.for === 'guest' ? User : House;
            return (
              <li key={x.id} className="shrink-0 lg:shrink">
                <button type="button" aria-current={on || undefined} onClick={() => setId(x.id)}
                  className={`flex w-60 items-start gap-3 rounded-2xl p-3 text-left outline-none ring-1 transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-focus lg:w-full ${on ? 'bg-accent/12 ring-accent' : 'bg-surface ring-border hover:bg-default/60'}`}>
                  <Icon size={16} aria-hidden="true" className={`mt-0.5 shrink-0 ${on ? 'text-accent' : 'text-muted'}`} />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{x.name}</span>
                    <span className="block text-xs text-muted">{TO[x.for]}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <section className="min-w-0 overflow-hidden rounded-3xl bg-surface shadow-[var(--surface-shadow)] ring-1 ring-border">
        <div className="space-y-3 border-b border-separator p-5 sm:p-6">
          <h2 className="text-lg font-semibold tracking-tight">{e.name}</h2>
          <p className="text-sm text-muted">{e.when}</p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-muted">Per a</dt><dd>{TO[e.for]}</dd>
            <dt className="text-muted">Assumpte</dt><dd className="font-medium break-words">{e.subject}</dd>
          </dl>
          <Tabs selectedKey={view} onSelectionChange={k => setView(k as 'html' | 'text')}>
            <Tabs.ListContainer><Tabs.List aria-label="Format" className="w-fit">
              <Tabs.Tab id="html">Com es veu<Tabs.Indicator /></Tabs.Tab>
              <Tabs.Tab id="text">Text pla<Tabs.Indicator /></Tabs.Tab>
            </Tabs.List></Tabs.ListContainer>
          </Tabs>
        </div>
        {view === 'html'
          ? <Preview key={e.id} html={e.html} title={e.name} />
          : <pre className="overflow-x-auto whitespace-pre-wrap p-5 font-[inherit] text-sm leading-relaxed sm:p-6">{e.text}</pre>}
      </section>
    </div>
  );
}

// The email in a frame of its own, so its styles stay apart; no scripts, sized to its content
function Preview({ html, title }: { html: string; title: string }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [h, setH] = useState(720);
  const fit = () => { const d = frame.current?.contentDocument; if (d) setH(d.documentElement.scrollHeight); };
  return (
    <div className="bg-[#efebe3]">
      <iframe ref={frame} title={`Vista prèvia: ${title}`} srcDoc={html} sandbox="allow-same-origin" onLoad={fit}
        className="block w-full border-0" style={{ height: h }} />
    </div>
  );
}
