// Diccionario de digitaciones de guitarra para acordes en nomenclatura hispana e inglesa.
// Strings: [6ª (Mi grave), 5ª, 4ª, 3ª, 2ª, 1ª (Mi agudo)]
// -1 = cuerda muteada (X), 0 = cuerda al aire (O), 1..N = traste presionado.

export const GUITAR_CHORDS = {
  // DO (C)
  'DO': { frets: [-1, 3, 2, 0, 1, 0], baseFret: 1 },
  'DO7': { frets: [-1, 3, 2, 3, 1, 0], baseFret: 1 },
  'DOmaj7': { frets: [-1, 3, 2, 0, 0, 0], baseFret: 1 },
  'DOm': { frets: [-1, 3, 5, 5, 4, 3], baseFret: 3, barre: 3 },
  'DOm7': { frets: [-1, 3, 5, 3, 4, 3], baseFret: 3, barre: 3 },
  'DO9': { frets: [-1, 3, 2, 3, 3, 3], baseFret: 1 },
  'DOadd9': { frets: [-1, 3, 2, 0, 3, 0], baseFret: 1 },
  'DO#': { frets: [-1, 4, 6, 6, 6, 4], baseFret: 4, barre: 4 },
  'DO#m': { frets: [-1, 4, 6, 6, 5, 4], baseFret: 4, barre: 4 },
  'DO#m7': { frets: [-1, 4, 6, 4, 5, 4], baseFret: 4, barre: 4 },
  'DO#7': { frets: [-1, 4, 6, 4, 6, 4], baseFret: 4, barre: 4 },
  'DO#dim': { frets: [-1, -1, 2, 3, 2, 3], baseFret: 1 },
  'DO/SI': { frets: [-1, 2, 2, 0, 1, 0], baseFret: 1 },

  // RE (D)
  'RE': { frets: [-1, -1, 0, 2, 3, 2], baseFret: 1 },
  'RE7': { frets: [-1, -1, 0, 2, 1, 2], baseFret: 1 },
  'REmaj7': { frets: [-1, -1, 0, 2, 2, 2], baseFret: 1 },
  'REm': { frets: [-1, -1, 0, 2, 3, 1], baseFret: 1 },
  'REm7': { frets: [-1, -1, 0, 2, 1, 1], baseFret: 1 },
  'REsus4': { frets: [-1, -1, 0, 2, 3, 3], baseFret: 1 },
  'RE4': { frets: [-1, -1, 0, 2, 3, 3], baseFret: 1 },
  'REsus2': { frets: [-1, -1, 0, 2, 3, 0], baseFret: 1 },
  'RE9': { frets: [-1, -1, 0, 2, 1, 0], baseFret: 1 },
  'RE#': { frets: [-1, 6, 8, 8, 8, 6], baseFret: 6, barre: 6 },
  'RE#m': { frets: [-1, 6, 8, 8, 7, 6], baseFret: 6, barre: 6 },
  'RE#7': { frets: [-1, 6, 8, 6, 8, 6], baseFret: 6, barre: 6 },
  'RE#dim': { frets: [-1, -1, 1, 2, 1, 2], baseFret: 1 },
  'REb': { frets: [-1, 4, 6, 6, 6, 4], baseFret: 4, barre: 4 },
  'RE/FA#': { frets: [2, 0, 0, 2, 3, 2], baseFret: 1 },
  'RE6/FA#': { frets: [2, 0, 0, 2, 0, 2], baseFret: 1 },
  'RE/DO#': { frets: [-1, 4, 0, 2, 3, 2], baseFret: 1 },

  // MI (E)
  'MI': { frets: [0, 2, 2, 1, 0, 0], baseFret: 1 },
  'MI7': { frets: [0, 2, 0, 1, 0, 0], baseFret: 1 },
  'MImaj7': { frets: [0, 2, 1, 1, 0, 0], baseFret: 1 },
  'MIm': { frets: [0, 2, 2, 0, 0, 0], baseFret: 1 },
  'MIm7': { frets: [0, 2, 0, 0, 0, 0], baseFret: 1 },
  'MIsus4': { frets: [0, 2, 2, 2, 0, 0], baseFret: 1 },
  'MI9': { frets: [0, 2, 0, 1, 0, 2], baseFret: 1 },
  'MIb': { frets: [-1, 6, 8, 8, 8, 6], baseFret: 6, barre: 6 },
  'MIbm': { frets: [-1, 6, 8, 8, 7, 6], baseFret: 6, barre: 6 },
  'MIb/SIb': { frets: [-1, 1, 1, 3, 4, 3], baseFret: 1 },

  // FA (F)
  'FA': { frets: [1, 3, 3, 2, 1, 1], baseFret: 1, barre: 1 },
  'FA7': { frets: [1, 3, 1, 2, 1, 1], baseFret: 1, barre: 1 },
  'FAmaj7': { frets: [-1, -1, 3, 2, 1, 0], baseFret: 1 },
  'FAm': { frets: [1, 3, 3, 1, 1, 1], baseFret: 1, barre: 1 },
  'FA#': { frets: [2, 4, 4, 3, 2, 2], baseFret: 2, barre: 2 },
  'FA#m': { frets: [2, 4, 4, 2, 2, 2], baseFret: 2, barre: 2 },
  'FA#7': { frets: [2, 4, 2, 3, 2, 2], baseFret: 2, barre: 2 },
  'FA#m7': { frets: [2, 4, 2, 2, 2, 2], baseFret: 2, barre: 2 },
  'FA#dim': { frets: [-1, -1, 1, 2, 1, 2], baseFret: 1 },

  // SOL (G)
  'SOL': { frets: [3, 2, 0, 0, 0, 3], baseFret: 1 },
  'SOL7': { frets: [3, 2, 0, 0, 0, 1], baseFret: 1 },
  'SOLmaj7': { frets: [3, 2, 0, 0, 0, 2], baseFret: 1 },
  'SOLm': { frets: [3, 5, 5, 3, 3, 3], baseFret: 3, barre: 3 },
  'SOLm7': { frets: [3, 5, 3, 3, 3, 3], baseFret: 3, barre: 3 },
  'SOL9': { frets: [3, 2, 0, 2, 0, 1], baseFret: 1 },
  'SOLadd9': { frets: [3, 2, 0, 2, 0, 3], baseFret: 1 },
  'SOL#': { frets: [4, 6, 6, 5, 4, 4], baseFret: 4, barre: 4 },
  'SOL#m': { frets: [4, 6, 6, 4, 4, 4], baseFret: 4, barre: 4 },
  'SOL#7': { frets: [4, 6, 4, 5, 4, 4], baseFret: 4, barre: 4 },
  'SOLb': { frets: [2, 4, 4, 3, 2, 2], baseFret: 2, barre: 2 },
  'SOL/SI': { frets: [-1, 2, 0, 0, 3, 3], baseFret: 1 },
  'SOL/DO': { frets: [-1, 3, 0, 0, 0, 3], baseFret: 1 },

  // LA (A)
  'LA': { frets: [-1, 0, 2, 2, 2, 0], baseFret: 1 },
  'LA5': { frets: [-1, 0, 2, 2, -1, -1], baseFret: 1 },
  'LA6': { frets: [-1, 0, 2, 2, 2, 2], baseFret: 1 },
  'LA7': { frets: [-1, 0, 2, 0, 2, 0], baseFret: 1 },
  'LA7sus': { frets: [-1, 0, 2, 0, 3, 0], baseFret: 1 },
  'LA9': { frets: [-1, 0, 2, 4, 2, 3], baseFret: 1 },
  'LAmaj7': { frets: [-1, 0, 2, 1, 2, 0], baseFret: 1 },
  'LAm': { frets: [-1, 0, 2, 2, 1, 0], baseFret: 1 },
  'LAm7': { frets: [-1, 0, 2, 0, 1, 0], baseFret: 1 },
  'LAsus4': { frets: [-1, 0, 2, 2, 3, 0], baseFret: 1 },
  'LAsus2': { frets: [-1, 0, 2, 2, 0, 0], baseFret: 1 },
  'LAsus9': { frets: [-1, 0, 2, 2, 0, 0], baseFret: 1 },
  'LA#': { frets: [-1, 1, 3, 3, 3, 1], baseFret: 1, barre: 1 },
  'LAb': { frets: [4, 6, 6, 5, 4, 4], baseFret: 4, barre: 4 },
  'LAm/SOL': { frets: [3, 0, 2, 2, 1, 0], baseFret: 1 },

  // SI (B)
  'SI': { frets: [-1, 2, 4, 4, 4, 2], baseFret: 2, barre: 2 },
  'SI7': { frets: [-1, 2, 1, 2, 0, 2], baseFret: 1 },
  'SIm': { frets: [-1, 2, 4, 4, 3, 2], baseFret: 2, barre: 2 },
  'SIm7': { frets: [-1, 2, 0, 2, 0, 2], baseFret: 1 },
  'SIsus4': { frets: [-1, 2, 4, 4, 5, 2], baseFret: 2, barre: 2 },
  'SIb': { frets: [-1, 1, 3, 3, 3, 1], baseFret: 1, barre: 1 },
  'SIbm': { frets: [-1, 1, 3, 3, 2, 1], baseFret: 1, barre: 1 },
  'SIb7': { frets: [-1, 1, 3, 1, 3, 1], baseFret: 1, barre: 1 },
  'SIb/RE': { frets: [-1, -1, 0, 3, 3, 1], baseFret: 1 },
  'SIm/SOL': { frets: [3, 2, 4, 4, 3, 2], baseFret: 1 },
};

