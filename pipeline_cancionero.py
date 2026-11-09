#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Pipeline: PDF cancionero -> JSON estructurado con sintaxis ChordPro.

Pasos:
  1. Extracción geométrica (PyMuPDF): páginas 10..final, dos columnas (mitad en X),
     texto con layout monoespaciado (izquierda, luego derecha).
  2. Procesamiento por LLM (OpenAI o Google GenAI) con reintentos y guardado
     temporal por página para no perder progreso.
  3. Consolidación de todos los JSON en cancionero_completo.json.

Variables de entorno (.env):
  LLM_PROVIDER=openai   # openai | google
  OPENAI_API_KEY=sk-...
  GOOGLE_API_KEY=...    # si se usa google
  LLM_MODEL=gpt-4o-mini # o gemini-1.5-flash
  PDF_INPUT=CANCIONERO MJP - final imprimir.pdf
  PAGINA_INICIO=10
  TEMP_DIR=cancionero_temp
  SALIDA=cancionero_completo.json
"""

from __future__ import annotations

import json
import os
import re
import sys
import time
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import List, Optional, Tuple

import fitz  # PyMuPDF
from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# Configuración
# ---------------------------------------------------------------------------

load_dotenv()

PDF_INPUT = os.getenv("PDF_INPUT", "CANCIONERO MJP - final imprimir.pdf")
PAGINA_INICIO = int(os.getenv("PAGINA_INICIO", "10"))  # 1-indexada
PAGINA_FIN = os.getenv("PAGINA_FIN", "")  # vacía = hasta el final del PDF
TEMP_DIR = Path(os.getenv("TEMP_DIR", "cancionero_temp"))
SALIDA = Path(os.getenv("SALIDA", "cancionero_completo.json"))

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "openai").lower()
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o-mini" if LLM_PROVIDER == "openai" else "gemini-1.5-flash")

MAX_REINTENTOS = 5
ESPERA_BASE = 2.0  # segundos, backoff exponencial

# Ancho promedio de un carácter en puntos (ajuste fino para el monoespaciado).
ANCHO_CARACTER_PT = 5.5


SYSTEM_PROMPT = """Sos un parser musical de alta precisión. Tu tarea es convertir el texto plano extraído de una página en un array de objetos JSON con sintaxis ChordPro, sin perder ni alterar ningún acorde, palabra o indicación.

Reglas:
1. Inserta el acorde entre corchetes [ACORDE] exactamente antes de la sílaba o letra donde comienza en el renglón superior.
2. Si una línea tiene solo acordes (ej. INTRO: SOL - RE), conservala como texto: INTRO: [SOL] - [RE].
3. Conserva indicaciones como [ESTRIBILLO], (x2), CAPO 1, O.308, etc.
4. Si la canción continúa de la columna anterior o página anterior, mantené la coherencia.
5. Ignorá números de página sueltos.

