function Header({ user, hijoSeleccionado }) {
  const inicial = user.username ? user.username.charAt(0) : 'U';

  return (
    <header className="main-header">
      <div>
        <h2>Bienvenido, {user.username}</h2>
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
