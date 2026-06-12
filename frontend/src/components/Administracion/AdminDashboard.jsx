import { useState } from 'react';
import Sidebar from './sidebar/sidebar';
import Header from './header/header';
import Alumnos from './alumnos';
import Docentes from './docentes';
import Horarios from './horarios';
import Asistencias from './asistencias';
import Notas from './notas';
import Comunicados from './comunicados';
import Notificaciones from '../Notificaciones';
import DiagnosticosView from '../Shared/DiagnosticosView';
import Administradores from './administradores';
import Preceptores from './preceptores';

function AdminDashboard({ user, onLogout }) {
  const [view, setView] = useState('alumnos');

  const renderView = () => {
    switch (view) {
      case 'alumnos':
        return <Alumnos />;
      case 'docentes':
        return <Docentes />;
      case 'preceptores':
        return <Preceptores />;
      case 'horarios':
        return <Horarios />;
      case 'asistencias':
        return <Asistencias />;
      case 'notas':
        return <Notas />;
      case 'comunicados':
        return <Comunicados />;
      case 'info':
        return <DiagnosticosView userRole={user.role === 'director' ? 'director' : 'admin'} />;
      case 'administradores':
        return <Administradores />;
      case 'notificaciones':
        return <Notificaciones />;
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
