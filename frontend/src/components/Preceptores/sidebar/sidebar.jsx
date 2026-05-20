import "./sidebar.css";

function Sidebar({ setView, onLogout, user }) {
  return (
    <aside className="sidebar">
      <button onClick={() => setView("alumnos")}>Alumnos</button>

      {user.role === "admin" && (
        <button onClick={() => setView("docentes")}>Docentes</button>
      )}

      <button onClick={() => setView("asistencias")}>Asistencias</button>
        <button onClick={() => setView("notas")}>Notas</button>
        <button onClick={() => setView("actas")}>Actas</button>
      <button onClick={onLogout}>Cerrar sesión</button>
      
    </aside>
  );
}

export default Sidebar;