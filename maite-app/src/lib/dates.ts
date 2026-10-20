// Dates are 'YYYY-MM-DD' strings in local time, like the API
const pad = (n: number) => String(n).padStart(2, '0');
export const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parse = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const addDays = (s: string, n: number) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
export const nightsBetween = (a: string, b: string) => Math.round((parse(b).getTime() - parse(a).getTime()) / 864e5);
export const TODAY = iso(new Date());
export const day = (s: string, opt: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }) => parse(s).toLocaleDateString('ca-ES', opt);
export const longDay = (s: string) => day(s, { weekday: 'long', day: 'numeric', month: 'long' });
export const range = (a: string, b: string) => `${day(a)} → ${day(b)}`;
export const nitsTxt = (n: number) => `${n} ${n === 1 ? 'nit' : 'nits'}`;
export const stamp = (t: string | number) => new Date(t).toLocaleString('ca-ES', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
export const euro = (c: number | null | undefined) => c == null ? '' : (c / 100).toLocaleString('ca-ES', { minimumFractionDigits: c % 100 ? 2 : 0, maximumFractionDigits: 2 }) + ' €';
export const cap = (s: string) => s ? s[0].toUpperCase() + s.slice(1) : s;
