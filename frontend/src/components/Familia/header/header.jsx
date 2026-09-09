function inicialesDesdeNombre(nombreCompleto, user) {
  if (nombreCompleto) {
    const [apellido, nombre] = nombreCompleto.split(',').map((s) => (s || '').trim());
    const ini = `${(nombre || '').charAt(0)}${(apellido || '').charAt(0)}`.toUpperCase();
    if (ini.trim()) return ini;
  }
  return user.username ? user.username.charAt(0).toUpperCase() : 'U';
}

function Header({ user, hijoSeleccionado, nombreCompleto, view, hijos, hijoId, setHijoId }) {
  const iniciales = inicialesDesdeNombre(nombreCompleto, user);
  const nombreMostrar = nombreCompleto || user.username || 'Usuario';
  const rol = (user.role || 'FAMILIA').toUpperCase();

  const mostrarSelectorHijo = view !== 'calendario';

  let subtitulo = 'Panel de Familia';
  if (view === 'calendario') {
    subtitulo = 'Calendario Institucional';
  } else if (hijoSeleccionado) {
    subtitulo = `Seguimiento académico — ${hijoSeleccionado.nombre}`;
  } else {
    subtitulo = 'Panel de Familia — seleccioná un estudiante vinculado';
  }

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
            {subtitulo}
          </p>
        </div>

        {mostrarSelectorHijo && hijos.length > 1 && (
          <div className="main-header-selectors">
            <div className="selector-group">
              <label htmlFor="familia-hijo-selector" className="selector-label">
                <i className="fas fa-user-graduate" aria-hidden="true" /> Estudiante
              </label>
              <select
                id="familia-hijo-selector"
                className="global-select"
                value={hijoId}
                onChange={(e) => setHijoId(e.target.value)}
              >
                {hijos.map((hijo) => (
                  <option key={hijo.id} value={String(hijo.id)}>
                    {hijo.nombre}{hijo.curso ? ` — ${hijo.curso}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
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