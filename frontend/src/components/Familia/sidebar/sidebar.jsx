const menuItems = [
  { id: 'resumen', label: 'Resumen', icon: 'fa-home' },
  { id: 'calificaciones', label: 'Calificaciones', icon: 'fa-graduation-cap' },
  { id: 'asistencias', label: 'Asistencias', icon: 'fa-calendar-check' },
  { id: 'actas', label: 'Actas', icon: 'fa-file-pdf' },
  { id: 'comunicados', label: 'Comunicados', icon: 'fa-bullhorn' },
  { id: 'notificaciones', label: 'Notificaciones', icon: 'fa-bell' },
];

function Sidebar({ view, setView, onLogout }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <i className="fas fa-school" aria-hidden="true" />
        <span>MiSecundaria 7</span>
      </div>

      <ul className="sidebar-menu">
        {menuItems.map((item) => (
          <li key={item.id} className={view === item.id ? 'active' : ''}>
            <button type="button" className="sidebar-menu-btn" onClick={() => setView(item.id)}>
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
