import { useState } from 'react';
import Sidebar from './Sidebar';
import PanelDocente from './PanelDocente';
import TopHeader from './TopHeader';
import PanelAlumnos from './PanelAlumnos';
import PanelInfo from './PanelInfo';
import PanelPlanif from './PanelPlanif';
import PanelAsistencia from './PanelAsistencia';
import MateriasGrid from './MateriasGrid';
import { cursos } from '../../data/mockData';

function PanelProfesores({ user, onLogout }) {
  const [cursoSeleccionado, setCursoSeleccionado] = useState('');
  const [materiaSeleccionada, setMateriaSeleccionada] = useState('');
  const [seccionActiva, setSeccionActiva] = useState('alumnos');

  const handleCursoChange = (nuevoCurso) => {
    setCursoSeleccionado(nuevoCurso);
    setMateriaSeleccionada('');
  };

  return (
    <div className="dashboard-layout">
      <Sidebar
        seccionActiva={seccionActiva}
        onCambiarSeccion={setSeccionActiva}
        onLogout={onLogout}
      />

      <main className="main-content">
        <TopHeader
          user={user}
          cursoSeleccionado={cursoSeleccionado}
          materiaSeleccionada={materiaSeleccionada}
        />

        {/* ========================================================= */}
        {/* PANEL SUPERIOR DE FILTROS                                */}
        {/* ========================================================= */}

        {seccionActiva !== 'docente' && (
          <div className="card">
            <div className="card-header-flex">
              <h3>Panel de trabajo</h3>
            </div>

            <div className="filter-row">
              <div className="form-group-filter">
                <label htmlFor="curso-select">
                  Curso Activo
                </label>

                <select
                  id="curso-select"
                  value={cursoSeleccionado}
                  onChange={(e) => handleCursoChange(e.target.value)}
                >
                  <option value="" disabled hidden>
                    Seleccione un curso...
                  </option>

                  {cursos.map((curso) => (
                    <option
                      key={curso}
                      value={curso}
                    >
                      {curso}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {cursoSeleccionado && (
              <MateriasGrid
                materiaSeleccionada={materiaSeleccionada}
                onSeleccionarMateria={setMateriaSeleccionada}
              />
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* CONTENIDO DINÁMICO                                       */}
        {/* ========================================================= */}

        {seccionActiva === 'docente' ? (

          <div className="view-section active">
            <PanelDocente />
          </div>

        ) : cursoSeleccionado && materiaSeleccionada ? (

          <>
            <div
              className={`view-section ${
                seccionActiva === 'alumnos'
                  ? 'active'
                  : ''
              }`}
            >
              {seccionActiva === 'alumnos' && (
                <PanelAlumnos />
              )}
            </div>

            <div
              className={`view-section ${
                seccionActiva === 'info'
                  ? 'active'
                  : ''
              }`}
            >
              {seccionActiva === 'info' && (
                <PanelInfo />
              )}
            </div>

            <div
              className={`view-section ${
                seccionActiva === 'planif'
                  ? 'active'
                  : ''
              }`}
            >
              {seccionActiva === 'planif' && (
                <PanelPlanif />
              )}
            </div>

            <div
              className={`view-section ${
                seccionActiva === 'asistencia'
                  ? 'active'
                  : ''
              }`}
            >
              {seccionActiva === 'asistencia' && (
                <PanelAsistencia />
              )}
            </div>
          </>

        ) : (

          <div className="card empty-state-card">
            <p className="empty-state-message">
              {!cursoSeleccionado
                ? 'Por favor, seleccione un curso.'
                : 'Por favor, seleccione una materia.'}
            </p>
          </div>

        )}
      </main>
    </div>
  );
}

export default PanelProfesores;