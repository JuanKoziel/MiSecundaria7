import { useEffect, useState } from 'react';
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
import Cursos from './cursos';
import Materias from './materias';
import CalendarioInstitucional from './CalendarioInstitucional';
import PanelAdmin from './PanelAdmin';
import { getDirectivos } from '../../services/api';

function AdminDashboard({ user, onLogout }) {
  const [view, setView] = useState('perfil');
  const [directivos, setDirectivos] = useState([]);

  useEffect(() => {
    getDirectivos()
      .then(setDirectivos)
      .catch(() => setDirectivos([]));
  }, []);

  const miDirectivo = directivos.find((d) => d.id_usuario === user?.id) || null;

  const renderView = () => {
    switch (view) {
      case 'perfil':
        return <PanelAdmin miDirectivo={miDirectivo} user={user} />;
      case 'alumnos':
        return <Alumnos />;
      case 'docentes':
        return <Docentes />;
      case 'preceptores':
        return <Preceptores />;
      case 'jefes-preceptores':
        return <Preceptores rol="jefe_preceptores" />;
      case 'horarios':
        return <Horarios />;
      case 'asistencias':
        return <Asistencias />;
      case 'calendario':
        return <CalendarioInstitucional />;
      case 'notas':
        return <Notas />;
      case 'comunicados':
        return <Comunicados />;
      case 'cursos':
        return <Cursos />;
      case 'materias':
        return <Materias />;
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
