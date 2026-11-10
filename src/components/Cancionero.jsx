import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../hooks/useTheme';
import Header from './Header';
import NavigationFilter from './NavigationFilter';
import SongCard from './SongCard';
import ChordModal from './ChordModal';
import LiveScrollModal from './LiveScrollModal';

const PAGE_SIZE = 25;

export default function Cancionero({
  datos: propDatos,
  theme: propTheme,
  toggleTheme: propToggleTheme,
  transpositions: propTranspositions,
  onTranspose: propOnTranspose,
  onResetTranspose: propOnResetTranspose,
}) {
  const defaultThemeHook = useTheme();
  const theme = propTheme !== undefined ? propTheme : defaultThemeHook.theme;
  const toggleTheme = propToggleTheme || defaultThemeHook.toggleTheme;

  const [localDatos, setLocalDatos] = useState(null);
  const datos = propDatos !== undefined ? propDatos : localDatos;

  const [seccionActiva, setSeccionActiva] = useState('Todas');
  const [subLiturgia, setSubLiturgia] = useState('Todas');
  const [busqueda, setBusqueda] = useState('');
  const [debouncedBusqueda, setDebouncedBusqueda] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [localTranspositions, setLocalTranspositions] = useState({});
  const transpositions = propTranspositions !== undefined ? propTranspositions : localTranspositions;

  // Cargar dataset de forma asíncrona si no viene provisto por props
  useEffect(() => {
    if (propDatos === undefined) {
      import('../data/cancionero.json').then((m) => {
        setLocalDatos(m.default || m);
      });
    }
  }, [propDatos]);

  // Modales
  const [modalChordsSong, setModalChordsSong] = useState(null); // { titulo, acordes }
  const [liveScrollSong, setLiveScrollSong] = useState(null);

  // Debounce para optimizar la respuesta al escribir en el buscador
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedBusqueda(busqueda.trim().toLowerCase());
    }, 150);
    return () => clearTimeout(handler);
  }, [busqueda]);

  // Precomputar índice de búsqueda en minúsculas una sola vez
  const cancionesConIndice = useMemo(() => {
    if (!datos) return [];
    return datos.canciones.map(c => ({
      ...c,
      _searchStr: `${c.titulo} ${c.subtitulo || ''} ${c.codigo_oasis || ''} ${c.letra_chordpro.join(' ')}`.toLowerCase()
    }));
  }, [datos]);

  const conteos = useMemo(() => {
    const counts = {
      Todas: datos ? datos.canciones.length : 0,
      'Canciones Litúrgicas': 0,
      Varios: 0,
      Movimiento: 0,
      Bajadas: 0,
    };
    if (datos) {
      datos.canciones.forEach(c => {
        if (counts[c.seccion] !== undefined) {
          counts[c.seccion]++;
        }
      });
    }
    return counts;
  }, [datos]);

  const cancionesFiltradas = useMemo(() => {
    if (!datos) return [];
    const q = debouncedBusqueda;
    return cancionesConIndice.filter(c => {
      let matchSec = (seccionActiva === 'Todas') || (c.seccion === seccionActiva);
      if (seccionActiva === 'Canciones Litúrgicas' && subLiturgia !== 'Todas') {
        matchSec = (c.categoria === subLiturgia);
      }
      if (!matchSec) return false;

      if (!q) return true;
      return c._searchStr.includes(q);
    });
  }, [datos, cancionesConIndice, seccionActiva, subLiturgia, debouncedBusqueda]);

  // Si estamos en Canciones Litúrgicas con subLiturgia "Todas", agrupar por categoría
  const esLiturgicoAgrupado = seccionActiva === 'Canciones Litúrgicas' && subLiturgia === 'Todas';

  const gruposLiturgicos = useMemo(() => {
    if (!esLiturgicoAgrupado) return null;
    const grupos = {};
    cancionesFiltradas.forEach(c => {
      const cat = c.categoria || 'Sin categoría';
      if (!grupos[cat]) grupos[cat] = [];
      grupos[cat].push(c);
    });
    return Object.entries(grupos);
  }, [esLiturgicoAgrupado, cancionesFiltradas]);

  // Reiniciar cantidad visible al cambiar sección o término de búsqueda
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [seccionActiva, subLiturgia, debouncedBusqueda]);

  const handleTranspose = (id, delta) => {
    if (propOnTranspose) {
      propOnTranspose(id, delta);
    } else {
      setLocalTranspositions(prev => ({
        ...prev,
        [id]: (prev[id] || 0) + delta
      }));
    }
  };

  const handleResetTranspose = (id) => {
    if (propOnResetTranspose) {
      propOnResetTranspose(id);
    } else {
      setLocalTranspositions(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const handleSelectSeccion = (sec) => {
    setSeccionActiva(sec);
    if (sec !== 'Canciones Litúrgicas') {
      setSubLiturgia('Todas');
    }
  };

  return (
    <div className="min-h-screen bg-base-200/30 text-base-content pb-24">
      {/* Header fijo y barra de búsqueda */}
      <header className="bg-base-100/98 backdrop-blur-md border-b border-base-300/80 shadow-md shadow-black/5 dark:shadow-black/30 sticky top-0 z-30 transition-shadow">
        <Header
          theme={theme}
          toggleTheme={toggleTheme}
          busqueda={busqueda}
          onBusquedaChange={setBusqueda}
          totalCanciones={datos?.total_canciones || 0}
          totalAcordes={datos?.total_acordes || 0}
          cancionesFiltradasCount={cancionesFiltradas.length}
        />

        <NavigationFilter
          seccionActiva={seccionActiva}
          onSelectSeccion={handleSelectSeccion}
          subLiturgia={subLiturgia}
          onSelectSubLiturgia={setSubLiturgia}
          conteos={conteos}
        />
      </header>

      {/* Lista de canciones */}
      <main className="max-w-5xl mx-auto px-4 mt-6">
        {!datos ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-base-content/60">
            <span className="loading loading-spinner loading-md text-[#0066AD]"></span>
            <span className="text-xs font-medium">Cargando cancionero...</span>
          </div>
        ) : cancionesFiltradas.length === 0 ? (
          <div className="bg-base-100 p-12 text-center text-base-content/50 rounded-2xl border border-base-200">
            No se encontraron canciones que coincidan con la búsqueda.
          </div>
        ) : esLiturgicoAgrupado ? (
          <div className="flex flex-col gap-8 pb-8">
            {gruposLiturgicos.map(([categoria, cancionesGrupo]) => (
              <section key={categoria} className="flex flex-col gap-3.5">
                {/* Divisor de categoría litúrgica */}
                <div className="flex items-center gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0066AD]"></span>
                    <h3 className="text-sm sm:text-base font-bold text-base-content tracking-tight uppercase">
                      {categoria}
                    </h3>
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-base-200 text-base-content/60">
                    {cancionesGrupo.length} {cancionesGrupo.length === 1 ? 'canción' : 'canciones'}
                  </span>
                  <div className="flex-1 h-px bg-base-300/80"></div>
                </div>

                {/* Grilla de canciones de la categoría */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                  {cancionesGrupo.map((cancion) => (
                    <SongCard
                      key={cancion.id}
                      cancion={cancion}
                      isDetail={false}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {cancionesFiltradas.slice(0, visibleCount).map((cancion) => (
                <SongCard
                  key={cancion.id}
                  cancion={cancion}
                  isDetail={false}
                />
              ))}
            </div>
            {visibleCount < cancionesFiltradas.length && (
              <div className="flex justify-center pt-6 pb-6">
                <button
                  onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                  className="px-6 py-2.5 rounded-xl font-medium text-xs bg-base-100 hover:bg-base-200 border border-base-300 text-base-content/80 shadow-xs transition-colors cursor-pointer"
                >
                  Cargar más canciones ({cancionesFiltradas.length - visibleCount} restantes)
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Modales */}
      <ChordModal
        isOpen={Boolean(modalChordsSong)}
        onClose={() => setModalChordsSong(null)}
        songTitle={modalChordsSong?.titulo}
        chords={modalChordsSong?.acordes || []}
      />

      <LiveScrollModal
        isOpen={Boolean(liveScrollSong)}
        onClose={() => setLiveScrollSong(null)}
        cancion={liveScrollSong}
        transposeShift={liveScrollSong ? (transpositions[liveScrollSong.id] || 0) : 0}
        onTransposeChange={handleTranspose}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    </div>
  );
}
