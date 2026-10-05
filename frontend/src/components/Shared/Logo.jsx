// `import.meta.env.BASE_URL` respeta el `base` de vite.config.js
// (`/misecundaria7/`). Con una ruta absoluta (`/logo-escuela.png`) el logo
// se pedía en la raíz del dominio y devolvía 404.
export default function Logo({ className = '', alt = 'Logo de la institución' }) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}logo-escuela.png`}
      alt={alt}
      className={`app-logo${className ? ` ${className}` : ''}`}
    />
  );
}
