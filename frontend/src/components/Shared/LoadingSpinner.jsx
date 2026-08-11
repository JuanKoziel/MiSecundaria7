export default function LoadingSpinner({ text = 'Cargando', size = 'md', dark = false, inline = false }) {
  return (
    <div
      className={`loading-screen ${dark ? 'loading-screen--dark' : ''} loading-spinner--${size} ${inline ? 'loading-screen--inline' : ''}`}
      role="status"
      aria-live="polite"
    >
      <div className="loading-screen__logo">
        <i className="fas fa-school" aria-hidden="true" />
      </div>
      {text && <span className="loading-screen__text">{text}</span>}
    </div>
  );
}
