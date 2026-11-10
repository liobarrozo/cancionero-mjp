import React from 'react';
import { SunIcon, MoonIcon } from './Icons';

export default function Header({
  theme,
  toggleTheme,
  busqueda,
  onBusquedaChange,
  cancionesFiltradasCount,
}) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
      {/* Brand / Logo + Título */}
      <a href="/" className="flex items-center gap-2.5 group cursor-pointer select-none shrink-0">
        <img
          src={theme === 'dark' ? '/logos/mjp-white.png' : '/logos/escudo.png'}
          alt="Logo MJP"
          className="h-9 w-auto object-contain transition-transform group-hover:scale-105"
        />
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-base-content leading-none">
          Cancionero <span className="text-[#0066AD]">MJP</span>
        </h1>
      </a>

      {/* Buscador y cambio de tema */}
      <div className="flex items-center gap-2 flex-1 max-w-xs sm:max-w-sm justify-end">
        <div className="relative w-full">
          <input
            type="text"
            className="input input-sm sm:input-md w-full rounded-xl bg-base-200/60 hover:bg-base-200 focus:bg-base-100 border border-base-300 focus:border-[#0066AD] focus:outline-none focus:ring-1 focus:ring-[#0066AD] transition-all text-xs sm:text-sm pl-3 pr-8"
            placeholder="Buscar por título, letra, O.xxx..."
            value={busqueda}
            onChange={(e) => onBusquedaChange(e.target.value)}
          />
          {busqueda && (
            <button
              onClick={() => onBusquedaChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-base-content/40 hover:text-base-content cursor-pointer"
              title="Borrar búsqueda"
            >
              ✕
            </button>
          )}
        </div>

        <button
          onClick={toggleTheme}
          className="btn btn-sm sm:btn-md btn-ghost btn-circle text-base-content/70 hover:text-[#0066AD] transition-colors shrink-0"
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
