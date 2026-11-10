import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CloseIcon, CopyIcon, ShareIcon, QrCodeIcon, CheckIcon, ArrowLeftIcon } from './Icons';

export default function ShareModal({ isOpen, onClose, cancion }) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // Resetear estados al abrir/cerrar
  useEffect(() => {
    if (isOpen) {
      setCopied(false);
      setShowQR(false);
    }
  }, [isOpen]);

  // Cerrar al presionar la tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !cancion) return null;

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2500);
    } catch (err) {
      console.error('Clipboard error:', err);
    }
  };

  const handleShareInApps = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: cancion.titulo,
          text: `${cancion.titulo} — Cancionero MJP`,
          url: shareUrl,
        });
        return;
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('Share error:', err);
        }
      }
    } else {
      // Fallback para navegadores que no admiten Web Share API
      await handleCopyLink();
    }
  };

  return (
    <div className="modal modal-open z-50">
      <div className="modal-box max-w-md bg-base-100 p-5 sm:p-6 rounded-2xl shadow-xl border border-base-200">
        {/* Cabecera del modal */}
        <div className="flex justify-between items-center mb-4 border-b border-base-200/80 pb-3">
          <div className="flex items-center gap-2 min-w-0 pr-2">
            {showQR && (
              <button
                onClick={() => setShowQR(false)}
                className="btn btn-sm btn-ghost btn-circle text-base-content/70 hover:text-[#0066AD] -ml-1.5 shrink-0"
                title="Volver a opciones"
                aria-label="Volver a opciones"
              >
                <ArrowLeftIcon className="w-4 h-4" />
              </button>
            )}
            <div className="min-w-0">
              <h3 className="font-bold text-base text-base-content truncate">
                {showQR ? 'Compartir por QR' : 'Compartir canción'}
              </h3>
              <p className="text-xs text-base-content/60 truncate mt-0.5">{cancion.titulo}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-sm btn-circle btn-ghost text-base-content/60 hover:text-base-content shrink-0"
            aria-label="Cerrar modal"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Vista principal: 3 opciones */}
        {!showQR ? (
          <div className="space-y-2.5">
            {/* Opción 1: Copiar link */}
            <button
              onClick={handleCopyLink}
              className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                copied
                  ? 'border-[#26A62F]/40 bg-[#26A62F]/10 text-base-content'
                  : 'border-base-200 hover:border-[#0066AD]/40 bg-base-200/40 hover:bg-[#0066AD]/5 text-base-content'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    copied ? 'bg-[#26A62F]/20 text-[#26A62F]' : 'bg-[#0066AD]/10 text-[#0066AD]'
                  }`}
                >
                  {copied ? <CheckIcon className="w-5 h-5" /> : <CopyIcon className="w-5 h-5" />}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm">Copiar link</div>
                  <div className="text-xs text-base-content/60 truncate">
                    Copia el enlace directo al portapapeles
                  </div>
                </div>
              </div>
              {copied && (
                <span className="text-xs font-bold text-[#26A62F] shrink-0 bg-[#26A62F]/15 px-2 py-0.5 rounded-md">
                  ¡Copiado!
                </span>
              )}
            </button>

            {/* Opción 2: Compartir en apps */}
            <button
              onClick={handleShareInApps}
              className="w-full text-left p-3.5 rounded-xl border border-base-200 hover:border-[#0066AD]/40 bg-base-200/40 hover:bg-[#0066AD]/5 text-base-content transition-all flex items-center justify-between gap-3 cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#0066AD]/10 text-[#0066AD] flex items-center justify-center shrink-0">
                  <ShareIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm">Compartir en apps</div>
                  <div className="text-xs text-base-content/60 truncate">
                    WhatsApp, Instagram u otras aplicaciones
                  </div>
                </div>
              </div>
            </button>

            {/* Opción 3: Compartir por QR */}
            <button
              onClick={() => setShowQR(true)}
              className="w-full text-left p-3.5 rounded-xl border border-base-200 hover:border-[#0066AD]/40 bg-base-200/40 hover:bg-[#0066AD]/5 text-base-content transition-all flex items-center justify-between gap-3 cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#0066AD]/10 text-[#0066AD] flex items-center justify-center shrink-0">
                  <QrCodeIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm">Compartir por QR</div>
                  <div className="text-xs text-base-content/60 truncate">
                    Mostrar código para escanear con la cámara
                  </div>
                </div>
              </div>
              <span className="text-base-content/40 text-sm font-semibold pr-1">→</span>
            </button>
          </div>
        ) : (
          /* Vista de código QR con Escudo MJP centrado */
          <div className="flex flex-col items-center text-center py-3">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-base-200 inline-block mb-3">
              <QRCodeSVG
                value={shareUrl}
                size={210}
                level="H"
                includeMargin={false}
                imageSettings={{
                  src: '/logos/Escudo MJP Color.png',
                  height: 48,
                  width: 48,
                  excavate: true,
                }}
              />
            </div>
            <p className="text-xs text-base-content/70 max-w-xs">
              Escaneá este código con la cámara de tu celular para abrir la canción directamente.
            </p>
          </div>
        )}
      </div>

      <div className="modal-backdrop bg-black/40 backdrop-blur-xs" onClick={onClose}></div>
    </div>
  );
}
