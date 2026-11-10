export function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar tildes y diacríticos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')     // Reemplazar símbolos y espacios por guión
    .replace(/^-+|-+$/g, '');        // Podar guiones al inicio o final
}

/**
 * Genera el slug canónico para una canción.
 * Desambigua canciones con títulos repetidos usando el código de Oasis.
 */
export function buildSongSlug(cancion) {
  const base = slugify(cancion.titulo);

  if (cancion.titulo === 'QUÉDATE CON NOSOTROS') {
    return cancion.codigo_oasis
      ? `${base}-${slugify(cancion.codigo_oasis)}`
      : base;
  }

  if (cancion.titulo === 'PERMANECER EN TU AMOR') {
    return cancion.codigo_oasis
      ? `${base}-${slugify(cancion.codigo_oasis)}`
      : `${base}-${cancion.id}`;
  }

  return base || `cancion-${cancion.id}`;
}

/**
 * Busca una canción por slug o por ID numérico.
 */
export function findSongBySlug(canciones, slugOrId) {
  if (!canciones || !slugOrId) return null;
  const target = slugify(slugOrId);
  const idStr = String(slugOrId);

  return (
    canciones.find(
      (c) =>
        c.slug === target ||
        slugify(c.slug) === target ||
        String(c.id) === idStr
    ) || null
  );
}
