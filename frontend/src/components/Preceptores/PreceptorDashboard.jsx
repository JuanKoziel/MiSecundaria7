import { useState } from 'react';

import Sidebar from './sidebar';
import Header from './header';

import Alumnos from './alumnos';
import Asistencias from './asistencias';
import Notas from './notas';
import Actas from './actas';
import Docentes from './docentes';
import Horarios from '../Administracion/horarios';
import Notificaciones from '../Notificaciones';
import ComunicadosView from '../Shared/ComunicadosView';

function PreceptorDashboard({ user, onLogout }) {

  const [view, setView] = useState('alumnos');

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

      case 'alumnos':
        return (
          <div className="view-section active">
            <Alumnos />
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
            <Notificaciones />
          </div>
        );

      case 'comunicados':
        return (
          <div className="view-section active">
            <ComunicadosView userRole="preceptor" />
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