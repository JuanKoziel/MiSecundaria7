import { menuItems } from '../sidebarMenu';
import Logo from '../../Shared/Logo';
import CambiarRolButton from '../../Shared/CambiarRolButton';

function Sidebar({ view, setView, onLogout }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <Logo />
        <span>MiSecundaria 7</span>
      </div>

      <div className="sidebar-menu-wrapper">
        <ul className="sidebar-menu">
          {menuItems.map((item) => (
            <li key={item.id} className={view === item.id ? 'active' : ''}>
              <button type="button" className="sidebar-menu-btn" onClick={() => setView(item.id)}>
                <i className={`fas ${item.icon}`} aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="sidebar-logout">
        <CambiarRolButton />
        <button type="button" className="sidebar-menu-btn sidebar-logout-btn" onClick={onLogout}>
          <i className="fas fa-sign-out-alt" aria-hidden="true" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
