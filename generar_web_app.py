#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Genera cancionero_web_precise.html interactivo y autónomo (sin dependencias).
Estructura de categorías tradicional MJP:
- Cantos Litúrgicos: Entradas, Penitenciales, Gloria, Aleluya, Ofertorio, Santo, Padre Nuestro, Cordero, Comunión, Meditación, Salida
- Varios
- Movimiento
- Bajadas (Agrupadas por año, próximamente a definir)
"""

import json
import html as html_mod
from pathlib import Path

DATA_PATH = Path("cancionero_vite.json")
OUT_HTML = Path("cancionero_web_precise.html")

LITURGICAS = [
    "Entradas", "Penitenciales", "Gloria", "Aleluya", "Ofertorio",
    "Santo", "Padre Nuestro", "Cordero", "Comunión", "Meditación", "Salida"
]


def escape(s):
    return html_mod.escape(str(s or ""), quote=False)


def main():
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    canciones = data["canciones"]
    total = data["total_canciones"]
    total_acordes = data["total_acordes"]

    canciones_html = []
    for c in canciones:
        lineas_html = []
        for l in c["lineas"]:
            tipo = l.get("tipo", "letra")
            segs = l.get("segmentos", [])

            linea_txt = "".join(s.get("letra", "") for s in segs).strip()
            tiene_acordes = any(s.get("acorde", "").strip() for s in segs)

            if not tiene_acordes and linea_txt in ("[ESTRIBILLO]", "ESTRIBILLO", "CORO"):
                lineas_html.append(f'<div class="renglon marcador">{escape(linea_txt)}</div>')
                continue

            if not tiene_acordes:
                lineas_html.append(
                    f'<div class="renglon sin-acordes"><span class="letra">{escape(linea_txt)}</span></div>'
                )
                continue

            if tipo == "acordes":
                segs_html = [
                    f'<span class="acorde-inline" data-chord="{escape(s.get("acorde", "").strip())}">{escape(s.get("acorde", "").strip())}</span>'
                    for s in segs if s.get("acorde", "").strip()
                ]
                lineas_html.append('<div class="renglon tipo-solo-acordes">' + " ".join(segs_html) + '</div>')
                continue

            segs_html = []
            for s in segs:
                acorde = s.get("acorde", "").strip()
                letra = s.get("letra", "")
                offset = s.get("offset", 0.0) or 0.0
                style_left = f' style="left:{offset}em;"' if offset else ''

                acorde_span = (
                    f'<span class="acorde" data-chord="{escape(acorde)}"{style_left}>{escape(acorde)}</span>'
                    if acorde else ''
                )
                letra_span = f'<span class="letra">{escape(letra) if letra else "&nbsp;"}</span>'
                segs_html.append(f'<span class="bloque-acorde">{acorde_span}{letra_span}</span>')

            lineas_html.append('<div class="renglon con-acordes">' + "".join(segs_html) + '</div>')

        seccion = c.get("seccion", "Varios")
        categoria = c.get("categoria", "Varios")

        badge_class = "liturgico"
        badge_label = f"Litúrgico · {categoria}"
        if seccion == "Movimiento":
            badge_class = "movimiento"
            badge_label = "Movimiento"
        elif seccion == "Bajadas":
            badge_class = "bajada"
            badge_label = "Bajada"
        elif seccion == "Varios":
            badge_class = "varios"
            badge_label = "Varios"

        badge_cat = f'<span class="badge {badge_class}">{escape(badge_label)}</span>'
        oasis_badge = f'<span class="badge oasis">{escape(c["codigo_oasis"])}</span>' if c.get("codigo_oasis") else ''
        subtitulo_html = f'<div class="subtitulo">{escape(c["subtitulo"])}</div>' if c.get("subtitulo") else ''

        canciones_html.append(f'''
        <article class="cancion" data-id="{c['id']}" data-sec="{escape(seccion)}" data-cat="{escape(categoria)}" data-tit="{escape(c['titulo'].lower())}" data-oasis="{escape((c.get('codigo_oasis') or '').lower())}">
          <header class="cancion-head">
            <div>
              <h2 class="cancion-titulo">{escape(c['titulo'])}</h2>
              {subtitulo_html}
            </div>
            <div class="cancion-badges">
              {badge_cat}
              {oasis_badge}
              <span class="badge pag">pág. {c['pagina_origen']}</span>
            </div>
          </header>

          <div class="transposer-bar">
            <span class="transpose-label">Tono:</span>
            <button class="btn-transpose" onclick="transposeSong({c['id']}, -1)">-1</button>
            <span class="transpose-val" id="trans-{c['id']}">0</span>
            <button class="btn-transpose" onclick="transposeSong({c['id']}, 1)">+1</button>
            <button class="btn-reset" onclick="resetTranspose({c['id']})">Reset</button>
          </div>

          <div class="cancion-cuerpo">
            {"".join(lineas_html)}
          </div>
        </article>
        ''')

    subchips_liturgia = "".join(
        f'<button class="chip chip-sub" data-subcat="{escape(cat)}">{escape(cat)}</button>'
        for cat in LITURGICAS
    )

    html_content = f'''<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cancionero MJP ({total} canciones) — Categorías Tradicionales</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,600;0,9..40,700;1,9..40,400&display=swap" rel="stylesheet">
  <style>
    :root {{
      --font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
      --chord-color: #285628;
      --lyric-color: #231f20;
      --primary: #1e3a8a;
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --border: #e2e8f0;
    }}
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      font-family: var(--font-family);
      background-color: var(--bg);
      color: var(--lyric-color);
      line-height: 1.5;
      padding: 1.5rem 1rem 4rem;
    }}
    .header-main {{
      text-align: center;
      max-width: 900px;
      margin: 0 auto 1.5rem;
    }}
    .header-main h1 {{
      font-size: 2.1rem;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.02em;
    }}
    .header-main p {{
      color: #64748b;
      font-size: 0.95rem;
      margin-top: 0.25rem;
    }}
    .stats-bar {{
      display: inline-flex;
      gap: 1.25rem;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1e40af;
      padding: 0.35rem 1.1rem;
      border-radius: 999px;
      font-size: 0.82rem;
      font-weight: 600;
      margin-top: 0.75rem;
    }}

    .controls {{
      max-width: 920px;
      margin: 0 auto 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      align-items: center;
    }}
    .search-box {{
      width: 100%;
      max-width: 520px;
      padding: 0.7rem 1.1rem;
      border-radius: 0.75rem;
      border: 1px solid #cbd5e1;
      font-size: 1rem;
      font-family: var(--font-family);
      background: #fff;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }}
    .search-box:focus {{
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37,99,235,0.15);
    }}

    /* Filtros por Secciones Principales */
    .filtros-secciones {{
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      justify-content: center;
    }}
    .tab-sec {{
      background: #ffffff;
      border: 1px solid #cbd5e1;
      color: #334155;
      font-family: var(--font-family);
      font-size: 0.88rem;
      font-weight: 600;
      padding: 0.45rem 1rem;
      border-radius: 0.6rem;
      cursor: pointer;
      transition: all 0.15s ease;
    }}
    .tab-sec:hover {{
      background: #f1f5f9;
      border-color: #94a3b8;
    }}
    .tab-sec.activo {{
      background: #1e3a8a;
      color: #ffffff;
      border-color: #1e3a8a;
    }}

    /* Subfiltros Litúrgicos */
    .filtros-subliturgia {{
      display: none;
      flex-wrap: wrap;
      gap: 0.35rem;
      justify-content: center;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      padding: 0.5rem 0.75rem;
      border-radius: 0.6rem;
      max-width: 820px;
    }}
    .filtros-subliturgia.visible {{
      display: flex;
    }}
    .chip-sub {{
      background: #ffffff;
      border: 1px solid #cbd5e1;
      color: #475569;
      font-family: var(--font-family);
      font-size: 0.78rem;
      font-weight: 600;
      padding: 0.25rem 0.65rem;
      border-radius: 999px;
      cursor: pointer;
    }}
    .chip-sub:hover {{
      background: #e2e8f0;
    }}
    .chip-sub.activo {{
      background: #2563eb;
      color: #ffffff;
      border-color: #2563eb;
    }}

    .bajada-nota {{
      display: none;
      font-size: 0.8rem;
      color: #701a75;
      background: #fdf4ff;
      border: 1px solid #f5d0fe;
      padding: 0.35rem 0.85rem;
      border-radius: 999px;
      font-weight: 600;
    }}
    .bajada-nota.visible {{
      display: inline-block;
    }}

    .grid {{
      max-width: 900px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }}
    .cancion {{
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 0.85rem;
      padding: 1.25rem 1.5rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.03);
    }}
    .cancion-head {{
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 0.75rem;
      margin-bottom: 0.75rem;
      flex-wrap: wrap;
      gap: 0.5rem;
    }}
    .cancion-titulo {{
      font-size: 1.35rem;
      font-weight: 700;
      color: #231f20;
      letter-spacing: -0.01em;
    }}
    .subtitulo {{
      font-size: 0.85rem;
      color: #64748b;
      font-weight: 600;
      margin-top: 0.15rem;
    }}
    .cancion-badges {{
      display: flex;
      gap: 0.4rem;
      align-items: center;
    }}
    .badge {{
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.2rem 0.55rem;
      border-radius: 0.35rem;
      background: #f1f5f9;
      color: #475569;
    }}
    .badge.liturgico {{
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
    }}
    .badge.movimiento {{
      background: #ecfdf5;
      color: #047857;
      border: 1px solid #a7f3d0;
    }}
    .badge.bajada {{
      background: #fdf4ff;
      color: #86198f;
      border: 1px solid #f5d0fe;
    }}
    .badge.varios {{
      background: #f8fafc;
      color: #475569;
      border: 1px solid #e2e8f0;
    }}
    .badge.oasis {{
      background: #f0fdf4;
      color: #166534;
      border: 1px solid #bbf7d0;
      font-weight: 700;
    }}
    .badge.pag {{
      color: #94a3b8;
    }}

    .transposer-bar {{
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.4rem;
      padding: 0.2rem 0.6rem;
      margin-bottom: 0.85rem;
      font-size: 0.8rem;
    }}
    .transpose-label {{
      color: #64748b;
      font-weight: 600;
    }}
    .btn-transpose, .btn-reset {{
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 0.25rem;
      padding: 0.15rem 0.45rem;
      cursor: pointer;
      font-size: 0.75rem;
      font-weight: 700;
      color: #334155;
    }}
    .btn-transpose:hover, .btn-reset:hover {{
      background: #e2e8f0;
    }}
    .transpose-val {{
      font-weight: 700;
      color: #1e3a8a;
      min-width: 1.2rem;
      text-align: center;
    }}

    .cancion-cuerpo {{
      font-family: var(--font-family);
      font-size: 16px;
      display: flex;
      flex-direction: column;
    }}
    .renglon {{
      white-space: pre;
    }}
    .renglon.con-acordes {{
      display: block;
      line-height: 1.35;
      margin-top: 0.1rem;
    }}
    .renglon.sin-acordes {{
      display: block;
      line-height: 1.5;
    }}
    .renglon.marcador {{
      font-weight: 400;
      font-size: 1rem;
      color: var(--lyric-color);
      line-height: 1.5;
      margin-top: 0.35rem;
    }}
    .renglon.tipo-solo-acordes {{
      display: flex;
      gap: 0.85rem;
      line-height: 1.5;
      margin-top: 0.15rem;
    }}
    .bloque-acorde {{
      display: inline-block;
      position: relative;
      padding-top: 1.35em;
      vertical-align: bottom;
    }}
    .acorde, .acorde-inline {{
      font-family: var(--font-family);
      font-weight: 600;
      color: var(--chord-color);
      font-size: 1em;
      line-height: 1.2;
      white-space: nowrap;
    }}
    .acorde {{
      position: absolute;
      top: 0.05em;
      left: 0;
    }}
    .letra {{
      font-family: var(--font-family);
      font-weight: 400;
      color: var(--lyric-color);
      font-size: 1em;
      line-height: 1.35;
      white-space: pre;
    }}
    .vacio {{
      text-align: center;
      padding: 3rem;
      color: #64748b;
      font-size: 1.1rem;
    }}
  </style>
</head>
<body>
  <header class="header-main">
    <h1>Cancionero MJP</h1>
    <p>Categorías tradicionales · Tipografía DM Sans y acordes con alineación milimétrica</p>
    <div class="stats-bar">
      <span>{total} canciones</span>
      <span>{total_acordes} acordes</span>
      <span>Cantos Litúrgicos (82) · Varios (128) · Movimiento (14) · Bajadas (64)</span>
    </div>
  </header>

  <div class="controls">
    <input type="text" id="buscador" class="search-box" placeholder="Buscar por título, letra o código Oasis (ej: O.308, Cristo joven, pan)...">
    
    <div class="filtros-secciones" id="filtros-secciones">
      <button class="tab-sec activo" data-sec="Todas">Todas (288)</button>
      <button class="tab-sec" data-sec="Cantos Litúrgicos">Cantos Litúrgicos (82)</button>
      <button class="tab-sec" data-sec="Varios">Varios (128)</button>
      <button class="tab-sec" data-sec="Movimiento">Movimiento (14)</button>
      <button class="tab-sec" data-sec="Bajadas">Bajadas (64)</button>
    </div>

    <div class="filtros-subliturgia" id="filtros-subliturgia">
      <button class="chip-sub activo" data-subcat="Todas">Todas las litúrgicas</button>
      {subchips_liturgia}
    </div>

    <div class="bajada-nota" id="bajada-nota">
      Bajadas: agrupadas por año, próximamente a definir
    </div>
  </div>

  <main class="grid" id="canciones-grid">
    {"".join(canciones_html)}
  </main>

  <script>
    const CHORDS_SHARP = ['DO', 'DO#', 'RE', 'RE#', 'MI', 'FA', 'FA#', 'SOL', 'SOL#', 'LA', 'SIb', 'SI'];
    const CHORDS_FLAT  = ['DO', 'REb', 'RE', 'MIb', 'MI', 'FA', 'SOLb', 'SOL', 'LAb', 'LA', 'SIb', 'SI'];
    const CHORDS_ENG   = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];

    function transposeSingleChord(chord, steps) {{
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
    }}

    function transposeChordGroup(group, steps) {{
      return group.split(/(\\s+)/).map(tok => /^\\s+$/.test(tok) ? tok : transposeSingleChord(tok, steps)).join('');
    }}

    const transposeState = {{}};

    function transposeSong(songId, delta) {{
      const current = transposeState[songId] || 0;
      const next = current + delta;
      transposeState[songId] = next;
      document.getElementById('trans-' + songId).textContent = (next > 0 ? '+' : '') + next;

      const card = document.querySelector(`.cancion[data-id="${{songId}}"]`);
      if (!card) return;
      card.querySelectorAll('[data-chord]').forEach(c => {{
        const original = c.getAttribute('data-chord');
        c.textContent = transposeChordGroup(original, next);
      }});
    }}

    function resetTranspose(songId) {{
      transposeState[songId] = 0;
      document.getElementById('trans-' + songId).textContent = '0';
      const card = document.querySelector(`.cancion[data-id="${{songId}}"]`);
      if (!card) return;
      card.querySelectorAll('[data-chord]').forEach(c => {{
        c.textContent = c.getAttribute('data-chord');
      }});
    }}

    const secTabs = document.querySelectorAll('.tab-sec');
    const subChips = document.querySelectorAll('.chip-sub');
    const subLiturgiaBox = document.getElementById('filtros-subliturgia');
    const bajadaNota = document.getElementById('bajada-nota');
    const cards = document.querySelectorAll('.cancion');
    const buscador = document.getElementById('buscador');

    let currentSec = 'Todas';
    let currentSub = 'Todas';

    function applyFilter() {{
      const q = buscador.value.trim().toLowerCase();

      cards.forEach(card => {{
        const cardSec = card.getAttribute('data-sec');
        const cardCat = card.getAttribute('data-cat');
        const cardTit = card.getAttribute('data-tit');
        const cardOasis = card.getAttribute('data-oasis');
        const textContent = card.querySelector('.cancion-cuerpo').textContent.toLowerCase();

        let matchSec = (currentSec === 'Todas') || (cardSec === currentSec);
        if (currentSec === 'Cantos Litúrgicos' && currentSub !== 'Todas') {{
          matchSec = (cardCat === currentSub);
        }}

        const matchSearch = !q || cardTit.includes(q) || cardOasis.includes(q) || textContent.includes(q);

        card.style.display = (matchSec && matchSearch) ? '' : 'none';
      }});
    }}

    secTabs.forEach(tab => {{
      tab.addEventListener('click', () => {{
        secTabs.forEach(t => t.classList.remove('activo'));
        tab.classList.add('activo');
        currentSec = tab.getAttribute('data-sec');

        if (currentSec === 'Cantos Litúrgicos') {{
          subLiturgiaBox.classList.add('visible');
        }} else {{
          subLiturgiaBox.classList.remove('visible');
          currentSub = 'Todas';
          subChips.forEach(c => c.classList.remove('activo'));
          if (subChips[0]) subChips[0].classList.add('activo');
        }}

        if (currentSec === 'Bajadas') {{
          bajadaNota.classList.add('visible');
        }} else {{
          bajadaNota.classList.remove('visible');
        }}

        applyFilter();
      }});
    }});

    subChips.forEach(chip => {{
      chip.addEventListener('click', () => {{
        subChips.forEach(c => c.classList.remove('activo'));
        chip.classList.add('activo');
        currentSub = chip.getAttribute('data-subcat');
        applyFilter();
      }});
    }});

    buscador.addEventListener('input', applyFilter);
  </script>
</body>
</html>'''

    OUT_HTML.write_text(html_content, encoding="utf-8")
    print(f"HTML generado exitosamente en: {OUT_HTML.resolve()}")


if __name__ == "__main__":
    main()
