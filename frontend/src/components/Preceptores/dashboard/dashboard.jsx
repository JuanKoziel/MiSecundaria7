import { useState } from "react";
import Sidebar from "./sidebar/sidebar";
import Header from "./Header";
import Alumnos from "./alumnos/alumnos";
import Docentes from "./Docentes";
import Asistencias from "./asistencias/asistencias";
import Notas from "./Notas";
import Actas from "./actas/actas";

function Dashboard({ user, onLogout }) {
  const [view, setView] = useState("alumnos");

  return (
    <div className="dashboard-layout">
      <Sidebar user={user} setView={setView} onLogout={onLogout} />

      <main className="main-content">
        <Header user={user} />

        {view === "alumnos" && <Alumnos />}
        {view === "docentes" && user.role === "admin" && <Docentes />}
        {view === "asistencias" && <Asistencias />}
        {view === "notas" && <Notas />}
        {view === "actas" && <Actas />}
      </main>
    </div>
  );
}

export default Dashboard;