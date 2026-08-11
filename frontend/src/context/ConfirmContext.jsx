import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import ConfirmDeleteModal from '../components/Shared/ConfirmDeleteModal';
import { setConfirmHandler } from '../utils/confirmarEliminacion';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState({
    open: false,
    title: 'Confirmar eliminación',
    message: '¿Está seguro de que desea eliminar este registro?',
    note: 'Esta acción ocultará el registro del sistema.',
    confirmText: 'Eliminar',
    loadingText: 'Eliminando...',
  });
  const [eliminando, setEliminando] = useState(false);
  const resolverRef = useRef(null);
  const onConfirmRef = useRef(null);

  const confirmar = useCallback((opciones = {}) => new Promise((resolve) => {
    onConfirmRef.current = opciones.onConfirm || null;
    resolverRef.current = resolve;
    setEliminando(false);
    setState({
      open: true,
      title: opciones.title || 'Confirmar eliminación',
      message: opciones.message || '¿Está seguro de que desea eliminar este registro?',
      note: opciones.note || 'Esta acción ocultará el registro del sistema.',
      confirmText: opciones.confirmText || 'Eliminar',
      loadingText: opciones.loadingText || 'Eliminando...',
    });
  }), []);

  const cerrar = useCallback((resultado) => {
    setState((s) => ({ ...s, open: false }));
    resolverRef.current?.(resultado);
    resolverRef.current = null;
    onConfirmRef.current = null;
    setEliminando(false);
  }, []);

  const cancelar = useCallback(() => cerrar(false), [cerrar]);

  const confirmarAccion = useCallback(async () => {
    if (eliminando) return;
    const fn = onConfirmRef.current;
    if (!fn) {
      cerrar(true);
      return;
    }
    setEliminando(true);
    try {
      await fn();
      cerrar(true);
    } catch {
      setEliminando(false);
      cerrar(false);
    }
  }, [eliminando, cerrar]);

  useEffect(() => {
    setConfirmHandler(confirmar);
    return () => setConfirmHandler(null);
  }, [confirmar]);

  return (
    <ConfirmContext.Provider value={{ confirmar }}>
      {children}
      <ConfirmDeleteModal
        open={state.open}
        title={state.title}
        message={state.message}
        note={state.note}
        confirmText={state.confirmText}
        loadingText={state.loadingText}
        loading={eliminando}
        onConfirm={confirmarAccion}
        onCancel={cancelar}
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error('useConfirm debe usarse dentro de <ConfirmProvider>.');
  }
  return ctx;
}
