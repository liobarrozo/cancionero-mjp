// Diccionario de digitaciones de guitarra para acordes en nomenclatura hispana e inglesa.
// Strings: [6ª (Mi grave), 5ª, 4ª, 3ª, 2ª, 1ª (Mi agudo)]
// -1 = cuerda muteada (X), 0 = cuerda al aire (O), 1..N = traste presionado.

export const GUITAR_CHORDS = {
  // DO
  'DO': { frets: [-1, 3, 2, 0, 1, 0], baseFret: 1 },
  'DO7': { frets: [-1, 3, 2, 3, 1, 0], baseFret: 1 },
  'DOmaj7': { frets: [-1, 3, 2, 0, 0, 0], baseFret: 1 },
  'DOm': { frets: [-1, 3, 5, 5, 4, 3], baseFret: 3, barre: 3 },
  'DOm7': { frets: [-1, 3, 5, 3, 4, 3], baseFret: 3, barre: 3 },
  'DO9': { frets: [-1, 3, 2, 3, 3, 3], baseFret: 1 },
  'DOadd9': { frets: [-1, 3, 2, 0, 3, 0], baseFret: 1 },
  'DO#': { frets: [-1, 4, 6, 6, 6, 4], baseFret: 4, barre: 4 },
  'DO#m': { frets: [-1, 4, 6, 6, 5, 4], baseFret: 4, barre: 4 },
  'DO#7': { frets: [-1, 4, 6, 4, 6, 4], baseFret: 4, barre: 4 },

  // RE
  'RE': { frets: [-1, -1, 0, 2, 3, 2], baseFret: 1 },
  'RE7': { frets: [-1, -1, 0, 2, 1, 2], baseFret: 1 },
  'REmaj7': { frets: [-1, -1, 0, 2, 2, 2], baseFret: 1 },
  'REm': { frets: [-1, -1, 0, 2, 3, 1], baseFret: 1 },
  'REm7': { frets: [-1, -1, 0, 2, 1, 1], baseFret: 1 },
  'REsus4': { frets: [-1, -1, 0, 2, 3, 3], baseFret: 1 },
  'RE4': { frets: [-1, -1, 0, 2, 3, 3], baseFret: 1 },
  'REsus2': { frets: [-1, -1, 0, 2, 3, 0], baseFret: 1 },
  'RE#': { frets: [-1, 6, 8, 8, 8, 6], baseFret: 6, barre: 6 },
  'RE#m': { frets: [-1, 6, 8, 8, 7, 6], baseFret: 6, barre: 6 },
  'REb': { frets: [-1, 4, 6, 6, 6, 4], baseFret: 4, barre: 4 },

  // MI
  'MI': { frets: [0, 2, 2, 1, 0, 0], baseFret: 1 },
  'MI7': { frets: [0, 2, 0, 1, 0, 0], baseFret: 1 },
  'MImaj7': { frets: [0, 2, 1, 1, 0, 0], baseFret: 1 },
  'MIm': { frets: [0, 2, 2, 0, 0, 0], baseFret: 1 },
  'MIm7': { frets: [0, 2, 0, 0, 0, 0], baseFret: 1 },
  'MIsus4': { frets: [0, 2, 2, 2, 0, 0], baseFret: 1 },
  'MI9': { frets: [0, 2, 0, 1, 0, 2], baseFret: 1 },
  'MIb': { frets: [-1, 6, 8, 8, 8, 6], baseFret: 6, barre: 6 },
  'MIbm': { frets: [-1, 6, 8, 8, 7, 6], baseFret: 6, barre: 6 },

  // FA
  'FA': { frets: [1, 3, 3, 2, 1, 1], baseFret: 1, barre: 1 },
  'FA7': { frets: [1, 3, 1, 2, 1, 1], baseFret: 1, barre: 1 },
  'FAmaj7': { frets: [-1, -1, 3, 2, 1, 0], baseFret: 1 },
  'FAm': { frets: [1, 3, 3, 1, 1, 1], baseFret: 1, barre: 1 },
  'FA#': { frets: [2, 4, 4, 3, 2, 2], baseFret: 2, barre: 2 },
  'FA#m': { frets: [2, 4, 4, 2, 2, 2], baseFret: 2, barre: 2 },
  'FA#7': { frets: [2, 4, 2, 3, 2, 2], baseFret: 2, barre: 2 },
  'FA#m7': { frets: [2, 4, 2, 2, 2, 2], baseFret: 2, barre: 2 },

  // SOL
  'SOL': { frets: [3, 2, 0, 0, 0, 3], baseFret: 1 },
  'SOL7': { frets: [3, 2, 0, 0, 0, 1], baseFret: 1 },
  'SOLmaj7': { frets: [3, 2, 0, 0, 0, 2], baseFret: 1 },
  'SOLm': { frets: [3, 5, 5, 3, 3, 3], baseFret: 3, barre: 3 },
  'SOLm7': { frets: [3, 5, 3, 3, 3, 3], baseFret: 3, barre: 3 },
  'SOL#': { frets: [4, 6, 6, 5, 4, 4], baseFret: 4, barre: 4 },
  'SOL#m': { frets: [4, 6, 6, 4, 4, 4], baseFret: 4, barre: 4 },
  'SOLb': { frets: [2, 4, 4, 3, 2, 2], baseFret: 2, barre: 2 },

  // LA
  'LA': { frets: [-1, 0, 2, 2, 2, 0], baseFret: 1 },
  'LA7': { frets: [-1, 0, 2, 0, 2, 0], baseFret: 1 },
  'LAmaj7': { frets: [-1, 0, 2, 1, 2, 0], baseFret: 1 },
  'LAm': { frets: [-1, 0, 2, 2, 1, 0], baseFret: 1 },
  'LAm7': { frets: [-1, 0, 2, 0, 1, 0], baseFret: 1 },
  'LAsus4': { frets: [-1, 0, 2, 2, 3, 0], baseFret: 1 },
  'LAsus2': { frets: [-1, 0, 2, 2, 0, 0], baseFret: 1 },
  'LA#': { frets: [-1, 1, 3, 3, 3, 1], baseFret: 1, barre: 1 },
  'LAb': { frets: [4, 6, 6, 5, 4, 4], baseFret: 4, barre: 4 },

  // SI
  'SI': { frets: [-1, 2, 4, 4, 4, 2], baseFret: 2, barre: 2 },
  'SI7': { frets: [-1, 2, 1, 2, 0, 2], baseFret: 1 },
  'SIm': { frets: [-1, 2, 4, 4, 3, 2], baseFret: 2, barre: 2 },
  'SIm7': { frets: [-1, 2, 0, 2, 0, 2], baseFret: 1 },
  'SIsus4': { frets: [-1, 2, 4, 4, 5, 2], baseFret: 2, barre: 2 },
  'SIb': { frets: [-1, 1, 3, 3, 3, 1], baseFret: 1, barre: 1 },
  'SIbm': { frets: [-1, 1, 3, 3, 2, 1], baseFret: 1, barre: 1 },
  'SIb7': { frets: [-1, 1, 3, 1, 3, 1], baseFret: 1, barre: 1 },
};

