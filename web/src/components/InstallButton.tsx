import { useEffect, useReducer, useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import {
  canInstall,
  runInstall,
  subscribeInstall,
  isStandalone,
  isIOS,
} from '../lib/pwaInstall';

// Boton "Instalar app". Se monta SOLO dentro del admin (Layout), asi nunca
// aparece en un futuro sitio publico. Se oculta si la app ya corre instalada
// o si el navegador no soporta instalarla.
export function InstallButton() {
  const [, force] = useReducer((x) => x + 1, 0);
  const [iosHelp, setIosHelp] = useState(false);

  useEffect(() => subscribeInstall(force), []);

  if (isStandalone()) return null;

  const android = canInstall();
  const ios = isIOS();
  if (!android && !ios) return null; // navegador de escritorio sin soporte, etc.

  return (
    <>
      <button
        onClick={() => (android ? runInstall() : setIosHelp(true))}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-neon-cyan bg-neon-cyan/10 hover:bg-neon-cyan/20 transition-all"
      >
        <Download size={18} />
        Instalar app
      </button>

      {ios && iosHelp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
          onClick={() => setIosHelp(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-line bg-surface p-5 shadow-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between mb-3">
              <p className="font-semibold text-white">Instalar en tu iPhone</p>
              <button
                onClick={() => setIosHelp(false)}
                className="text-slate-500 hover:text-slate-300"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>
            <ol className="space-y-3 text-sm text-slate-300">
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-neon-cyan/10 text-neon-cyan text-xs font-bold flex items-center justify-center shrink-0">
                  1
                </span>
                Abri esta pagina en <b className="text-white">Safari</b> (no en
                otro navegador).
              </li>
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-neon-cyan/10 text-neon-cyan text-xs font-bold flex items-center justify-center shrink-0">
                  2
                </span>
                Toca el boton <b className="text-white">Compartir</b>
                <Share size={16} className="text-neon-cyan" />
                (abajo en el centro).
              </li>
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-neon-cyan/10 text-neon-cyan text-xs font-bold flex items-center justify-center shrink-0">
                  3
                </span>
                Elegi <b className="text-white">Anadir a pantalla de inicio</b>.
              </li>
            </ol>
          </div>
        </div>
      )}
    </>
  );
}
