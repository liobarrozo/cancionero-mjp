import React from 'react';
import { transposeChordGroup } from '../utils/transposition';

export default function SongLyrics({ lineas = [], shift = 0, isLiveMode = false }) {
  const stanzaMargin = isLiveMode ? 'mt-6' : 'mt-4 sm:mt-5';
  const markerMargin = isLiveMode ? 'my-3' : 'my-2';
  const chordPt = isLiveMode ? 'pt-5' : 'pt-4.5';
  const chordTop = isLiveMode ? 'top-0' : 'top-0.5';
  const chordSize = isLiveMode ? 'text-[0.88em]' : 'text-[0.84em]';

  return (
    <div className={`cuerpo-cancion font-['DM_Sans',sans-serif] ${isLiveMode ? '' : 'text-[15px] sm:text-[16px]'}`}>
      {lineas.map((linea, lIdx) => {
        const textOnly = linea.segmentos.map(s => s.letra).join('').trim();
        const hasChords = linea.segmentos.some(s => (s.acorde || '').trim() !== '');
        const isMarker = !hasChords && (textOnly === '[ESTRIBILLO]' || textOnly === 'ESTRIBILLO' || textOnly === 'CORO');

        const stanzaClass = linea.salto_previo ? stanzaMargin : '';

        if (isMarker) {
          return (
            <div key={lIdx} className={`font-bold text-xs tracking-wider text-[#26A62F] ${markerMargin} ${stanzaClass}`}>
              {textOnly}
            </div>
          );
        }

        if (!hasChords) {
          return (
            <div key={lIdx} className={`leading-relaxed text-base-content whitespace-pre ${stanzaClass}`}>
              {textOnly}
            </div>
          );
        }

        if (linea.tipo === 'acordes') {
          return (
            <div key={lIdx} className={`flex ${isLiveMode ? 'gap-4 my-1' : 'gap-3 my-0.5 text-[0.9em]'} text-[#26A62F] font-bold ${stanzaClass}`}>
              {linea.segmentos
                .filter(s => (s.acorde || '').trim() !== '')
                .map((s, sIdx) => (
                  <span key={sIdx}>
                    {transposeChordGroup(s.acorde.trim(), shift)}
                  </span>
                ))}
            </div>
          );
        }

        return (
          <div key={lIdx} className={`block leading-relaxed whitespace-pre my-0.5 ${stanzaClass}`}>
            {linea.segmentos.map((s, sIdx) => {
              const chord = s.acorde ? transposeChordGroup(s.acorde.trim(), shift) : '';
              const offset = s.offset || 0;
              return (
                <span key={sIdx} className={`inline-block relative ${chordPt} align-bottom`}>
                  {chord && (
                    <span
                      className={`absolute ${chordTop} font-bold text-[#26A62F] ${chordSize} leading-none select-none`}
                      style={offset ? { left: `${offset}em` } : { left: 0 }}
                    >
                      {chord}
                    </span>
                  )}
                  <span className="font-normal text-base-content text-[1em]">
                    {s.letra || '\u00A0'}
                  </span>
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
