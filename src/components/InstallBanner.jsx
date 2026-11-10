import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DownloadIcon, CloseIcon, IosShareIcon } from './Icons';

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showIosModal, setShowIosModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [sessionDismissed, setSessionDismissed] = useState(false);

  // Detección de standalone / ya instalado
  const [isInstalled, setIsInstalled] = useState(() => {
    if (typeof window === 'undefined') return false;
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.startsWith('android-app://');

    if (standalone) {
      try {
        localStorage.setItem('cancionero_app_installed', 'true');
      } catch (_) {}
      return true;
    }

    try {
      return localStorage.getItem('cancionero_app_installed') === 'true';
    } catch (_) {
      return false;
    }
  });

  // Detección de "No volver a preguntar"
  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem('cancionero_install_dismissed') === 'true';
    } catch (_) {
      return false;
    }
  });

  const isIOS =
    typeof navigator !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !window.MSStream;

  const isMobile =
    typeof navigator !== 'undefined' &&
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      try {
        localStorage.setItem('cancionero_app_installed', 'true');
      } catch (_) {}
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Bloquear scroll del body al abrir cualquier modal
  useEffect(() => {
    if (showIosModal || showHelpModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showIosModal, showHelpModal]);

  // Por defecto se debe mostrar salvo que ya esté instalado o descartado
  if (isInstalled || isDismissed || sessionDismissed) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIosModal(true);
      return;
    }

    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
          try {
            localStorage.setItem('cancionero_app_installed', 'true');
          } catch (_) {}
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.warn('Install prompt error:', err);
      }
    } else {
      setShowHelpModal(true);
    }
  };

  const handleNeverAskAgain = () => {
    try {
      localStorage.setItem('cancionero_install_dismissed', 'true');
    } catch (_) {}
    setIsDismissed(true);
    setShowIosModal(false);
    setShowHelpModal(false);
  };

  const renderModal = () => {
    if (typeof document === 'undefined') return null;

    if (showIosModal) {
      return createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => setShowIosModal(false)}
        >
          <div
            className="bg-base-100 rounded-2xl w-full max-w-sm sm:max-w-md p-5 border border-base-300 shadow-2xl flex flex-col gap-4 text-base-content animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-1 border-b border-base-200">
              <div className="flex items-center gap-2">
                <DownloadIcon className="w-5 h-5 text-[#0066AD]" />
                <h3 className="font-bold text-base sm:text-lg">Instalar en tu iPhone o iPad</h3>
              </div>
              <button
                onClick={() => setShowIosModal(false)}
                className="btn btn-xs btn-ghost btn-circle text-base-content/60 hover:text-base-content cursor-pointer"
                aria-label="Cerrar modal"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-base-content/80">
              En Safari podés añadir el cancionero a tu pantalla de inicio siguiendo estos 2 pasos:
            </p>

            <div className="flex flex-col gap-3 bg-base-200/50 p-3.5 rounded-xl border border-base-300/60 text-xs sm:text-sm">
              <div className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#0066AD] text-white font-bold text-xs shrink-0">
                  1
                </span>
                <div className="flex-1 leading-snug">
                  Tocá el botón <strong className="text-base-content">Compartir</strong> de Safari en la barra inferior{' '}
                  <span className="inline-flex items-center justify-center p-1 rounded bg-base-300 text-[#0066AD] align-middle">
                    <IosShareIcon className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#0066AD] text-white font-bold text-xs shrink-0">
                  2
                </span>
                <div className="flex-1 leading-snug">
                  Buscá en el menú y elegí <strong className="text-base-content">"Agregar a pantalla de inicio"</strong>.
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                onClick={handleNeverAskAgain}
                className="text-xs text-base-content/60 hover:text-base-content underline decoration-dotted cursor-pointer"
              >
                No volver a preguntar
              </button>
              <button
                onClick={() => setShowIosModal(false)}
                className="btn btn-sm bg-[#0066AD] hover:bg-[#00528c] text-white border-none rounded-lg px-4 cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>,
        document.body
      );
    }

    if (showHelpModal) {
      return createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => setShowHelpModal(false)}
        >
          <div
            className="bg-base-100 rounded-2xl w-full max-w-sm sm:max-w-md p-5 border border-base-300 shadow-2xl flex flex-col gap-4 text-base-content animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-1 border-b border-base-200">
              <div className="flex items-center gap-2">
                <DownloadIcon className="w-5 h-5 text-[#0066AD]" />
                <h3 className="font-bold text-base sm:text-lg">
                  {isMobile ? 'Cómo instalar la aplicación' : 'Instalar en tu computadora'}
                </h3>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="btn btn-xs btn-ghost btn-circle text-base-content/60 hover:text-base-content cursor-pointer"
                aria-label="Cerrar modal"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-base-content/80">
              {isMobile
                ? 'Podés instalar el cancionero directamente desde las opciones de tu navegador:'
                : 'Podés instalar el cancionero como una app de escritorio desde tu navegador:'}
            </p>

            <div className="flex flex-col gap-2.5 bg-base-200/50 p-3.5 rounded-xl border border-base-300/60 text-xs sm:text-sm">
              {isMobile ? (
                <>
                  <p className="leading-snug">
                    1. Abrí el menú del navegador (los tres puntos <strong className="font-bold">⋮</strong> arriba o abajo).
                  </p>
                  <p className="leading-snug">
                    2. Seleccioná <strong className="text-base-content">"Instalar aplicación"</strong> o <strong className="text-base-content">"Agregar a la pantalla principal"</strong>.
                  </p>
                </>
              ) : (
                <>
                  <p className="leading-snug">
                    1. Buscá el ícono de instalación <strong className="text-[#0066AD] font-bold">⊕</strong> (o monitor) en la barra de direcciones de tu navegador (Chrome, Edge o Brave).
                  </p>
                  <p className="leading-snug">
                    2. O abrí el menú <strong className="font-bold">⋮</strong> y seleccioná <strong className="text-base-content">"Instalar Cancionero MJP"</strong>.
                  </p>
                </>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                onClick={handleNeverAskAgain}
                className="text-xs text-base-content/60 hover:text-base-content underline decoration-dotted cursor-pointer"
              >
                No volver a preguntar
              </button>
              <button
                onClick={() => setShowHelpModal(false)}
                className="btn btn-sm bg-[#0066AD] hover:bg-[#00528c] text-white border-none rounded-lg px-4 cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>,
        document.body
      );
    }

    return null;
  };

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 pb-2.5 transition-all duration-300">
        <div className="bg-base-200/80 border border-[#0066AD]/25 dark:border-[#0066AD]/40 rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-2.5 sm:gap-4 shadow-xs">
          {/* Info principal */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#0066AD]/10 text-[#0066AD] flex items-center justify-center shrink-0">
              <DownloadIcon className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-base-content leading-tight truncate">
                  Instalar Cancionero MJP
                </span>
                <span className="hidden xs:inline-block px-1.5 py-0.2 rounded-md bg-[#0066AD]/15 text-[#0066AD] text-[10px] font-semibold">
                  Offline
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-base-content/70 leading-tight truncate">
                {isIOS
                  ? 'Agregala a tu inicio para abrirla rápido y sin internet.'
                  : 'Descargala en tu dispositivo para usarla sin conexión.'}
              </p>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallClick}
              className="btn btn-xs sm:btn-sm bg-[#0066AD] hover:bg-[#00528c] text-white border-none rounded-lg px-2.5 sm:px-3 font-semibold shadow-xs flex items-center gap-1 cursor-pointer"
            >
              <DownloadIcon className="w-3.5 h-3.5" />
              <span>Instalar</span>
            </button>

            <button
              onClick={handleNeverAskAgain}
              className="btn btn-xs sm:btn-sm btn-ghost text-base-content/60 hover:text-base-content text-[11px] sm:text-xs hidden md:inline-flex cursor-pointer"
              title="No volver a mostrar este aviso"
            >
              No volver a preguntar
            </button>

            <button
              onClick={() => setSessionDismissed(true)}
              className="btn btn-xs btn-ghost btn-circle text-base-content/40 hover:text-base-content cursor-pointer"
              title="Cerrar por ahora"
              aria-label="Cerrar aviso de instalación"
            >
              <CloseIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {renderModal()}
    </>
  );
}
