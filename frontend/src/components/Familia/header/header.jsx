function Header({ user, hijoSeleccionado, nombreCompleto, view }) {
  const inicial = user.username ? user.username.charAt(0) : 'U';
  const saludo = nombreCompleto ? `Bienvenido, ${nombreCompleto}` : `Bienvenido, ${user.username}`;

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

      <div className="user-profile-info">
        <span className="badge role-badge-display">{(user.role || '').toUpperCase()}</span>
        <div className="user-avatar">{inicial}</div>
      </div>
    </header>
  );
}

export default Header;
