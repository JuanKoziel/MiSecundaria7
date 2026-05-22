import './sidebar.css';

const menuItems = [
  { id: 'alumnos', label: 'Alumnos', adminOnly: false },
  { id: 'docentes', label: 'Docentes', adminOnly: true },
  { id: 'asistencias', label: 'Asistencias', adminOnly: false },
  { id: 'notas', label: 'Notas', adminOnly: false },
  { id: 'actas', label: 'Actas', adminOnly: false },
];

function Sidebar({ setView, onLogout, user, view }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
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
                <span>{item.label}</span>
              </button>
            </li>
          ))}

        <li className="logout-li">
          <button type="button" className="sidebar-menu-btn sidebar-logout-btn" onClick={onLogout}>
            <span>Cerrar Sesión</span>
          </button>
        </li>
      </ul>
    </aside>
  );
}

export default Sidebar;
