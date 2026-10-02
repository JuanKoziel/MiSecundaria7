import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const ErrorOverlayContext = createContext({ mostrarError: () => {} });

/* ------------------------------------------------------------------
   Store a nivel de módulo para que los errores produced fuera del árbol
   de React (p. ej. el interceptor de axios en services/api.js) puedan
   abrir la misma capa global de error.
   ------------------------------------------------------------------ */
const suscriptores = new Set();

export function reportarErrorGlobal(mensaje) {
  if (!mensaje) return;
  suscriptores.forEach((fn) => {
    try {
      fn(mensaje);
    } catch {
      /* un suscriptor roto no debe romper el resto */
    }
  });
}

function extraerMensaje(error) {
  if (!error) return 'Ocurrió un error inesperado.';
  if (typeof error === 'string') return error;
  return (
    error.detail ||
    (typeof error.error === 'string' ? error.error : null) ||
    error.message ||
    'Ocurrió un error inesperado.'
  );
}

export function useErrorOverlay() {
  return useContext(ErrorOverlayContext).mostrarError;
}

export function ErrorOverlayProvider({ children }) {
  const [errorActual, setErrorActual] = useState(null);

  const mostrarError = useCallback((mensaje) => {
    if (!mensaje) return;
    setErrorActual(extraerMensaje(mensaje));
  }, []);

  const cerrarError = useCallback(() => setErrorActual(null), []);

  useEffect(() => {
    suscriptores.add(setErrorActual);
    return () => {
      suscriptores.delete(setErrorActual);
    };
  }, []);

  // 5.16 — Escape cierra la capa de error global. Antes el Escape solo estaba
  // atado al botón "Cerrar" mediante onKeyDown, y como el foco estaba en el texto
  // del mensaje nunca se disparaba.
  useEffect(() => {
    if (!errorActual) return undefined;
    const alPresionar = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setErrorActual(null);
      }
    };
    document.addEventListener('keydown', alPresionar);
    return () => document.removeEventListener('keydown', alPresionar);
  }, [errorActual]);

  return (
    <ErrorOverlayContext.Provider value={{ mostrarError }}>
      {children}
      {errorActual &&
        createPortal(
          <div className="form-error-overlay" role="alertdialog" aria-modal="true" aria-labelledby="error-overlay-text">
            <div className="form-error-overlay-card">
              <i className="fas fa-triangle-exclamation" aria-hidden="true"></i>
              <span className="form-error-overlay-text" id="error-overlay-text" tabIndex={-1} ref={(nodo) => nodo?.focus()}>
                {errorActual}
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={cerrarError}
              >
                Cerrar
              </button>
            </div>
          </div>,
          document.body,
        )}
    </ErrorOverlayContext.Provider>
  );
}
