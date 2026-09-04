function TopHeader({ cursoSeleccionado, materiaSeleccionada, user, nombreCompleto }) {
  const inicial = user?.username ? user.username.charAt(0) : 'U';
  const rol = user?.role ? user.role.toUpperCase() : 'DOCENTE';
  const saludo = nombreCompleto ? `Bienvenido, ${nombreCompleto}` : `Bienvenido, ${user?.username ?? 'Usuario'}`;

  let subtitulo = 'Panel de Gestión Docente — seleccioná curso y materia';
  if (cursoSeleccionado) {
    subtitulo = cursoSeleccionado;
    if (materiaSeleccionada) {
      subtitulo = (
        <div>
          {cursoSeleccionado} {' > '} <span className="font-accent">{materiaSeleccionada}</span>
        </div>
      );
    }
  }

  return (
    <header className="main-header">
      <div>
        <h2>{saludo}</h2>
        <p className="main-header-subtitle">{subtitulo}</p>
      </div>
      <div className="user-profile-info">
        <span className="badge role-badge-display">{rol}</span>
        <div className="user-avatar">{inicial}</div>
      </div>
    </header>
  );
}

export default TopHeader;