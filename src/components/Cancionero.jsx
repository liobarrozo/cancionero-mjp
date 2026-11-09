import React, { useState, useMemo } from 'react';
import datos from '../data/cancionero.json';
import ChordModal from './ChordModal';
import LiveScrollModal from './LiveScrollModal';
import './Cancionero.css';

const CHORDS_SHARP = ['DO', 'DO#', 'RE', 'RE#', 'MI', 'FA', 'FA#', 'SOL', 'SOL#', 'LA', 'SIb', 'SI'];
const CHORDS_FLAT  = ['DO', 'REb', 'RE', 'MIb', 'MI', 'FA', 'SOLb', 'SOL', 'LAb', 'LA', 'SIb', 'SI'];
const CHORDS_ENG   = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];

const LITURGICAS = [
  'Entradas', 'Penitenciales', 'Gloria', 'Aleluya', 'Ofertorio',
  'Santo', 'Padre Nuestro', 'Cordero', 'Comunión', 'Meditación', 'Salida'
];

export function transposeSingleChord(chord, steps) {
  if (!chord || steps === 0) return chord;
  const m = chord.match(/^(DO#?|RE#?|MI#?|FA#?|SOL#?|LA#?|SI#?|REb|MIb|SOLb|LAb|SIb|[A-G][#b]?)(.*)$/i);
  if (!m) return chord;
  const root = m[1].toUpperCase().replace('B', 'b');
  const suffix = m[2];

  let idx = CHORDS_SHARP.indexOf(root);
  if (idx === -1) idx = CHORDS_FLAT.indexOf(root);
  if (idx === -1) idx = CHORDS_ENG.indexOf(root);
  if (idx === -1) return chord;

  let newIdx = (idx + steps) % 12;
  if (newIdx < 0) newIdx += 12;
  return CHORDS_SHARP[newIdx] + suffix;
}

export function transposeChordGroup(group, steps) {
  if (!group || steps === 0) return group;
  return group
    .split(/(\s+)/)
    .map(tok => (/^\s+$/.test(tok) ? tok : transposeSingleChord(tok, steps)))
    .join('');
}

export default function Cancionero() {
  const [seccionActiva, setSeccionActiva] = useState('Todas');
  const [subLiturgia, setSubLiturgia] = useState('Todas');
  const [busqueda, setBusqueda] = useState('');
  const [transpositions, setTranspositions] = useState({});

  // Estados para modales
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

  const handleSeccionClick = (sec) => {
    setSeccionActiva(sec);
    if (sec !== 'Cantos Litúrgicos') {
      setSubLiturgia('Todas');
    }
  };

  return (
    <div className="min-h-screen bg-base-200/40 text-base-content pb-20">
      {/* Barra superior con navegación y buscador */}
      <header className="bg-base-100 border-b border-base-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-primary">Cancionero MJP</h1>
              <p className="text-xs text-base-content/60 hidden sm:block">
                {datos.total_canciones} canciones · {datos.total_acordes} acordes
              </p>
            </div>
            <div className="badge badge-outline badge-sm sm:hidden font-semibold">
              {cancionesFiltradas.length} cantos
            </div>
          </div>

          <div className="w-full sm:w-80">
            <input
              type="text"
              className="input input-sm sm:input-md input-bordered w-full rounded-xl bg-base-200/50 focus:bg-base-100"
              placeholder="Buscar por título, letra, código O.xxx..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        {/* Pestañas de Secciones */}
        <div className="max-w-4xl mx-auto px-4 pb-2.5 pt-1 overflow-x-auto no-scrollbar">
          <div className="flex gap-1.5 min-w-max">
            <button
              className={`btn btn-xs sm:btn-sm rounded-lg ${seccionActiva === 'Todas' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => handleSeccionClick('Todas')}
            >
              Todas ({conteos.Todas})
            </button>
            <button
              className={`btn btn-xs sm:btn-sm rounded-lg ${seccionActiva === 'Cantos Litúrgicos' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => handleSeccionClick('Cantos Litúrgicos')}
            >
              Cantos Litúrgicos ({conteos['Cantos Litúrgicos']})
            </button>
            <button
              className={`btn btn-xs sm:btn-sm rounded-lg ${seccionActiva === 'Varios' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => handleSeccionClick('Varios')}
            >
              Varios ({conteos['Varios']})
            </button>
            <button
              className={`btn btn-xs sm:btn-sm rounded-lg ${seccionActiva === 'Movimiento' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => handleSeccionClick('Movimiento')}
            >
              Movimiento ({conteos['Movimiento']})
            </button>
            <button
              className={`btn btn-xs sm:btn-sm rounded-lg ${seccionActiva === 'Bajadas' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => handleSeccionClick('Bajadas')}
            >
              Bajadas ({conteos['Bajadas']})
            </button>
          </div>

          {/* Subfiltros Litúrgicos */}
          {seccionActiva === 'Cantos Litúrgicos' && (
            <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-base-200">
              <button
                className={`badge badge-sm cursor-pointer ${subLiturgia === 'Todas' ? 'badge-primary' : 'badge-ghost'}`}
                onClick={() => setSubLiturgia('Todas')}
              >
                Todas las litúrgicas
              </button>
              {LITURGICAS.map(cat => (
                <button
                  key={cat}
                  className={`badge badge-sm cursor-pointer ${subLiturgia === cat ? 'badge-primary' : 'badge-ghost'}`}
                  onClick={() => setSubLiturgia(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Nota de Bajadas */}
          {seccionActiva === 'Bajadas' && (
            <div className="text-xs text-secondary font-semibold mt-2 pt-1 border-t border-base-200">
              Bajadas: agrupadas por año, próximamente a definir
            </div>
          )}
        </div>
      </header>

      {/* Grid de Canciones */}
      <main className="max-w-4xl mx-auto px-4 mt-6 flex flex-col gap-5">
        {cancionesFiltradas.length === 0 ? (
          <div className="card bg-base-100 p-12 text-center text-base-content/60 shadow-sm border border-base-200">
            No se encontraron canciones que coincidan con la búsqueda.
          </div>
        ) : (
          cancionesFiltradas.map((cancion) => {
            const shift = transpositions[cancion.id] || 0;

            let badgeClass = 'badge-info';
            let badgeLabel = `Litúrgico · ${cancion.categoria}`;
            if (cancion.seccion === 'Movimiento') {
              badgeClass = 'badge-accent';
              badgeLabel = 'Movimiento';
            } else if (cancion.seccion === 'Bajadas') {
              badgeClass = 'badge-secondary';
              badgeLabel = 'Bajada';
            } else if (cancion.seccion === 'Varios') {
              badgeClass = 'badge-ghost';
              badgeLabel = 'Varios';
            }

            // Acordes transpuestos para la barra de acordes inicial
            const uniqueChords = cancion.acordes || [];
            const transposedChords = uniqueChords.map(c => transposeChordGroup(c, shift));

            return (
              <article key={cancion.id} className="card bg-base-100 shadow-sm border border-base-200 p-5 sm:p-6 rounded-2xl">
                {/* Cabecera de la canción */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-base-200/80 pb-3">
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
                    <span className={`badge ${badgeClass} font-semibold text-xs`}>
                      {badgeLabel}
                    </span>
                    {cancion.codigo_oasis && (
                      <span className="badge badge-success font-bold text-xs">
                        {cancion.codigo_oasis}
                      </span>
                    )}
                  </div>
                </div>

                {/* Acordes utilizados al principio de la canción */}
                {uniqueChords.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-1">
                    <span className="text-xs font-semibold text-base-content/60 mr-1">Acordes:</span>
                    {transposedChords.map((ch, chIdx) => (
                      <button
                        key={chIdx}
                        onClick={() => setModalChordsSong({ titulo: cancion.titulo, acordes: transposedChords })}
                        className="badge badge-sm badge-outline font-bold text-[#285628] hover:badge-primary transition-all cursor-pointer"
                        title="Ver diagrama de digitación"
                      >
                        {ch}
                      </button>
                    ))}
                  </div>
                )}

                {/* Barra de herramientas: Tono, Diagramas y Pantalla Completa / Auto-scroll */}
                <div className="flex flex-wrap items-center justify-between gap-2 my-3 p-2 bg-base-200/50 rounded-xl">
                  {/* Transposición */}
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold text-base-content/60 mr-1">Tono:</span>
                    <button
                      onClick={() => handleTranspose(cancion.id, -1)}
                      className="btn btn-xs btn-outline rounded-sm"
                      title="Bajar medio tono"
                    >
                      -1
                    </button>
                    <span className="text-xs font-bold w-6 text-center text-primary">
                      {shift > 0 ? `+${shift}` : shift}
                    </span>
                    <button
                      onClick={() => handleTranspose(cancion.id, 1)}
                      className="btn btn-xs btn-outline rounded-sm"
                      title="Subir medio tono"
                    >
                      +1
                    </button>
                    {shift !== 0 && (
                      <button
                        onClick={() => handleResetTranspose(cancion.id)}
                        className="btn btn-xs btn-ghost text-xs"
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  {/* Acciones principales */}
                  <div className="flex items-center gap-2">
                    {uniqueChords.length > 0 && (
                      <button
                        onClick={() => setModalChordsSong({ titulo: cancion.titulo, acordes: transposedChords })}
                        className="btn btn-xs btn-ghost text-primary gap-1 font-semibold"
                        title="Ver digitación de acordes"
                      >
                        🎸 Diagramas
                      </button>
                    )}
                    <button
                      onClick={() => setLiveScrollSong(cancion)}
                      className="btn btn-xs btn-primary gap-1 font-semibold"
                      title="Abrir en pantalla completa con deslizamiento automático"
                    >
                      ▶ En vivo / Scroll
                    </button>
                  </div>
                </div>

                {/* Letra y acordes con espaciado vertical milimétrico */}
                <div className="cuerpo-cancion font-['DM_Sans',sans-serif] text-[15px] sm:text-[16px]">
                  {cancion.lineas.map((linea, lIdx) => {
                    const textOnly = linea.segmentos.map(s => s.letra).join('').trim();
                    const hasChords = linea.segmentos.some(s => (s.acorde || '').trim() !== '');
                    const isMarker = !hasChords && (textOnly === '[ESTRIBILLO]' || textOnly === 'ESTRIBILLO' || textOnly === 'CORO');

                    const stanzaClass = linea.salto_previo ? 'mt-4 sm:mt-5' : '';

                    if (isMarker) {
                      return (
                        <div key={lIdx} className={`font-bold text-xs tracking-wider text-base-content/60 my-2 ${stanzaClass}`}>
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
                        <div key={lIdx} className={`flex gap-3 my-0.5 text-[#285628] font-bold text-[0.9em] ${stanzaClass}`}>
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
                            <span key={sIdx} className="inline-block relative pt-4.5 align-bottom">
                              {chord && (
                                <span
                                  className="absolute top-0.5 font-bold text-[#285628] text-[0.84em] leading-none select-none"
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
              </article>
            );
          })
        )}
      </main>

      {/* Modal de diagramas de acordes */}
      <ChordModal
        isOpen={Boolean(modalChordsSong)}
        onClose={() => setModalChordsSong(null)}
        songTitle={modalChordsSong?.titulo}
        chords={modalChordsSong?.acordes || []}
      />

      {/* Modal de modo en vivo con auto-scroll */}
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
