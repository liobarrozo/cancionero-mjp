#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Genera cancionero_web_precise.html usando coordenadas X REALES del PDF para posicionar
cada acorde exactamente sobre la sílaba donde debe tocarse.

Lee:
- cancionero_completo.json  (metadata: título, categoría, código, página de origen)
- cancionero_temp/layout/*.json  (coordenadas x0/x1/y0/y1 reales de cada span del PDF)

Cada canción se renderiza usando el layout de su página de origen. Los acordes y la
letra se colocan con position: absolute y left: Xpx respecto al inicio de su columna,
por lo que la ubicación visual coincide con el PDF impreso.
"""

import json
import html
import re
from pathlib import Path

JSON_PATH = Path("cancionero_completo.json")
LAYOUT_DIR = Path("cancionero_temp/layout")
HTML_PATH = Path("cancionero_web_precise.html")

# Ancho medio de columna del PDF en puntos (para fallback si no hay layout).
ANCHO_COLUMNA_PT = 250


def escape(s: str) -> str:
    return html.escape(str(s), quote=False)


def cargar_layout(pagina: int) -> list:
    ruta = LAYOUT_DIR / f"layout_{pagina:03d}.json"
    if not ruta.exists():
        return []
    return json.loads(ruta.read_text(encoding="utf-8"))


def agrupar_por_linea(elementos: list) -> list:
    """Agrupa elementos en líneas basándose en la coordenada y0 (umbral 4 pt)."""
    if not elementos:
        return []
    lineas = []
    actual = [elementos[0]]
    for el in elementos[1:]:
        if abs(el["y0"] - actual[-1]["y0"]) <= 4:
            actual.append(el)
        else:
            lineas.append(actual)
            actual = [el]
    lineas.append(actual)
    for linea in lineas:
        linea.sort(key=lambda e: e["x0"])
    return lineas


def es_titulo(texto: str) -> bool:
    """Detecta si un span de letra es probable título de canción."""
    t = texto.strip()
    if len(t) < 3:
        return False
    # Todo mayúsculas y no empieza con acorde conocido.
    return t.isupper() and not re.match(r"^[A-G](#|b)?", t)


def extraer_elementos_cancion(layout: list, titulo: str) -> list:
    """Desde el layout de una página, extrae los elementos de una canción empezando por su título."""
    titulo_up = titulo.strip().upper()
    idx = None
    for i, el in enumerate(layout):
        if el["tipo"] == "letra" and el["texto"].strip().upper() == titulo_up:
            idx = i
            break
    if idx is None:
        return []

    elementos = []
    for el in layout[idx:]:
        # Parar si encontramos otro título (letra mayúscula corta que no es el actual)
        if (
            el is not layout[idx]
            and el["tipo"] == "letra"
            and es_titulo(el["texto"])
        ):
            break
        elementos.append(el)
    return elementos


def categoria_filtro(cancion: dict) -> str:
    codigo = cancion.get("codigo_oasis") or ""
    if re.match(r"^O\.\d+$", codigo.strip()):
        return "Bajadas"
    return cancion.get("categoria") or "Sin categoría"


def generar_html(datos: dict) -> str:
    canciones = datos.get("canciones", [])
    total = datos.get("total_canciones", len(canciones))

    cats = sorted({categoria_filtro(c) for c in canciones})
    orden_preferido = ["Todas", "Bajadas"]
    cats_ordenadas = [c for c in orden_preferido if c in cats] + [c for c in cats if c not in orden_preferido]

    chips = ""
    for cat in cats_ordenadas:
        activo = 'activo' if cat == "Todas" else ""
        chips += f'<button class="chip {activo}" data-cat="{escape(cat)}">{escape(cat)}</button>'

    bloques = []
    canciones_renderizadas = 0

    for c in canciones:
        pagina = c.get("pagina_origen")
        if not pagina:
            continue

        layout = cargar_layout(pagina)
        if not layout:
            continue

        elementos = extraer_elementos_cancion(layout, c.get("titulo", ""))
        if not elementos:
            continue

        canciones_renderizadas += 1

        # Definir columna por el x0 del primer elemento (mitad de página ≈ 297 pt).
        x_inicio = min(e["x0"] for e in elementos)
        x_max = max(e["x1"] for e in elementos)
        ancho = x_max - x_inicio + 20  # margen derecho

        lineas = agrupar_por_linea(elementos)
        lineas_html = []

        for linea in lineas:
            acordes_html = ""
            letras_html = ""
            max_x = 0

            for el in linea:
                x_rel = round(el["x0"] - x_inicio, 1)
                if el["tipo"] == "acorde":
                    acordes_html += (
                        f'<span class="acorde" style="left:{x_rel}px;">'
                        f"{escape(el['texto'])}</span>"
                    )
                else:
                    letras_html += (
                        f'<span class="letra" style="left:{x_rel}px;">'
                        f"{escape(el['texto'])}</span>"
                    )
                max_x = max(max_x, round(el["x1"] - x_inicio, 1))

            lineas_html.append(
                f'<div class="renglon" style="width:{max_x + 5}px;">'
                f'<div class="fila-acordes">{acordes_html}</div>'
                f'<div class="fila-letra">{letras_html}</div>'
                f"</div>"
            )

        cat = categoria_filtro(c)
        es_bajada = cat == "Bajadas"
        badge_cat = (
            f'<span class="badge {"bajada" if es_bajada else ""}">{escape(cat)}</span>'
        )
        codigo = c.get("codigo_oasis") or "—"
        badge_cod = f'<span class="badge">{escape(codigo)}</span>'
        badge_pag = f'<span class="badge">pág. {pagina}</span>'

        bloques.append(
            f'<div class="cancion" data-cat="{escape(cat)}" data-tit="{escape(c.get("titulo",""))}">'
            f'<h2 class="titulo">{escape(c.get("titulo",""))}</h2>'
            f'<div class="meta">{badge_cat} {badge_cod} {badge_pag}</div>'
            f'<div class="letra-container">{"".join(lineas_html)}</div>'
            f"</div>"
        )

    grid = "".join(bloques) if bloques else '<div class="vacio">No se encontraron canciones con layout.</div>'

    css = """
* { box-sizing: border-box; }
body {
  font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  background: #f8fafc; color: #1e293b; margin: 0; padding: 1.5rem 1rem;
}
.container { max-width: 950px; margin: 0 auto; }
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
}
.meta {
  display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.75rem;
  font-size: 0.8rem;
}
.badge {
  padding: 0.15rem 0.55rem; border-radius: 0.4rem;
  background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe;
}
.badge.bajada { background: #fdf4ff; color: #7c3aed; border-color: #e9d5ff; }

/* --- Acorde exactamente arriba de la sílaba (coordenadas reales del PDF) --- */
.letra-container { position: relative; }
.renglon { position: relative; margin-bottom: 0.3rem; width: fit-content; }
.fila-acordes {
  position: relative;
  height: 1.1em;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.8rem; font-weight: 800; color: #7c3aed;
}
.fila-acordes .acorde {
  position: absolute;
  left: var(--x, 0)px;
  white-space: nowrap;
  top: 0;
}
.fila-letra {
  position: relative;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 1rem; color: #334155; line-height: 1.45;
}
.fila-letra .letra {
  position: absolute;
  left: var(--x, 0)px;
  top: 0;
  white-space: pre-wrap;
}

