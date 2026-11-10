import React, { useState, useEffect, useRef } from 'react';
import { SunIcon, MoonIcon, PlayIcon, PauseIcon, FullscreenIcon, CloseIcon } from './Icons';
import SongLyrics from './SongLyrics';

export default function LiveScrollModal({
  isOpen,
  onClose,
  cancion,
  transposeShift = 0,
  onTransposeChange,
  theme = 'light',
  toggleTheme,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(2); // 1 a 10 (1 = Pausa)
  const [fontSize, setFontSize] = useState(20); // px
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isDark = theme === 'dark';

  const scrollContainerRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const lastTimeRef = useRef(null);
  const scrollSubpixelRef = useRef(0);
  const isAutoScrollingRef = useRef(false);
  const resumeTimeoutRef = useRef(null);
  const userInteractingRef = useRef(false);

  // Reset scroll al abrir
  useEffect(() => {
    if (isOpen) {
      setIsPlaying(false);
      setSpeed(2);
      lastTimeRef.current = null;
      scrollSubpixelRef.current = 0;
      userInteractingRef.current = false;
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    }
  }, [isOpen]);

  const handleSpeedChange = (newSpeed) => {
    const val = Math.max(1, Math.min(10, newSpeed));
    setSpeed(val);
    if (val === 1) {
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
    }
  };

  const handleTogglePlay = () => {
    setIsPlaying(prev => {
      const next = !prev;
      if (!next) {
        setSpeed(1);
      } else if (speed === 1) {
        setSpeed(2);
      }
      return next;
    });
  };

  // Manejo de teclado (Space = toggle play, ESC = salir, flechas = velocidad)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.code === 'Escape') {
        onClose();
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        handleSpeedChange(speed + 1);
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        handleSpeedChange(speed - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, speed]);

  // Motor de Auto-Scroll con requestAnimationFrame suave
  useEffect(() => {
    if (!isPlaying || !isOpen) {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      lastTimeRef.current = null;
      return;
    }

    const scrollLoop = (timestamp) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
      }
      const delta = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      if (!userInteractingRef.current && scrollContainerRef.current) {
        const el = scrollContainerRef.current;
        const pxPerSec = (speed - 1) * 10;
        scrollSubpixelRef.current += pxPerSec * delta;
        isAutoScrollingRef.current = true;
        el.scrollTop = scrollSubpixelRef.current;

        // Si llega al final de la canción, pausar
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 5) {
          setIsPlaying(false);
          setSpeed(1);
          return;
        }
      }

      animFrameIdRef.current = requestAnimationFrame(scrollLoop);
    };

    animFrameIdRef.current = requestAnimationFrame(scrollLoop);
    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isPlaying, isOpen, speed]);

  const toggleNativeFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleUserScroll = () => {
    if (isAutoScrollingRef.current) {
      isAutoScrollingRef.current = false;
      return;
    }
    // Deslizamiento manual del usuario (hacia arriba o hacia abajo)
    userInteractingRef.current = true;
    if (scrollContainerRef.current) {
      scrollSubpixelRef.current = scrollContainerRef.current.scrollTop;
    }
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      userInteractingRef.current = false;
      lastTimeRef.current = null;
    }, 150);
  };

  if (!isOpen || !cancion) return null;

  return (
    <div className="fixed inset-0 z-50 bg-base-100 flex flex-col overflow-hidden select-none">
      {/* Barra superior de título y salida */}
      <div className="navbar bg-base-100 border-b border-base-200 px-4 py-2 flex justify-between shadow-xs">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-base-content">{cancion.titulo}</h2>
            {cancion.codigo_oasis && (
              <span className="text-xs font-semibold text-[#0066AD] bg-[#0066AD]/10 border border-[#0066AD]/30 px-2 py-0.5 rounded-full">
                {cancion.codigo_oasis}
              </span>
            )}
          </div>
          {cancion.subtitulo && (
            <span className="text-xs text-base-content/60 font-medium">{cancion.subtitulo}</span>
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={toggleTheme}
            className="btn btn-sm btn-ghost btn-circle"
            title={isDark ? 'Modo claro' : 'Modo oscuro'}
            aria-label="Alternar modo oscuro"
          >
            {isDark ? (
              <SunIcon className="w-4 h-4 text-warning" />
            ) : (
              <MoonIcon className="w-4 h-4 text-base-content/80" />
            )}
          </button>
          <button
            onClick={toggleNativeFullscreen}
            className="btn btn-sm btn-ghost btn-circle"
            title="Pantalla completa nativa"
            aria-label="Pantalla completa"
          >
            <FullscreenIcon isFullscreen={isFullscreen} className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost" title="Salir" aria-label="Cerrar">
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Contenedor de la canción scrolleable */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-6 py-10 max-w-3xl mx-auto w-full"
        style={{ fontSize: `${fontSize}px` }}
        onScroll={handleUserScroll}
        onTouchStart={() => {
          userInteractingRef.current = true;
          if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
        }}
        onTouchEnd={() => {
          if (scrollContainerRef.current) {
            scrollSubpixelRef.current = scrollContainerRef.current.scrollTop;
          }
          if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
          resumeTimeoutRef.current = setTimeout(() => {
            userInteractingRef.current = false;
            lastTimeRef.current = null;
          }, 150);
        }}
        onMouseDown={() => {
          userInteractingRef.current = true;
          if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
        }}
        onMouseUp={() => {
          if (scrollContainerRef.current) {
            scrollSubpixelRef.current = scrollContainerRef.current.scrollTop;
          }
          if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
          resumeTimeoutRef.current = setTimeout(() => {
            userInteractingRef.current = false;
            lastTimeRef.current = null;
          }, 150);
        }}
      >
        <SongLyrics lineas={cancion.lineas} shift={transposeShift} isLiveMode={true} />

        {/* Espacio final para que la última estrofa pueda subir hasta el centro de pantalla */}
        <div className="h-96"></div>
      </div>

      {/* Barra de control flotante inferior (Dock de DaisyUI) */}
      <div className="bg-base-200/90 backdrop-blur-md border-t border-base-300 px-4 py-2.5 flex items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2">
          {/* Botón Play / Pause */}
          <button
            onClick={handleTogglePlay}
            className={`btn btn-sm btn-circle text-white border-none ${isPlaying ? 'bg-[#00528c]' : 'bg-[#0066AD] hover:bg-[#00528c]'}`}
            title={isPlaying ? 'Pausar (Espacio)' : 'Deslizar (Espacio)'}
            aria-label={isPlaying ? 'Pausar' : 'Deslizar'}
          >
            {isPlaying ? (
              <PauseIcon className="w-4 h-4" />
            ) : (
              <PlayIcon className="w-4 h-4 translate-x-0.5" />
            )}
          </button>

          {/* Slider de Velocidad */}
          <div className="flex items-center gap-2 bg-base-100 px-3 py-1 rounded-full border border-base-300">
            <span className="text-xs font-semibold text-base-content/70">Vel:</span>
            <input
              type="range"
              min="1"
              max="10"
              value={speed}
              onChange={(e) => handleSpeedChange(Number(e.target.value))}
              className="range range-xs accent-[#0066AD] w-24 sm:w-32"
            />
            <span className="text-xs font-bold w-4 text-center text-[#0066AD]">{speed}x</span>
          </div>
        </div>

        {/* Controles de tono y tamaño de texto */}
        <div className="flex items-center gap-2">
          {/* Tono */}
          <div className="join join-horizontal">
            <button
              onClick={() => onTransposeChange(cancion.id, -1)}
              className="btn btn-xs join-item"
              title="Bajar medio tono"
            >
              -1
            </button>
            <span className="btn btn-xs join-item pointer-events-none font-bold text-[#0066AD]">
              {transposeShift > 0 ? `+${transposeShift}` : transposeShift}
            </span>
            <button
              onClick={() => onTransposeChange(cancion.id, 1)}
              className="btn btn-xs join-item"
              title="Subir medio tono"
            >
              +1
            </button>
          </div>

          {/* Zoom tipográfico */}
          <div className="join join-horizontal hidden sm:flex">
            <button
              onClick={() => setFontSize(f => Math.max(14, f - 2))}
              className="btn btn-xs join-item"
              title="Reducir letra"
            >
              A-
            </button>
            <button
              onClick={() => setFontSize(f => Math.min(32, f + 2))}
              className="btn btn-xs join-item"
              title="Aumentar letra"
            >
              A+
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
