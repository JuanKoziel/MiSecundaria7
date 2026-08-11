import { useAuth } from '../../context/AuthContext';

function CambiarRolButton() {
  const { user, cambiarRol } = useAuth();
  const roles = Array.isArray(user?.roles) ? user.roles : [];
  if (roles.length < 2) return null;
  return (
    <button
      type="button"
      className="sidebar-menu-btn"
      onClick={cambiarRol}
      title="Cambiar rol"
    >
      <i className="fas fa-repeat" aria-hidden="true" />
      <span>Cambiar rol</span>
    </button>
  );
}

export default CambiarRolButton;
