import { useEffect, useRef } from 'react';

const MENSAJE_DEFECTO = '¿Está seguro de que desea eliminar este registro?';
const NOTA_DEFECTO = 'Esta acción ocultará el registro del sistema.';
const TITULO_DEFECTO = 'Confirmar eliminación';

export default function ConfirmDeleteModal({
  open = false,
  title = TITULO_DEFECTO,
  message = MENSAJE_DEFECTO,
  note = NOTA_DEFECTO,
  confirmText = 'Eliminar',
  cancelText = 'Cancelar',
  loading = false,
  loadingText = 'Eliminando...',
  onConfirm,
  onCancel,
}) {
  const cancelarRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    cancelarRef.current?.focus();
    const manejarTeclado = (e) => {
      if (e.key === 'Escape' && !loading) {
        e.preventDefault();
        onCancel();
      }
      if (e.key === 'Enter' && !loading) {
        e.preventDefault();
        onConfirm();
      }
    };
    document.addEventListener('keydown', manejarTeclado);
    return () => document.removeEventListener('keydown', manejarTeclado);
  }, [open, loading, onCancel, onConfirm]);

  if (!open) return null;

  return (
    <div
      className="ddjj-modal-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !loading) onCancel();
      }}
    >
      <div
        className="confirm-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-message"
      >
        <div className="confirm-modal__icon">
          <i className="fas fa-triangle-exclamation" aria-hidden="true" />
        </div>
        <h3 id="confirm-modal-title" className="confirm-modal__title">{title}</h3>
        <p id="confirm-modal-message" className="confirm-modal__message">{message}</p>
        {note && <p className="confirm-modal__note">{note}</p>}
        <div className="confirm-modal__actions">
          <button
            type="button"
            className="btn btn-secondary"
            ref={cancelarRef}
            disabled={loading}
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className="btn btn-danger"
            disabled={loading}
            onClick={onConfirm}
          >
            {loading ? loadingText : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