// Mapeo de acordes en inglés a español
const ENG_TO_ESP = {
  'C': 'DO', 'D': 'RE', 'E': 'MI', 'F': 'FA', 'G': 'SOL', 'A': 'LA', 'B': 'SI'
};

export function normalizeChordName(chordStr) {
  if (!chordStr) return '';
  let str = chordStr.trim().replace(/^[\[\(]+|[\]\)\:\,\.\*]+$/g, '');

  // Corrección de OCR común en cancioneros
  if (str === 'Slm' || str === 'slm') return 'SIm';
  if (str === 'SI#') return 'DO';
  if (str === 'DOm#') return 'DO#m';

  // Soporte para notación de menor con guion: DO- -> DOm
  str = str.replace(/^(DO|RE|MI|FA|SOL|LA|SI)-$/i, '$1m');

  // Soporte para símbolo de disminuido °
  str = str.replace(/°/g, 'dim');

  // Normalizar raíces en minúsculas comunes
  const lowerMap = {
    'do': 'DO', 're': 'RE', 'mi': 'MI', 'fa': 'FA', 'sol': 'SOL', 'la': 'LA', 'si': 'SI',
    'dom': 'DOm', 'rem': 'REm', 'mim': 'MIm', 'fam': 'FAm', 'solm': 'SOLm', 'lam': 'LAm', 'sim': 'SIm',
    'fa#m': 'FA#m', 'do#m': 'DO#m', 'sol#m': 'SOL#m', 'la#m': 'LA#m', 're#m': 'RE#m'
  };
  const lowerKey = str.toLowerCase();
  if (lowerMap[lowerKey]) {
    return lowerMap[lowerKey];
  }

  // Capitalización de raíces españolas
  const espMatch = str.match(/^(do|re|mi|fa|sol|la|si)(#|b)?(.*)$/i);
  if (espMatch) {
    const root = espMatch[1].toUpperCase();
    const acc = espMatch[2] ? (espMatch[2].toLowerCase() === 'b' ? 'b' : '#') : '';
    let suffix = espMatch[3] || '';
    if (suffix.startsWith('m') && !suffix.startsWith('maj')) {
      suffix = 'm' + suffix.slice(1);
    }
    str = root + acc + suffix;
  } else {
    // Reemplazar raíz inglesa si aplica (ej: Am -> LAm, C#m -> DO#m)
    const engMatch = str.match(/^([A-G])(#|b)?(.*)$/);
    if (engMatch && ENG_TO_ESP[engMatch[1]]) {
      const rootEsp = ENG_TO_ESP[engMatch[1]];
      const acc = engMatch[2] || '';
      let suffix = engMatch[3] || '';
      if (suffix.startsWith('m') && !suffix.startsWith('maj')) {
        suffix = 'm' + suffix.slice(1);
      }
      str = rootEsp + acc + suffix;
    }
  }

  return str;
}

export function getChordDiagram(chordStr) {
  const norm = normalizeChordName(chordStr);
  if (!norm) return null;

  // 1. Coincidencia exacta
  if (GUITAR_CHORDS[norm]) {
    return { name: norm, ...GUITAR_CHORDS[norm] };
  }

  // 2. Acorde con bajo / inversión: si no tiene digitación específica, usar acorde base
  if (norm.includes('/')) {
    const base = norm.split('/')[0];
    if (GUITAR_CHORDS[base]) {
      return { name: norm, ...GUITAR_CHORDS[base] };
    }
  }

  // 3. Variaciones comunes (ej: RE4 -> REsus4, LAadd9 -> LA9)
  if (norm.endsWith('4') && GUITAR_CHORDS[norm.replace(/4$/, 'sus4')]) {
    return { name: norm, ...GUITAR_CHORDS[norm.replace(/4$/, 'sus4')] };
  }
  if (norm.endsWith('sus') && GUITAR_CHORDS[norm.replace(/sus$/, 'sus4')]) {
    return { name: norm, ...GUITAR_CHORDS[norm.replace(/sus$/, 'sus4')] };
  }

  // 4. Fallback a familia de acorde
  const m = norm.match(/^(DO#?|RE#?|MI#?|FA#?|SOL#?|LA#?|SI#?|REb|MIb|SOLb|LAb|SIb)(m|maj7|7|sus4|dim)?/);
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
