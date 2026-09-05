function Header({ user, hijoSeleccionado, nombreCompleto, view, hijos, hijoId, setHijoId }) {
  const inicial = user.username ? user.username.charAt(0) : 'U';
  const saludo = nombreCompleto ? `Bienvenido, ${nombreCompleto}` : `Bienvenido, ${user.username}`;

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
    <header className="main-header">
      <div>
        <h2>{saludo}</h2>
        <p className="main-header-subtitle">{subtitulo}</p>
      </div>

      {mostrarSelectorHijo && hijos.length > 1 && (
        <div className="form-group-filter" style={{ maxWidth: '280px', marginBottom: 0 }}>
          <label htmlFor="familia-hijo-selector">Estudiante</label>
          <select
            id="familia-hijo-selector"
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
      )}

      <div className="user-profile-info">
        <span className="badge role-badge-display">{(user.role || '').toUpperCase()}</span>
        <div className="user-avatar">{inicial}</div>
      </div>
    </header>
  );
}

export default Header;
