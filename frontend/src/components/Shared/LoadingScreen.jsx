import Logo from './Logo';

export default function LoadingScreen({ text = 'Cargando', fixed = false, dark = false }) {
  return (
    <div
      className={`loading-screen ${fixed ? 'loading-screen--fixed' : ''} ${dark ? 'loading-screen--dark' : ''}`}
      role="status"
      aria-live="polite"
    >
      <div className="loading-screen__logo">
        <Logo />
      </div>
      <span className="loading-screen__text">{text}</span>
    </div>
  );
}
