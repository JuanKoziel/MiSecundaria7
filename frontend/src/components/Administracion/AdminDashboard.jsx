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
import Suplencias from './suplencias';
import CalendarioInstitucional from './CalendarioInstitucional';
import Historial from './historial';
import AdelantosHoras from '../Shared/AdelantosHoras';
import PanelAdmin from './PanelAdmin';
import Actas from '../Preceptores/actas';
import { getDirectivos } from '../../services/api';
import { useData } from '../../context/DataContext';
import { viewDesdeDestino } from '../../utils/navDestinos';

function AdminDashboard({ user, onLogout }) {
  const { navIntent } = useData();
  const [view, setView] = useState('perfil');
  const [directivos, setDirectivos] = useState([]);

  // Parte 8: manejar navegación desde notificaciones.
  useEffect(() => {
    if (navIntent && navIntent.destino) {
      const vista = viewDesdeDestino(navIntent.destino, user.role);
      if (vista) setView(vista);
    }
  }, [navIntent, user.role]);

  const [anioLectivo, setAnioLectivo] = useState('');
  const [curso, setCurso] = useState('');

  const handleAnioChange = (nuevoAnio) => {
    setAnioLectivo(nuevoAnio);
    setCurso('');
  };

  const filtrosProps = {
    anioLectivo,
    curso,
    onAnioChange: handleAnioChange,
    onCursoChange: setCurso,
  };

  useEffect(() => {
    getDirectivos()
      .then(setDirectivos)
      .catch(() => setDirectivos([]));
  }, []);

  const miDirectivo = directivos.find((d) => d.id_usuario === user?.id) || null;
  const nombreCompletoAdmin = miDirectivo ? `${miDirectivo.apellido}, ${miDirectivo.nombre}` : null;

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
      case 'adelantos-horas':
        return <AdelantosHoras />;
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
      case 'suplencias':
        return <Suplencias />;
      case 'historial':
        return <Historial />;
      case 'actas':
        return <Actas {...filtrosProps} />;
      case 'info':
        return <DiagnosticosView userRole={user.role === 'director' ? 'director' : 'admin'} />;
      case 'administradores':
        return <Administradores />;
      case 'notificaciones':
        return <Notificaciones userRole={user.role} />;
      default:
        return <Alumnos />;
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar view={view} setView={setView} onLogout={onLogout} />

      <main className="main-content">
        <Header user={user} nombreCompleto={nombreCompletoAdmin} />
        <div className="view-section active">{renderView()}</div>
      </main>
    </div>
  );
}

export default AdminDashboard;
