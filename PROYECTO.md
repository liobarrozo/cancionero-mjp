# Cancionero MJP — Proyecto de Extracción y Estructuración

## 1. Descripción general

El objetivo del proyecto es extraer todas las canciones y acordes de un PDF de 195 páginas llamado **"CANCIONERO MJP - final imprimir.pdf"** y convertirlos a un archivo JSON estructurado con sintaxis **ChordPro** (acordes incrustados entre corchetes `[ACORDE]` justo antes de la sílaba correspondiente), listo para consumirse en una web app con **Vite + React**.

El PDF contiene:
- Páginas 1–4: Carátulas.
- Páginas 5–9: Índice general con categorías litúrgicas.
- Páginas 10–195: Cancionero propiamente dicho, con maquetación a **dos columnas verticales** por página.
- Los acordes aparecen en una línea independiente sobre la letra, alineados visualmente mediante espacios en blanco.
- Indicaciones extra: `(x2)`, `[ESTRIBILLO]`, `CAPO 1`, códigos tipo `O.308`.

## 2. Archivos del proyecto

| Archivo | Propósito |
|---------|-----------|
| `pipeline_cancionero.py` | Pipeline completo: extracción geométrica + LLM por página + consolidación final |
| `extraer_layout_pdf.py` | Extrae coordenadas X/Y reales de cada acorde y letra desde el PDF (PyMuPDF `rawdict`) |
| `generar_web_vite.py` | Genera `cancionero_vite.json` (formato para Vite/React) y `cancionero_web_precise.html` (HTML estático de verificación) |
| `generar_web.py` | Versión anterior de generador HTML (acordes inline, menos preciso) |
| `src/components/Cancionero.jsx` | Componente React para web app Vite |
| `src/components/Cancionero.css` | Estilos con `position: absolute` para posicionar acordes sobre la letra |
| `cancionero_completo.json` | Resultado final consolidado: 283 canciones con metadata y letra ChordPro |
| `cancionero_vite.json` | JSON optimizado para Vite: incluye coordenadas X reales por acorde/letra |
| `cancionero_web_precise.html` | HTML estático para verificar visualmente el posicionamiento |
| `cancionero_temp/` | Archivos temporales por página (texto extraído + respuesta LLM + layout por página) |
| `.env` | Variables de entorno (LLM_PROVIDER, LLM_MODEL, API keys) |
| `.env.example` | Plantilla de variables de entorno |

## 3. Pipeline implementado

### Paso 1 — Extracción geométrica (PyMuPDF)
- Recorre páginas 10 a 195.
- Divide cada hoja por la mitad en el eje X (≈297 pt) para separar columna izquierda y derecha.
- Extrae texto con `page.get_text("rawdict")` para obtener coordenadas `x0`, `x1`, `y0`, `y1` de cada span.
- Reconstruye líneas monoespaciadas respetando la posición visual X de cada span.
- Detecta líneas de acordes mediante regex que soporta notación inglesa (`A-G`) e hispana (`DO`, `RE`, `MI`, `FA`, `SOL`, `LA`, `SI`).
- Guarda un JSON de layout por página en `cancionero_temp/layout/layout_NNN.json`.

### Paso 2 — Procesamiento por LLM (Gemini)
- Cliente asíncrono/iterativo con reintentos (backoff exponencial, hasta 5 intentos).
- Guarda un temporal por página en `cancionero_temp/pagina_NNN.json` para no perder progreso si falla o se interrumpe.
- System Prompt exacto solicitado por el usuario para convertir texto plano a JSON ChordPro.
- Modelo usado: `gemini-flash-lite-latest` (dentro de la cuota gratuita de Gemini AI Pro).
- Resultado: 283 canciones extraídas de 186 páginas con texto.

### Paso 3 — Consolidación
- Une todos los temporales en `cancionero_completo.json`.
- Estructura final por canción: `id`, `titulo`, `categoria`, `categoria_filtro`, `codigo_oasis`, `pagina_origen`, `lineas` (array de `{y, acordes: [{x, texto}], letras: [{x, texto}], ancho}`).
- Detecta automáticamente las "Bajadas" por código Oasis (`O.xxx`).

## 4. Resultados obtenidos

| Métrica | Valor |
|---------|-------|
| Páginas del cancionero (10→195) | 186 |
| Páginas procesadas OK | 186 |
| Páginas en blanco (sin texto) | 7 (10, 50, 52, 134, 136, 148, 150) |
| Páginas sin canciones (contenido no musical) | 3 (51, 135, 149) |
| Canciones totales extraídas | 283 |
| Canciones tipo "Bajadas" (código O.xxx) | 56 |
| Acordes con coordenada X real | 251 |
| Llamadas al LLM en el paso final de layout | 0 (reuso de JSON existente) |