Devolvé ÚNICAMENTE JSON válido con esta estructura:
{
  "canciones": [
    {
      "titulo": "NOMBRE DE LA CANCIÓN",
      "categoria": "Categoría si se infiere (o null)",
      "codigo_oasis": "Código tipo O.308 (o null)",
      "letra_chordpro": [
        "[SOL]Ven hermano y [SIm]cántale a Cristo,",
        "[DO]A ese Cristo [LAm]joven..."
      ]
    }
  ]
}
"""


# ---------------------------------------------------------------------------
# Paso 1 - Extracción geométrica
# ---------------------------------------------------------------------------


@dataclass
class Columna:
    nombre: str  # "izquierda" | "derecha"
    texto: str


def _texto_span(sp: dict) -> str:
    """En rawdict el span no trae 'text' directo; se arma a partir de 'chars'."""
    return "".join(ch.get("c", "") for ch in sp.get("chars", []))


def _reconstruir_linea(spans: List[dict], ancho_char: float = ANCHO_CARACTER_PT) -> str:
    """Construye una línea monoespaciada posicionando cada span según su x0."""
    if not spans:
        return ""
    # Ordenar por x0 para respetar la lectura visual de izquierda a derecha.
    spans = sorted(spans, key=lambda s: s["bbox"][0])
    partes: List[Tuple[int, str]] = []
    max_pos = 0
    for sp in spans:
        texto = _texto_span(sp)
        if not texto:
            continue
        x0 = sp["bbox"][0]
        pos = int(round(x0 / ancho_char))
        if pos < 0:
            pos = 0
        partes.append((pos, texto))
        max_pos = max(max_pos, pos + len(texto))
    if not partes:
        return ""
    buf = [" "] * (max_pos + 1)
    for pos, texto in partes:
        for i, ch in enumerate(texto):
            idx = pos + i
            if 0 <= idx < len(buf):
                # Si hay choque, conservar el carácter no-espacio.
                if buf[idx] == " " or buf[idx] == ch:
                    buf[idx] = ch
    return "".join(buf).rstrip()


def extraer_columnas_pagina(page: fitz.Page, pagina_num: int) -> List[Columna]:
    """Divide la página por la mitad en X y devuelve [izquierda, derecha] con texto monoespaciado."""
    ancho = page.rect.width
    mitad = ancho / 2.0

    # rawdict da bloques > líneas > spans con bbox de cada span.
    d = page.get_text("rawdict")
    columnas: dict[str, List[dict]] = {"izquierda": [], "derecha": []}

    for bloque in d.get("blocks", []):
        if bloque.get("type", 0) != 0:
            continue  # saltar dibujos/imágenes
        for linea in bloque.get("lines", []):
            spans = linea.get("spans", [])
            if not spans:
                continue
            # Centroide x de la línea para decidir columna.
            spans_con_texto = [s for s in spans if _texto_span(s)]
            xs0 = [s["bbox"][0] for s in spans_con_texto]
            xs1 = [s["bbox"][2] for s in spans_con_texto]
            if not xs0:
                continue
            centro_x = (min(xs0) + max(xs1)) / 2.0
            col = "izquierda" if centro_x < mitad else "derecha"
            columnas[col].append(linea)

    resultado: List[Columna] = []
    for nombre in ("izquierda", "derecha"):
        lineas = columnas[nombre]
        # Ordenar por y (y luego x) para leer de arriba a abajo.
        lineas.sort(key=lambda l: (l["bbox"][1], l["bbox"][0]))
        texto_lineas = [_reconstruir_linea(l.get("spans", [])) for l in lineas]
        # Filtrar líneas vacías pero conservar saltos entre bloques de canción.
        texto = "\n".join(t for t in texto_lineas if t.strip())
        resultado.append(Columna(nombre=nombre, texto=texto))

    return resultado


def extraer_texto_pagina(page: fitz.Page, pagina_num: int) -> str:
    """Devuelve el texto de la página: columna izquierda seguida de la derecha."""
    columnas = extraer_columnas_pagina(page, pagina_num)
    partes = []
    for col in columnas:
        if col.texto.strip():
            partes.append(f"=== COLUMNA {col.nombre.upper()} ===\n{col.texto}")
    return "\n\n".join(partes)


# ---------------------------------------------------------------------------
# Paso 2 - Cliente LLM
# ---------------------------------------------------------------------------


class LLMClient:
    """Cliente minimalista para OpenAI o Google GenAI con reintentos."""

    def __init__(self, provider: str, model: str):
        self.provider = provider
        self.model = model
        self._cliente = None
        self._modelo = None
        self._inicializar()

    def _inicializar(self):
        if self.provider == "openai":
            try:
                from openai import OpenAI
            except ImportError as exc:
                raise RuntimeError(
                    "Falta el paquete 'openai'. Instalalo con: pip install openai"
                ) from exc
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                raise RuntimeError("Falta OPENAI_API_KEY en el entorno (.env).")
            self._cliente = OpenAI(api_key=api_key)
        elif self.provider == "google":
            try:
                import google.generativeai as genai
            except ImportError as exc:
                raise RuntimeError(
                    "Falta el paquete 'google-generativeai'. Instalalo con: pip install google-generativeai"
                ) from exc
            api_key = os.getenv("GOOGLE_API_KEY")
            if not api_key:
                raise RuntimeError("Falta GOOGLE_API_KEY en el entorno (.env).")
            genai.configure(api_key=api_key)
            self._modelo = genai.GenerativeModel(self.model)
        else:
            raise ValueError(f"Proveedor LLM no soportado: {self.provider}")

    def _limpiar_json(self, texto: str) -> str:
        """Elimina bloques de markdown ```json ... ``` si los hubiera."""
        texto = texto.strip()
        m = re.search(r"```json\s*(.*?)\s*```", texto, re.DOTALL | re.IGNORECASE)
        if m:
            return m.group(1).strip()
        m = re.search(r"```\s*(.*?)\s*```", texto, re.DOTALL)
        if m:
            return m.group(1).strip()
        return texto

    def parsear_pagina(self, texto_pagina: str, pagina_num: int) -> dict:
        """Envía el texto de una página al LLM y devuelve el JSON parseado."""
        usuario = (
            f"Página {pagina_num} del cancionero.\n\nTexto extraído (dos columnas, izquierda luego derecha):\n"
            f"{texto_pagina}\n\n"
            "Devuelve ÚNICAMENTE el JSON válido, sin texto adicional."
        )

        ultimo_error = None
        for intento in range(1, MAX_REINTENTOS + 1):
            try:
                if self.provider == "openai":
                    resp = self._cliente.chat.completions.create(
                        model=self.model,
                        messages=[
                            {"role": "system", "content": SYSTEM_PROMPT},
                            {"role": "user", "content": usuario},
                        ],
                        temperature=0,
                        response_format={"type": "json_object"},
                    )
                    contenido = resp.choices[0].message.content or ""
                else:  # google
                    resp = self._modelo.generate_content(
                        [SYSTEM_PROMPT, usuario],
                        generation_config={"temperature": 0},
                    )
                    contenido = resp.text or ""

                limpio = self._limpiar_json(contenido)
                datos = json.loads(limpio)
                if "canciones" not in datos:
                    datos = {"canciones": datos.get("canciones", [])}
                return datos

            except Exception as exc:  # noqa: BLE001
                ultimo_error = exc
                if intento < MAX_REINTENTOS:
                    espera = ESPERA_BASE * (2 ** (intento - 1))
                    print(
                        f"  [página {pagina_num}] intento {intento} falló: {exc}. "
                        f"Reintentando en {espera:.0f}s...",
                        file=sys.stderr,
                    )
                    time.sleep(espera)
                else:
                    print(
                        f"  [página {pagina_num}] falló tras {MAX_REINTENTOS} intentos: {ultimo_error}",
                        file=sys.stderr,
                    )
        raise RuntimeError(f"No se pudo parsear la página {pagina_num}: {ultimo_error}")


# ---------------------------------------------------------------------------
# Orquestación por lotes con guardado temporal
# ---------------------------------------------------------------------------


def _ruta_temp(temp_dir: Path, pagina_num: int) -> Path:
    return temp_dir / f"pagina_{pagina_num:03d}.json"


def _guardar_temp(temp_dir: Path, pagina_num: int, texto_extraido: str, datos: Optional[dict], error: Optional[str] = None):
    temp_dir.mkdir(parents=True, exist_ok=True)
    registro = {
        "pagina": pagina_num,
        "texto_extraido": texto_extraido,
        "datos_llm": datos,
        "error": error,
        "ok": datos is not None and error is None,
    }
    _ruta_temp(temp_dir, pagina_num).write_text(json.dumps(registro, ensure_ascii=False, indent=2), encoding="utf-8")


def _cargar_temp(temp_dir: Path, pagina_num: int) -> Optional[dict]:
    ruta = _ruta_temp(temp_dir, pagina_num)
    if not ruta.exists():
        return None
    return json.loads(ruta.read_text(encoding="utf-8"))


def procesar_paginas(
    pdf_path: str,
    inicio: int = PAGINA_INICIO,
    fin: Optional[int] = None,
    temp_dir: Path = TEMP_DIR,
    saltar_completadas: bool = True,
) -> Tuple[int, List[int]]:
    """
    Recorre las páginas del PDF, extrae texto y llama al LLM por página.
    Guarda un archivo temporal por página. Devuelve (paginas_ok, paginas_fallidas).
    """
    temp_dir.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(pdf_path)
    total = doc.page_count

    if fin is None:
        fin = total
    if inicio < 1 or inicio > total:
        raise ValueError(f"Página inicial {inicio} fuera de rango (1..{total}).")
    if fin > total:
        fin = total
    if fin < inicio:
        raise ValueError(f"Página final {fin} menor que la inicial {inicio}.")

    print(f"PDF: {pdf_path} | páginas totales: {total} | desde página {inicio} hasta {fin}")
    print(f"Provider LLM: {LLM_PROVIDER} | modelo: {LLM_MODEL}")
    print(f"Temporales en: {temp_dir.resolve()}")

    client = LLMClient(provider=LLM_PROVIDER, model=LLM_MODEL)

    paginas_ok: List[int] = []
    paginas_fallidas: List[int] = []

    for idx in range(inicio - 1, fin):  # índice 0-based
        num = idx + 1  # 1-based

        previo = _cargar_temp(temp_dir, num) if saltar_completadas else None
        if previo and previo.get("ok") and previo.get("datos_llm") is not None:
            print(f"  [página {num}] ya procesada, saltando.")
            paginas_ok.append(num)
            continue

        page = doc[idx]
        try:
            texto = extraer_texto_pagina(page, num)
        except Exception as exc:  # noqa: BLE001
            print(f"  [página {num}] error de extracción: {exc}", file=sys.stderr)
            _guardar_temp(temp_dir, num, "", None, str(exc))
            paginas_fallidas.append(num)
            continue

        # Si la página está vacía (sin texto), no llamar al LLM.
        if not texto.strip():
            print(f"  [página {num}] página vacía, sin texto.")
            _guardar_temp(temp_dir, num, "", {"canciones": []}, None)
            paginas_ok.append(num)
            continue

        try:
            datos = client.parsear_pagina(texto, num)
            _guardar_temp(temp_dir, num, texto, datos, None)
            paginas_ok.append(num)
            n_canciones = len(datos.get("canciones", []))
            print(f"  [página {num}] OK -> {n_canciones} canción(es).")
        except Exception as exc:  # noqa: BLE001
            _guardar_temp(temp_dir, num, texto, None, str(exc))
            paginas_fallidas.append(num)

    doc.close()
    print(f"\nResumen: {len(paginas_ok)} OK, {len(paginas_fallidas)} fallidas.")
    if paginas_fallidas:
        print(f"  Páginas fallidas: {paginas_fallidas}")
    return paginas_ok, paginas_fallidas


# ---------------------------------------------------------------------------
# Paso 3 - Consolidación
# ---------------------------------------------------------------------------


def _extraer_canciones_de_texto(texto: str) -> List[dict]:
    """Intenta extraer un array de canciones de un texto que podría no ser JSON puro."""
    texto = texto.strip()
    m = re.search(r"\{.*\}", texto, re.DOTALL)
    if not m:
        return []
    try:
        datos = json.loads(m.group(0))
    except json.JSONDecodeError:
        return []
    canciones = datos.get("canciones", [])
    return canciones if isinstance(canciones, list) else []


def consolidar(temp_dir: Path = TEMP_DIR, salida: Path = SALIDA) -> Path:
    """Une todos los JSON temporales en un único archivo cancionero_completo.json."""
    temp_dir = Path(temp_dir)
    salida = Path(salida)

    archivos = sorted(temp_dir.glob("pagina_*.json"))
    if not archivos:
        raise FileNotFoundError(f"No se encontraron temporales en {temp_dir.resolve()}")

    todas: List[dict] = []
    paginas_procesadas: List[int] = []
    paginas_con_error: List[int] = []
    canciones_vacias = 0

    for ruta in archivos:
        registro = json.loads(ruta.read_text(encoding="utf-8"))
        num = registro.get("pagina")
        if num is not None:
            paginas_procesadas.append(num)

        if not registro.get("ok") or registro.get("error"):
            if num is not None:
                paginas_con_error.append(num)
            continue

        datos = registro.get("datos_llm")
        if datos is None:
            continue

        canciones = datos.get("canciones", [])
        if not isinstance(canciones, list):
            canciones = _extraer_canciones_de_texto(json.dumps(datos))

        if not canciones:
            canciones_vacias += 1

        for c in canciones:
            if not isinstance(c, dict):
                continue
            c.setdefault("pagina_origen", num)
            todas.append(c)

    consolidado = {
        "total_canciones": len(todas),
        "paginas_procesadas": paginas_procesadas,
        "paginas_con_error": paginas_con_error,
        "canciones_sin_letra": canciones_vacias,
        "canciones": todas,
    }

    salida.write_text(json.dumps(consolidado, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nConsolidado escrito en: {salida.resolve()}")
    print(f"  Canciones totales: {len(todas)}")
    print(f"  Páginas procesadas: {len(paginas_procesadas)}")
    print(f"  Páginas con error: {len(paginas_con_error)}")
    print(f"  Páginas sin canciones: {canciones_vacias}")
    return salida


# ---------------------------------------------------------------------------
# main
# ---------------------------------------------------------------------------


def main():
    pdf_path = Path(PDF_INPUT)
    if not pdf_path.exists():
        print(f"ERROR: no se encuentra el PDF: {pdf_path.resolve()}", file=sys.stderr)
        sys.exit(1)

    fin = None
    if PAGINA_FIN.strip():
        fin = int(PAGINA_FIN)

    print("=== PASO 1+2: Extracción geométrica + LLM por página ===")
    ok, fallidas = procesar_paginas(str(pdf_path), fin=fin)

    print("\n=== PASO 3: Consolidación ===")
    consolidar()

    if fallidas:
        print(
            "\nATENCIÓN: algunas páginas fallaron. Revisá los temporales y volvé a ejecutar; "
            "el pipeline salta las ya completadas."
        )
        sys.exit(1)


if __name__ == "__main__":
    main()
