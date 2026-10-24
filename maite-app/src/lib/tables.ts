// The restaurant's tables, loaded by date windows and merged by id, shared by Inici and Restaurant
import { useEffect, useSyncExternalStore } from 'react';
import { api } from './api';
import type { Table } from './types';

interface State { tables: Map<string, Table>; configured: boolean; error: string; version: number }
let state: State = { tables: new Map(), configured: true, error: '', version: 0 };
let loaded: [string, string][] = [];
const subs = new Set<() => void>();
const emit = (patch: Partial<State>) => { state = { ...state, ...patch, version: state.version + 1 }; subs.forEach(f => f()); };
const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };

async function load(from: string, to: string) {
  if (loaded.some(([a, b]) => a <= from && b >= to)) return;
  loaded.push([from, to]);
  try {
    const d = await api<{ configured: boolean; tables: Table[] }>(`restaurant?from=${from}&to=${to}`);
    const map = new Map(state.tables);
    for (const [k, t] of map) if (t.date >= from && t.date < to) map.delete(k);
    d.tables.forEach(t => map.set(t.id, t));
    emit({ tables: map, configured: d.configured, error: '' });
  } catch (e) {
    loaded = loaded.filter(([a, b]) => a !== from || b !== to);
    emit({ error: (e as Error).message });
  }
}

/** The tables, loading [from, to) the first time it is asked for */
export function useTables(from: string, to: string) {
  useEffect(() => { load(from, to); }, [from, to]);
  return useSyncExternalStore(subscribe, () => state);
}
export const putTable = (t: Table) => emit({ tables: new Map(state.tables).set(t.id, t) });
export const atOf = (t: Pick<Table, 'date' | 'time'>) => `${t.date}T${t.time}`;
export const seated = (list: Table[]) => list.reduce((n, t) => n + (t.people || 0), 0);