## 5. Problemas encontrados y soluciones

### 5.1. Notación de acordes hispana vs inglesa
El regex inicial solo reconocía notación inglesa (`A-G`). El PDF usa notación hispana (`DO`, `RE`, `MI`, etc.). Se amplió el regex para aceptar ambos sistemas.

### 5.2. Títulos del LLM vs texto del PDF
El LLM devuelve títulos como "GLORIA" pero el PDF tiene "GLORIA misa criolla". Se implementó matching por contenencia y normalización (quitar tildes, espacios múltiples, mayúsculas).

### 5.3. Páginas en blanco
7 páginas del PDF están completamente vacías (0 caracteres, 0 bloques). Se detectan y se saltan sin llamar al LLM.

### 5.4. Cuota gratuita de Gemini
Límite de 15 requests por minuto en el plan gratuito. El pipeline incluye reintentos con backoff exponencial y respeta `retry_delay` de la API.

### 5.5. Página 44 (JSON malformado)
El LLM devolvió JSON inválido en un intento. Se borró el temporal y se reejecutó solo esa página; el pipeline salta automáticamente las ya completadas.

## 6. Limitación conocida: posicionamiento de acordes

El archivo `cancionero_web_precise.html` **no es 100% preciso** en el posicionamiento visual de los acordes sobre las sílabas.

**Causa:** Aunque se extraen coordenadas X reales del PDF (en puntos), al renderizar en HTML con `position: absolute` y `left: Xpx`, hay factores que introducen desviación:
- Diferencia de fuente entre el PDF y el navegador (monoespaciado vs fuente del sistema).
- El ancho de carácter en el PDF no equivale exactamente a `1px` en pantalla.
- Los spans del PDF pueden contener espacios/tabulaciones que afectan el `x0` real del texto visible.
- Las columnas izquierda y derecha se renderizan desde `x=0` en el HTML, pero en el PDF empiezan en `x≈42.52` (izquierda) y `x≈300.47` (derecha).

**Resultado:** Los acordes quedan aproximadamente en la zona correcta, pero no exactamente sobre cada sílaba como en el PDF impreso.

## 7. Recomendaciones para el próximo agente

1. **No volver a llamar al LLM.** El JSON `cancionero_completo.json` ya tiene las 283 canciones con letra ChordPro. El trabajo restante es puro posicionamiento visual.

2. **Mejorar el mapeo de coordenadas PDF → pantalla.** Opciones:
   - Calcular un factor de escala `puntos_pdf → px_pantalla` midiendo el ancho de una línea conocida en el PDF y comparando con su ancho renderizado en HTML.
   - Usar `transform: scale()` o ajustar `left` con un offset por columna (izquierda: +42.52pt, derecha: +300.47pt).
   - Considerar renderizar con SVG en lugar de HTML/CSS para control absoluto de coordenadas.

3. **Verificar canción por canción.** Abrir `cancionero_web_precise.html` y comparar visualmente con el PDF fuente (páginas 10–195) para identificar canciones donde el desplazamiento es sistemático.

4. **El JSON `cancionero_vite.json` está listo para consumir.** Cada canción tiene `lineas[].acordes[].x` y `lineas[].letras[].x` en píxeles relativos al inicio de la columna. Ese es el formato óptimo para una web app Vite + React.

5. **El componente `src/components/Cancionero.jsx` ya consume `cancionero_vite.json`.** Solo necesita el CSS de `Cancionero.css` y estar importado en la app Vite.

## 8. Cómo probar lo generado

### HTML estático (sin instalar nada)
```bash
open cancionero_web_precise.html
```
O doble clic sobre el archivo. Incluye buscador y filtros por categoría (incluye "Bajadas").

### Web app con Vite + React
```bash
# Copiar archivos al proyecto Vite
cp cancionero_vite.json src/data/
cp src/components/Cancionero.jsx src/components/
cp src/components/Cancionero.css src/components/

# Importar en App.jsx
import Cancionero from './components/Cancionero';
import './components/Cancionero.css';

# Levantar
npm run dev
```

## 9. Estado actual

- ✅ Extracción geométrica de 186 páginas
- ✅ Procesamiento LLM de 283 canciones (cuota gratuita respetada)
- ✅ Consolidación en `cancionero_completo.json`
- ✅ JSON con coordenadas reales en `cancionero_vite.json`
- ✅ Componente React para Vite
- ⚠️ HTML de verificación con aproximación visual (no 100% preciso pixel-perfect)
- ⏳ Pendiente: ajuste fino de coordenadas para posicionamiento exacto de acordes
