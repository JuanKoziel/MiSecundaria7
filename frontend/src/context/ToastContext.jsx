import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const ToastContext = createContext(null);

const DURACION_DEFECTO = 3000;
const DURACION_SALIDA = 250;

const ICONOS = {
  success: 'fa-circle-check',
  error: 'fa-circle-xmark',
  warning: 'fa-triangle-exclamation',
  info: 'fa-circle-info',
};

let contadorId = 0;

function ToastItem({ toast, onCerrar }) {
  return (
    <div
      role="alert"
      className={`toast toast--${toast.tipo}${toast.saliendo ? ' toast--saliendo' : ''}`}
      onClick={() => onCerrar(toast.id)}
    >
      <i className={`fas ${ICONOS[toast.tipo] || ICONOS.info}`} aria-hidden="true" />
      <span className="toast__mensaje">{toast.mensaje}</span>
      <button
        type="button"
        className="toast__cerrar"
        aria-label="Cerrar notificación"
        onClick={(e) => {
          e.stopPropagation();
          onCerrar(toast.id);
        }}
      >
        <i className="fas fa-xmark" aria-hidden="true" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const temporizadoresRef = useRef({});

  const quitar = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const temporizador = temporizadoresRef.current[id];
    if (temporizador) {
      clearTimeout(temporizador);
      delete temporizadoresRef.current[id];
    }
  }, []);

  const cerrar = useCallback(
    (id) => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, saliendo: true } : t)));
      temporizadoresRef.current[id] = setTimeout(() => quitar(id), DURACION_SALIDA);
    },
    [quitar],
  );

  const mostrar = useCallback(
    (tipo, mensaje, duracion = DURACION_DEFECTO) => {
      const id = ++contadorId;
      setToasts((prev) => [...prev, { id, tipo, mensaje }]);
      temporizadoresRef.current[id] = setTimeout(() => cerrar(id), duracion);
      return id;
    },
    [cerrar],
  );

  const toast = useMemo(
    () => ({
      success: (mensaje, duracion) => mostrar('success', mensaje, duracion),
      error: (mensaje, duracion) => mostrar('error', mensaje, duracion),
      warning: (mensaje, duracion) => mostrar('warning', mensaje, duracion),
      info: (mensaje, duracion) => mostrar('info', mensaje, duracion),
      cerrar,
    }),
    [mostrar, cerrar],
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container" aria-live="polite">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onCerrar={cerrar} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const contexto = useContext(ToastContext);
  if (!contexto) {
    throw new Error('useToast debe usarse dentro de <ToastProvider>.');
  }
  return contexto;
}
