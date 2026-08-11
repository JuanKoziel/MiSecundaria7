export default function Logo({ className = '', alt = 'Logo de la institución' }) {
  return (
    <img
      src="/logo-escuela.png"
      alt={alt}
      className={`app-logo${className ? ` ${className}` : ''}`}
    />
  );
}
