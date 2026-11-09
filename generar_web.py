#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Genera cancionero_web.html a partir de cancionero_completo.json.

Mejoras vs versión previa:
- Los acordes se renderizan ARRIBA de la letra (como en el cancionero impreso),
  no inline, para indicar el momento exacto de cada acorde.
- Las "Bajadas" se detectan por codigo_oasis tipo O.308, no solo por el campo
  categoria, para que el filtro las agrupe todas.
HTML estático con datos embargados: abrilo directo en el navegador.
"""

import json
import re
import html
from pathlib import Path

JSON_PATH = Path("cancionero_completo.json")
HTML_PATH = Path("cancionero_web.html")

# ---------------------------------------------------------------------------
# Utilidades de parseo ChordPro -> acordes arriba de la letra
# ---------------------------------------------------------------------------

_CORCHETE = re.compile(r"\[([^\]]+)\]")
_CODIGO_OASIS = re.compile(r"^O\.\d+$")


def parsear_linea_chordpro(linea: str):
    """
    Devuelve (texto_plano, lista_de_tuplas(nombre_acorde, columna_inicio)).
    La columna es el índice dentro de texto_plano donde empieza el acorde,
    para poder posicionarlo visualmente arriba con fuente monoespaciada.
    """
    texto_partes = []
    acordes = []
    pos = 0
    for m in _CORCHETE.finditer(linea):
        antes = linea[pos : m.start()]
        texto_partes.append(antes)
        pos = m.end()
        nombre = m.group(1)
        col = len("".join(texto_partes))
        acordes.append((nombre, col))
    texto_partes.append(linea[pos:])
    return "".join(texto_partes), acordes


def categoria_filtro(cancion: dict) -> str:
    """
    Categoría usada para agrupar/filtrar.
    Si tiene código Oasis tipo O.308 -> 'Bajadas'.
    Si no, usa el campo categoria o 'Sin categoría'.
    """
    codigo = cancion.get("codigo_oasis") or ""
    if _CODIGO_OASIS.match(codigo.strip()):
        return "Bajadas"
    return cancion.get("categoria") or "Sin categoría"


def escape(s: str) -> str:
    return html.escape(str(s), quote=False)


# ---------------------------------------------------------------------------
# Generación de HTML
# ---------------------------------------------------------------------------

CSS = """
* { box-sizing: border-box; }
body {
  font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  background: #f8fafc; color: #1e293b; margin: 0; padding: 1.5rem 1rem;
}
.container { max-width: 900px; margin: 0 auto; }
header { text-align: center; margin-bottom: 1.5rem; }
h1 { font-size: 1.6rem; margin: 0 0 0.25rem; color: #0f172a; }
.sub { color: #64748b; font-size: 0.95rem; }

.buscar {
  width: 100%; max-width: 520px; margin: 0 auto 1.25rem; display: block;
  padding: 0.65rem 1rem; border-radius: 0.6rem; border: 1px solid #cbd5e1;
  font-size: 1rem; background: #fff;
}
.buscar:focus { outline: none; border-color: #2563eb; }

.filtros { display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: center; margin-bottom: 1.25rem; }
.chip {
  padding: 0.35rem 0.9rem; border-radius: 999px; border: 1px solid #cbd5e1;
  background: #fff; cursor: pointer; font-size: 0.85rem; color: #334155;
}
.chip.activo { background: #2563eb; color: #fff; border-color: #2563eb; }

.grid { display: grid; gap: 1rem; }

.cancion {
  background: #fff; border: 1px solid #e2e8f0; border-radius: 0.75rem;
  padding: 1rem 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}
.cancion .titulo {
  font-size: 1.25rem; font-weight: 800; margin: 0 0 0.5rem; color: #0f172a;
  letter-spacing: -0.01em;
}
.meta {
  display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.75rem;
  font-size: 0.8rem;
}
.badge {
  padding: 0.15rem 0.55rem; border-radius: 0.4rem;
  background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe;
}
.badge.sin { background: #f1f5f9; color: #64748b; border-color: #cbd5e1; }
.badge.bajada { background: #fdf4ff; color: #7c3aed; border-color: #e9d5ff; }

/* --- Acorde arriba de la letra --- */
.renglon { position: relative; margin-bottom: 0.35rem; }
.fila-acordes {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.78rem; font-weight: 800; color: #7c3aed;
  position: relative; height: 1.15em;
}
.fila-acordes .acorde {
  position: absolute;
  left: var(--col, 0)ch;
  white-space: nowrap;
}
.fila-letra {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 1rem; color: #334155; white-space: pre-wrap;
  line-height: 1.5; margin-top: -0.1em;
}

.vacío { text-align: center; color: #64748b; padding: 2.5rem; }

@media (max-width: 600px) {
  body { padding: 1rem 0.5rem; }
  h1 { font-size: 1.3rem; }
  .fila-acordes { font-size: 0.7rem; }
  .fila-letra { font-size: 0.9rem; }
}
"""


def _render_linea(linea: str) -> str:
    """Renderiza una línea de letra_chordpro con acordes arriba de la palabra."""
    texto_plano, acordes = parsear_linea_chordpro(linea)
    acorde_spans = ""
    for nombre, col in acordes:
        acorde_spans += (
            f'<span class="acorde" style="--col: {col}; left: {col}ch;">{escape(nombre)}</span>'
        )
    return (
        '<div class="renglon">'
        f'<div class="fila-acordes">{acorde_spans}</div>'
        f'<div class="fila-letra">{escape(texto_plano)}</div>'
        "</div>"
    )


def _tarjeta(c: dict) -> str:
    cat_filtro = categoria_filtro(c)
    es_bajada = cat_filtro == "Bajadas"
    badge_cat = (
        f'<span class="badge {"bajada" if es_bajada else "sin" if not c.get("categoria") else ""}">'
        f"{escape(cat_filtro)}</span>"
    )
    codigo = c.get("codigo_oasis") or "—"
    badge_cod = f'<span class="badge {"sin" if not c.get("codigo_oasis") else ""}">{escape(codigo)}</span>'
    pagina = c.get("pagina_origen")
    badge_pag = f'<span class="badge">pág. {pagina}</span>' if pagina else ""

    lineas_html = ""
    for ln in c.get("letra_chordpro", []):
        lineas_html += _render_linea(ln)
    if not lineas_html:
        lineas_html = '<div class="fila-letra" style="color:#94a3b8">(sin letra)</div>'

    return (
        '<div class="cancion" data-cat="'
        + escape(cat_filtro)
        + '" data-tit="'
        + escape(c.get("titulo", ""))
        + '">'
        f'<h2 class="titulo">{escape(c.get("titulo",""))}</h2>'
        f'<div class="meta">{badge_cat} {badge_cod} {badge_pag}</div>'
        + lineas_html +
        "</div>"
    )


def generar_html(datos: dict) -> str:
    canciones = datos.get("canciones", [])
    total = datos.get("total_canciones", len(canciones))

    # Categorías únicas para filtros, ordenadas
    cats = sorted({categoria_filtro(c) for c in canciones})
    # Poner 'Todas' primero y 'Bajadas' cerca del inicio si existe
    orden_preferido = ["Todas", "Bajadas"]
    cats_ordenadas = [c for c in orden_preferido if c in cats] + [c for c in cats if c not in orden_preferido]

    chips = ""
    for cat in cats_ordenadas:
        activo = 'activo' if cat == "Todas" else ""
        chips += f'<button class="chip {activo}" data-cat="{escape(cat)}">{escape(cat)}</button>'

    tarjetas = "\n".join(_tarjeta(c) for c in canciones) if canciones else '<div class="vacío">No hay canciones.</div>'

    js = """
    const chips = document.querySelectorAll('.chip');
    const cards = document.querySelectorAll('.cancion');
    const buscar = document.getElementById('buscar');

    function filtrar() {
      const el = document.querySelector('.chip.activo');
      const cat = el ? el.dataset.cat : 'Todas';
      const q = buscar.value.toLowerCase();
      cards.forEach(card => {
        const matchCat = cat === 'Todas' || card.dataset.cat === cat;
        const matchTxt = card.dataset.tit.toLowerCase().includes(q);
        card.style.display = (matchCat && matchTxt) ? '' : 'none';
      });
    }
    chips.forEach(chip => chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('activo'));
      chip.classList.add('activo');
      filtrar();
    }));
    buscar.addEventListener('input', filtrar);
    """

    return f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Cancionero MJP ({total} canciones)</title>
<style>{CSS}</style>
</head>
<body>
<div class="container">
  <header>
    <h1>Cancionero MJP</h1>
    <p class="sub">{total} canciones · páginas 10 a 195 · ChordPro con acordes sobre la letra</p>
  </header>

  <input type="text" id="buscar" class="buscar" placeholder="Buscar canción…">

  <div class="filtros">{chips}</div>

  <div class="grid">{tarjetas}</div>
</div>
<script>{js}</script>
</body>
</html>"""


def main():
    if not JSON_PATH.exists():
        print(f"ERROR: no se encuentra {JSON_PATH.resolve()}")
        return

    datos = json.loads(JSON_PATH.read_text(encoding="utf-8"))
    html_doc = generar_html(datos)
    HTML_PATH.write_text(html_doc, encoding="utf-8")
    print(f"HTML generado: {HTML_PATH.resolve()} ({len(html_doc)//1024} KB, {len(canciones if False else datos.get('canciones',[]))} canciones)")


if __name__ == "__main__":
    main()
