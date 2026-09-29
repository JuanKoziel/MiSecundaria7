import { useEffect, useState } from 'react';
import Sidebar from './sidebar/sidebar';
import Header from './header/header';
import Estudiantes from './estudiantes';
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
import TutoresFamilias from '../Preceptores/tutoresFamilias';
import { getDirectivos } from '../../services/api';
import { useData } from '../../context/DataContext';
import { viewDesdeDestino } from '../../utils/navDestinos';

function AdminDashboard({ user, onLogout }) {
  const {
    navIntent,
    cursosObj,
    selectedCursoId,
    setSeleccionCursoMateria,
  } = useData();
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

  // Punto 1.4: el header es la única fuente de selección. Lo que se elige ahí se
  // publica en el contexto global para que las vistas consuman siempre el mismo
  // curso y no vuelvan a mostrar selectores duplicados.
  useEffect(() => {
    const seleccionado = (cursosObj || []).find((c) => c.nombre_curso === curso);
    const idActual = seleccionado?.id_curso ? String(seleccionado.id_curso) : '';
    if (idActual === String(selectedCursoId || '')) return;
    setSeleccionCursoMateria(idActual, '', '');
  }, [curso, cursosObj, selectedCursoId, setSeleccionCursoMateria]);

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
        return <Estudiantes {...filtrosProps} />;
      case 'docentes':
        return <Docentes {...filtrosProps} />;
      case 'preceptores':
        return <Preceptores {...filtrosProps} />;
      case 'jefes-preceptores':
        return <Preceptores rol="jefe_preceptores" {...filtrosProps} />;
      case 'horarios':
        return <Horarios {...filtrosProps} />;
      case 'adelantos-horas':
        return <AdelantosHoras {...filtrosProps} />;
      case 'asistencias':
        return <Asistencias {...filtrosProps} />;
      case 'calendario':
        return <CalendarioInstitucional {...filtrosProps} />;
      case 'notas':
        return <Notas {...filtrosProps} />;
      case 'comunicados':
        return <Comunicados {...filtrosProps} />;
      case 'cursos':
        return <Cursos {...filtrosProps} />;
      case 'materias':
        return <Materias {...filtrosProps} />;
      case 'suplencias':
        return <Suplencias {...filtrosProps} />;
      case 'historial':
        return <Historial {...filtrosProps} />;
      case 'tutores':
        return <TutoresFamilias {...filtrosProps} />;
      case 'actas':
        return <Actas {...filtrosProps} showFiltros />;
      case 'info':
        return <DiagnosticosView userRole={user.role === 'director' ? 'director' : 'admin'} {...filtrosProps} />;
      case 'administradores':
        return <Administradores {...filtrosProps} />;
      case 'notificaciones':
        return <Notificaciones userRole={user.role} {...filtrosProps} />;
      default:
        return <Estudiantes {...filtrosProps} />;
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar view={view} setView={setView} onLogout={onLogout} />

      <main className="main-content">
        <Header
            user={user}
            nombreCompleto={nombreCompletoAdmin}
            anioLectivo={anioLectivo}
            curso={curso}
            onAnioChange={handleAnioChange}
            onCursoChange={setCurso}
          />
        <div className="view-section active">{renderView()}</div>
      </main>
    </div>
  );
}

export default AdminDashboard;
