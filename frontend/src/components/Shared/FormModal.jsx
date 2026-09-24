import { Fragment } from 'react';
import { createPortal } from 'react-dom';

export default function FormModal({ title, onClose, children, error, onClearError }) {
  return (
    <Fragment>
      {createPortal(
        <div className="ddjj-modal-overlay" role="presentation" onClick={onClose}>
          <div className="standard-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="standard-modal-header">
              <h3>{title}</h3>
            </div>
            {children}
          </div>
        </div>,
        document.body,
      )}
      {error &&
        createPortal(
          <div className="form-error-overlay" role="alert">
            <div className="form-error-overlay-card">
              <i className="fas fa-exclamation-triangle" aria-hidden="true"></i>
              <span className="form-error-overlay-text">{error}</span>
              <button type="button" className="btn btn-secondary btn-sm" onClick={onClearError}>
                Cerrar
              </button>
            </div>
          </div>,
          document.body,
        )}
    </Fragment>
  );
}