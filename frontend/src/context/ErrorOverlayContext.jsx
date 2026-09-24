import { createContext, useCallback, useContext, useState } from 'react';
import { createPortal } from 'react-dom';

const ErrorOverlayContext = createContext({ mostrarError: () => {} });

export function useErrorOverlay() {
  return useContext(ErrorOverlayContext).mostrarError;
}

export function ErrorOverlayProvider({ children }) {
  const [errorActual, setErrorActual] = useState(null);

  const mostrarError = useCallback((mensaje) => {
    if (!mensaje) return;
    const texto = typeof mensaje === 'string' ? mensaje : (mensaje?.detail || mensaje?.error || mensaje?.message || 'Ocurrió un error inesperado.');
    setErrorActual(texto);
  }, []);

  return (
    <ErrorOverlayContext.Provider value={{ mostrarError }}>
      {children}
      {errorActual &&
        createPortal(
          <div className="form-error-overlay" role="alert">
            <div className="form-error-overlay-card">
              <i className="fas fa-exclamation-triangle" aria-hidden="true"></i>
              <span className="form-error-overlay-text">{errorActual}</span>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setErrorActual(null)}>
                Cerrar
              </button>
            </div>
          </div>,
          document.body,
        )}
    </ErrorOverlayContext.Provider>
  );
}