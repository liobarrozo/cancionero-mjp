import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SongLyrics from './SongLyrics';
import { transposeChordGroup } from '../utils/transposition';
import { MusicNoteIcon, PlayIcon, ShareIcon, CheckIcon } from './Icons';

export default function SongCard({
  cancion,
  shift = 0,
  onTranspose,
  onResetTranspose,
  onOpenDiagrams,
  onOpenLiveScroll,
  isDetail = false,
}) {
  const navigate = useNavigate();
  let badgeLabel = `Litúrgico · ${cancion.categoria}`;
  if (cancion.seccion === 'Movimiento') {
    badgeLabel = 'Movimiento';
  } else if (cancion.seccion === 'Bajadas') {
    badgeLabel = 'Bajada';
  } else if (cancion.seccion === 'Varios') {
    badgeLabel = 'Varios';
  }

  const uniqueChords = cancion.acordes || [];
  const transposedChords = uniqueChords.map((c) => transposeChordGroup(c, shift));
  const [copied, setCopied] = useState(false);

  const handleShare = async (e) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/cancion/${cancion.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: cancion.titulo,
          text: `${cancion.titulo} — Cancionero MJP`,
          url: shareUrl,
        });
        return;
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('Share error:', err);
        }
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Clipboard error:', err);
    }
  };

  const handleCardClick = (e) => {
    // Si estamos en mobile (o en cualquier dispositivo), cualquier click en la tarjeta que no sea interactivo navega
    if (e.target.closest('button') || e.target.closest('a')) return;
    navigate(`/cancion/${cancion.slug}`);
  };

  // Extraer las primeras líneas limpias de la letra para la vista previa
  const previewLines = useMemo(() => {
    if (!cancion.letra_chordpro) return [];
    return cancion.letra_chordpro
      .map((l) => l.replace(/\[[^\]]*\]/g, '').trim())
      .filter((l) => l.length > 0 && l !== 'ESTRIBILLO' && l !== '[ESTRIBILLO]' && l !== 'CORO')
      .slice(0, 3);
  }, [cancion.letra_chordpro]);

  // VISTA PREVIA (para la raíz del cancionero)
  if (!isDetail) {
    return (
      <article
        onClick={handleCardClick}
        className="bg-base-100 border border-base-200/90 hover:border-[#0066AD]/30 rounded-2xl p-4 sm:p-5 shadow-none transition-all flex flex-col justify-between cursor-pointer sm:cursor-default"
      >
        <div>
          {/* Cabecera simplificada */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                <span className="text-[11px] font-medium text-base-content/60 border border-base-300/80 px-2.5 py-0.5 rounded-full">
                  {badgeLabel}
                </span>
                {cancion.codigo_oasis && (
                  <span className="text-[11px] font-bold text-[#0066AD] bg-[#0066AD]/10 border border-[#0066AD]/25 px-2.5 py-0.5 rounded-full">
                    {cancion.codigo_oasis}
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-base-content tracking-tight">
                <Link
                  to={`/cancion/${cancion.slug}`}
                  className="hover:text-[#0066AD] transition-colors"
                  title="Ver canción y acordes"
                >
                  {cancion.titulo}
                </Link>
              </h2>
              {cancion.subtitulo && (
                <p className="text-xs text-base-content/60 font-medium mt-0.5">
                  {cancion.subtitulo}
                </p>
              )}
            </div>

            {/* Botón de compartir redondo con icono únicamente */}
            <div className="relative shrink-0">
              <button
                onClick={handleShare}
                className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                  copied
                    ? 'border-[#26A62F]/40 bg-[#26A62F]/10 text-[#26A62F]'
                    : 'border-base-300/80 hover:border-[#0066AD]/40 bg-base-200/50 hover:bg-[#0066AD]/10 text-base-content/70 hover:text-[#0066AD]'
                }`}
                title="Compartir enlace de la canción"
                aria-label="Compartir canción"
              >
                {copied ? (
                  <CheckIcon className="w-4 h-4 text-[#26A62F]" />
                ) : (
                  <ShareIcon className="w-4 h-4" />
                )}
              </button>
              {copied && (
                <span className="absolute -bottom-6 right-0 text-[10px] font-bold text-[#26A62F] whitespace-nowrap bg-base-100 px-1.5 py-0.5 rounded shadow-xs border border-base-200 z-10">
                  ¡Copiado!
                </span>
              )}
            </div>
          </div>

          {/* Vista previa de la letra sin acordes */}
          {previewLines.length > 0 && (
            <div className="mt-3 pt-3 border-t border-base-200/70 text-xs sm:text-sm text-base-content/75 font-normal leading-relaxed space-y-0.5">
              {previewLines.map((line, idx) => (
                <div key={idx} className="truncate">
                  {line}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Enlace para ver canción completa y acordes */}
        <div className="mt-3 pt-2 flex items-center justify-between border-t border-base-200/40">
          <Link
            to={`/cancion/${cancion.slug}`}
            className="text-xs font-semibold text-[#0066AD] hover:underline flex items-center gap-1 group"
          >
            <span>Ver acordes y letra completa</span>
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        </div>
      </article>
    );
  }

  // VISTA COMPLETA (para la página individual de la canción /cancion/:slug)
  return (
    <article className="bg-base-100 border border-base-200/90 rounded-2xl p-5 sm:p-7 shadow-none transition-colors">
      {/* Cabecera de la canción */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-base-200/70 pb-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-base-content tracking-tight">
            {cancion.titulo}
          </h1>
          {cancion.subtitulo && (
            <p className="text-xs sm:text-sm text-base-content/60 font-medium mt-1">
              {cancion.subtitulo}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium text-base-content/60 border border-base-300/80 px-2.5 py-0.5 rounded-full">
            {badgeLabel}
          </span>
          {cancion.codigo_oasis && (
            <span className="text-[11px] font-bold text-[#0066AD] bg-[#0066AD]/10 border border-[#0066AD]/25 px-2.5 py-0.5 rounded-full">
              {cancion.codigo_oasis}
            </span>
          )}
        </div>
      </div>

      {/* Acordes utilizados en la canción */}
      {uniqueChords.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-1">
          <span className="text-xs font-semibold text-base-content/50 mr-1">Acordes:</span>
          {transposedChords.map((ch, chIdx) => (
            <button
              key={chIdx}
              onClick={() => onOpenDiagrams && onOpenDiagrams({ titulo: cancion.titulo, acordes: transposedChords })}
              className="px-2.5 py-0.5 rounded-md text-xs font-bold text-[#26A62F] bg-[#26A62F]/8 hover:bg-[#26A62F] hover:text-white transition-all cursor-pointer"
              title="Ver diagrama de digitación"
            >
              {ch}
            </button>
          ))}
        </div>
      )}

      {/* Barra de herramientas completa */}
      <div className="flex flex-wrap items-center justify-between gap-2 my-4 py-2.5 border-y border-base-200/70 text-xs">
        {/* Selector de tonos / Transposición */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-base-content/50 mr-1">Tono:</span>
          <button
            onClick={() => onTranspose && onTranspose(cancion.id, -1)}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-base-300 text-base-content hover:border-[#0066AD] hover:text-[#0066AD] transition-colors cursor-pointer"
            title="Bajar medio tono"
          >
            -1
          </button>
          <span className="font-bold text-xs w-6 text-center text-[#0066AD]">
            {shift > 0 ? `+${shift}` : shift}
          </span>
          <button
            onClick={() => onTranspose && onTranspose(cancion.id, 1)}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-base-300 text-base-content hover:border-[#0066AD] hover:text-[#0066AD] transition-colors cursor-pointer"
            title="Subir medio tono"
          >
            +1
          </button>
          {shift !== 0 && (
            <button
              onClick={() => onResetTranspose && onResetTranspose(cancion.id)}
              className="text-xs text-base-content/50 hover:text-[#0066AD] transition-colors ml-1 cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>

        {/* Acciones de la canción */}
        <div className="flex items-center gap-2">
          {uniqueChords.length > 0 && onOpenDiagrams && (
            <button
              onClick={() => onOpenDiagrams({ titulo: cancion.titulo, acordes: transposedChords })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-base-content/75 hover:text-[#0066AD] hover:bg-[#0066AD]/10 border border-base-300/80 transition-colors cursor-pointer"
              title="Ver digitación de acordes"
            >
              <MusicNoteIcon className="w-3.5 h-3.5" />
              <span>Diagramas</span>
            </button>
          )}
          {onOpenLiveScroll && (
            <button
              onClick={() => onOpenLiveScroll(cancion)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#0066AD] hover:bg-[#00528c] text-white transition-colors cursor-pointer shadow-xs"
              title="Abrir en pantalla completa con deslizamiento automático"
            >
              <PlayIcon className="w-3 h-3" />
              <span>En vivo</span>
            </button>
          )}
        </div>
      </div>

      {/* Letra y acordes completos */}
      <SongLyrics lineas={cancion.lineas} shift={shift} />
    </article>
  );
}
