import { useState } from "react";
import Sidebar from "./sidebar/sidebar"; // Asegurá las rutas reales en tu proyecto
import Header from "./header/header";
import Alumnos from "./Alumnos";
import Docentes from "./Docentes";
import Asistencias from "./Asistencias";
import Notas from "./Notas";
import Actas from "./Actas";

function PreceptorDashboard({ user, onLogout }) {
  const [view, setView] = useState("alumnos");

  return (
    <div className="dashboard-layout">
      <Sidebar user={user} setView={setView} onLogout={onLogout} />

      <main className="main-content">
        <Header user={user} />

        {/* Usamos las clases utilitarias de index.css para las animaciones suaves */}
        <div className="view-section active">
          {view === "alumnos" && <Alumnos />}
          {view === "docentes" && user.role === "admin" && <Docentes />}
          {view === "asistencias" && <Asistencias />}
          {view === "notas" && <Notas />}
          {view === "actas" && <Actas />}
        </div>
      </main>
    </div>
  );
}

export default PreceptorDashboard;