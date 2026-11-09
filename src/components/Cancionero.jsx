import { useState, useMemo } from 'react';
import datos from '../data/cancionero.json';
import './Cancionero.css';

const CHORDS_SHARP = ['DO', 'DO#', 'RE', 'RE#', 'MI', 'FA', 'FA#', 'SOL', 'SOL#', 'LA', 'SIb', 'SI'];
const CHORDS_FLAT  = ['DO', 'REb', 'RE', 'MIb', 'MI', 'FA', 'SOLb', 'SOL', 'LAb', 'LA', 'SIb', 'SI'];
const CHORDS_ENG   = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];

const LITURGICAS = [
  'Entradas', 'Penitenciales', 'Gloria', 'Aleluya', 'Ofertorio',
  'Santo', 'Padre Nuestro', 'Cordero', 'Comunión', 'Meditación', 'Salida'
];

function transposeSingleChord(chord, steps) {
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

function transposeChordGroup(group, steps) {
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
    <div className="cancionero-app">
      <header className="cancionero-header">
        <h1>Cancionero MJP</h1>
        <p>Categorías tradicionales · Tipografía DM Sans y acordes con alineación milimétrica</p>
        <div className="stats-pill">
          <span>{datos.total_canciones} canciones</span>
          <span>{datos.total_acordes} acordes</span>
          <span>Cantos Litúrgicos ({conteos['Cantos Litúrgicos']}) · Varios ({conteos['Varios']}) · Movimiento ({conteos['Movimiento']}) · Bajadas ({conteos['Bajadas']})</span>
        </div>
      </header>

      <div className="cancionero-controls">
        <input
          type="text"
          className="buscador"
          placeholder="Buscar por título, letra o código Oasis (ej: O.308, Cristo joven, pan)..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        <div className="filtros-secciones">
          <button
            className={`tab-sec ${seccionActiva === 'Todas' ? 'activo' : ''}`}
            onClick={() => handleSeccionClick('Todas')}
          >
            Todas ({conteos.Todas})
          </button>
          <button
            className={`tab-sec ${seccionActiva === 'Cantos Litúrgicos' ? 'activo' : ''}`}
            onClick={() => handleSeccionClick('Cantos Litúrgicos')}
          >
            Cantos Litúrgicos ({conteos['Cantos Litúrgicos']})
          </button>
          <button
            className={`tab-sec ${seccionActiva === 'Varios' ? 'activo' : ''}`}
            onClick={() => handleSeccionClick('Varios')}
          >
            Varios ({conteos['Varios']})
          </button>
          <button
            className={`tab-sec ${seccionActiva === 'Movimiento' ? 'activo' : ''}`}
            onClick={() => handleSeccionClick('Movimiento')}
          >
            Movimiento ({conteos['Movimiento']})
          </button>
          <button
            className={`tab-sec ${seccionActiva === 'Bajadas' ? 'activo' : ''}`}
            onClick={() => handleSeccionClick('Bajadas')}
          >
            Bajadas ({conteos['Bajadas']})
          </button>
        </div>

        {seccionActiva === 'Cantos Litúrgicos' && (
          <div className="filtros-subliturgia">
            <button
              className={`chip-sub ${subLiturgia === 'Todas' ? 'activo' : ''}`}
              onClick={() => setSubLiturgia('Todas')}
            >
              Todas las litúrgicas
            </button>
            {LITURGICAS.map(cat => (
              <button
                key={cat}
                className={`chip-sub ${subLiturgia === cat ? 'activo' : ''}`}
                onClick={() => setSubLiturgia(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {seccionActiva === 'Bajadas' && (
          <div className="bajada-nota">
            Bajadas: agrupadas por año, próximamente a definir
          </div>
        )}
      </div>

      <main className="grid">
        {cancionesFiltradas.length === 0 ? (
          <div className="vacio">No se encontraron canciones que coincidan con la búsqueda.</div>
        ) : (
          cancionesFiltradas.map((cancion) => {
            const shift = transpositions[cancion.id] || 0;

            let badgeClass = 'liturgico';
            let badgeLabel = `Litúrgico · ${cancion.categoria}`;
            if (cancion.seccion === 'Movimiento') {
              badgeClass = 'movimiento';
              badgeLabel = 'Movimiento';
            } else if (cancion.seccion === 'Bajadas') {
              badgeClass = 'bajada';
              badgeLabel = 'Bajada';
            } else if (cancion.seccion === 'Varios') {
              badgeClass = 'varios';
              badgeLabel = 'Varios';
            }

            return (
              <article key={cancion.id} className="cancion-card">
                <header className="cancion-head">
                  <div>
                    <h2 className="cancion-titulo">{cancion.titulo}</h2>
                    {cancion.subtitulo && (
                      <div className="subtitulo">{cancion.subtitulo}</div>
                    )}
                  </div>
                  <div className="cancion-badges">
                    <span className={`badge ${badgeClass}`}>
                      {badgeLabel}
                    </span>
                    {cancion.codigo_oasis && (
                      <span className="badge oasis">{cancion.codigo_oasis}</span>
                    )}
                    <span className="badge pag">pág. {cancion.pagina_origen}</span>
                  </div>
                </header>

                <div className="transposer-bar">
                  <span className="transpose-label">Tono:</span>
                  <button className="btn-transpose" onClick={() => handleTranspose(cancion.id, -1)}>-1</button>
                  <span className="transpose-val">{shift > 0 ? `+${shift}` : shift}</span>
                  <button className="btn-transpose" onClick={() => handleTranspose(cancion.id, 1)}>+1</button>
                  {shift !== 0 && (
                    <button className="btn-reset" onClick={() => handleResetTranspose(cancion.id)}>Reset</button>
                  )}
                </div>

                <div className="cancion-cuerpo">
                  {cancion.lineas.map((linea, lIdx) => {
                    const textOnly = linea.segmentos.map(s => s.letra).join('').trim();
                    const hasChords = linea.segmentos.some(s => (s.acorde || '').trim() !== '');

                    if (!hasChords && (textOnly === '[ESTRIBILLO]' || textOnly === 'ESTRIBILLO' || textOnly === 'CORO')) {
                      return (
                        <div key={lIdx} className="renglon marcador">
                          {textOnly}
                        </div>
                      );
                    }

                    if (!hasChords) {
                      return (
                        <div key={lIdx} className="renglon sin-acordes">
                          <span className="letra">{textOnly}</span>
                        </div>
                      );
                    }

                    if (linea.tipo === 'acordes') {
                      return (
                        <div key={lIdx} className="renglon tipo-solo-acordes">
                          {linea.segmentos
                            .filter(s => (s.acorde || '').trim() !== '')
                            .map((s, sIdx) => (
                              <span key={sIdx} className="acorde-inline">
                                {transposeChordGroup(s.acorde.trim(), shift)}
                              </span>
                            ))}
                        </div>
                      );
                    }

                    return (
                      <div key={lIdx} className="renglon con-acordes">
                        {linea.segmentos.map((s, sIdx) => {
                          const chord = s.acorde ? transposeChordGroup(s.acorde.trim(), shift) : '';
                          const offset = s.offset || 0;
                          return (
                            <span key={sIdx} className="bloque-acorde">
                              {chord && (
                                <span
                                  className="acorde"
                                  style={offset ? { left: `${offset}em` } : undefined}
                                >
                                  {chord}
                                </span>
                              )}
                              <span className="letra">{s.letra || '\u00A0'}</span>
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
    </div>
  );
}
