function inicialesDesdeNombre(nombreCompleto, user) {
  if (nombreCompleto) {
    const [apellido, nombre] = nombreCompleto.split(',').map((s) => (s || '').trim());
    const ini = `${(nombre || '').charAt(0)}${(apellido || '').charAt(0)}`.toUpperCase();
    if (ini.trim()) return ini;
  }
  return user.username ? user.username.charAt(0).toUpperCase() : 'U';
}

function Header({ user, nombreCompleto }) {
  const iniciales = inicialesDesdeNombre(nombreCompleto, user);
  const nombreMostrar = nombreCompleto || user.username || 'Usuario';
  const rol = 'JEFE DE PRECEPTORES';

  return (
    <header className="main-header main-header--dark">
      <div className="main-header-left">
        <div className="main-header-greeting">
          <h2>
            <span className="greeting-saludo">Bienvenido:</span>{' '}
            <span className="greeting-nombre">{nombreMostrar}</span>
          </h2>
          <p className="main-header-subtitle">
            <i className="fas fa-school font-accent" aria-hidden="true" />
            Jefatura de Preceptoría
          </p>
        </div>
      </div>

      <div className="user-profile-info user-profile-card">
        <div className="user-avatar-wrap">
          <div className="user-avatar">{iniciales}</div>
        </div>
        <span className="badge role-badge-display">
          <span className="role-dot" aria-hidden="true" />
          {rol}
        </span>
      </div>
    </header>
  );
}

export default Header;