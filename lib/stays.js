// Stays as the web shows them: type, name, description, features, capacity and photos.
// Edited in Maite (Allotjaments) and kept in the MAITE KV namespace (key "stays"); photos uploaded there live in R2 (PHOTOS).
// The defaults are what index.html has written in, so the page looks the same before anything is edited.
import { STAYS } from './booking.js';

// Feature icons (24×24 line drawings, same style as the page)
export const ICONS = {
  "bed": "<path d=\"M3 18V7M3 14h18v4M21 18v-3.5A3.5 3.5 0 0 0 17.5 11H11v3\"/><circle cx=\"7\" cy=\"11.5\" r=\"1.8\"/>",
  "kitchen": "<path d=\"M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M16 3c-1.7 1-3 3.2-3 6h3v12\"/>",
  "bath": "<path d=\"M4 12h16v2a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-2Z\"/><path d=\"M6 12V6a2 2 0 0 1 3.7-1M7 19l-1 2M17 19l1 2\"/>",
  "wifi": "<path d=\"M2.5 9a14 14 0 0 1 19 0M5.5 12.5a9.5 9.5 0 0 1 13 0M8.6 16a5 5 0 0 1 6.8 0\"/><circle cx=\"12\" cy=\"19.2\" r=\".9\" fill=\"currentColor\"/>",
  "ac": "<path d=\"M12 2v20M4.5 6.5l15 11M19.5 6.5l-15 11M9.5 3.5 12 6l2.5-2.5M9.5 20.5 12 18l2.5 2.5\"/>",
  "tv": "<rect x=\"3\" y=\"5\" width=\"18\" height=\"12\" rx=\"1.5\"/><path d=\"M8 21h8\"/>",
  "parking": "<rect x=\"3.5\" y=\"3.5\" width=\"17\" height=\"17\" rx=\"3\"/><path d=\"M10 17V7.5h3.2a3 3 0 0 1 0 6H10\"/>",
  "people": "<path d=\"M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z\"/><path d=\"M2.5 20c.6-3.6 3.3-6 6.5-6s5.9 2.4 6.5 6\"/><path d=\"M16 4.3a3.5 3.5 0 0 1 0 6.4M18 14.5c1.9.8 3.2 2.8 3.5 5.5\"/>",
  "heating": "<path d=\"M6 4v14M10 4v14M14 4v14M18 4v14M4 18h16M4 8h16\"/>",
  "garden": "<path d=\"M12 21V11M12 11c0-4 3-7 7-7 0 4-3 7-7 7ZM12 14c0-3-2.5-5.5-6-5.5 0 3 2.5 5.5 6 5.5Z\"/>",
  "pets": "<circle cx=\"6\" cy=\"10\" r=\"1.8\"/><circle cx=\"10\" cy=\"6\" r=\"1.8\"/><circle cx=\"14\" cy=\"6\" r=\"1.8\"/><circle cx=\"18\" cy=\"10\" r=\"1.8\"/><path d=\"M12 11c-3 0-5 3.5-5 6 0 1.5 1.2 2.5 2.6 2.2 1-.2 1.6-.7 2.4-.7s1.4.5 2.4.7c1.4.3 2.6-.7 2.6-2.2 0-2.5-2-6-5-6Z\"/>",
  "washer": "<rect x=\"4\" y=\"3\" width=\"16\" height=\"18\" rx=\"2\"/><circle cx=\"12\" cy=\"13\" r=\"4.5\"/><path d=\"M7 6.5h2\"/>",
  "star": "<path d=\"m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z\"/>"
};
export const ICON_NAMES = {
  "bed": "Llit / dormitori",
  "kitchen": "Cuina",
  "bath": "Bany",
  "wifi": "Wifi",
  "ac": "Aire condicionat",
  "tv": "Televisió",
  "parking": "Aparcament",
  "people": "Persones",
  "heating": "Calefacció",
  "garden": "Jardí / terrassa",
  "pets": "Mascotes",
  "washer": "Rentadora",
  "star": "Altres"
};
// Photos that come with the web (img/), to pick from again after removing one
export const LIBRARY = [
  "img/apt-bany.jpg",
  "img/apt-cuina-detall.jpg",
  "img/apt-cuina.jpg",
  "img/apt-detall-rosa.jpg",
  "img/apt-dormitori-1.jpg",
  "img/apt-dormitori-2.jpg",
  "img/apt-dormitori-3.jpg",
  "img/apt-dormitori-4.jpg",
  "img/apt-passadis.jpg",
  "img/apt-sala-2.jpg",
  "img/apt-sala.jpg",
  "img/apt-tovalloles.jpg",
  "img/bedorc-capvespre.jpg",
  "img/bedorc.jpg",
  "img/escala-entrada.jpg",
  "img/escala.jpg",
  "img/gerro.jpg",
  "img/hab-armari.jpg",
  "img/hab-balco.jpg",
  "img/hab-bany.jpg",
  "img/hab-escriptori.jpg",
  "img/hab-llit.jpg",
  "img/hab-llum.jpg",
  "img/hab-tovalloles.jpg",
  "img/hero-vinyes-capvespre.jpg",
  "img/hero-vinyes-cel.jpg",
  "img/hero-vinyes-sol.jpg",
  "img/historia-carrer.jpg",
  "img/llibre.jpg",
  "img/mirall.jpg",
  "img/montserrat-vinyes.jpg",
  "img/postal-bedorc.jpg",
  "img/rajola-flor.jpg",
  "img/rajola.jpg",
  "img/rebedor.jpg",
  "img/restaurant-barra.jpg",
  "img/rotul.jpg",
  "img/tirador.jpg"
];

