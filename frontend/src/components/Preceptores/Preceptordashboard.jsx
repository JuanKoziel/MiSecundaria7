import { useState } from 'react';
import Sidebar from './sidebar/sidebar';
import Header from './header/header';
import Alumnos from './alumnos';
import Docentes from './docentes';
import Asistencias from './asistencias';
import Notas from './notas';
import Actas from './actas';

function PreceptorDashboard({ user, onLogout }) {
  const [view, setView] = useState('alumnos');

  const renderView = () => {
    switch (view) {
      case 'alumnos':
        return <Alumnos />;
      case 'docentes':
        if (user.role === 'admin') return <Docentes />;
        return (
          <div className="card empty-state-card empty-state-card--compact">
            <p className="empty-state-message">No tenés permisos para ver esta sección.</p>
          </div>
        );
      case 'asistencias':
        return <Asistencias />;
      case 'notas':
        return <Notas />;
      case 'actas':
        return <Actas />;
      default:
        return <Alumnos />;
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar user={user} view={view} setView={setView} onLogout={onLogout} />

      <main className="main-content">
        <Header user={user} />
        <div className="view-section active">{renderView()}</div>
      </main>
    </div>
  );
}

export default PreceptorDashboard;
