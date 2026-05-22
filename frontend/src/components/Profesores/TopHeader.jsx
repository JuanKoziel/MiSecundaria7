function TopHeader({ cursoSeleccionado, materiaSeleccionada, user }) {
  const inicial = user?.username ? user.username.charAt(0) : 'U';
  const rol = user?.role ? user.role.toUpperCase() : 'DOCENTE';

  return (
    <header className="main-header">
      <div>
        <h2>Panel de Gestión Docente</h2>
        <div className="main-header-subtitle">
          {cursoSeleccionado ? (
            <span>
              {cursoSeleccionado}
              {materiaSeleccionada && (
                <>
                  {' '}
                  &gt; <span className="font-accent">{materiaSeleccionada}</span>
                </>
              )}
            </span>
          ) : (
            'Aguardando selección de grupo...'
          )}
        </div>
      </div>
      <div className="user-profile-info">
        <span className="badge role-badge-display">{rol}</span>
        <div className="user-avatar">{inicial}</div>
      </div>
    </header>
  );
}

export default TopHeader;