export const DEFAULT_CONTENT = {
  "montserrat": {
    "kind": "Apartament",
    "name": "Montserrat",
    "desc": "La muntanya que es veu des del Bedorc, i el seu nom. Un apartament complet per a estades més llargues.",
    "feats": [
      {
        "icon": "bed",
        "text": "1 dormitori"
      },
      {
        "icon": "kitchen",
        "text": "Cuina equipada"
      },
      {
        "icon": "bath",
        "text": "Bany privat"
      },
      {
        "icon": "wifi",
        "text": "Wifi gratuït"
      },
      {
        "icon": "ac",
        "text": "Aire condicionat"
      },
      {
        "icon": "tv",
        "text": "Smart TV"
      },
      {
        "icon": "parking",
        "text": "Aparcament"
      }
    ],
    "max": 3,
    "photos": [
      "img/apt-sala-2.jpg",
      "img/apt-cuina.jpg",
      "img/apt-dormitori-3.jpg",
      "img/apt-bany.jpg",
      "img/apt-sala.jpg",
      "img/apt-cuina-detall.jpg",
      "img/apt-dormitori-2.jpg",
      "img/apt-passadis.jpg",
      "img/apt-dormitori-4.jpg",
      "img/apt-detall-rosa.jpg",
      "img/apt-dormitori-1.jpg",
      "img/apt-tovalloles.jpg"
    ]
  },
  "la-pineda": {
    "kind": "Apartament",
    "name": "La Pineda",
    "desc": "Amb el nom dels pins que envolten el poble. Espai, cuina pròpia i calma per quedar-s'hi uns dies.",
    "feats": [
      {
        "icon": "bed",
        "text": "Dormitori doble"
      },
      {
        "icon": "kitchen",
        "text": "Cuina equipada"
      },
      {
        "icon": "bath",
        "text": "Bany privat"
      },
      {
        "icon": "wifi",
        "text": "Wifi gratuït"
      },
      {
        "icon": "ac",
        "text": "Aire condicionat"
      },
      {
        "icon": "tv",
        "text": "Smart TV"
      },
      {
        "icon": "parking",
        "text": "Aparcament"
      }
    ],
    "max": 3,
    "photos": [
      "img/apt-dormitori-3.jpg",
      "img/apt-dormitori-2.jpg",
      "img/apt-sala.jpg",
      "img/apt-cuina-detall.jpg",
      "img/apt-bany.jpg",
      "img/apt-passadis.jpg",
      "img/apt-sala-2.jpg",
      "img/apt-cuina.jpg",
      "img/apt-dormitori-4.jpg",
      "img/apt-dormitori-1.jpg",
      "img/apt-tovalloles.jpg",
      "img/apt-detall-rosa.jpg"
    ]
  },
  "les-vinyes": {
    "kind": "Habitació",
    "name": "Les Vinyes",
    "desc": "Per la tradició vitivinícola que ha modelat el paisatge. Llit de forja, terra hidràulic i l'armari antic de la casa.",
    "feats": [
      {
        "icon": "people",
        "text": "2 persones"
      },
      {
        "icon": "bed",
        "text": "Llit doble"
      },
      {
        "icon": "bath",
        "text": "Bany privat"
      },
      {
        "icon": "wifi",
        "text": "Wifi gratuït"
      },
      {
        "icon": "ac",
        "text": "Aire condicionat"
      },
      {
        "icon": "tv",
        "text": "Smart TV"
      },
      {
        "icon": "parking",
        "text": "Aparcament"
      }
    ],
    "max": 2,
    "photos": [
      "img/hab-armari.jpg",
      "img/mirall.jpg",
      "img/llibre.jpg",
      "img/tirador.jpg",
      "img/rajola.jpg",
      "img/gerro.jpg"
    ]
  },
  "figarot": {
    "kind": "Habitació",
    "name": "Figarot",
    "desc": "Amb el nom de la figuera, l'arbre de les cases de pagès. Una habitació tranquil·la amb bany privat.",
    "feats": [
      {
        "icon": "people",
        "text": "2 persones"
      },
      {
        "icon": "bed",
        "text": "Llit doble"
      },
      {
        "icon": "bath",
        "text": "Bany privat"
      },
      {
        "icon": "wifi",
        "text": "Wifi gratuït"
      },
      {
        "icon": "ac",
        "text": "Aire condicionat"
      },
      {
        "icon": "tv",
        "text": "Smart TV"
      },
      {
        "icon": "parking",
        "text": "Aparcament"
      }
    ],
    "max": 2,
    "photos": [
      "img/rajola-flor.jpg",
      "img/hab-armari.jpg",
      "img/tirador.jpg",
      "img/escala.jpg",
      "img/mirall.jpg",
      "img/rajola.jpg"
    ]
  }
};

export const isUpload = src => /^\/photos\/[0-9a-f-]{36}\.(jpg|webp|png)$/.test(src);
export const isPhoto = src => LIBRARY.includes(src) || isUpload(src);

export async function content(env) {
  let saved = null;
  try { saved = env.MAITE && await env.MAITE.get('stays', 'json'); } catch (e) {}
  return Object.fromEntries(Object.keys(STAYS).map(k => [k, { ...DEFAULT_CONTENT[k], ...saved?.[k] }]));
}
