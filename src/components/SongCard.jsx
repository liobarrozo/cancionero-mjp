import React from 'react';
import SongLyrics from './SongLyrics';
import { transposeChordGroup } from '../utils/transposition';
import { GuitarIcon, PlayIcon } from './Icons';

export default function SongCard({
  cancion,
  shift = 0,
  onTranspose,
  onResetTranspose,
  onOpenDiagrams,
  onOpenLiveScroll,
}) {
  let badgeLabel = `Litúrgico · ${cancion.categoria}`;
  if (cancion.seccion === 'Movimiento') {
    badgeLabel = 'Movimiento';
  } else if (cancion.seccion === 'Bajadas') {
    badgeLabel = 'Bajada';
  } else if (cancion.seccion === 'Varios') {
    badgeLabel = 'Varios';
  }

  const uniqueChords = cancion.acordes || [];
  const transposedChords = uniqueChords.map(c => transposeChordGroup(c, shift));

  return (
    <article className="bg-base-100 border border-base-200/90 rounded-2xl p-5 sm:p-7 shadow-none hover:border-[#0066AD]/30 transition-colors">
      {/* Cabecera de la canción */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-base-200/70 pb-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-base-content tracking-tight">
            {cancion.titulo}
          </h2>
          {cancion.subtitulo && (
            <p className="text-xs sm:text-sm text-base-content/60 font-medium mt-0.5">
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

      {/* Acordes utilizados al principio de la canción */}
      {uniqueChords.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-1">
          <span className="text-xs font-semibold text-base-content/50 mr-1">Acordes:</span>
          {transposedChords.map((ch, chIdx) => (
            <button
              key={chIdx}
              onClick={() => onOpenDiagrams({ titulo: cancion.titulo, acordes: transposedChords })}
              className="px-2 py-0.5 rounded-md text-xs font-bold text-[#26A62F] bg-[#26A62F]/8 hover:bg-[#26A62F] hover:text-white transition-all cursor-pointer"
              title="Ver diagrama de digitación"
            >
              {ch}
            </button>
          ))}
        </div>
      )}

      {/* Barra de herramientas minimalista */}
      <div className="flex flex-wrap items-center justify-between gap-2 my-4 py-2 border-y border-base-200/70 text-xs">
        {/* Transposición */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-base-content/50 mr-1">Tono:</span>
          <button
            onClick={() => onTranspose(cancion.id, -1)}
            className="w-6 h-6 flex items-center justify-center rounded border border-base-300 text-base-content hover:border-[#0066AD] transition-colors"
            title="Bajar medio tono"
          >
            -1
          </button>
          <span className="font-bold text-xs w-5 text-center text-[#0066AD]">
            {shift > 0 ? `+${shift}` : shift}
          </span>
          <button
            onClick={() => onTranspose(cancion.id, 1)}
            className="w-6 h-6 flex items-center justify-center rounded border border-base-300 text-base-content hover:border-[#0066AD] transition-colors"
            title="Subir medio tono"
          >
            +1
          </button>
          {shift !== 0 && (
            <button
              onClick={() => onResetTranspose(cancion.id)}
              className="text-xs text-base-content/50 hover:text-[#0066AD] transition-colors ml-1"
            >
              Reset
            </button>
          )}
        </div>

        {/* Acciones principales */}
        <div className="flex items-center gap-2">
          {uniqueChords.length > 0 && (
            <button
              onClick={() => onOpenDiagrams({ titulo: cancion.titulo, acordes: transposedChords })}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-base-content/75 hover:text-[#0066AD] hover:bg-[#0066AD]/10 transition-colors cursor-pointer"
              title="Ver digitación de acordes"
            >
              <GuitarIcon className="w-3.5 h-3.5" />
              <span>Diagramas</span>
            </button>
          )}
          <button
            onClick={() => onOpenLiveScroll(cancion)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-[#0066AD] hover:bg-[#00528c] text-white transition-colors cursor-pointer"
            title="Abrir en pantalla completa con deslizamiento automático"
          >
            <PlayIcon className="w-3 h-3" />
            <span>En vivo</span>
          </button>
        </div>
      </div>

      {/* Letra y acordes */}
      <SongLyrics lineas={cancion.lineas} shift={shift} />
    </article>
  );
}
