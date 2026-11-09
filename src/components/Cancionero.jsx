import React, { useState, useEffect, useMemo } from 'react';
import datos from '../data/cancionero.json';
import ChordModal from './ChordModal';
import LiveScrollModal from './LiveScrollModal';
import { SunIcon, MoonIcon, GuitarIcon, PlayIcon } from './Icons';
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
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('cancionero_theme') ||
      (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cancionero_theme', theme);
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', theme === 'dark' ? '#1d232a' : '#285628');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(t => (t === 'dark' ? 'light' : 'dark'));
  };

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
    <div className="min-h-screen bg-base-200/30 text-base-content pb-24">
      {/* Barra superior minimalista con logo oficial y buscador */}
      <header className="bg-base-100/95 backdrop-blur-md border-b border-base-200/80 sticky top-0 z-30">
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
                  Cancionero <span className="text-[#26A62F]">MJP</span>
                </h1>
                <p className="text-[11px] text-base-content/50 font-medium hidden sm:block">
                  {datos.total_canciones} cantos · {datos.total_acordes} acordes
                </p>
              </div>
            </div>
            <div className="text-xs font-semibold px-2 py-0.5 rounded-full border border-base-300 text-base-content/60 sm:hidden">
              {cancionesFiltradas.length} cantos
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex-1 sm:w-72">
              <input
                type="text"
                className="input input-sm sm:input-md w-full rounded-xl bg-base-200/50 hover:bg-base-200/80 focus:bg-base-100 border border-base-300/80 focus:border-[#26A62F] focus:outline-none focus:ring-1 focus:ring-[#26A62F] transition-all text-xs sm:text-sm"
                placeholder="Buscar por título, letra, O.xxx..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <button
              onClick={toggleTheme}
              className="btn btn-sm sm:btn-md btn-ghost btn-circle text-base-content/70 hover:text-[#26A62F] transition-colors"
              title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              aria-label="Alternar modo oscuro o claro"
            >
              {theme === 'dark' ? (
                <SunIcon className="w-5 h-5 text-[#26A62F]" />
              ) : (
                <MoonIcon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Pestañas de Secciones Minimalistas */}
        <div className="max-w-4xl mx-auto px-4 pb-2.5 pt-1 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 min-w-max">
            {['Todas', 'Cantos Litúrgicos', 'Varios', 'Movimiento', 'Bajadas'].map(sec => (
              <button
                key={sec}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  seccionActiva === sec
                    ? 'bg-[#26A62F] text-white font-semibold shadow-xs'
                    : 'text-base-content/70 hover:text-base-content hover:bg-base-200/60'
                }`}
                onClick={() => handleSeccionClick(sec)}
              >
                {sec} {sec === 'Todas' ? `(${conteos.Todas})` : `(${conteos[sec] || 0})`}
              </button>
            ))}
          </div>

          {/* Subfiltros Litúrgicos */}
          {seccionActiva === 'Cantos Litúrgicos' && (
            <div className="flex flex-wrap gap-1 mt-2.5 pt-2 border-t border-base-200/70">
              <button
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                  subLiturgia === 'Todas'
                    ? 'bg-[#26A62F] text-white font-semibold'
                    : 'bg-base-200/60 text-base-content/70 hover:text-base-content'
                }`}
                onClick={() => setSubLiturgia('Todas')}
              >
                Todas las litúrgicas
              </button>
              {LITURGICAS.map(cat => (
                <button
                  key={cat}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                    subLiturgia === cat
                      ? 'bg-[#26A62F] text-white font-semibold'
                      : 'bg-base-200/60 text-base-content/70 hover:text-base-content'
                  }`}
                  onClick={() => setSubLiturgia(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Nota de Bajadas */}
          {seccionActiva === 'Bajadas' && (
            <div className="text-xs text-[#26A62F] font-medium mt-2 pt-1 border-t border-base-200/70">
              Bajadas: agrupadas por año, próximamente a definir
            </div>
          )}
        </div>
      </header>

      {/* Grid de Canciones */}
      <main className="max-w-4xl mx-auto px-4 mt-6 flex flex-col gap-5">
        {cancionesFiltradas.length === 0 ? (
          <div className="bg-base-100 p-12 text-center text-base-content/50 rounded-2xl border border-base-200">
            No se encontraron canciones que coincidan con la búsqueda.
          </div>
        ) : (
          cancionesFiltradas.map((cancion) => {
            const shift = transpositions[cancion.id] || 0;

            let badgeLabel = `Litúrgico · ${cancion.categoria}`;
            if (cancion.seccion === 'Movimiento') {
              badgeLabel = 'Movimiento';
            } else if (cancion.seccion === 'Bajadas') {
              badgeLabel = 'Bajada';
            } else if (cancion.seccion === 'Varios') {
              badgeLabel = 'Varios';
            }

            // Acordes transpuestos para la barra de acordes inicial
            const uniqueChords = cancion.acordes || [];
            const transposedChords = uniqueChords.map(c => transposeChordGroup(c, shift));

            return (
              <article
                key={cancion.id}
                className="bg-base-100 border border-base-200/90 rounded-2xl p-5 sm:p-7 shadow-none hover:border-[#26A62F]/30 transition-colors"
              >
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
                      <span className="text-[11px] font-bold text-[#26A62F] bg-[#26A62F]/10 border border-[#26A62F]/25 px-2.5 py-0.5 rounded-full">
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
                        onClick={() => setModalChordsSong({ titulo: cancion.titulo, acordes: transposedChords })}
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
                      onClick={() => handleTranspose(cancion.id, -1)}
                      className="w-6 h-6 flex items-center justify-center rounded border border-base-300 text-base-content hover:border-[#26A62F] transition-colors"
                      title="Bajar medio tono"
                    >
                      -1
                    </button>
                    <span className="font-bold text-xs w-5 text-center text-[#26A62F]">
                      {shift > 0 ? `+${shift}` : shift}
                    </span>
                    <button
                      onClick={() => handleTranspose(cancion.id, 1)}
                      className="w-6 h-6 flex items-center justify-center rounded border border-base-300 text-base-content hover:border-[#26A62F] transition-colors"
                      title="Subir medio tono"
                    >
                      +1
                    </button>
                    {shift !== 0 && (
                      <button
                        onClick={() => handleResetTranspose(cancion.id)}
                        className="text-xs text-base-content/50 hover:text-[#26A62F] transition-colors ml-1"
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
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-base-content/75 hover:text-[#26A62F] hover:bg-[#26A62F]/10 transition-colors cursor-pointer"
                        title="Ver digitación de acordes"
                      >
                        <GuitarIcon className="w-3.5 h-3.5" />
                        <span>Diagramas</span>
                      </button>
                    )}
                    <button
                      onClick={() => setLiveScrollSong(cancion)}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-[#26A62F] hover:bg-[#1f8726] text-white transition-colors cursor-pointer"
                      title="Abrir en pantalla completa con deslizamiento automático"
                    >
                      <PlayIcon className="w-3 h-3" />
                      <span>En vivo</span>
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
                        <div key={lIdx} className={`font-bold text-xs tracking-wider text-[#26A62F] my-2 ${stanzaClass}`}>
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
                        <div key={lIdx} className={`flex gap-3 my-0.5 text-[#26A62F] font-bold text-[0.9em] ${stanzaClass}`}>
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
                                  className="absolute top-0.5 font-bold text-[#26A62F] text-[0.84em] leading-none select-none"
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
