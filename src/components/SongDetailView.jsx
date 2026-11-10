import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { findSongBySlug } from '../utils/slug';
import SongCard from './SongCard';
import ChordModal from './ChordModal';
import LiveScrollModal from './LiveScrollModal';
import ShareModal from './ShareModal';
import { ArrowLeftIcon, ShareIcon, SunIcon, MoonIcon } from './Icons';

export default function SongDetailView({
  datos,
  theme,
  toggleTheme,
  transpositions,
  onTranspose,
  onResetTranspose,
}) {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [modalChordsSong, setModalChordsSong] = useState(null);
  const [liveScrollSong, setLiveScrollSong] = useState(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const cancion = findSongBySlug(datos?.canciones, slug);

  // Actualizar el título de la página
  useEffect(() => {
    if (cancion) {
      document.title = `${cancion.titulo} — Cancionero MJP`;
    } else {
      document.title = 'Cancionero MJP';
    }
    return () => {
      document.title = 'Cancionero MJP';
    };
  }, [cancion]);

  // Si cambia de canción, volver arriba en la pantalla
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [slug]);

  return (
    <div className="min-h-screen bg-base-200/30 text-base-content pb-24">
      {/* Barra de navegación superior fija */}
      <header className="bg-base-100/98 backdrop-blur-md border-b border-base-300/80 shadow-md shadow-black/5 dark:shadow-black/30 sticky top-0 z-30 transition-shadow">
        <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          {/* Logo y título con botón para volver */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group cursor-pointer select-none shrink-0"
            title="Volver al inicio"
          >
            <img
              src={theme === 'dark' ? '/logos/mjp-white.png' : '/logos/escudo.png'}
              alt="Logo MJP"
              className="h-8 sm:h-9 w-auto object-contain transition-transform group-hover:scale-105"
            />
            <span className="text-lg sm:text-2xl font-black tracking-tight text-base-content leading-none">
              Cancionero <span className="text-[#0066AD]">MJP</span>
            </span>
          </Link>

          {/* Acciones: Volver, Compartir y Tema */}
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-base-300 bg-base-100 hover:bg-base-200 text-base-content/80 transition-all cursor-pointer"
              title="Volver al listado"
            >
              <ArrowLeftIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Volver</span>
            </Link>

            <button
              onClick={() => setShareModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-base-300 bg-base-100 hover:bg-base-200 text-base-content/80 transition-all cursor-pointer"
              title="Compartir canción"
            >
              <ShareIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Compartir</span>
            </button>

            <button
              onClick={toggleTheme}
              className="btn btn-sm btn-ghost btn-circle text-base-content/70 hover:text-[#0066AD] transition-colors shrink-0"
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
      </header>

      {/* Contenido principal */}
      <main className="max-w-4xl mx-auto px-4 mt-6">
        {!datos ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-base-content/60">
            <span className="loading loading-spinner loading-md text-[#0066AD]"></span>
            <span className="text-xs font-medium">Cargando canción...</span>
          </div>
        ) : !cancion ? (
          <div className="bg-base-100 p-12 text-center rounded-2xl border border-base-200 shadow-none flex flex-col items-center gap-4">
            <div className="text-4xl">🎵</div>
            <div>
              <h2 className="text-lg font-bold text-base-content">Canción no encontrada</h2>
              <p className="text-xs text-base-content/60 mt-1 max-w-sm">
                No pudimos encontrar la canción con el identificador «{slug}». Puede haber sido modificada o no existir.
              </p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="mt-2 px-5 py-2 rounded-xl text-xs font-semibold bg-[#0066AD] hover:bg-[#00528c] text-white transition-colors cursor-pointer"
            >
              ← Volver al cancionero
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <SongCard
              cancion={cancion}
              isDetail={true}
              shift={transpositions[cancion.id] || 0}
              onTranspose={onTranspose}
              onResetTranspose={onResetTranspose}
              onOpenDiagrams={setModalChordsSong}
              onOpenLiveScroll={setLiveScrollSong}
            />
          </div>
        )}
      </main>

      {/* Modales */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        cancion={cancion}
      />

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
        onTransposeChange={onTranspose}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    </div>
  );
}
