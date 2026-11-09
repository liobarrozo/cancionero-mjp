import React, { useState, useMemo } from 'react';
import datos from '../data/cancionero.json';
import { useTheme } from '../hooks/useTheme';
import { transposeChordGroup } from '../utils/transposition';
import Header from './Header';
import NavigationFilter from './NavigationFilter';
import SongCard from './SongCard';
import ChordModal from './ChordModal';
import LiveScrollModal from './LiveScrollModal';
import './Cancionero.css';

export default function Cancionero() {
  const { theme, toggleTheme } = useTheme();

  const [seccionActiva, setSeccionActiva] = useState('Todas');
  const [subLiturgia, setSubLiturgia] = useState('Todas');
  const [busqueda, setBusqueda] = useState('');
  const [transpositions, setTranspositions] = useState({});

  // Modales
  const [modalChordsSong, setModalChordsSong] = useState(null); // { titulo, acordes }
  const [liveScrollSong, setLiveScrollSong] = useState(null);

  const conteos = useMemo(() => {
    const counts = {
      Todas: datos.canciones.length,
      'Cantos Litúrgicos': 0,
      Varios: 0,
      Movimiento: 0,
      Bajadas: 0,
    };
    datos.canciones.forEach(c => {
      if (counts[c.seccion] !== undefined) {
        counts[c.seccion]++;
      }
    });
    return counts;
  }, []);

  const cancionesFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return datos.canciones.filter(c => {
      let matchSec = (seccionActiva === 'Todas') || (c.seccion === seccionActiva);
      if (seccionActiva === 'Cantos Litúrgicos' && subLiturgia !== 'Todas') {
        matchSec = (c.categoria === subLiturgia);
      }
      if (!matchSec) return false;

      if (!q) return true;
      const tit = c.titulo.toLowerCase();
      const oasis = (c.codigo_oasis || '').toLowerCase();
      const lyrics = c.letra_chordpro.join(' ').toLowerCase();
      return tit.includes(q) || oasis.includes(q) || lyrics.includes(q);
    });
  }, [seccionActiva, subLiturgia, busqueda]);

  const handleTranspose = (id, delta) => {
    setTranspositions(prev => ({
      ...prev,
      [id]: (prev[id] || 0) + delta
    }));
  };

  const handleResetTranspose = (id) => {
    setTranspositions(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleSelectSeccion = (sec) => {
    setSeccionActiva(sec);
    if (sec !== 'Cantos Litúrgicos') {
      setSubLiturgia('Todas');
    }
  };

  return (
    <div className="min-h-screen bg-base-200/30 text-base-content pb-24">
      {/* Header fijo y barra de búsqueda */}
      <header className="bg-base-100/95 backdrop-blur-md border-b border-base-200/80 sticky top-0 z-30">
        <Header
          theme={theme}
          toggleTheme={toggleTheme}
          busqueda={busqueda}
          onBusquedaChange={setBusqueda}
          totalCanciones={datos.total_canciones}
          totalAcordes={datos.total_acordes}
          cantosFiltradosCount={cancionesFiltradas.length}
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
      <main className="max-w-4xl mx-auto px-4 mt-6 flex flex-col gap-5">
        {cancionesFiltradas.length === 0 ? (
          <div className="bg-base-100 p-12 text-center text-base-content/50 rounded-2xl border border-base-200">
            No se encontraron canciones que coincidan con la búsqueda.
          </div>
        ) : (
          cancionesFiltradas.map((cancion) => (
            <SongCard
              key={cancion.id}
              cancion={cancion}
              shift={transpositions[cancion.id] || 0}
              onTranspose={handleTranspose}
              onResetTranspose={handleResetTranspose}
              onOpenDiagrams={setModalChordsSong}
              onOpenLiveScroll={setLiveScrollSong}
            />
          ))
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
        transposeChordFn={transposeChordGroup}
      />
    </div>
  );
}
