# Cancionero MJP — Proyecto de Extracción y Estructuración

## 1. Descripción general

El objetivo del proyecto es extraer todas las canciones y acordes del PDF de 195 páginas **"CANCIONERO MJP - final imprimir.pdf"** y estructurarlas con alta fidelidad para consumirse en una web app con **Vite + React** y en un archivo HTML interactivo autónomo.

### Características del PDF impreso:
- **Páginas 1–4**: Carátulas.
- **Páginas 5–9**: Índice general con categorías litúrgicas canónicas y números de página.
- **Páginas 10–195**: Canciones a dos columnas por página.
- **Tipografía real**:
  - Acordes en **DM Sans SemiBold 12pt** (color verde `#285628`).
  - Letras en **DM Sans Regular 12pt** (color `#231f20`).
  - Títulos de canciones en **DM Sans SemiBold 14pt**.
  - Cabeceras de categorías decorativas en **Gelica-Italic 34pt**.
- Los acordes están ubicados milimétricamente en el eje X sobre la sílaba correspondiente.

---

## 2. Archivos del proyecto

| Directorio / Archivo | Propósito |
|----------------------|-----------|
| `src/data/cancionero.json` | Base maestra de 288 canciones estructuradas con acordes y metadatos |
| `src/components/` | Componentes React (buscador, filtros, vista detalle, transposición, autoscroll) |
| `src/utils/` | Utilidades para transposición tonal, diagramas de acordes y slugs de URLs |
| `public/` | Assets PWA (manifest, service worker, iconos y logos del MJP) |

---

## 3. Arquitectura y Renderizado

### ¿Por qué fallaba el enfoque anterior?
1. **Aproximación monoespaciada incorrecta**: El PDF usa **DM Sans** (fuente proporcional), donde un espacio mide ~2.9 pt y una letra entre 7 y 10 pt. El pipeline anterior asumía ancho fijo de 5.5 pt por carácter para un LLM, causando que cada acorde se desplazara a la derecha.
2. **Regex de span completo**: Se clasificaban spans completos con regex de acorde único, provocando que spans como `'RE             SOL'` se marcaran como "letra" y se perdiera el 97% de los acordes.

### Solución geométrica implementada:
1. **Extracción por carácter (`rawdict`)**: Cada letra y cada acorde se extrae con sus coordenadas exactas `x0, x1, y0, y1`.
2. **Anclaje de acorde a sílaba/carácter**: Cada acorde se asocia al carácter de la línea inferior donde comienza su coordenada `x0` (con tolerancia para inicios de palabra).
3. **Renderizado vertical flex (`.bloque-acorde`)**:
   ```html
   <span class="bloque-acorde">
     <span class="acorde">SOL</span>
     <span class="letra">DEL SEÑOR</span>
   </span>
   ```
   Garantiza que el acorde **nunca se mueva ni se desplace** respecto a su sílaba, sin importar el ancho de pantalla ni el dispositivo.
4. **Tipografía DM Sans auténtica**: Cargada directamente desde Google Fonts con los colores hex exactos del PDF (`#285628` para acordes y `#231f20` para letras).

---

## 4. Métricas de Extracción

| Métrica | Valor |
|---------|-------|
| Páginas del PDF | 195 |
| Páginas con canciones (11→195) | 185 |
| Canciones totales extraídas | **288** |
| Acordes totales extraídos | **8.589** |
| Canciones tipo "Bajadas" (Oasis O.xxx) | **64** |
| Categorías litúrgicas mapeadas | **13** (Entradas, Penitenciales, Gloria, Aleluya, Ofertorio, Santo, Padre nuestro, Cordero, Comunión, Meditación, Salida, Varios, Bajadas) |
| Dependencia de LLM / Cuotas de API | **0** (100% determinista y reproducible en 3 segundos) |

---

## 5. Cómo probar y verificar

```bash
npm run dev
```

Incluye:
- Buscador por título, letra y código Oasis en vivo.
- Filtros por categoría litúrgica.
- Vista detallada de canción con URL compartible y código QR.
- Transposición tonal en tiempo real (+1 / -1 semitonos con botón Reset).
- Modo autoscroll interactivo para tocar en vivo.
- Soporte PWA offline con Service Worker.
