function Header({ user, hijoSeleccionado, nombreCompleto }) {
  const inicial = user.username ? user.username.charAt(0) : 'U';
  const saludo = nombreCompleto ? `Bienvenido, ${nombreCompleto}` : `Bienvenido, ${user.username}`;

  return (
    <header className="main-header">
      <div>
        <h2>{saludo}</h2>
        <p className="main-header-subtitle">
          {hijoSeleccionado
            ? `Seguimiento académico — ${hijoSeleccionado.nombre}`
            : 'Panel de Familia — seleccioná un estudiante vinculado'}
        </p>
      </div>

      <div className="user-profile-info">
        <span className="badge role-badge-display">{(user.role || '').toUpperCase()}</span>
        <div className="user-avatar">{inicial}</div>
      </div>
    </header>
  );
}

export default Header;
