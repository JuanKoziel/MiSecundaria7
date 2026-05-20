import { useState } from "react";
import Sidebar from "./sidebar/sidebar";
import Header from "./header/header";
import Alumnos from "./alumnos";
import Docentes from "./docentes";
import Asistencias from "./asistencias";
import Notas from "./notas";
import Actas from "./actas";

function App({ user, onLogout }) {
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

export default App;