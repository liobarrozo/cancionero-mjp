export const CHORDS_SHARP = ['DO', 'DO#', 'RE', 'RE#', 'MI', 'FA', 'FA#', 'SOL', 'SOL#', 'LA', 'SIb', 'SI'];
export const CHORDS_FLAT  = ['DO', 'REb', 'RE', 'MIb', 'MI', 'FA', 'SOLb', 'SOL', 'LAb', 'LA', 'SIb', 'SI'];
export const CHORDS_ENG   = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];

export function transposeSingleChord(chord, steps) {
  if (!chord || steps === 0) return chord;
  const m = chord.match(/^(DO#?|RE#?|MI#?|FA#?|SOL#?|LA#?|SI#?|REb|MIb|SOLb|LAb|SIb|[A-G][#b]?)(.*)$/i);
  if (!m) return chord;
  const root = m[1].toUpperCase().replace('B', 'b');
  const suffix = m[2];

  let idx = CHORDS_SHARP.indexOf(root);
  if (idx === -1) idx = CHORDS_FLAT.indexOf(root);
  if (idx === -1) idx = CHORDS_ENG.indexOf(root);
  if (idx === -1) return chord;

  let newIdx = (idx + steps) % 12;
  if (newIdx < 0) newIdx += 12;
  return CHORDS_SHARP[newIdx] + suffix;
}

export function transposeChordGroup(group, steps) {
  if (!group || steps === 0) return group;
  return group
    .split(/(\s+)/)
    .map(tok => (/^\s+$/.test(tok) ? tok : transposeSingleChord(tok, steps)))
    .join('');
}
