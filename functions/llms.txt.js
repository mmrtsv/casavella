// GET /llms.txt
// The facts about La Casa Vella in plain text, for AI assistants (ChatGPT, Claude, Perplexity, Gemini…) that read the site.
// Prices, discounts, times, the cancellation policy and the restaurant's open days come live from Maite, like the web.
import { settings, policyText } from '../lib/booking.js';
import { content } from '../lib/stays.js';

const SITE = 'https://casavellarural.com';
const euros = n => `${n} €`;

export function llms(S, C, today) {
  const stay = k => {
    const c = C[k], st = S.stays[k];
    const price = st.weekend != null && st.weekend !== st.base
      ? `${euros(st.base)} per night Sunday to Thursday, ${euros(st.weekend)} on Friday and Saturday nights`
      : `${euros(st.base)} per night`;
    const kind = c.kind === 'Apartament' ? 'Apartment' : 'Room';
    return `- ${kind} ${c.name}: up to ${c.max} guests. ${price}. As the site lists it, in Catalan: ${c.feats.map(f => f.text).join(', ')}. ${SITE}/en/#${k}`;
  };
  const discounts = S.discounts.slice().sort((a, b) => a.nights - b.nights).map(d => `${d.pct} % off from ${d.nights} nights`).join(', ');
  const open = S.restaurant.open.filter(a => a.slice(0, 10) >= today);
  const day = a => new Date(a.slice(0, 10) + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) + ' at ' + a.slice(11, 16);
  return `# La Casa Vella

> Family-run rural guesthouse in an 1898 village house in El Bedorc (Piera, Anoia, Barcelona, Catalonia, Spain), among vineyards with the mountain of Montserrat on the horizon. Two apartments, two rooms with private bathroom and a restaurant on the ground floor. Book direct on the website, by phone or WhatsApp.

The website is in Catalan (${SITE}/), Spanish (${SITE}/es/) and English (${SITE}/en/). Last updated ${today}; prices and dates below are the current ones.

## Contact and location

- Address: Carrer Munné Orpí, 23, 08784 El Bedorc (Barcelona), Spain. El Bedorc is a village of the municipality of Piera, in the Anoia county.
- Phone and WhatsApp: +34 667 40 98 59
- Email: info@casavellarural.com
- Instagram: @casavellarural (https://www.instagram.com/casavellarural/)
- Google Maps: https://www.google.com/maps/search/?api=1&query=La+Casa+Vella+El+Bedorc&query_place_id=ChIJK6vlrrVlpBIRBAeTHj5ufvE
- Driving times: Sant Sadurní d'Anoia 15 min, Montserrat 45 min, Barcelona 45 min, Barcelona airport (El Prat) 50 min.

## Accommodation

Four units, each booked as a whole, in the restored house: original stone walls, wooden beams painted green, antique furniture and hydraulic tile floors.

${Object.keys(C).map(stay).join('\n')}

All units: air conditioning and heating, free fast wifi, free parking, private bathroom, smart TV and fridge, towels and bed linen included. The apartments have their own equipped kitchen. Garden with terrace.

- Check-in from ${S.rules.checkin}, check-out until ${S.rules.checkout}.
- Stays of ${S.rules.minNights} to ${S.rules.maxNights} nights${S.rules.maxAdvance ? `, bookable up to ${S.rules.maxAdvance} days ahead` : ''}.
- Longer stays pay less: ${discounts}.
- Cancellation: ${policyText(S.cancel, 'en')}
- Book with live availability and instant payment at ${SITE}/en/#reservar. Booking links can carry the dates: ${SITE}/en/?in=2026-11-13&out=2026-11-15&stay=montserrat&guests=2 (stay: montserrat, la-pineda, les-vinyes or figarot).

## Restaurant

On the ground floor: stone, wood and warm light, from the morning coffee to a glass of Penedès wine; calçots on the terrace in season. It opens on set days, each with its own time${open.length ? `. Next open days: ${open.map(day).join('; ')}` : '; there are no open days announced right now, call to ask'}. Tables are booked at ${SITE}/en/#taula (groups of up to ${S.restaurant.maxParty} online; larger ones by phone). Groups of 8 to 16 can ask for a private event on another day: ${SITE}/en/#esdeveniment.

## The house

Built between 1898 and 1900 as a farmhouse (Casa Parellada). For decades its owners lived off the land; a stable, a henhouse and a small stall for "Macho", the horse that worked the fields, were added. When the family grew older without descendants the house stood empty. Today it is part of our family's project.

## Nearby

- Castell de la Ventosa, in El Bedorc itself: remains of the castle the village grew from, documented more than a thousand years ago.
- Sant Sadurní d'Anoia (15 min): the capital of cava, with century-old cava cellars and tastings among the vineyards.
- Capellades (20 min): the Molí Paperer paper mill museum and La Bassa.
- Vilafranca del Penedès (25 min): the Vinseum wine museum, the market and the castellers at the festa major.
- Castell de Claramunt (30 min): a medieval fortress above the Anoia.
- Montserrat (45 min): the monastery, the Escolania choir and the paths up to Sant Jeroni.
- Walking and cycling routes start at the door: paths among vineyards, hermitages and old villages.
`;
}

export async function onRequestGet({ env }) {
  const [S, C] = await Promise.all([settings(env), content(env)]);
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(new Date());
  return new Response(llms(S, C, today), { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
}
