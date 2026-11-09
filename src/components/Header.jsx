import React from 'react';
import { SunIcon, MoonIcon } from './Icons';

export default function Header({
  theme,
  toggleTheme,
  busqueda,
  onBusquedaChange,
  totalCanciones,
  totalAcordes,
  cantosFiltradosCount,
}) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={theme === 'dark' ? '/logos/mjp-white.png' : '/logos/mjp-black.png'}
            alt="Logo MJP"
            className="h-8 w-auto object-contain select-none"
          />
          <div className="border-l border-base-300/80 pl-3">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-base-content leading-tight">
              Cancionero <span className="text-[#0066AD]">MJP</span>
            </h1>
            <p className="text-[11px] text-base-content/50 font-medium hidden sm:block">
              {totalCanciones} cantos · {totalAcordes} acordes
            </p>
          </div>
        </div>
        <div className="text-xs font-semibold px-2 py-0.5 rounded-full border border-base-300 text-base-content/60 sm:hidden">
          {cantosFiltradosCount} cantos
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        <div className="flex-1 sm:w-72">
          <input
            type="text"
            className="input input-sm sm:input-md w-full rounded-xl bg-base-200/50 hover:bg-base-200/80 focus:bg-base-100 border border-base-300/80 focus:border-[#0066AD] focus:outline-none focus:ring-1 focus:ring-[#0066AD] transition-all text-xs sm:text-sm"
            placeholder="Buscar por título, letra, O.xxx..."
            value={busqueda}
            onChange={(e) => onBusquedaChange(e.target.value)}
          />
        </div>
        <button
          onClick={toggleTheme}
          className="btn btn-sm sm:btn-md btn-ghost btn-circle text-base-content/70 hover:text-[#0066AD] transition-colors"
          title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          aria-label="Alternar modo oscuro o claro"
        >
          {theme === 'dark' ? (
            <SunIcon className="w-5 h-5 text-[#0066AD]" />
          ) : (
            <MoonIcon className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}
