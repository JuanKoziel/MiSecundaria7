function TopHeader({ cursoSeleccionado, materiaSeleccionada, user }) {
  const inicial = user?.username ? user.username.charAt(0) : 'U';
  const rol = user?.role ? user.role.toUpperCase() : 'DOCENTE';

  let subtitulo = 'Panel de Gestión Docente — seleccioná curso y materia';
  if (cursoSeleccionado) {
    subtitulo = cursoSeleccionado;
    if (materiaSeleccionada) {
      subtitulo = (
        <div>
          {cursoSeleccionado} &gt; <span className="font-accent">{materiaSeleccionada}</span>
        </div>
      );
    }
  }

  return (
    <header className="main-header">
      <div>
        <h2>Bienvenido, {user?.username ?? 'Usuario'}</h2>
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
