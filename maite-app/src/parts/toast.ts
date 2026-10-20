// Short confirmations and errors (HeroUI toasts; the region is mounted once in App)
import { toast } from '@heroui/react';
export const done = (msg: string) => { toast.success(msg); };
export const toastError = (e: unknown) => { toast.danger(e instanceof Error ? e.message : String(e)); };
