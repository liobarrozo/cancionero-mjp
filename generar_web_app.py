#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Genera cancionero_web_precise.html interactivo y autónomo con DaisyUI 5 y Tailwind CSS 4.
Incluye:
- Stanzas y coros con separación idéntica al PDF (salto_previo).
- Acordes al principio de cada canción.
- Modal de diagramas de acordes de guitarra en SVG.
- Modo En Vivo / Pantalla completa con Auto-scroll a velocidad ajustable.
- Sin números de página (navegación 100% digital por categorías y buscador).
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

    conteos = {
        "Todas": len(canciones),
        "Cantos Litúrgicos": sum(1 for c in canciones if c.get("seccion") == "Cantos Litúrgicos"),
        "Varios": sum(1 for c in canciones if c.get("seccion") == "Varios"),
        "Movimiento": sum(1 for c in canciones if c.get("seccion") == "Movimiento"),
        "Bajadas": sum(1 for c in canciones if c.get("seccion") == "Bajadas"),
    }

    canciones_html = []
    for c in canciones:
        lineas_html = []
        for l in c["lineas"]:
            tipo = l.get("tipo", "letra")
            segs = l.get("segmentos", [])
            salto_class = "mt-4 sm:mt-5" if l.get("salto_previo") else ""

            linea_txt = "".join(s.get("letra", "") for s in segs).strip()
            tiene_acordes = any(s.get("acorde", "").strip() for s in segs)

            if not tiene_acordes and linea_txt in ("[ESTRIBILLO]", "ESTRIBILLO", "CORO"):
                lineas_html.append(f'<div class="font-bold text-xs tracking-wider text-base-content/60 my-2 {salto_class}">{escape(linea_txt)}</div>')
                continue

            if not tiene_acordes:
                lineas_html.append(
                    f'<div class="leading-relaxed text-base-content whitespace-pre {salto_class}">{escape(linea_txt)}</div>'
                )
                continue

            if tipo == "acordes":
                segs_html = [
                    f'<span class="font-bold text-[#285628] inline-chord" data-chord="{escape(s.get("acorde", "").strip())}">{escape(s.get("acorde", "").strip())}</span>'
                    for s in segs if s.get("acorde", "").strip()
                ]
                lineas_html.append(f'<div class="flex gap-3 my-0.5 text-[#285628] font-bold text-[0.9em] {salto_class}">' + " ".join(segs_html) + '</div>')
                continue

            segs_html = []
            for s in segs:
                acorde = s.get("acorde", "").strip()
                letra = s.get("letra", "")
                offset = s.get("offset", 0.0) or 0.0
                style_left = f' style="left:{offset}em;"' if offset else ''

                acorde_span = (
                    f'<span class="absolute top-0.5 font-bold text-[#285628] text-[0.84em] leading-none select-none inline-chord" data-chord="{escape(acorde)}"{style_left}>{escape(acorde)}</span>'
                    if acorde else ''
                )
                letra_span = f'<span class="font-normal text-base-content text-[1em]">{escape(letra) if letra else "&nbsp;"}</span>'
                segs_html.append(f'<span class="inline-block relative pt-4.5 align-bottom">{acorde_span}{letra_span}</span>')

            lineas_html.append(f'<div class="block leading-relaxed whitespace-pre my-0.5 {salto_class}">' + "".join(segs_html) + '</div>')

        seccion = c.get("seccion", "Varios")
        categoria = c.get("categoria", "Varios")

        badge_class = "badge-info"
        badge_label = f"Litúrgico · {categoria}"
        if seccion == "Movimiento":
            badge_class = "badge-accent"
            badge_label = "Movimiento"
        elif seccion == "Bajadas":
            badge_class = "badge-secondary"
            badge_label = "Bajada"
        elif seccion == "Varios":
            badge_class = "badge-ghost"
            badge_label = "Varios"

        badge_cat = f'<span class="badge {badge_class} font-semibold text-xs">{escape(badge_label)}</span>'
        oasis_badge = f'<span class="badge badge-success font-bold text-xs">{escape(c["codigo_oasis"])}</span>' if c.get("codigo_oasis") else ''
        subtitulo_html = f'<p class="text-xs sm:text-sm text-base-content/60 font-medium mt-0.5">{escape(c["subtitulo"])}</p>' if c.get("subtitulo") else ''

        # Acordes al inicio de la canción
        unique_chords = c.get("acordes", [])
        chords_badges_html = ""
        if unique_chords:
            badges_items = "".join(
                f'<button class="badge badge-sm badge-outline font-bold text-[#285628] hover:badge-primary transition-all cursor-pointer chord-top-btn" data-chord="{escape(ch)}" onclick="showSingleChordModal(\'{escape(ch)}\')">{escape(ch)}</button>'
                for ch in unique_chords
            )
            chords_badges_html = f'''
            <div class="flex flex-wrap items-center gap-1.5 mt-3 pt-1">
              <span class="text-xs font-semibold text-base-content/60 mr-1">Acordes:</span>
              {badges_items}
            </div>
            '''

        chords_json_attr = escape(json.dumps(unique_chords))

        canciones_html.append(f'''
        <article class="card bg-base-100 shadow-sm border border-base-200 p-5 sm:p-6 rounded-2xl cancion" data-id="{c['id']}" data-sec="{escape(seccion)}" data-cat="{escape(categoria)}" data-tit="{escape(c['titulo'].lower())}" data-oasis="{escape((c.get('codigo_oasis') or '').lower())}" data-chords="{chords_json_attr}">
          <div class="flex flex-wrap items-start justify-between gap-3 border-b border-base-200/80 pb-3">
            <div>
              <h2 class="text-xl sm:text-2xl font-bold text-base-content tracking-tight">{escape(c['titulo'])}</h2>
              {subtitulo_html}
            </div>
            <div class="flex flex-wrap items-center gap-1.5">
              {badge_cat}
              {oasis_badge}
            </div>
          </div>

          {chords_badges_html}

          <div class="flex flex-wrap items-center justify-between gap-2 my-3 p-2 bg-base-200/50 rounded-xl">
            <div class="flex items-center gap-1">
              <span class="text-xs font-semibold text-base-content/60 mr-1">Tono:</span>
              <button class="btn btn-xs btn-outline rounded-sm" onclick="transposeSong({c['id']}, -1)">-1</button>
              <span class="text-xs font-bold w-6 text-center text-primary" id="trans-{c['id']}">0</span>
              <button class="btn btn-xs btn-outline rounded-sm" onclick="transposeSong({c['id']}, 1)">+1</button>
              <button class="btn btn-xs btn-ghost text-xs" onclick="resetTranspose({c['id']})">Reset</button>
            </div>

            <div class="flex items-center gap-2">
              <button class="btn btn-xs btn-ghost text-primary gap-1 font-semibold" onclick="openSongChordsModal({c['id']})">
                🎸 Diagramas
              </button>
              <button class="btn btn-xs btn-primary gap-1 font-semibold" onclick="openLiveScrollModal({c['id']})">
                ▶ En vivo / Scroll
              </button>
            </div>
          </div>

          <div class="cuerpo-cancion font-['DM_Sans',sans-serif] text-[15px] sm:text-[16px]">
            {"".join(lineas_html)}
          </div>
        </article>
        ''')

    subchips_liturgia = "".join(
        f'<button class="badge badge-sm cursor-pointer badge-ghost chip-sub" data-subcat="{escape(cat)}">{escape(cat)}</button>'
        for cat in LITURGICAS
    )

    html_content = f'''<!DOCTYPE html>
<html lang="es" data-theme="emerald">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Cancionero MJP ({total} canciones) — DaisyUI 5 & PWA</title>
  <link rel="icon" type="image/svg+xml" href="/icon.svg" />
  <link rel="manifest" href="/manifest.json" />
  <meta name="theme-color" content="#285628" />

  <!-- Google Font: DM Sans -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,600;0,9..40,700;1,9..40,400&display=swap" rel="stylesheet">

  <!-- DaisyUI 5 & Tailwind CSS Browser CDN -->
  <link href="https://cdn.jsdelivr.net/npm/daisyui@5" rel="stylesheet" type="text/css" />
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
  <style>
    body {{
      font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
    }}
    .no-scrollbar::-webkit-scrollbar {{ display: none; }}
    .no-scrollbar {{ -ms-overflow-style: none; scrollbar-width: none; }}
  </style>
</head>
<body class="min-h-screen bg-base-200/40 text-base-content pb-20">
  <header class="bg-base-100 border-b border-base-200 sticky top-0 z-30 shadow-xs">
    <div class="max-w-4xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-primary">Cancionero MJP</h1>
          <p class="text-xs text-base-content/60 hidden sm:block">
            {total} canciones · {total_acordes} acordes · PWA Offline
          </p>
        </div>
      </div>

      <div class="w-full sm:w-80">
        <input
          type="text"
          id="buscador"
          class="input input-sm sm:input-md input-bordered w-full rounded-xl bg-base-200/50 focus:bg-base-100"
          placeholder="Buscar por título, letra, código O.xxx..."
        />
      </div>
    </div>

    <!-- Pestañas de Secciones -->
    <div class="max-w-4xl mx-auto px-4 pb-2.5 pt-1 overflow-x-auto no-scrollbar">
      <div class="flex gap-1.5 min-w-max" id="tabs-secciones">
        <button class="btn btn-xs sm:btn-sm rounded-lg btn-primary tab-sec" data-sec="Todas">Todas ({conteos['Todas']})</button>
        <button class="btn btn-xs sm:btn-sm rounded-lg btn-ghost tab-sec" data-sec="Cantos Litúrgicos">Cantos Litúrgicos ({conteos['Cantos Litúrgicos']})</button>
        <button class="btn btn-xs sm:btn-sm rounded-lg btn-ghost tab-sec" data-sec="Varios">Varios ({conteos['Varios']})</button>
        <button class="btn btn-xs sm:btn-sm rounded-lg btn-ghost tab-sec" data-sec="Movimiento">Movimiento ({conteos['Movimiento']})</button>
        <button class="btn btn-xs sm:btn-sm rounded-lg btn-ghost tab-sec" data-sec="Bajadas">Bajadas ({conteos['Bajadas']})</button>
      </div>

      <!-- Subfiltros Litúrgicos -->
      <div class="flex flex-wrap gap-1 mt-2 pt-2 border-t border-base-200 hidden" id="subliturgia-container">
        <button class="badge badge-sm cursor-pointer badge-primary chip-sub" data-subcat="Todas">Todas las litúrgicas</button>
        {subchips_liturgia}
      </div>

      <!-- Nota de Bajadas -->
      <div class="text-xs text-secondary font-semibold mt-2 pt-1 border-t border-base-200 hidden" id="bajadas-nota">
        Bajadas: agrupadas por año, próximamente a definir
      </div>
    </div>
  </header>

  <main class="max-w-4xl mx-auto px-4 mt-6 flex flex-col gap-5" id="canciones-grid">
    {"".join(canciones_html)}
  </main>

  <!-- Modal de Diagramas de Acordes -->
  <dialog id="chord_modal" class="modal">
    <div class="modal-box max-w-2xl bg-base-100 p-6 rounded-2xl shadow-2xl">
      <div class="flex justify-between items-center mb-4 border-b border-base-200 pb-3">
        <div>
          <h3 class="font-bold text-lg text-base-content">Acordes de guitarra</h3>
          <p class="text-xs text-base-content/70 mt-0.5" id="chord_modal_title">Diagramas</p>
        </div>
        <form method="dialog">
          <button class="btn btn-sm btn-circle btn-ghost">✕</button>
        </form>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[65vh] overflow-y-auto p-1" id="chord_modal_grid">
      </div>
      <div class="modal-action mt-5 pt-3 border-t border-base-200">
        <form method="dialog">
          <button class="btn btn-primary btn-sm px-6">Entendido</button>
        </form>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button>Cerrar</button>
    </form>
  </dialog>

  <!-- Modal de Modo En Vivo y Auto-Scroll -->
  <div id="live_scroll_modal" class="fixed inset-0 z-50 bg-base-100 flex flex-col overflow-hidden select-none hidden">
    <div class="navbar bg-base-100 border-b border-base-200 px-4 py-2 flex justify-between shadow-xs">
      <div>
        <h2 class="text-xl font-bold tracking-tight text-base-content" id="live_title">Título</h2>
        <span class="text-xs text-base-content/60 font-medium" id="live_sub"></span>
      </div>
      <div class="flex items-center gap-2">
        <button onclick="closeLiveScroll()" class="btn btn-sm btn-circle btn-ghost">✕</button>
      </div>
    </div>

    <div id="live_scroll_body" class="flex-1 overflow-y-auto px-6 py-10 max-w-3xl mx-auto w-full text-[20px]">
    </div>

    <!-- Dock inferior con controles de Play, Velocidad y Tono -->
    <div class="bg-base-200/90 backdrop-blur-md border-t border-base-300 px-4 py-2.5 flex items-center justify-between gap-3 shadow-lg">
      <div class="flex items-center gap-2">
        <button id="live_play_btn" onclick="toggleLivePlay()" class="btn btn-sm btn-circle btn-primary">▶</button>
        <div class="flex items-center gap-2 bg-base-100 px-3 py-1 rounded-full border border-base-300">
          <span class="text-xs font-semibold text-base-content/70">Vel:</span>
          <input type="range" min="1" max="10" value="3" id="live_speed_slider" class="range range-xs range-primary w-24 sm:w-32" oninput="updateLiveSpeed(this.value)" />
          <span class="text-xs font-bold w-4 text-center" id="live_speed_label">3x</span>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button onclick="adjustLiveFontSize(-2)" class="btn btn-xs btn-outline">A-</button>
        <button onclick="adjustLiveFontSize(2)" class="btn btn-xs btn-outline">A+</button>
      </div>
    </div>
  </div>

  <script>
    // Diccionario de acordes de guitarra para SVG
    const GUITAR_CHORDS = {{
      'DO': {{ frets: [-1, 3, 2, 0, 1, 0], baseFret: 1 }},
      'DO7': {{ frets: [-1, 3, 2, 3, 1, 0], baseFret: 1 }},
      'DOmaj7': {{ frets: [-1, 3, 2, 0, 0, 0], baseFret: 1 }},
      'DOm': {{ frets: [-1, 3, 5, 5, 4, 3], baseFret: 3, barre: 3 }},
      'DO#': {{ frets: [-1, 4, 6, 6, 6, 4], baseFret: 4, barre: 4 }},
      'DO#m': {{ frets: [-1, 4, 6, 6, 5, 4], baseFret: 4, barre: 4 }},
      'RE': {{ frets: [-1, -1, 0, 2, 3, 2], baseFret: 1 }},
      'RE7': {{ frets: [-1, -1, 0, 2, 1, 2], baseFret: 1 }},
      'REm': {{ frets: [-1, -1, 0, 2, 3, 1], baseFret: 1 }},
      'REm7': {{ frets: [-1, -1, 0, 2, 1, 1], baseFret: 1 }},
      'RE4': {{ frets: [-1, -1, 0, 2, 3, 3], baseFret: 1 }},
      'MI': {{ frets: [0, 2, 2, 1, 0, 0], baseFret: 1 }},
      'MI7': {{ frets: [0, 2, 0, 1, 0, 0], baseFret: 1 }},
      'MIm': {{ frets: [0, 2, 2, 0, 0, 0], baseFret: 1 }},
      'MIm7': {{ frets: [0, 2, 0, 0, 0, 0], baseFret: 1 }},
      'FA': {{ frets: [1, 3, 3, 2, 1, 1], baseFret: 1, barre: 1 }},
      'FA#': {{ frets: [2, 4, 4, 3, 2, 2], baseFret: 2, barre: 2 }},
      'FA#m': {{ frets: [2, 4, 4, 2, 2, 2], baseFret: 2, barre: 2 }},
      'FAm': {{ frets: [1, 3, 3, 1, 1, 1], baseFret: 1, barre: 1 }},
      'SOL': {{ frets: [3, 2, 0, 0, 0, 3], baseFret: 1 }},
      'SOL7': {{ frets: [3, 2, 0, 0, 0, 1], baseFret: 1 }},
      'SOLm': {{ frets: [3, 5, 5, 3, 3, 3], baseFret: 3, barre: 3 }},
      'SOL#m': {{ frets: [4, 6, 6, 4, 4, 4], baseFret: 4, barre: 4 }},
      'LA': {{ frets: [-1, 0, 2, 2, 2, 0], baseFret: 1 }},
      'LA7': {{ frets: [-1, 0, 2, 0, 2, 0], baseFret: 1 }},
      'LAm': {{ frets: [-1, 0, 2, 2, 1, 0], baseFret: 1 }},
      'LAm7': {{ frets: [-1, 0, 2, 0, 1, 0], baseFret: 1 }},
      'LAmaj7': {{ frets: [-1, 0, 2, 1, 2, 0], baseFret: 1 }},
      'SI': {{ frets: [-1, 2, 4, 4, 4, 2], baseFret: 2, barre: 2 }},
      'SI7': {{ frets: [-1, 2, 1, 2, 0, 2], baseFret: 1 }},
      'SIm': {{ frets: [-1, 2, 4, 4, 3, 2], baseFret: 2, barre: 2 }},
      'SIb': {{ frets: [-1, 1, 3, 3, 3, 1], baseFret: 1, barre: 1 }}
    }};

    function renderChordSVG(name) {{
      const d = GUITAR_CHORDS[name];
      if (!d) return `<div class="p-2 bg-base-200 rounded-lg text-xs text-center"><span class="font-bold">${{name}}</span><br/>Sin diagrama</div>`;
      const frets = d.frets;
      const base = d.baseFret || 1;
      const w = 110, h = 135;
      const mx = 20, my = 26;
      const ss = (w - mx*2)/5;
      const fs = (h - my*2)/5;

      let topMarkers = frets.map((f, i) => {{
        const x = mx + i * ss;
        if (f === -1) return `<text x="${{x}}" y="${{my - 8}}" text-anchor="middle" font-size="11" font-weight="bold" fill="#ef4444">✕</text>`;
        if (f === 0) return `<circle cx="${{x}}" cy="${{my - 10}}" r="3.5" fill="none" stroke="#22c55e" stroke-width="1.5"/>`;
        return '';
      }}).join('');

      let fretLines = [1,2,3,4,5].map(i => `<line x1="${{mx}}" y1="${{my + i*fs}}" x2="${{mx + ss*5}}" y2="${{my + i*fs}}" stroke="#cbd5e1" stroke-width="1"/>`).join('');
      let stringLines = [0,1,2,3,4,5].map(i => `<line x1="${{mx + i*ss}}" y1="${{my}}" x2="${{mx + i*ss}}" y2="${{my + fs*5}}" stroke="#64748b" stroke-width="${{1 + (5-i)*0.25}}"/>`).join('');

      let dots = frets.map((f, i) => {{
        if (f > 0) {{
          const rel = f - base + 1;
          if (rel >= 1 && rel <= 5) {{
            const x = mx + i * ss;
            const y = my + (rel - 0.5) * fs;
            return `<circle cx="${{x}}" cy="${{y}}" r="5.5" fill="#285628" stroke="#ffffff" stroke-width="1.5"/>`;
          }}
        }}
        return '';
      }}).join('');

      let nut = base === 1
        ? `<line x1="${{mx}}" y1="${{my}}" x2="${{mx + ss*5}}" y2="${{my}}" stroke="#334155" stroke-width="3.5"/>`
        : `<text x="${{mx - 12}}" y="${{my + fs*0.7}}" text-anchor="middle" font-size="10" font-weight="bold" fill="#64748b">${{base}}ª</text>`;

      return `<div class="flex flex-col items-center p-2 bg-base-100 rounded-xl border border-base-200 shadow-xs">
        <span class="font-bold text-xs text-primary mb-1">${{name}}</span>
        <svg width="${{w}}" height="${{h}}">${{topMarkers}}${{nut}}${{fretLines}}${{stringLines}}${{dots}}</svg>
      </div>`;
    }}

    function showSingleChordModal(chord) {{
      document.getElementById('chord_modal_title').textContent = chord;
      document.getElementById('chord_modal_grid').innerHTML = renderChordSVG(chord);
      document.getElementById('chord_modal').showModal();
    }}

    function openSongChordsModal(id) {{
      const card = document.querySelector(`.cancion[data-id="${{id}}"]`);
      const tit = card.querySelector('h2').textContent;
      const chords = JSON.parse(card.getAttribute('data-chords') || '[]');
      document.getElementById('chord_modal_title').textContent = tit;
      document.getElementById('chord_modal_grid').innerHTML = chords.map(c => renderChordSVG(c)).join('');
      document.getElementById('chord_modal').showModal();
    }}

    // Auto-scroll logic
    let livePlaying = false;
    let liveSpeed = 3;
    let liveFontSize = 20;
    let liveAnimId = null;
    let liveLastTime = null;

    function openLiveScrollModal(id) {{
      const card = document.querySelector(`.cancion[data-id="${{id}}"]`);
      const tit = card.querySelector('h2').textContent;
      const sub = card.querySelector('.subtitulo')?.textContent || '';
      const bodyHtml = card.querySelector('.cuerpo-cancion').innerHTML;

      document.getElementById('live_title').textContent = tit;
      document.getElementById('live_sub').textContent = sub;
      const container = document.getElementById('live_scroll_body');
      container.innerHTML = bodyHtml + '<div class="h-96"></div>';
      container.scrollTop = 0;

      livePlaying = false;
      document.getElementById('live_play_btn').textContent = '▶';
      document.getElementById('live_scroll_modal').classList.remove('hidden');
    }}

    function closeLiveScroll() {{
      livePlaying = false;
      if (liveAnimId) cancelAnimationFrame(liveAnimId);
      document.getElementById('live_scroll_modal').classList.add('hidden');
    }}

    function toggleLivePlay() {{
      livePlaying = !livePlaying;
      document.getElementById('live_play_btn').textContent = livePlaying ? '⏸' : '▶';
      if (livePlaying) {{
        liveLastTime = null;
        liveAnimId = requestAnimationFrame(liveScrollLoop);
      }}
    }}

    function updateLiveSpeed(v) {{
      liveSpeed = Number(v);
      document.getElementById('live_speed_label').textContent = v + 'x';
    }}

    function adjustLiveFontSize(delta) {{
      liveFontSize = Math.max(14, Math.min(32, liveFontSize + delta));
      document.getElementById('live_scroll_body').style.fontSize = liveFontSize + 'px';
    }}

    function liveScrollLoop(ts) {{
      if (!livePlaying) return;
      if (!liveLastTime) liveLastTime = ts;
      const delta = (ts - liveLastTime) / 1000;
      liveLastTime = ts;

      const container = document.getElementById('live_scroll_body');
      const pxPerSec = 10 + (liveSpeed - 1) * 10;
      container.scrollTop += pxPerSec * delta;

      if (container.scrollTop + container.clientHeight >= container.scrollHeight - 5) {{
        livePlaying = false;
        document.getElementById('live_play_btn').textContent = '▶';
        return;
      }}
      liveAnimId = requestAnimationFrame(liveScrollLoop);
    }}

    // Transposición
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
      card.querySelectorAll('.inline-chord, .chord-top-btn').forEach(c => {{
        const original = c.getAttribute('data-chord');
        c.textContent = transposeChordGroup(original, next);
      }});
    }}

    function resetTranspose(songId) {{
      transposeState[songId] = 0;
      document.getElementById('trans-' + songId).textContent = '0';
      const card = document.querySelector(`.cancion[data-id="${{songId}}"]`);
      if (!card) return;
      card.querySelectorAll('.inline-chord, .chord-top-btn').forEach(c => {{
        c.textContent = c.getAttribute('data-chord');
      }});
    }}

    // Filtros y pestañas
    const tabs = document.querySelectorAll('.tab-sec');
    const subChips = document.querySelectorAll('.chip-sub');
    const subLiturgiaBox = document.getElementById('subliturgia-container');
    const bajadasNota = document.getElementById('bajadas-nota');
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
        const textContent = card.querySelector('.cuerpo-cancion').textContent.toLowerCase();

        let matchSec = (currentSec === 'Todas') || (cardSec === currentSec);
        if (currentSec === 'Cantos Litúrgicos' && currentSub !== 'Todas') {{
          matchSec = (cardCat === currentSub);
        }}
        const matchSearch = !q || cardTit.includes(q) || cardOasis.includes(q) || textContent.includes(q);
        card.style.display = (matchSec && matchSearch) ? '' : 'none';
      }});
    }}

    tabs.forEach(tab => {{
      tab.addEventListener('click', () => {{
        tabs.forEach(t => {{ t.classList.remove('btn-primary'); t.classList.add('btn-ghost'); }});
        tab.classList.remove('btn-ghost');
        tab.classList.add('btn-primary');
        currentSec = tab.getAttribute('data-sec');

        if (currentSec === 'Cantos Litúrgicos') {{
          subLiturgiaBox.classList.remove('hidden');
        }} else {{
          subLiturgiaBox.classList.add('hidden');
          currentSub = 'Todas';
          subChips.forEach(c => {{ c.classList.remove('badge-primary'); c.classList.add('badge-ghost'); }});
          if (subChips[0]) {{ subChips[0].classList.remove('badge-ghost'); subChips[0].classList.add('badge-primary'); }}
        }}

        if (currentSec === 'Bajadas') {{
          bajadasNota.classList.remove('hidden');
        }} else {{
          bajadasNota.classList.add('hidden');
        }}

        applyFilter();
      }});
    }});

    subChips.forEach(chip => {{
      chip.addEventListener('click', () => {{
        subChips.forEach(c => {{ c.classList.remove('badge-primary'); c.classList.add('badge-ghost'); }});
        chip.classList.remove('badge-ghost');
        chip.classList.add('badge-primary');
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
