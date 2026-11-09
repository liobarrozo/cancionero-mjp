#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Extracción geométrica determinista de alta fidelidad:
PDF "CANCIONERO MJP - final imprimir.pdf" -> JSON estructurado y ChordPro.

Estructura de categorías tradicional MJP:
1. Cantos Litúrgicos:
   - Entradas
   - Penitenciales
   - Gloria
   - Aleluya
   - Ofertorio
   - Santo
   - Padre Nuestro
   - Cordero
   - Comunión
   - Meditación
   - Salida
2. Varios
3. Movimiento
4. Bajadas (con códigos O.xxx, agrupadas por año próximamente a definir)
"""

import fitz
import json
import re
from pathlib import Path
from collections import defaultdict

PDF_PATH = "CANCIONERO MJP - final imprimir.pdf"
OUT_COMPLETO = Path("cancionero_completo.json")
OUT_VITE = Path("cancionero_vite.json")
OUT_VITE_SRC = Path("src/data/cancionero.json")

SPACE_W = 3.05  # Ancho de espacio en DM Sans 12pt (puntos PDF)

LITURGICAS = [
    "Entradas", "Penitenciales", "Gloria", "Aleluya", "Ofertorio",
    "Santo", "Padre Nuestro", "Cordero", "Comunión", "Meditación", "Salida"
]


def span_text(s):
    if 'text' in s:
        return s['text']
    return "".join(c.get('c', '') for c in s.get('chars', []))


def is_title_span(s):
    t = span_text(s).strip()
    return (
        s.get('font') == 'DMSans-SemiBold'
        and s.get('size', 0) >= 13.0
        and s.get('color') == 0x231f20
        and t not in ('ÍNDICE',)
    )


def is_cat_span(s):
    return s.get('font', '').startswith('Gelica') or s.get('size', 0) >= 24.0


def is_page_num(s, y0):
    return s.get('size', 0) <= 8.0 or y0 < 45 or y0 > 805


def is_chord_char(c):
    return c['color'] == 0x285628 and c['size'] >= 9.0


SPURIOUS_TOKENS = {
    'a', 'acordes:', 'acordes', 'de', 'el', 'en', 'la', 'un', 'y', 'se', 'te',
    'tono', 'cuerda', 'guitarra:', 'intro:', 'fin:', 'final:', 'puente:', 'rasgueo:',
    'inter:', 'interludio:', 'puede', 'las', 'sobre', 'junto', 'recitan', 'sube', 'solo'
}

def clean_chord_token(t):
    if not t:
        return None
    s = re.sub(r'^[(\[]+|[)\].,:;*+-]+$', '', t.strip())
    if not s or (s.lower() in SPURIOUS_TOKENS and s not in ('MI', 'RE', 'SOL', 'LA', 'FA', 'DO', 'SI')):
        return None
    if s == 'Slm': s = 'SIm'
    if s in ('Mi', 'mi'): s = 'MI'
    if s in ('Re', 're'): s = 'RE'
    if s in ('Sol', 'sol'): s = 'SOL'
    if s in ('La', 'la'): s = 'LA'
    if s in ('Do', 'do'): s = 'DO'
    if s in ('Fa', 'fa'): s = 'FA'
    if s in ('Sim', 'sim'): s = 'SIm'
    if s in ('Mim', 'mim'): s = 'MIm'
    if s in ('Lam', 'lam'): s = 'LAm'
    if s in ('Rem', 'rem'): s = 'REm'
    if s == 'DOm#': s = 'DO#m'
    if s == 'SI#': s = 'DO'
    if re.match(r'^(DO|RE|MI|FA|SOL|LA|SI|[A-G])(#|b)?(m|M|dim|aug|sus|maj|min|add)?[0-9]*(\/[A-Z0-9#b]+)?$', s, re.I):
        return s
    return None


def line_is_chords(l):
    ns = [c for c in l['chars'] if c['c'] not in (' ', '\t', '\n', '\r')]
    if not ns:
        return False
    return (sum(1 for c in ns if is_chord_char(c)) / len(ns)) >= 0.55


def extract_chord_tokens(line, shift_x=0.0):
    tokens = []
    cur = []
    for c in line['chars']:
        if c['c'] in (' ', '\t', '\n', '\r'):
            if cur:
                tokens.append({
                    'text': "".join(x['c'] for x in cur),
                    'x0': cur[0]['x0'] + shift_x,
                    'x1': cur[-1]['x1'] + shift_x,
                    'y0': cur[0]['y0'],
                    'y1': cur[0]['y1'],
                })
                cur = []
        else:
            if cur and (c['x0'] - cur[-1]['x1'] > 4.0):
                tokens.append({
                    'text': "".join(x['c'] for x in cur),
                    'x0': cur[0]['x0'] + shift_x,
                    'x1': cur[-1]['x1'] + shift_x,
                    'y0': cur[0]['y0'],
                    'y1': cur[0]['y1'],
                })
                cur = [c]
            else:
                cur.append(c)
    if cur:
        tokens.append({
            'text': "".join(x['c'] for x in cur),
            'x0': cur[0]['x0'] + shift_x,
            'x1': cur[-1]['x1'] + shift_x,
            'y0': cur[0]['y0'],
            'y1': cur[0]['y1'],
        })
    return tokens


def build_standalone_chord_segments(chords, col_x0):
    segs = []
    prev_x1 = col_x0
    for idx, c in enumerate(chords):
        gap = max(0.0, c['x0'] - prev_x1)
        n_sp = max(2 if idx > 0 else 0, int(round(gap / SPACE_W)))
        if n_sp > 0 and idx == 0:
            segs.append({'acorde': '', 'letra': ' ' * n_sp, 'offset': 0.0})
        chord_w_spaces = max(2, int(round((c['x1'] - c['x0']) / SPACE_W)) + 2)
        trail_sp = 0
        if idx + 1 < len(chords):
            next_gap = max(0.0, chords[idx + 1]['x0'] - c['x1'])
            trail_sp = max(2, int(round(next_gap / SPACE_W)))
        segs.append({
            'acorde': c['text'],
            'letra': ' ' * (chord_w_spaces + trail_sp),
            'offset': 0.0,
        })
        prev_x1 = c['x1']
    return segs


def normalize_lyric_chars(raw_chars, col_x0, min_x0=None, max_x1=0):
    non_ws = [c for c in raw_chars if c['c'] not in (' ', '\t', '\n', '\r')]
    if not non_ws:
        return []
    non_ws.sort(key=lambda c: c['x0'])
    out = []

    start_ref = col_x0
    if min_x0 is not None and min_x0 < non_ws[0]['x0'] - 2.0:
        start_ref = min(col_x0, min_x0)

    if non_ws[0]['x0'] - start_ref > 6.0 and (min_x0 is not None and min_x0 < non_ws[0]['x0'] - 3.0):
        gap = non_ws[0]['x0'] - min_x0
        n_sp = max(1, int(round(gap / SPACE_W)))
        step = gap / n_sp
        for k in range(n_sp):
            out.append({
                'c': ' ',
                'x0': min_x0 + k * step,
                'x1': min_x0 + (k + 1) * step,
                'y0': non_ws[0]['y0'],
                'y1': non_ws[0]['y1'],
            })

    for idx, ch in enumerate(non_ws):
        if idx > 0:
            prev = non_ws[idx - 1]
            gap = ch['x0'] - prev['x1']
            if gap > 1.8:
                n_sp = max(1, int(round(gap / SPACE_W)))
                step = gap / n_sp
                for k in range(n_sp):
                    out.append({
                        'c': ' ',
                        'x0': prev['x1'] + k * step,
                        'x1': prev['x1'] + (k + 1) * step,
                        'y0': ch['y0'],
                        'y1': ch['y1'],
                    })
        out.append(ch)

    last_x1 = out[-1]['x1']
    if max_x1 > last_x1 + 3.0:
        gap = max_x1 - last_x1 + 6.0
        n_sp = max(1, int(round(gap / SPACE_W)))
        step = gap / n_sp
        for k in range(n_sp):
            out.append({
                'c': ' ',
                'x0': last_x1 + k * step,
                'x1': last_x1 + (k + 1) * step,
                'y0': out[-1]['y0'],
                'y1': out[-1]['y1'],
            })
    return out


def find_chord_anchor(cx0, lyric_chars):
    n = len(lyric_chars)
    if not n:
        return 0, 0.0
    if cx0 <= lyric_chars[0]['x0']:
        dx_em = round((cx0 - lyric_chars[0]['x0']) / 12.0, 2)
        return 0, max(-2.0, dx_em)
    for i, ch in enumerate(lyric_chars):
        if ch['x0'] <= cx0 <= ch['x1']:
            dx_em = round((cx0 - ch['x0']) / 12.0, 2)
            return i, dx_em
    best_i = 0
    min_d = float('inf')
    for i, ch in enumerate(lyric_chars):
        d = abs(ch['x0'] - cx0)
        if d < min_d:
            min_d = d
            best_i = i
    dx_em = round((cx0 - lyric_chars[best_i]['x0']) / 12.0, 2)
    return best_i, max(-1.0, min(2.0, dx_em))


def build_chordpro_and_segments(chords, raw_lyric_chars, col_x0):
    min_cx0 = min(c['x0'] for c in chords) if chords else None
    max_cx1 = max(c['x1'] for c in chords) if chords else 0
    lyric_chars = normalize_lyric_chars(raw_lyric_chars, col_x0, min_x0=min_cx0, max_x1=max_cx1)
    if not lyric_chars:
        c_str = " ".join(f"[{c['text']}]" for c in chords)
        return c_str, build_standalone_chord_segments(chords, col_x0)

    anchors = []
    for ct in chords:
        pos, dx_em = find_chord_anchor(ct['x0'], lyric_chars)
        anchors.append((pos, ct['text'], dx_em))
    anchors.sort(key=lambda x: x[0])

    chordpro_str = ""
    c_idx = 0
    for idx, lc in enumerate(lyric_chars):
        while c_idx < len(anchors) and anchors[c_idx][0] == idx:
            chordpro_str += f"[{anchors[c_idx][1]}]"
            c_idx += 1
        chordpro_str += lc['c']
    while c_idx < len(anchors):
        chordpro_str += f"[{anchors[c_idx][1]}]"
        c_idx += 1
    chordpro_str = chordpro_str.rstrip()

    chord_map = defaultdict(list)
    offset_map = {}
    for pos, chord_txt, dx_em in anchors:
        chord_map[pos].append(chord_txt)
        if pos not in offset_map:
            offset_map[pos] = dx_em

    segments = []
    cur_chord = ""
    cur_offset = 0.0
    cur_lyric = []
    n = len(lyric_chars)

    for idx, lc in enumerate(lyric_chars):
        if idx in chord_map:
            if cur_chord or cur_lyric:
                segments.append({
                    'acorde': cur_chord,
                    'letra': "".join(cur_lyric),
                    'offset': cur_offset,
                })
                cur_lyric = []
            cur_chord = " ".join(chord_map[idx])
            cur_offset = offset_map[idx]
        cur_lyric.append(lc['c'])

    if cur_chord or cur_lyric:
        segments.append({
            'acorde': cur_chord,
            'letra': "".join(cur_lyric),
            'offset': cur_offset,
        })

    if n in chord_map:
        segments.append({
            'acorde': " ".join(chord_map[n]),
            'letra': "",
            'offset': offset_map[n],
        })

    return chordpro_str, segments


def parse_index(doc):
    categories = {}
    current_cat = "Entradas"
    for p in range(4, 9):
        text = doc[p].get_text()
        for line in text.splitlines():
            line = line.strip()
            if not line or line == 'ÍNDICE':
                continue
            if line == 'Movimiento':
                current_cat = 'Movimiento'
                continue
            m = re.match(r'^(.*?)\s*[\.\s\u2008]+\s*(\d+)$', line)
            if m:
                t = m.group(1).strip()
                if (
                    t[0].isupper()
                    and any(c.islower() for c in t)
                    and not any(
                        w in t
                        for w in [
                            'lírico', 'simple', 'misa criolla', 'criollo', 'mjp',
                            'grave', 'lento', 'dolores', 'litúrgico', 'común',
                            'rápido', 'escalado', '(cuaresma)'
                        ]
                    )
                ):
                    current_cat = "Padre Nuestro" if t.lower() == "padre nuestro" else t
                else:
                    clean_t = re.sub(r'\s+', ' ', t).strip()
                    categories[clean_t.upper()] = current_cat
    return categories


def find_category_and_section(title, index_categories, page_cat, oasis_code):
    if oasis_code:
        return "Bajadas", "Bajadas"

    norm = re.sub(r'\s+', ' ', title).strip().upper()
    cat = None
    if norm in index_categories:
        cat = index_categories[norm]
    else:
        for k, v in index_categories.items():
            if k in norm or norm in k:
                cat = v
                break

    if not cat:
        cat = page_cat or "Varios"

    if cat in LITURGICAS:
        return cat, "Cantos Litúrgicos"
    elif cat == "Movimiento":
        return "Movimiento", "Movimiento"
    elif cat == "Bajadas":
        return "Bajadas", "Bajadas"
    else:
        return "Varios", "Varios"


def main():
    doc = fitz.open(PDF_PATH)
    print(f"Abierto {PDF_PATH} ({doc.page_count} páginas).")

    index_categories = parse_index(doc)
    print(f"Categorías indexadas: {len(index_categories)} canciones mapeadas.")

    songs = []
    current_song = None
    current_page_cat = None

    for p_idx in range(10, min(193, doc.page_count)):
        page = doc[p_idx]
        d = page.get_text('rawdict')

        for b in d.get('blocks', []):
            for l in b.get('lines', []):
                for s in l.get('spans', []):
                    if is_cat_span(s):
                        t = span_text(s).strip()
                        if t:
                            current_page_cat = t

        raw_page_lines = []
        for b in d.get('blocks', []):
            for l in b.get('lines', []):
                spans = l.get('spans', [])
                if not spans:
                    continue
                y0 = l['bbox'][1]
                x0 = l['bbox'][0]
                y1 = l['bbox'][3]
                if is_page_num(spans[0], y0) or any(is_cat_span(s) for s in spans):
                    continue
                col = 0 if x0 < 297 else 1

                line_chars = []
                for s in spans:
                    font = s.get('font', '')
                    size = s.get('size', 0)
                    color = s.get('color', 0)
                    for ch in s.get('chars', []):
                        line_chars.append({
                            'c': ch.get('c', ''),
                            'x0': ch['bbox'][0],
                            'x1': ch['bbox'][2],
                            'y0': ch['bbox'][1],
                            'y1': ch['bbox'][3],
                            'font': font,
                            'size': size,
                            'color': color,
                        })
                if any(c['c'] not in (' ', '\t', '\n', '\r') for c in line_chars):
                    raw_page_lines.append({
                        'col': col,
                        'y0': y0,
                        'y1': y1,
                        'x0': x0,
                        'spans': list(spans),
                        'chars': line_chars,
                        'page': p_idx + 1,
                    })

        raw_page_lines.sort(key=lambda l: (l['col'], l['y0'], l['x0']))

        page_lines = []
        for l in raw_page_lines:
            if (
                page_lines
                and page_lines[-1]['col'] == l['col']
                and abs(l['y0'] - page_lines[-1]['y0']) < 5.0
                and is_title_span(page_lines[-1]['spans'][0]) == is_title_span(l['spans'][0])
            ):
                page_lines[-1]['spans'].extend(l['spans'])
                page_lines[-1]['chars'].extend(l['chars'])
                page_lines[-1]['chars'].sort(key=lambda c: c['x0'])
                page_lines[-1]['y1'] = max(page_lines[-1]['y1'], l['y1'])
            else:
                l['chars'].sort(key=lambda c: c['x0'])
                page_lines.append(l)

        idx = 0
        while idx < len(page_lines):
            l = page_lines[idx]
            spans = l['spans']
            text = "".join(span_text(s) for s in spans).strip()

            if is_title_span(spans[0]):
                is_sub = current_song and (
                    re.match(r'^(\([A-Z]|O\.\d+|0\.\d+)', text)
                    or re.match(r'^(Jueves Santo|Tito Velazquez)', text)
                )
                if is_sub:
                    current_song['subtitulo'] = text
                    if re.match(r'^[O0]\.\d+', text):
                        current_song['codigo_oasis'] = text.split()[0].replace('0.', 'O.')
                        current_song['categoria'] = "Bajadas"
                        current_song['seccion'] = "Bajadas"
                    idx += 1
                    continue

                full_title = text
                next_idx = idx + 1
                if next_idx < len(page_lines):
                    nl = page_lines[next_idx]
                    if (
                        nl['col'] == l['col']
                        and abs(nl['y0'] - l['y0']) < 25
                        and is_title_span(nl['spans'][0])
                    ):
                        n_text = "".join(span_text(s) for s in nl['spans']).strip()
                        if not (
                            re.match(r'^(\([A-Z]|O\.\d+|0\.\d+)', n_text)
                            or re.match(r'^(Jueves Santo|Tito Velazquez)', n_text)
                        ):
                            full_title = f"{text} {n_text}"
                            idx += 1

                oasis = None
                m = re.search(r'\s+([O0]\.\d+)$', full_title)
                clean_title = full_title
                if m:
                    oasis = m.group(1).replace('0.', 'O.')
                    clean_title = full_title[:m.start()].strip()

                cat, seccion = find_category_and_section(clean_title, index_categories, current_page_cat, oasis)

                current_song = {
                    'id': len(songs) + 1,
                    'titulo': clean_title,
                    'subtitulo': None,
                    'codigo_oasis': oasis,
                    'categoria': cat,
                    'seccion': seccion,
                    'pagina_origen': p_idx + 1,
                    'raw_lines': [],
                }
                songs.append(current_song)
                idx += 1
                continue

            if current_song:
                current_song['raw_lines'].append(l)
            idx += 1

    print(f"Total canciones detectadas: {len(songs)}")

    total_chords = 0
    for s in songs:
        raw = s.pop('raw_lines')
        chordpro_lines = []
        structured_lines = []
        unique_chords = []

        col_margins = {0: 42.52, 1: 300.47}
        for col_id in (0, 1):
            col_xs = [l['chars'][0]['x0'] for l in raw if l['col'] == col_id and l['chars']]
            if col_xs:
                col_margins[col_id] = min(col_xs)

        prev_line_bottom = None
        prev_line_col = None

        i = 0
        while i < len(raw):
            line = raw[i]
            col_x0 = col_margins.get(line['col'], 42.52)

            # Detección de salto de estrofa por espacio vertical en PDF (dy >= 26pt o gap > 10pt)
            salto_previo = False
            if prev_line_bottom is not None and prev_line_col == line['col']:
                gap_y = line['y0'] - prev_line_bottom
                if gap_y > 10.0:
                    salto_previo = True
            elif prev_line_col is not None and prev_line_col != line['col']:
                # Cambio de columna o página: si no está pegado al tope
                if line['y0'] > 80.0:
                    salto_previo = True

            if line_is_chords(line):
                chords = extract_chord_tokens(line)
                total_chords += len(chords)
                for c in chords:
                    c_clean = clean_chord_token(c['text'])
                    if c_clean and c_clean not in unique_chords:
                        unique_chords.append(c_clean)

                next_is_paired_lyric = (
                    i + 1 < len(raw)
                    and not line_is_chords(raw[i + 1])
                    and (
                        (raw[i + 1]['col'] == line['col'] and 8.0 <= (raw[i + 1]['y0'] - line['y0']) < 26.0)
                        or (raw[i + 1]['col'] != line['col'] or raw[i + 1]['page'] != line['page'])
                    )
                )
                if next_is_paired_lyric:
                    lyr = raw[i + 1]
                    lyr_col_x0 = col_margins.get(lyr['col'], 42.52)
                    shift_x = (lyr_col_x0 - col_x0) if lyr['col'] != line['col'] else 0.0
                    adj_chords = extract_chord_tokens(line, shift_x=shift_x) if shift_x else chords
                    c_str, segs = build_chordpro_and_segments(adj_chords, lyr['chars'], lyr_col_x0)
                    chordpro_lines.append(c_str)
                    structured_lines.append({
                        'tipo': 'letra',
                        'salto_previo': salto_previo,
                        'segmentos': segs,
                    })
                    prev_line_bottom = lyr['y1']
                    prev_line_col = lyr['col']
                    i += 2
                    continue

                if (
                    i + 2 < len(raw)
                    and line_is_chords(raw[i + 1])
                    and not line_is_chords(raw[i + 2])
                    and raw[i + 1]['col'] == line['col']
                    and 8.0 <= (raw[i + 1]['y0'] - line['y0']) < 26.0
                    and 8.0 <= (raw[i + 2]['y0'] - raw[i + 1]['y0']) < 26.0
                ):
                    chords2 = extract_chord_tokens(raw[i + 1])
                    total_chords += len(chords2)
                    for c2 in chords2:
                        c2_clean = clean_chord_token(c2['text'])
                        if c2_clean and c2_clean not in unique_chords:
                            unique_chords.append(c2_clean)
                    lyr1 = raw[i + 2]
                    if (
                        i + 3 < len(raw)
                        and not line_is_chords(raw[i + 3])
                        and raw[i + 3]['col'] == line['col']
                        and 8.0 <= (raw[i + 3]['y0'] - lyr1['y0']) < 26.0
                    ):
                        lyr2 = raw[i + 3]
                        c_str1, segs1 = build_chordpro_and_segments(chords, lyr1['chars'], col_x0)
                        c_str2, segs2 = build_chordpro_and_segments(chords2, lyr2['chars'], col_x0)
                        chordpro_lines.extend([c_str1, c_str2])
                        structured_lines.append({'tipo': 'letra', 'salto_previo': salto_previo, 'segmentos': segs1})
                        structured_lines.append({'tipo': 'letra', 'salto_previo': False, 'segmentos': segs2})
                        prev_line_bottom = lyr2['y1']
                        prev_line_col = lyr2['col']
                        i += 4
                        continue
                    else:
                        last_x = max(c['x1'] for c in chords)
                        for idx_c, c2 in enumerate(chords2):
                            c2['x0'] = max(c2['x0'], last_x + 12.0 * (idx_c + 1))
                            c2['x1'] = c2['x0'] + 12.0
                        combined = chords + chords2
                        c_str, segs = build_chordpro_and_segments(combined, lyr1['chars'], col_x0)
                        chordpro_lines.append(c_str)
                        structured_lines.append({'tipo': 'letra', 'salto_previo': salto_previo, 'segmentos': segs})
                        prev_line_bottom = lyr1['y1']
                        prev_line_col = lyr1['col']
                        i += 3
                        continue

                c_str = " ".join(f"[{c['text']}]" for c in chords)
                chordpro_lines.append(c_str)
                structured_lines.append({
                    'tipo': 'acordes',
                    'salto_previo': salto_previo,
                    'segmentos': build_standalone_chord_segments(chords, col_x0),
                })
                prev_line_bottom = line['y1']
                prev_line_col = line['col']
                i += 1
                continue
            else:
                lyr_chars = normalize_lyric_chars(line['chars'], col_x0)
                txt = "".join(c['c'] for c in lyr_chars).rstrip()
                if txt.strip():
                    chordpro_lines.append(txt)
                    structured_lines.append({
                        'tipo': 'verso',
                        'salto_previo': salto_previo,
                        'segmentos': [{'acorde': '', 'letra': txt, 'offset': 0}],
                    })
                prev_line_bottom = line['y1']
                prev_line_col = line['col']
                i += 1

        s['acordes'] = unique_chords
        s['letra_chordpro'] = chordpro_lines
        s['lineas'] = structured_lines

    print(f"Total acordes extraídos: {total_chords}")

    consolidado = {
        'total_canciones': len(songs),
        'total_acordes': total_chords,
        'secciones': [
            {
                'nombre': 'Cantos Litúrgicos',
                'categorias': LITURGICAS,
            },
            {
                'nombre': 'Varios',
                'categorias': ['Varios'],
            },
            {
                'nombre': 'Movimiento',
                'categorias': ['Movimiento'],
            },
            {
                'nombre': 'Bajadas',
                'categorias': ['Bajadas'],
                'nota': 'Agrupadas por año, próximamente a definir',
            },
        ],
        'canciones': songs,
    }

    OUT_COMPLETO.write_text(json.dumps(consolidado, ensure_ascii=False, indent=2), encoding="utf-8")
    OUT_VITE.write_text(json.dumps(consolidado, ensure_ascii=False, indent=2), encoding="utf-8")
    OUT_VITE_SRC.parent.mkdir(parents=True, exist_ok=True)
    OUT_VITE_SRC.write_text(json.dumps(consolidado, ensure_ascii=False, indent=2), encoding="utf-8")
    print("Archivos JSON actualizados con saltos de estrofa y acordes únicos.")


if __name__ == "__main__":
    main()
