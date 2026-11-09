import { useState, useMemo } from 'react';
import datos from '../../cancionero_vite.json';

export default function Cancionero() {
  const [filtro, setFiltro] = useState('Todas');
  const [busqueda, setBusqueda] = useState('');

  const categorias = useMemo(() => {
    const cats = new Set(datos.canciones.map(c => c.categoria_filtro));
    return ['Todas', 'Bajadas', ...Array.from(cats).sort()];
  }, []);

  const cancionesFiltradas = useMemo(() => {
    return datos.canciones.filter(c => {
      const matchCat = filtro === 'Todas' || c.categoria_filtro === filtro;
      const matchTxt = c.titulo.toLowerCase().includes(busqueda.toLowerCase());
      return matchCat && matchTxt;
    });
  }, [filtro, busqueda]);

  return (
    <div className="cancionero-app">
      <header className="cancionero-header">
        <h1>Cancionero MJP</h1>
        <p>{datos.total_canciones} canciones · acordes con coordenadas precisas del PDF</p>
      </header>

      <div className="cancionero-controls">
        <input
          type="text"
          className="buscador"
          placeholder="Buscar canción…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <div className="filtros">
          {categorias.map((cat) => (
            <button
              key={cat}
              className={`chip ${filtro === cat ? 'activo' : ''}`}
              onClick={() => setFiltro(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid">
        {cancionesFiltradas.length === 0 ? (
          <div className="vacio">No se encontraron canciones.</div>
        ) : (
          cancionesFiltradas.map((cancion) => (
            <div key={cancion.id} className="cancion">
              <h2 className="titulo">{cancion.titulo}</h2>
              <div className="meta">
                <span className={`badge ${cancion.categoria_filtro === 'Bajadas' ? 'bajada' : ''}`}>
                  {cancion.categoria_filtro}
                </span>
                <span className="badge">{cancion.codigo_oasis ?? '—'}</span>
                <span className="badge">pág. {cancion.pagina_origen}</span>
              </div>
              <div className="letra-container">
                {cancion.lineas.map((linea, i) => (
                  <div key={i} className="renglon" style={{ width: `${linea.ancho}px` }}>
                    <div className="fila-acordes">
                      {linea.acordes.map((acorde, j) => (
                        <span
                          key={j}
                          className="acorde"
                          style={{ left: `${acorde.x}px` }}
                        >
                          {acorde.texto}
                        </span>
                      ))}
                    </div>
                    <div className="fila-letra">
                      {linea.letras.map((letra, j) => (
                        <span
                          key={j}
                          className="letra"
                          style={{ left: `${letra.x}px` }}
                        >
                          {letra.texto}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