.vacio { text-align: center; color: #64748b; padding: 2.5rem; }

@media (max-width: 600px) {
  body { padding: 1rem 0.5rem; }
  h1 { font-size: 1.3rem; }
}
"""

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
<title>Cancionero MJP ({total} canciones) - Acordes precisos</title>
<style>{css}</style>
</head>
<body>
<div class="container">
  <header>
    <h1>Cancionero MJP</h1>
    <p class="sub">{total} canciones · acordes posicionados con coordenadas reales del PDF</p>
  </header>

  <input type="text" id="buscar" class="buscar" placeholder="Buscar canción…">

  <div class="filtros">{chips}</div>

  <div class="grid">{grid}</div>
</div>
<script>{js}</script>
</body>
</html>"""


def main():
    if not JSON_PATH.exists():
        print(f"ERROR: no se encuentra {JSON_PATH.resolve()}")
        return

    if not LAYOUT_DIR.exists():
        print(f"ERROR: no se encuentra {LAYOUT_DIR.resolve()}. Ejecutá primero extraer_layout_pdf.py")
        return

    datos = json.loads(JSON_PATH.read_text(encoding="utf-8"))
    html_doc = generar_html(datos)
    HTML_PATH.write_text(html_doc, encoding="utf-8")

    n = len(datos.get("canciones", []))
    print(f"HTML generado: {HTML_PATH.resolve()} ({len(html_doc)//1024} KB, {n} canciones)")


if __name__ == "__main__":
    main()
