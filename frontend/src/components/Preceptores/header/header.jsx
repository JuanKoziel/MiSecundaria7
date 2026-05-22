function Header({ user }) {
  const inicial = user.username ? user.username.charAt(0) : 'U';
  const subtitulo =
    user.role === 'admin'
      ? 'Panel de Administración Escolar'
      : 'Panel de Gestión Escolar';

  return (
    <header className="main-header">
      <div>
        <h2>Bienvenido, {user.username}</h2>
        <p className="main-header-subtitle">{subtitulo}</p>
      </div>

      <div className="user-profile-info">
        <span className="badge role-badge-display">{user.role.toUpperCase()}</span>
        <div className="user-avatar">{inicial}</div>
      </div>
    </header>
  );
}

export default Header;
