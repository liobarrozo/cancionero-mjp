import React from 'react';

export const SECCIONES = ['Todas', 'Cantos Litúrgicos', 'Varios', 'Movimiento', 'Bajadas'];

export const LITURGICAS = [
  'Entradas', 'Penitenciales', 'Gloria', 'Aleluya', 'Ofertorio',
  'Santo', 'Padre Nuestro', 'Cordero', 'Comunión', 'Meditación', 'Salida'
];

export default function NavigationFilter({
  seccionActiva,
  onSelectSeccion,
  subLiturgia,
  onSelectSubLiturgia,
  conteos,
}) {
  return (
    <div className="max-w-4xl mx-auto px-4 pb-2.5 pt-1 overflow-x-auto no-scrollbar">
      {/* Pestañas principales */}
      <div className="flex items-center gap-1.5 min-w-max">
        {SECCIONES.map(sec => (
          <button
            key={sec}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              seccionActiva === sec
                ? 'bg-[#0066AD] text-white font-semibold shadow-xs'
                : 'text-base-content/70 hover:text-base-content hover:bg-base-200/60'
            }`}
            onClick={() => onSelectSeccion(sec)}
          >
            {sec} {sec === 'Todas' ? `(${conteos.Todas || 0})` : `(${conteos[sec] || 0})`}
          </button>
        ))}
      </div>

      {/* Subfiltros Litúrgicos */}
      {seccionActiva === 'Cantos Litúrgicos' && (
        <div className="flex flex-wrap gap-1 mt-2.5 pt-2 border-t border-base-200/70">
          <button
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
              subLiturgia === 'Todas'
                ? 'bg-[#0066AD] text-white font-semibold'
                : 'bg-base-200/60 text-base-content/70 hover:text-base-content'
            }`}
            onClick={() => onSelectSubLiturgia('Todas')}
          >
            Todas las litúrgicas
          </button>
          {LITURGICAS.map(cat => (
            <button
              key={cat}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                subLiturgia === cat
                  ? 'bg-[#0066AD] text-white font-semibold'
                  : 'bg-base-200/60 text-base-content/70 hover:text-base-content'
              }`}
              onClick={() => onSelectSubLiturgia(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Nota de Bajadas */}
      {seccionActiva === 'Bajadas' && (
        <div className="text-xs text-[#0066AD] font-medium mt-2 pt-1 border-t border-base-200/70">
          Bajadas: agrupadas por año, próximamente a definir
        </div>
      )}
    </div>
  );
}
