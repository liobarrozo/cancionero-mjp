#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Genera:
1. cancionero_vite.json  -> formato optimizado para web app con Vite (React/Vue)
2. cancionero_web_precise.html -> HTML estático para verificar el posicionamiento

Lee cancionero_completo.json (metadata de canciones) y los layouts por página
cancionero_temp/layout/layout_NNN.json (coordenadas reales x0/x1/y0/y1 del PDF).

Cada acorde se posiciona con position: absolute y left: Xpx respecto al inicio
de su columna, para que quede exactamente sobre la sílaba donde debe tocarse.
"""

import json
import html as html_mod
import re
from pathlib import Path

JSON_PATH = Path("cancionero_completo.json")
LAYOUT_DIR = Path("cancionero_temp/layout")
VITE_JSON_PATH = Path("cancionero_vite.json")
HTML_PATH = Path("cancionero_web_precise.html")

MITAD_PAGINA_PT = 297.0  # ancho 595 / 2


def escape(s: str) -> str:
    return html_mod.escape(str(s), quote=False)


def limpiar_texto(t: str) -> str:
    """Elimina espacios/tabulaciones sobrantes del texto extraído del PDF."""
    return t.strip()


def es_titulo_probable(texto: str) -> bool:
    t = texto.strip()
    if len(t) < 3 or len(t) > 60:
        return False
    return t.isupper()


def cargar_layout(pagina: int) -> list:
    ruta = LAYOUT_DIR / f"layout_{pagina:03d}.json"
    if not ruta.exists():
        return []
    return json.loads(ruta.read_text(encoding="utf-8"))


def separar_columnas(elementos: list) -> tuple:
    """Separa elementos en columna izquierda y derecha por mitad de página."""
    izq = [e for e in elementos if e["x0"] < MITAD_PAGINA_PT]
    der = [e for e in elementos if e["x0"] >= MITAD_PAGINA_PT]
    return izq, der


def agrupar_lineas(elementos: list) -> list:
    """Agrupa elementos en líneas por coordenada y0 (umbral 5 pt)."""
    if not elementos:
        return []
    elementos = sorted(elementos, key=lambda e: (e["y0"], e["x0"]))
    lineas = []
    actual = [elementos[0]]
    for el in elementos[1:]:
        if abs(el["y0"] - actual[-1]["y0"]) <= 5:
            actual.append(el)
        else:
            lineas.append(actual)
            actual = [el]
    lineas.append(actual)
    for linea in lineas:
        linea.sort(key=lambda e: e["x0"])
    return lineas


def normalizar_texto(t: str) -> str:
    """Normaliza texto para comparación: mayúsculas, sin tildes, espacios simples."""
    import unicodedata
    t = t.strip().upper()
    t = ''.join(c for c in unicodedata.normalize('NFD', t) if unicodedata.category(c) != 'Mn')
    t = re.sub(r'\s+', ' ', t)
    return t


def encontrar_indice_titulo(elementos: list, titulo: str, inicio: int = 0) -> int:
    """
    Busca el índice de un elemento letra que coincida con el título.
    Usa normalización y matching por contenencia (título del JSON puede ser
    prefijo del texto del PDF, ej. 'GLORIA' vs 'GLORIA misa criolla').
    """
    titulo_norm = normalizar_texto(titulo)
    if not titulo_norm:
        return -1
    for i in range(inicio, len(elementos)):
        el = elementos[i]
        if el["tipo"] != "letra":
            continue
        texto_norm = normalizar_texto(limpiar_texto(el["texto"]))
        if not texto_norm:
            continue
        # Matching exacto o por contenencia en ambas direcciones
        if texto_norm == titulo_norm or titulo_norm in texto_norm or texto_norm in titulo_norm:
            return i
    return -1


def extraer_lineas_cancion(elementos_columna: list, indice_inicio: int) -> list:
    """
    Desde el índice del título, agrupa los elementos de la canción en líneas.
    Se detiene al encontrar otro título probable en la misma columna.
    """
    lineas_raw = []
    actual_linea = [elementos_columna[indice_inicio]]
    i = indice_inicio + 1
    while i < len(elementos_columna):
        el = elementos_columna[i]
        # Si es otro título probable, termina la canción
        if (
            el is not elementos_columna[indice_inicio]
            and el["tipo"] == "letra"
            and es_titulo_probable(el["texto"])
        ):
            break
        # Agrupar por línea (misma y0)
        if abs(el["y0"] - actual_linea[-1]["y0"]) <= 5:
            actual_linea.append(el)
        else:
            lineas_raw.append(actual_linea)
            actual_linea = [el]
        i += 1
    lineas_raw.append(actual_linea)

    # Convertir a estructura de acordes/letras con x relativo
    x_inicio = min(e["x0"] for e in elementos_columna[indice_inicio:indice_inicio+1])
    # x_inicio real = x0 del primer elemento de la canción
    x_inicio = elementos_columna[indice_inicio]["x0"]

    lineas = []
    for linea in lineas_raw:
        linea_sorted = sorted(linea, key=lambda e: e["x0"])
        acordes = []
        letras = []
        max_x = 0
        for el in linea_sorted:
            x_rel = round(el["x0"] - x_inicio, 1)
            texto_limpio = limpiar_texto(el["texto"])
            if not texto_limpio:
                continue
            if el["tipo"] == "acorde":
                acordes.append({"x": x_rel, "texto": texto_limpio})
            else:
                letras.append({"x": x_rel, "texto": texto_limpio})
            max_x = max(max_x, round(el["x1"] - x_inicio, 1))
        lineas.append({
            "y": round(linea_sorted[0]["y0"] - elementos_columna[indice_inicio]["y0"], 1),
            "acordes": acordes,
            "letras": letras,
            "ancho": round(max_x + 5, 1),
        })
    return lineas


def categoria_filtro(cancion: dict) -> str:
    codigo = cancion.get("codigo_oasis") or ""
    if re.match(r"^O\.\d+$", codigo.strip()):
        return "Bajadas"
    return cancion.get("categoria") or "Sin categoría"


def procesar():
    if not JSON_PATH.exists():
        raise FileNotFoundError(f"No se encuentra {JSON_PATH}")
    if not LAYOUT_DIR.exists():
        raise FileNotFoundError(f"No se encuentra {LAYOUT_DIR}. Ejecutá extraer_layout_pdf.py")

    datos = json.loads(JSON_PATH.read_text(encoding="utf-8"))
    canciones_json = datos.get("canciones", [])

    # Indexar canciones por página para buscar rápido en el layout
    canciones_por_pagina = {}
    for c in canciones_json:
        p = c.get("pagina_origen")
        if p:
            canciones_por_pagina.setdefault(p, []).append(c)

    canciones_vite = []
    cancion_id = 0

    for pagina in sorted(canciones_por_pagina.keys()):
        layout = cargar_layout(pagina)
        if not layout:
            print(f"  Página {pagina}: sin layout, saltando canciones.")
            continue

        col_izq, col_der = separar_columnas(layout)

        for c in canciones_por_pagina[pagina]:
            cancion_id += 1
            titulo = c.get("titulo", "")
            cat = categoria_filtro(c)

            # Buscar el título en cada columna
            elementos_usados = None
            indice_titulo = -1
            for nombre_col, elementos_col in (("izq", col_izq), ("der", col_der)):
                idx = encontrar_indice_titulo(elementos_col, titulo)
                if idx >= 0:
                    elementos_usados = elementos_col
                    indice_titulo = idx
                    break

            if elementos_usados is None or indice_titulo < 0:
                print(f"  Página {pagina}: título '{titulo}' no encontrado en layout.")
                continue

            lineas = extraer_lineas_cancion(elementos_usados, indice_titulo)

            cancion_vite = {
                "id": cancion_id,
                "titulo": titulo,
                "categoria": c.get("categoria"),
                "categoria_filtro": cat,
                "codigo_oasis": c.get("codigo_oasis"),
                "pagina_origen": pagina,
                "lineas": lineas,
            }
            canciones_vite.append(cancion_vite)

    vite_data = {
        "total_canciones": len(canciones_vite),
        "canciones": canciones_vite,
    }
    VITE_JSON_PATH.write_text(json.dumps(vite_data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n{cancion_id} canciones procesadas con layout.")
    print(f"JSON para Vite guardado en: {VITE_JSON_PATH.resolve()}")

    # Generar HTML estático para verificación
    generar_html(vite_data)
    print(f"HTML de verificación guardado en: {HTML_PATH.resolve()}")


def generar_html(datos: dict) -> None:
    canciones = datos.get("canciones", [])
    total = datos.get("total_canciones", len(canciones))

    cats = sorted({c["categoria_filtro"] for c in canciones})
    orden_preferido = ["Todas", "Bajadas"]
    cats_ordenadas = [c for c in orden_preferido if c in cats] + [c for c in cats if c not in orden_preferido]

    chips = ""
    for cat in cats_ordenadas:
        activo = 'activo' if cat == "Todas" else ""
        chips += f'<button class="chip {activo}" data-cat="{escape(cat)}">{escape(cat)}</button>'

    bloques = []
    for c in canciones:
        lineas_html = []
        for linea in c["lineas"]:
            acordes_html = ""
            for ac in linea["acordes"]:
                acordes_html += (
                    f'<span class="acorde" style="left:{ac["x"]}px;">{escape(ac["texto"])}</span>'
                )
            letras_html = ""
            for lt in linea["letras"]:
                letras_html += (
                    f'<span class="letra" style="left:{lt["x"]}px;">{escape(lt["texto"])}</span>'
                )
            lineas_html.append(
                f'<div class="renglon" style="width:{linea["ancho"]}px;">'
                f'<div class="fila-acordes">{acordes_html}</div>'
                f'<div class="fila-letra">{letras_html}</div>'
                f"</div>"
            )

        es_bajada = c["categoria_filtro"] == "Bajadas"
        badge_cat = f'<span class="badge {"bajada" if es_bajada else ""}">{escape(c["categoria_filtro"])}</span>'
        codigo = c["codigo_oasis"] or "—"
        badge_cod = f'<span class="badge">{escape(codigo)}</span>'
        badge_pag = f'<span class="badge">pág. {c["pagina_origen"]}</span>'

        bloques.append(
            f'<div class="cancion" data-cat="{escape(c["categoria_filtro"])}" data-tit="{escape(c["titulo"])}">'
            f'<h2 class="titulo">{escape(c["titulo"])}</h2>'
            f'<div class="meta">{badge_cat} {badge_cod} {badge_pag}</div>'
            f'<div class="letra-container">{"".join(lineas_html)}</div>'
            f"</div>"
        )

    grid = "".join(bloques) if bloques else '<div class="vacio">No hay canciones.</div>'

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

/* Acorde exactamente encima de la sílaba (coordenadas reales del PDF) */
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
  top: 0;
  white-space: nowrap;
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

    html_doc = f"""<!DOCTYPE html>
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
    HTML_PATH.write_text(html_doc, encoding="utf-8")


if __name__ == "__main__":
    procesar()
