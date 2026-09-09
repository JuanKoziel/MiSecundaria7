import { createPortal } from 'react-dom';

export default function FormModal({ title, onClose, children }) {
  return createPortal(
    <div className="ddjj-modal-overlay" role="presentation" onClick={onClose}>
      <div className="standard-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="standard-modal-header">
          <h3>{title}</h3>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}