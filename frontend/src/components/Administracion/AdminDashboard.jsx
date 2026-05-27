import { useState } from 'react';
import Sidebar from './sidebar/sidebar';
import Header from './header/header';
import Alumnos from './alumnos';
import Docentes from './docentes';
import Asistencias from './asistencias';
import Notas from './notas';
import Comunicados from './comunicados';

function AdminDashboard({ user, onLogout }) {
  const [view, setView] = useState('alumnos');

  const renderView = () => {
    switch (view) {
      case 'alumnos':
        return <Alumnos />;
      case 'docentes':
        return <Docentes />;
      case 'asistencias':
        return <Asistencias />;
      case 'notas':
        return <Notas />;
      case 'comunicados':
        return <Comunicados />;
      default:
        return <Alumnos />;
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar view={view} setView={setView} onLogout={onLogout} />

      <main className="main-content">
        <Header user={user} />
        <div className="view-section active">{renderView()}</div>
      </main>
    </div>
  );
}

export default AdminDashboard;
