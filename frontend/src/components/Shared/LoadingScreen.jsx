export default function LoadingScreen({ text = 'Cargando', fixed = false, dark = false }) {
  return (
    <div
      className={`loading-screen ${fixed ? 'loading-screen--fixed' : ''} ${dark ? 'loading-screen--dark' : ''}`}
      role="status"
      aria-live="polite"
    >
      <div className="loading-screen__logo">
        <i className="fas fa-school" aria-hidden="true" />
      </div>
      <span className="loading-screen__text">{text}</span>
    </div>
  );
}
