import { menuItems } from '../sidebarMenu';

function Sidebar({ setView, onLogout, user, view }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <i className="fas fa-school" aria-hidden="true" />
        <span>MiSecundaria 7</span>
      </div>

      <ul className="sidebar-menu">
        {menuItems
          .filter((item) => !item.adminOnly || user.role === 'admin')
          .map((item) => (
            <li key={item.id} className={view === item.id ? 'active' : ''}>
              <button
                type="button"
                className="sidebar-menu-btn"
                onClick={() => setView(item.id)}
              >
                <i className={`fas ${item.icon}`} aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            </li>
          ))}

        <li className="logout-li">
          <button type="button" className="sidebar-menu-btn sidebar-logout-btn" onClick={onLogout}>
            <i className="fas fa-sign-out-alt" aria-hidden="true" />
            <span>Cerrar Sesión</span>
          </button>
        </li>
      </ul>
    </aside>
  );
}

export default Sidebar;
