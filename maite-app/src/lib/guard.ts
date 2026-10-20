// Unsaved changes: the page being edited registers here, and leaving it (another page, another stay, reload) asks first
import { useEffect, useRef, useSyncExternalStore } from 'react';

type Guard = { dirty: boolean; save: () => Promise<boolean> };
let active: { current: Guard } | null = null;
let pending: (() => void) | null = null;
const subs = new Set<() => void>();
const emit = () => subs.forEach(f => f());

export const isDirty = () => !!active?.current.dirty;

// Pages call this with whether they have changes and how to save them (resolves true when saved)
export function useGuard(dirty: boolean, save: () => Promise<boolean>) {
  const ref = useRef<Guard>({ dirty, save });
  ref.current = { dirty, save };
  useEffect(() => {
    active = ref;
    return () => { if (active === ref) active = null; };
  }, []);
}

// Run `then` now, or once the changes are saved or discarded
export function leave(then: () => void) {
  if (!isDirty()) return then();
  pending = then; emit();
}

export const usePending = () => useSyncExternalStore(f => { subs.add(f); return () => { subs.delete(f); }; }, () => pending !== null);
export function stay() { pending = null; emit(); }
export function discard() {
  const then = pending; pending = null;
  if (active) active.current = { ...active.current, dirty: false };
  emit(); then?.();
}
export async function saveAndGo() {
  if (!active || !(await active.current.save())) return false;
  discard(); return true;
}

addEventListener('beforeunload', e => { if (isDirty()) e.preventDefault(); });
