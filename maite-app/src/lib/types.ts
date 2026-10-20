// Shapes returned by functions/api/maite/* (see lib/maite.js asBooking and lib/booking.js settings)
export type Kind = 'paid' | 'pending' | 'manual' | 'block' | 'cancelled' | 'refunded' | 'other';
export interface Policy { fullDays: number | null; partialDays: number | null; partialPct: number }
export interface Booking {
  id: string; stay: string; first: string; until: string; kind: Kind; title: string; blocks: boolean;
  name: string; email: string; phone: string; guests: number | null; amount: number | null;
  settled: boolean; refunded: number; was: string; source: string; arrival: string; notes: string;
  stripe: string; link: string; checkin: string; checkout: string; docs: boolean; police: boolean; docsFolder: string; ref: string;
  method: string; memo: string; policy: Policy | null;
}
export interface Stay { id: string; name: string; short: string; max: number }
export interface Settings {
  stays: Record<string, { base: number; weekend: number | null }>;
  days: Record<string, Record<string, { price?: number; min?: number }>>;
  discounts: { nights: number; pct: number }[];
  rules: { minNights: number; maxNights: number; minAdvance: number; maxAdvance: number; checkin: string; checkout: string };
  cancel: Policy;
  policy?: string;
}
export interface Feat { icon: string; text: string }
export interface StayContent { kind: string; name: string; desc: string; feats: Feat[]; max: number; photos: string[] }
export interface Content { stays: Record<string, StayContent>; icons: Record<string, string>; iconNames: Record<string, string>; library: string[]; uploads: boolean }
export interface Payment {
  status: string; amount: number; received: number; refunded: number; created: number; receipt: string; livemode: boolean; link: string;
  method: { type: string; brand: string; last4: string; wallet: string; country: string; bank: string };
}
