// Status chips: a dot and a word, in the brand green for done things and amber for things still owed
import type { Booking } from '../lib/types';
import { KIND } from '../lib/words';

export function Status({ b }: { b: Booking }) {
  if (b.kind === 'paid') return <span className="status paid">Pagada a la web</span>;
  if (b.kind === 'pending') return <span className="status due">Pendent del banc</span>;
  if (b.kind === 'manual') return <span className={`status ${b.settled ? 'paid' : 'due'}`}>{b.settled ? 'Cobrada' : 'Per cobrar'}</span>;
  if (b.kind === 'other') return <span className="status other">Google Calendar</span>;
  if (b.kind === 'cancelled' || b.kind === 'refunded') return <span className="status danger">{KIND[b.kind]}</span>;
  return <span className="status neutral">{KIND[b.kind]}</span>;
}
export function Tag({ tone = 'neutral', children }: { tone?: 'paid' | 'due' | 'other' | 'neutral' | 'danger'; children: React.ReactNode }) {
  return <span className={`status ${tone}`}>{children}</span>;
}
