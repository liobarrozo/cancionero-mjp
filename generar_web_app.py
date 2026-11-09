#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Genera cancionero_web_precise.html interactivo y autónomo (sin dependencias).
Reproduce con fidelidad visual idéntica la tipografía y posición del PDF:
- Fuente Google DM Sans (la misma tipografía del cancionero original).
- Color de acordes verde #285628 idéntico al PDF.
- Cada acorde posicionado directamente sobre su sílaba con flex vertical.
- Transposición tonal (+1 / -1 semitono).
- Buscador en tiempo real y filtros por categoría litúrgica.
"""

import json
import html as html_mod
from pathlib import Path

DATA_PATH = Path("cancionero_vite.json")
OUT_HTML = Path("cancionero_web_precise.html")

def escape(s):
    return html_mod.escape(str(s or ""), quote=False)

def main():
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    canciones = data["canciones"]
    total = data["total_canciones"]
    total_acordes = data["total_acordes"]

    # Ordenar categorías con orden litúrgico canónico
    orden_liturgico = [
        "Todas", "Entradas", "Penitenciales", "Gloria", "Aleluya",
        "Ofertorio", "Santo", "Padre nuestro", "Cordero",
        "Comunión", "Meditación", "Salida", "Varios", "Bajadas"
    ]
    
    cats_presentes = set(c["categoria"] for c in canciones)
    cats_ordenadas = [c for c in orden_liturgico if c == "Todas" or c in cats_presentes]
    for c in sorted(cats_presentes):
        if c not in cats_ordenadas:
            cats_ordenadas.append(c)

    # Botones chips
    chips_html = "".join(
        f'<button class="chip {"activo" if cat == "Todas" else ""}" data-cat="{escape(cat)}">{escape(cat)}</button>'
        for cat in cats_ordenadas
    )

    # Render de canciones
    canciones_html = []
    for c in canciones:
        lineas_html = []
        for l in c["lineas"]:
            tipo = l.get("tipo", "letra")
            segs = l.get("segmentos", [])
            
            # Detectar marcadores como [ESTRIBILLO], (x2), etc.
            linea_txt = "".join(s.get("letra", "") for s in segs).strip()
            es_marcador = linea_txt in ("[ESTRIBILLO]", "ESTRIBILLO", "CORO", "(x2)", "(x3)")
            
            if es_marcador:
                lineas_html.append(f'<div class="renglon marcador">{escape(linea_txt)}</div>')
                continue
                
            segs_html = []
            for s in segs:
                acorde = s.get("acorde", "").strip()
                letra = s.get("letra", "")
                
                acorde_span = f'<span class="acorde" data-chord="{escape(acorde)}">{escape(acorde)}</span>' if acorde else '<span class="acorde-vacio">&nbsp;</span>'
                letra_span = f'<span class="letra">{escape(letra)}</span>' if letra else '<span class="letra">&nbsp;</span>'
                
                segs_html.append(f'<span class="bloque-acorde">{acorde_span}{letra_span}</span>')
                
            lineas_html.append(f'<div class="renglon {"tipo-solo-acordes" if tipo == "acordes" else ""}">' + "".join(segs_html) + '</div>')
            
        badge_bajada = 'bajada' if c['categoria'] == 'Bajadas' or c.get('codigo_oasis') else ''
        oasis_badge = f'<span class="badge oasis">{escape(c["codigo_oasis"])}</span>' if c.get('codigo_oasis') else ''
        subtitulo_html = f'<div class="subtitulo">{escape(c["subtitulo"])}</div>' if c.get('subtitulo') else ''
        
        canciones_html.append(f'''
        <article class="cancion" data-id="{c['id']}" data-cat="{escape(c['categoria'])}" data-tit="{escape(c['titulo'].lower())}" data-oasis="{escape((c.get('codigo_oasis') or '').lower())}">
          <header class="cancion-head">
            <div>
              <h2 class="cancion-titulo">{escape(c['titulo'])}</h2>
              {subtitulo_html}
            </div>
            <div class="cancion-badges">
              <span class="badge {badge_bajada}">{escape(c['categoria'])}</span>
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

    html_content = f'''<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cancionero MJP ({total} canciones) — Acordes de Alta Precisión</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,600;0,9..40,700;1,9..40,400&display=swap" rel="stylesheet">
  <style>
    :root {{
      --font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
      --chord-color: #285628; /* Verde exacto del PDF */
      --lyric-color: #231f20; /* Color exacto de letra del PDF */
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
      font-size: 2rem;
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
      gap: 1.5rem;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1e40af;
      padding: 0.35rem 1rem;
      border-radius: 999px;
      font-size: 0.82rem;
      font-weight: 600;
      margin-top: 0.75rem;
    }}

    /* Controles */
    .controls {{
      max-width: 900px;
      margin: 0 auto 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      align-items: center;
    }}
    .search-box {{
      width: 100%;
      max-width: 500px;
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
    .filtros {{
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      justify-content: center;
    }}
    .chip {{
      background: #ffffff;
      border: 1px solid #cbd5e1;
      color: #475569;
      font-family: var(--font-family);
      font-size: 0.82rem;
      font-weight: 600;
      padding: 0.35rem 0.85rem;
      border-radius: 999px;
      cursor: pointer;
      transition: all 0.15s ease;
    }}
    .chip:hover {{
      background: #f1f5f9;
      border-color: #94a3b8;
    }}
    .chip.activo {{
      background: #1e3a8a;
      color: #ffffff;
      border-color: #1e3a8a;
    }}

    /* Grid de canciones */
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
      color: #0f172a;
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
    .badge.bajada {{
      background: #fdf4ff;
      color: #86198f;
      border: 1px solid #f5d0fe;
    }}
    .badge.oasis {{
      background: #f0fdf4;
      color: #166534;
      border: 1px solid #bbf7d0;
    }}
    .badge.pag {{
      color: #94a3b8;
    }}

    /* Barra de transposición */
    .transposer-bar {{
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.4rem;
      padding: 0.2rem 0.6rem;
      margin-bottom: 1rem;
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

    /* Cuerpo musical: acordes exactamente sobre letras */
    .cancion-cuerpo {{
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }}
    .renglon {{
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      line-height: 1.15;
    }}
    .renglon.marcador {{
      font-weight: 700;
      font-size: 0.82rem;
      color: #64748b;
      margin: 0.5rem 0 0.2rem;
      letter-spacing: 0.04em;
    }}
    .bloque-acorde {{
      display: inline-flex;
      flex-direction: column;
      vertical-align: bottom;
    }}
    .acorde {{
      font-family: var(--font-family);
      font-weight: 700;
      color: var(--chord-color);
      font-size: 0.82rem;
      line-height: 1.1;
      min-height: 1.1em;
      white-space: pre;
    }}
    .acorde-vacio {{
      font-size: 0.82rem;
      line-height: 1.1;
      min-height: 1.1em;
      visibility: hidden;
      white-space: pre;
    }}
    .letra {{
      font-family: var(--font-family);
      font-weight: 400;
      color: var(--lyric-color);
      font-size: 0.98rem;
      line-height: 1.35;
      white-space: pre;
    }}
    .tipo-solo-acordes .acorde {{
      font-size: 0.9rem;
    }}
    .no-results {{
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
    <p>Visualización idéntica al cancionero impreso · Tipografía DM Sans y acordes alineados por coordenadas</p>
    <div class="stats-bar">
      <span>{total} canciones</span>
      <span>{total_acordes} acordes</span>
      <span>13 categorías</span>
    </div>
  </header>

  <div class="controls">
    <input type="text" id="buscador" class="search-box" placeholder="Buscar por título, letra o código Oasis (ej: O.308, Al altar, pan)...">
    <div class="filtros" id="filtros-container">
      {chips_html}
    </div>
  </div>

  <main class="grid" id="canciones-grid">
    {"".join(canciones_html)}
  </main>

  <script>
    // Transposición musical
    const CHORDS_SHARP = ['DO', 'DO#', 'RE', 'RE#', 'MI', 'FA', 'FA#', 'SOL', 'SOL#', 'LA', 'SIb', 'SI'];
    const CHORDS_FLAT  = ['DO', 'REb', 'RE', 'MIb', 'MI', 'FA', 'SOLb', 'SOL', 'LAb', 'LA', 'SIb', 'SI'];
    const CHORDS_ENG   = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];

    function transposeChord(chord, steps) {{
      if (!chord || steps === 0) return chord;
      // Regex para separar raíz de sufijo
      const m = chord.match(/^(DO#?|RE#?|MI#?|FA#?|SOL#?|LA#?|SI#?|REb|MIb|SOLb|LAb|SIb|[A-G][#b]?)(.*)$/);
      if (!m) return chord;
      let root = m[1];
      const suffix = m[2];
      
      let idx = CHORDS_SHARP.indexOf(root);
      if (idx === -1) idx = CHORDS_FLAT.indexOf(root);
      if (idx === -1) idx = CHORDS_ENG.indexOf(root);
      if (idx === -1) return chord;
      
      let newIdx = (idx + steps) % 12;
      if (newIdx < 0) newIdx += 12;
      
      const newRoot = CHORDS_SHARP[newIdx];
      return newRoot + suffix;
    }}

    const transposeState = {{}};

    function transposeSong(songId, delta) {{
      const current = transposeState[songId] || 0;
      const next = current + delta;
      transposeState[songId] = next;
      document.getElementById('trans-' + songId).textContent = (next > 0 ? '+' : '') + next;
      
      const card = document.querySelector(`.cancion[data-id="${{songId}}"]`);
      if (!card) return;
      const chords = card.querySelectorAll('.acorde');
      chords.forEach(c => {{
        const original = c.getAttribute('data-chord');
        c.textContent = transposeChord(original, next);
      }});
    }}

    function resetTranspose(songId) {{
      transposeState[songId] = 0;
      document.getElementById('trans-' + songId).textContent = '0';
      const card = document.querySelector(`.cancion[data-id="${{songId}}"]`);
      if (!card) return;
      const chords = card.querySelectorAll('.acorde');
      chords.forEach(c => {{
        c.textContent = c.getAttribute('data-chord');
      }});
    }}

    // Filtrado y búsqueda
    const chips = document.querySelectorAll('.chip');
    const cards = document.querySelectorAll('.cancion');
    const buscador = document.getElementById('buscador');

    function applyFilter() {{
      const activeChip = document.querySelector('.chip.activo');
      const cat = activeChip ? activeChip.getAttribute('data-cat') : 'Todas';
      const q = buscador.value.trim().toLowerCase();

      let visible = 0;
      cards.forEach(card => {{
        const cardCat = card.getAttribute('data-cat');
        const cardTit = card.getAttribute('data-tit');
        const cardOasis = card.getAttribute('data-oasis');
        const textContent = card.querySelector('.cancion-cuerpo').textContent.toLowerCase();

        const matchCat = (cat === 'Todas') || (cardCat === cat) || (cat === 'Bajadas' && cardOasis);
        const matchSearch = !q || cardTit.includes(q) || cardOasis.includes(q) || textContent.includes(q);

        if (matchCat && matchSearch) {{
          card.style.display = '';
          visible++;
        }} else {{
          card.style.display = 'none';
        }}
      }});
    }}

    chips.forEach(chip => {{
      chip.addEventListener('click', () => {{
        chips.forEach(c => c.classList.remove('activo'));
        chip.classList.add('activo');
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
