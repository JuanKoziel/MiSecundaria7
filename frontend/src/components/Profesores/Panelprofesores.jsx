import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';
import PanelAlumnos from './PanelAlumnos';
import PanelInfo from './PanelInfo';
import PanelPlanif from './PanelPlanif';
import PanelAsistencia from './PanelAsistencia';
import MateriasGrid from './MateriasGrid';
import { fetchCatalogos } from '../../api/services';

function PanelProfesores({ user, onLogout }) {
  const [cursoSeleccionado, setCursoSeleccionado] = useState('');
  const [materiaSeleccionada, setMateriaSeleccionada] = useState('');
  const [seccionActiva, setSeccionActiva] = useState('alumnos');
  const [cursos, setCursos] = useState([]);
  const [materias, setMaterias] = useState([]);

  useEffect(() => {
    fetchCatalogos()
      .then((data) => {
        setCursos(data.cursos);
        setMaterias(data.materias);
      })
      .catch(console.error);
  }, []);

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

        <div className="card">
          <div className="filter-row">
            <div className="form-group-filter">
              <label htmlFor="curso-select">Curso Activo</label>
              <select
                id="curso-select"
                value={cursoSeleccionado}
                onChange={(e) => handleCursoChange(e.target.value)}
              >
                <option value="" disabled>
                  Seleccione un curso...
                </option>
                {cursos.map((curso) => (
                  <option key={curso} value={curso}>
                    {curso}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {cursoSeleccionado && (
            <MateriasGrid
              materias={materias}
              materiaSeleccionada={materiaSeleccionada}
              onSeleccionarMateria={setMateriaSeleccionada}
            />
          )}
        </div>

        {cursoSeleccionado && materiaSeleccionada ? (
          <>
            <div className={`view-section ${seccionActiva === 'alumnos' ? 'active' : ''}`}>
              {seccionActiva === 'alumnos' && (
                <PanelAlumnos curso={cursoSeleccionado} materia={materiaSeleccionada} />
              )}
            </div>
            <div className={`view-section ${seccionActiva === 'info' ? 'active' : ''}`}>
              {seccionActiva === 'info' && <PanelInfo />}
            </div>
            <div className={`view-section ${seccionActiva === 'planif' ? 'active' : ''}`}>
              {seccionActiva === 'planif' && <PanelPlanif />}
            </div>
            <div className={`view-section ${seccionActiva === 'asistencia' ? 'active' : ''}`}>
              {seccionActiva === 'asistencia' && (
                <PanelAsistencia curso={cursoSeleccionado} materia={materiaSeleccionada} />
              )}
            </div>
          </>
        ) : (
          <div className="card empty-state-card">
            <p className="empty-state-message">
              {!cursoSeleccionado
                ? 'Por favor, seleccione un curso en el Panel de Control superior.'
                : 'Por favor, seleccione una materia para desplegar las planillas de trabajo.'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default PanelProfesores;
