#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Extrae el layout detallado por página del PDF para posicionar acordes con precisión.

Para cada página 10..195 guarda en cancionero_temp/layout/ un JSON con los elementos
de texto (tipo 'acorde' o 'letra'), su texto y sus coordenadas X0/X1/Y0/Y1 en puntos
del PDF. Así el generador web puede colocar cada acorde exactamente sobre su sílaba.
"""

import fitz
import json
import re
from pathlib import Path

PDF = "CANCIONERO MJP - final imprimir.pdf"
OUT = Path("cancionero_temp/layout")
OUT.mkdir(parents=True, exist_ok=True)

# Nombres de acordes válidos para detectar una línea de acordes.
# Soporta notación inglesa (A-G) e hispana (DO, RE, MI, FA, SOL, LA, SI).
_ACORDE_RE = re.compile(
    r"^(DO|RE|MI|FA|SOL|LA|SI|[A-G])(#|b)?(m|M|dim|aug|sus|7|maj|min|add|6|9|11|13)?(\d)?$"
)


def es_linea_de_acordes(spans):
    """Devuelve True si la línea parece ser solo acordes (spans cortos y mayúsculas)."""
    partes = []
    for sp in spans:
        t = "".join(ch.get("c", "") for ch in sp.get("chars", [])).strip()
        if t:
            partes.append(t)
    if not partes:
        return False
    return all(_ACORDE_RE.match(p) for p in partes)


def main():
    doc = fitz.open(PDF)
    total_paginas = doc.page_count
    print(f"Extrayendo layout de páginas 10 a {total_paginas}...")

    for i in range(9, total_paginas):  # índice 0-based, desde página 10
        num = i + 1
        page = doc[i]
        d = page.get_text("rawdict")
        elementos = []

        for bloque in d.get("blocks", []):
            if bloque.get("type", 0) != 0:
                continue
            for linea in bloque.get("lines", []):
                spans = linea.get("spans", [])
                if not spans:
                    continue

                es_acorde = es_linea_de_acordes(spans)

                for sp in spans:
                    texto = "".join(ch.get("c", "") for ch in sp.get("chars", []))
                    if not texto.strip():
                        continue
                    elementos.append({
                        "texto": texto,
                        "tipo": "acorde" if es_acorde else "letra",
                        "x0": round(sp["bbox"][0], 2),
                        "x1": round(sp["bbox"][2], 2),
                        "y0": round(sp["bbox"][1], 2),
                        "y1": round(sp["bbox"][3], 2),
                    })

        # Ordenar de arriba a abajo, izquierda a derecha.
        elementos.sort(key=lambda e: (e["y0"], e["x0"]))

        salida = OUT / f"layout_{num:03d}.json"
        salida.write_text(json.dumps(elementos, ensure_ascii=False), encoding="utf-8")
        print(f"  Página {num}: {len(elementos)} elementos")

    doc.close()
    print("\nListo. Layouts en:", OUT.resolve())


if __name__ == "__main__":
    main()