// Mapeo inglés -> español
const ENG_TO_ESP = {
  'C': 'DO', 'D': 'RE', 'E': 'MI', 'F': 'FA', 'G': 'SOL', 'A': 'LA', 'B': 'SI'
};

export function normalizeChordName(chordStr) {
  if (!chordStr) return '';
  let str = chordStr.trim().replace(/^\[|\]$/g, '');
  // Homogeneizar mayúsculas/minúsculas
  if (/^mim/i.test(str)) str = 'MIm' + str.slice(3);
  else if (/^lam/i.test(str)) str = 'LAm' + str.slice(3);
  else if (/^rem/i.test(str)) str = 'REm' + str.slice(3);
  else if (/^sim/i.test(str)) str = 'SIm' + str.slice(3);
  else if (/^fam/i.test(str)) str = 'FAm' + str.slice(3);
  else if (/^solm/i.test(str)) str = 'SOLm' + str.slice(4);
  else if (/^dom/i.test(str)) str = 'DOm' + str.slice(3);

  // Reemplazar raíz inglesa si aplica
  const engMatch = str.match(/^([A-G])(.*)$/);
  if (engMatch && ENG_TO_ESP[engMatch[1]]) {
    const rootEsp = ENG_TO_ESP[engMatch[1]];
    const suffix = engMatch[2];
    str = rootEsp + suffix;
  }
  return str;
}

export function getChordDiagram(chordStr) {
  const norm = normalizeChordName(chordStr);
  if (GUITAR_CHORDS[norm]) {
    return { name: norm, ...GUITAR_CHORDS[norm] };
  }
  // Intentar sin sufijo de bajo (ej: DO/SI -> DO)
  if (norm.includes('/')) {
    const base = norm.split('/')[0];
    if (GUITAR_CHORDS[base]) {
      return { name: norm, ...GUITAR_CHORDS[base] };
    }
  }
  // Fallback si no está exactamente registrado: buscar raíz
  const m = norm.match(/^(DO#?|RE#?|MI#?|FA#?|SOL#?|LA#?|SI#?|REb|MIb|SOLb|LAb|SIb)(m|maj7|7|sus4)?/);
  if (m) {
    const candidate = m[1] + (m[2] || '');
    if (GUITAR_CHORDS[candidate]) {
      return { name: norm, ...GUITAR_CHORDS[candidate] };
    }
    if (GUITAR_CHORDS[m[1]]) {
      return { name: norm, ...GUITAR_CHORDS[m[1]] };
    }
  }
  return null;
}
