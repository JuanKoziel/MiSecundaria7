import { useState, useMemo, useEffect } from 'react';

import Sidebar from './sidebar';
import Header from './header';

import Alumnos from './alumnos';
import Tutores from './tutores';
import Asistencias from './asistencias';
import Notas from './notas';
import Actas from './actas';
import Docentes from './docentes';
import GestionDiaria from './GestionDiaria';
import Proyectos from './Proyectos';
import ActividadesView from '../Shared/ActividadesView';
import Horarios from '../Administracion/horarios';
import Notificaciones from '../Notificaciones';
import ComunicadosView from '../Shared/ComunicadosView';
import CalendarioInstitucional from '../Administracion/CalendarioInstitucional';
import AdelantosHoras from '../Shared/AdelantosHoras';
import PanelPreceptor from './PanelPreceptor';
import { useData } from '../../context/DataContext';
import { viewDesdeDestino } from '../../utils/navDestinos';

function PreceptorDashboard({ user, onLogout }) {

  const { preceptores, navIntent, cursosObj } = useData();

  const userId = user?.id_usuario ?? user?.id ?? null;
  const miPreceptor = useMemo(
    () => preceptores.find((p) => p.id_usuario === userId) || null,
    [preceptores, userId],
  );
  const nombreCompletoPreceptor = miPreceptor ? `${miPreceptor.apellido}, ${miPreceptor.nombre}` : null;

  const [view, setView] = useState('perfil');

  // Parte 8: manejar navegación desde notificaciones.
  useEffect(() => {
    if (navIntent && navIntent.destino) {
      const vista = viewDesdeDestino(navIntent.destino, 'preceptor');
      if (vista) setView(vista);
    }
  }, [navIntent]);

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

  const cursoId = useMemo(
    () => (curso ? (cursosObj || []).find((c) => c.nombre_curso === curso)?.id_curso || null : null),
    [curso, cursosObj],
  );

  const renderView = () => {

    switch (view) {

      case 'perfil':
        return (
          <div className="view-section active">
            <PanelPreceptor miPreceptor={miPreceptor} />
          </div>
        );

      case 'alumnos':
        return (
          <div className="view-section active">
            <Alumnos
              preceptorCursos={miPreceptor?.cursos || []}
              anioLectivo={anioLectivo}
              curso={curso}
              onAnioChange={handleAnioChange}
              onCursoChange={setCurso}
            />
          </div>
        );

      case 'tutores':
        return (
          <div className="view-section active">
            <Tutores />
          </div>
        );

      case 'docentes':
        return (
          <div className="view-section active">
            <Docentes />
          </div>
        );

      case 'horarios':
        return (
          <div className="view-section active">
            <Horarios esControlado cursoGlobal={curso} />
          </div>
        );

      case 'panel-diario':
        return (
          <div className="view-section active">
            <GestionDiaria anioLectivo={anioLectivo} curso={curso} />
          </div>
        );

      case 'proyectos':
        return (
          <div className="view-section active">
            <Proyectos anioLectivo={anioLectivo} curso={curso} />
          </div>
        );

      case 'actividades':
        return (
          <div className="view-section active">
            <ActividadesView userRole="preceptor" cursoId={cursoId} cursoNombre={curso} />
          </div>
        );

      case 'adelantos-horas':
        return (
          <div className="view-section active">
            <AdelantosHoras />
          </div>
        );

      case 'asistencias':
        return (
          <div className="view-section active">
            <Asistencias {...filtrosProps} />
          </div>
        );

      case 'notas':
        return (
          <div className="view-section active">
            <Notas {...filtrosProps} />
          </div>
        );

      case 'actas':
        return (
          <div className="view-section active">
            <Actas {...filtrosProps} />
          </div>
        );

      case 'notificaciones':
        return (
          <div className="view-section active">
            <Notificaciones userRole="preceptor" />
          </div>
        );

      case 'comunicados':
        return (
          <div className="view-section active">
            <ComunicadosView userRole="preceptor" />
          </div>
        );

      case 'calendario':
        return (
          <div className="view-section active">
            <CalendarioInstitucional readOnly />
          </div>
        );

      default:
        return (
          <div className="view-section active">
            <Alumnos
              anioLectivo={anioLectivo}
              curso={curso}
              onAnioChange={handleAnioChange}
              onCursoChange={setCurso}
            />
          </div>
        );
    }
  };

  return (
    <div className="dashboard-layout">

      <Sidebar
        view={view}
        setView={setView}
        onLogout={onLogout}
      />

      <main className="main-content">

        <Header
          user={user}
          nombreCompleto={nombreCompletoPreceptor}
          anioLectivo={anioLectivo}
          curso={curso}
          onAnioChange={handleAnioChange}
          onCursoChange={setCurso}
        />

        {/* ===================================================== */}
        {/* CONTENIDO PRINCIPAL                                   */}
        {/* ===================================================== */}

        <div className="dashboard-content">
          {renderView()}
        </div>

      </main>
    </div>
  );
}

export default PreceptorDashboard;