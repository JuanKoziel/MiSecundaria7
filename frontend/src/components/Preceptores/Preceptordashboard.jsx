import { useState } from 'react';
import Sidebar from './sidebar';
import Header from './header';
import Alumnos from './alumnos';
import Asistencias from './asistencias';
import Notas from './notas';
import Actas from './actas';
import Docentes from './docentes';

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
        return <Alumnos />;
      case 'docentes':
        return <Docentes />;
      case 'asistencias':
        return <Asistencias {...filtrosProps} />;
      case 'notas':
        return <Notas {...filtrosProps} />;
      case 'actas':
        return <Actas {...filtrosProps} />;
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

export default PreceptorDashboard;
