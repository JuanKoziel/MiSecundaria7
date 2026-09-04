import { useState, useMemo, useEffect } from 'react';

import Sidebar from './sidebar';
import Header from './header';

import Alumnos from './alumnos';
import Tutores from './tutores';
import Asistencias from './asistencias';
import Notas from './notas';
import Actas from './actas';
import Docentes from './docentes';
import Horarios from '../Administracion/horarios';
import Notificaciones from '../Notificaciones';
import ComunicadosView from '../Shared/ComunicadosView';
import CalendarioInstitucional from '../Administracion/CalendarioInstitucional';
import AdelantosHoras from '../Shared/AdelantosHoras';
import PanelPreceptor from './PanelPreceptor';
import { useData } from '../../context/DataContext';
import { viewDesdeDestino } from '../../utils/navDestinos';

function PreceptorDashboard({ user, onLogout }) {

  const { preceptores, navIntent } = useData();

  const userId = user?.id_usuario ?? user?.id ?? null;
  const miPreceptor = useMemo(
    () => preceptores.find((p) => p.id_usuario === userId) || null,
    [preceptores, userId],
  );

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
            <Alumnos />
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
            <Horarios />
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
            <Alumnos />
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

        <Header user={user} />

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