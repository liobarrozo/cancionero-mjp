import React from 'react';
import { getChordDiagram } from '../utils/chordDiagrams';
import { CloseIcon } from './Icons';

export function GuitarChordSVG({ chordName, size = 120 }) {
  const diag = getChordDiagram(chordName);
  if (!diag) {
    return (
      <div className="flex flex-col items-center justify-center p-2 bg-base-200 rounded-lg text-xs">
        <span className="font-bold text-base">{chordName}</span>
        <span className="text-base-content/60 mt-1">Sin diagrama</span>
      </div>
    );
  }

  const { frets, baseFret = 1 } = diag;
  const width = size;
  const height = size * 1.25;

  const marginX = 22;
  const marginY = 28;
  const stringSpacing = (width - marginX * 2) / 5;
  const fretSpacing = (height - marginY * 2) / 5;

  // Encontrar rango de trastes a dibujar
  const validFrets = frets.filter(f => f > 0);
  const minFret = validFrets.length > 0 ? Math.min(...validFrets) : 1;
  const maxFret = validFrets.length > 0 ? Math.max(...validFrets) : 4;
  
  let startFret = baseFret;
  if (maxFret > 4 && baseFret === 1) {
    startFret = minFret;
  }

  return (
    <div className="flex flex-col items-center p-2.5 bg-base-100 rounded-xl border border-base-200/90 shadow-none">
      <span className="font-bold text-xs text-[#26A62F] mb-1">{diag.name}</span>
      <svg width={width} height={height} className="select-none">
        {/* Marcadores X y O arriba de las cuerdas */}
        {frets.map((f, i) => {
          const x = marginX + i * stringSpacing;
          if (f === -1) {
            return (
              <text key={i} x={x} y={marginY - 10} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#ef4444">
                ✕
              </text>
            );
          } else if (f === 0) {
            return (
              <circle key={i} cx={x} cy={marginY - 12} r="4" fill="none" stroke="#26A62F" strokeWidth="1.5" />
            );
          }
          return null;
        })}

        {/* Indicador de traste inicial si no empieza en traste 1 */}
        {startFret > 1 && (
          <text x={marginX - 14} y={marginY + fretSpacing * 0.7} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#64748b">
            {startFret}ª
          </text>
        )}

        {/* Cejuela (Nut) gruesa si startFret == 1 */}
        {startFret === 1 ? (
          <line
            x1={marginX}
            y1={marginY}
            x2={marginX + stringSpacing * 5}
            y2={marginY}
            stroke="#334155"
            strokeWidth="4"
          />
        ) : (
          <line
            x1={marginX}
            y1={marginY}
            x2={marginX + stringSpacing * 5}
            y2={marginY}
            stroke="#94a3b8"
            strokeWidth="1.5"
          />
        )}

        {/* Trastes horizontales (5 trastes) */}
        {[1, 2, 3, 4, 5].map((fretIndex) => (
          <line
            key={fretIndex}
            x1={marginX}
            y1={marginY + fretIndex * fretSpacing}
            x2={marginX + stringSpacing * 5}
            y2={marginY + fretIndex * fretSpacing}
            stroke="#cbd5e1"
            strokeWidth="1"
          />
        ))}

        {/* 6 Cuerdas verticales */}
        {[0, 1, 2, 3, 4, 5].map((stringIndex) => (
          <line
            key={stringIndex}
            x1={marginX + stringIndex * stringSpacing}
            y1={marginY}
            x2={marginX + stringIndex * stringSpacing}
            y2={marginY + fretSpacing * 5}
            stroke="#64748b"
            strokeWidth={1 + (5 - stringIndex) * 0.3} // Cuerdas graves más gruesas
          />
        ))}

        {/* Puntos de digitación (dedos en trastes) */}
        {frets.map((f, stringIndex) => {
          if (f > 0) {
            const relFret = f - startFret + 1;
            if (relFret >= 1 && relFret <= 5) {
              const x = marginX + stringIndex * stringSpacing;
              const y = marginY + (relFret - 0.5) * fretSpacing;
              return (
                <circle
                  key={stringIndex}
                  cx={x}
                  cy={y}
                  r="6"
                  fill="#26A62F"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
              );
            }
          }
          return null;
        })}
      </svg>
    </div>
  );
}

export default function ChordModal({ isOpen, onClose, songTitle, chords = [] }) {
  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-xl bg-base-100 p-6 rounded-2xl shadow-xl border border-base-200">
        <div className="flex justify-between items-center mb-4 border-b border-base-200 pb-3">
          <div>
            <h3 className="font-bold text-base text-base-content">Acordes de guitarra</h3>
            <p className="text-xs text-base-content/60 mt-0.5">{songTitle}</p>
          </div>
          <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost" aria-label="Cerrar">
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[65vh] overflow-y-auto p-1">
          {chords.map((chord, idx) => (
            <GuitarChordSVG key={idx} chordName={chord} size={110} />
          ))}
        </div>

        <div className="modal-action mt-5 pt-3 border-t border-base-200 flex justify-end">
          <button className="btn btn-sm px-6 bg-[#0066AD] hover:bg-[#00528c] text-white border-none font-medium rounded-lg" onClick={onClose}>
            Entendido
          </button>
        </div>
      </div>
      <div className="modal-backdrop bg-black/40 backdrop-blur-xs" onClick={onClose}></div>
    </div>
  );
}
