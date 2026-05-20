import "./sidebar.css";

function Sidebar({ setView, onLogout, user }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span>MiSecundaria7</span>
      </div>

      <ul className="sidebar-menu">
        <li>
          <a href="#" onClick={(e) => { e.preventDefault(); setView("alumnos"); }}>
            <span>Alumnos</span>
          </a>
        </li>

        {user.role === "admin" && (
          <li>
            <a href="#" onClick={(e) => { e.preventDefault(); setView("docentes"); }}>
              <span>Docentes</span>
            </a>
          </li>
        )}

        <li>
          <a href="#" onClick={(e) => { e.preventDefault(); setView("asistencias"); }}>
            <span>Asistencias</span>
          </a>
        </li>
        <li>
          <a href="#" onClick={(e) => { e.preventDefault(); setView("notas"); }}>
            <span>Notas</span>
          </a>
        </li>
        <li>
          <a href="#" onClick={(e) => { e.preventDefault(); setView("actas"); }}>
            <span>Actas</span>
          </a>
        </li>

        <li className="logout-li">
          <a href="#" onClick={(e) => { e.preventDefault(); onLogout(); }} style={{ color: '#ff6b6b' }}>
            <span>Cerrar Sesión</span>
          </a>
        </li>
      </ul>
    </aside>
  );
}

export default Sidebar;