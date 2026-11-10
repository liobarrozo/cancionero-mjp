import React, { useRef, useState, useEffect } from 'react';

export const SECCIONES = ['Todas', 'Canciones Litúrgicas', 'Varios', 'Movimiento', 'Bajadas'];

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
  const scrollRef = useRef(null);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 6);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 6);
  };

  useEffect(() => {
    if (seccionActiva === 'Canciones Litúrgicas') {
      // Pequeño timeout para medir tras la animación de despliegue
      const timer = setTimeout(checkScroll, 50);
      window.addEventListener('resize', checkScroll);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [seccionActiva]);

  const getButtonClass = (isActive) =>
    `px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer text-center select-none active:scale-[0.98] ${
      isActive
        ? 'bg-[#0066AD] text-white font-semibold shadow-xs border border-[#0066AD]'
        : 'bg-base-200/70 text-base-content/80 hover:bg-base-200 hover:text-base-content border border-base-300/60'
    }`;

  return (
    <div className="max-w-4xl mx-auto px-4 pb-3 pt-1 transition-[padding] duration-300 ease-out">
      {/* Mobile: 2 filas compactas organizadas sin scroll horizontal */}
      <div className="flex flex-col gap-1.5 sm:hidden">
        {/* Fila 1: Todas y Litúrgicos */}
        <div className="grid grid-cols-2 gap-1.5">
          <button
            className={`${getButtonClass(seccionActiva === 'Todas')} truncate`}
            onClick={() => onSelectSeccion('Todas')}
          >
            Todas <span className="opacity-80">({conteos.Todas || 0})</span>
          </button>
          <button
            className={`${getButtonClass(seccionActiva === 'Canciones Litúrgicas')} truncate`}
            onClick={() => onSelectSeccion('Canciones Litúrgicas')}
          >
            Litúrgicas <span className="opacity-80">({conteos['Canciones Litúrgicas'] || 0})</span>
          </button>
        </div>

        {/* Fila 2: Varios, Movimiento y Bajadas */}
        <div className="grid grid-cols-3 gap-1.5">
          {['Varios', 'Movimiento', 'Bajadas'].map(sec => (
            <button
              key={sec}
              className={`${getButtonClass(seccionActiva === sec)} truncate px-1`}
              onClick={() => onSelectSeccion(sec)}
            >
              {sec} <span className="opacity-80">({conteos[sec] || 0})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Desktop / Tablet: Fila horizontal fluida */}
      <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {SECCIONES.map(sec => (
          <button
            key={sec}
            className={getButtonClass(seccionActiva === sec)}
            onClick={() => onSelectSeccion(sec)}
          >
            {sec} <span className="opacity-80">({sec === 'Todas' ? conteos.Todas || 0 : conteos[sec] || 0})</span>
          </button>
        ))}
      </div>

      {/* Subfiltros Litúrgicos con animación suave de altura */}
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
          seccionActiva === 'Canciones Litúrgicas'
            ? 'grid-rows-[1fr] opacity-100'
            : 'grid-rows-[0fr] opacity-0 pointer-events-none'
        }`}
      >
        <div className="overflow-hidden">
          <div className="relative mt-2 pt-2 border-t border-base-300/60">
            {/* Contenedor con scroll horizontal */}
            <div
              ref={scrollRef}
              onScroll={checkScroll}
              className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5"
            >
              <button
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all shrink-0 cursor-pointer ${
                  subLiturgia === 'Todas'
                    ? 'bg-[#0066AD] text-white font-semibold shadow-xs border border-[#0066AD]'
                    : 'bg-base-200/70 text-base-content/80 hover:bg-base-200 hover:text-base-content border border-base-300/50'
                }`}
                onClick={() => onSelectSubLiturgia('Todas')}
              >
                Todas las litúrgicas
              </button>
              {LITURGICAS.map(cat => (
                <button
                  key={cat}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all shrink-0 cursor-pointer ${
                    subLiturgia === cat
                      ? 'bg-[#0066AD] text-white font-semibold shadow-xs border border-[#0066AD]'
                      : 'bg-base-200/70 text-base-content/80 hover:bg-base-200 hover:text-base-content border border-base-300/50'
                  }`}
                  onClick={() => onSelectSubLiturgia(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Indicador de scroll derecho */}
            {canScrollRight && (
              <div
                className="pointer-events-none absolute right-0 top-2 bottom-0 w-8 flex items-center justify-end bg-gradient-to-l from-base-100 via-base-100/90 to-transparent pr-0.5 text-base-content/60 transition-opacity duration-200"
                aria-hidden="true"
              >
                <svg className="w-3.5 h-3.5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            )}

            {/* Indicador de scroll izquierdo */}
            {canScrollLeft && (
              <div
                className="pointer-events-none absolute left-0 top-2 bottom-0 w-8 flex items-center justify-start bg-gradient-to-r from-base-100 via-base-100/90 to-transparent pl-0.5 text-base-content/60 transition-opacity duration-200"
                aria-hidden="true"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Nota de Bajadas con animación suave de altura */}
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
          seccionActiva === 'Bajadas'
            ? 'grid-rows-[1fr] opacity-100'
            : 'grid-rows-[0fr] opacity-0 pointer-events-none'
        }`}
      >
        <div className="overflow-hidden">
          <div className="text-xs text-[#0066AD] font-medium mt-2 pt-1 border-t border-base-300/60">
            Bajadas: agrupadas por año, próximamente a definir
          </div>
        </div>
      </div>
    </div>
  );
}
