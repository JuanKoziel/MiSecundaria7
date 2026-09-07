function ProfileBanner({ icon, nombre, rol, rolIcon, estado = 'Activo' }) {
  const activo = estado === 'Activo';
  return (
    <div className="profile-banner">
      <div className="profile-banner-avatar">
        <i className={`fas ${icon}`} aria-hidden="true" />
      </div>
      <div className="profile-banner-info">
        <span className="profile-banner-eyebrow">Mi Perfil</span>
        <span className="profile-banner-name">{nombre}</span>
        {rol && (
          <span className="profile-banner-role">
            {rolIcon !== false && <i className={`fas ${rolIcon || icon}`} aria-hidden="true" />}
            {rol}
          </span>
        )}
      </div>
      <span className={`profile-banner-status ${activo ? 'is-active' : 'is-inactive'}`}>
        <i className={`fas ${activo ? 'fa-check-circle' : 'fa-exclamation-circle'}`} aria-hidden="true" />
        {estado}
      </span>
    </div>
  );
}

export default ProfileBanner;