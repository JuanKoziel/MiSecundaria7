import { Fragment, useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const FOCUSEABLES =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function FormModal({ title, onClose, children, error, onClearError, cerrarConEscape = true }) {
  const modalRef = useRef(null);
  const focoPrevioRef = useRef(null);
  const tituloId = useId();
  // 5.16 — Varios consumidores (suplencias, docentes, adelantos, roles,
  // programming de estado, etc.) no pasan `onClearError`, así que el botón
  // "Cerrar" no tenía con qué limpiar el error y la capa no se iba nunca. El
  // descarte se resuelve acá: se oculta localmente y, si el consumidor sí
  // limpia el error, también se le avota. Se re-arma cuando llega un error nuevo.
  const [errorDescartado, setErrorDescartado] = useState(false);
  const errorVisible = Boolean(error) && !errorDescartado;

  const descartarError = useCallback(() => {
    setErrorDescartado(true);
    if (typeof onClearError === 'function') onClearError();
  }, [onClearError]);

  useEffect(() => {
    setErrorDescartado(false);
  }, [error]);

  // Callback ref estable: enfoca el texto una sola vez, al montarse. Con un
  // arrow ref inline React lo re-ejecutaba en cada render y el mensaje le robaba
  // el foco al usuario (y al botón Cerrar).
  const enfocarTexto = useCallback((nodo) => {
    if (nodo) nodo.focus();
  }, []);

  /* Al abrir: guarda el elemento que tenía el foco, lo lleva al primer campo
     focusable del modal, bloquea el scroll del fondo y registra el teclado a
     nivel de documento. Al cerrar: devuelve el foco al elemento de origen.
     (punto 1.4) */
  useEffect(() => {
    focoPrevioRef.current = document.activeElement;
    const primerFocuseable = modalRef.current?.querySelector(FOCUSEABLES);
    if (primerFocuseable) primerFocuseable.focus();
    else modalRef.current?.focus();

    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = overflowAnterior;
      if (focoPrevioRef.current instanceof HTMLElement) focoPrevioRef.current.focus();
    };
  }, []);

  /* Escape cierra y Tab queda atrapado dentro del modal, para que el teclado
     nunca pueda escapar al contenido de atrás. */
  useEffect(() => {
    const manejarTeclado = (e) => {
      if (e.key === 'Escape') {
        // Si hay una capa por encima (confirmación o error), esa capa es la que
        // responde al Escape; el formulario no debe cerrarse también.
        const hayConfirmacion = document.querySelector('.confirm-modal');
        if (hayConfirmacion) return;
        if (errorVisible) {
          // 5.16 — Escape también descarta la capa de error (antes solo
          // respondía si el botón Cerrar tenía el foco, y no lo tenía).
          e.preventDefault();
          e.stopPropagation();
          descartarError();
          return;
        }
        if (document.querySelector('.form-error-overlay')) return;
        if (cerrarConEscape) {
          e.preventDefault();
          onClose?.();
        }
        return;
      }
      if (e.key !== 'Tab') return;
      const nodos = modalRef.current?.querySelectorAll(FOCUSEABLES);
      if (!nodos || nodos.length === 0) return;
      const primero = nodos[0];
      const ultimo = nodos[nodos.length - 1];
      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    };
    document.addEventListener('keydown', manejarTeclado);
    return () => document.removeEventListener('keydown', manejarTeclado);
  }, [cerrarConEscape, onClose, errorVisible, descartarError]);

  return (
    <Fragment>
      {createPortal(
        <div className="ddjj-modal-overlay" role="presentation" onClick={onClose}>
          <div
            className="standard-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={tituloId}
            tabIndex={-1}
            ref={modalRef}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="standard-modal-header">
              <h3 id={tituloId}>{title}</h3>
            </div>
            {children}
          </div>
        </div>,
        document.body,
      )}
      {errorVisible &&
        createPortal(
          <div className="form-error-overlay" role="alertdialog" aria-modal="true" aria-labelledby="form-modal-error-text">
            <div className="form-error-overlay-card">
              <i className="fas fa-triangle-exclamation" aria-hidden="true"></i>
              <span className="form-error-overlay-text" id="form-modal-error-text" tabIndex={-1} ref={enfocarTexto}>
                {error}
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={descartarError}
              >
                Cerrar
              </button>
            </div>
          </div>,
          document.body,
        )}
    </Fragment>
  );
}
