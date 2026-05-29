import { useState, useMemo } from 'react';
import Sidebar from './Sidebar';
import PanelDocente from './PanelDocente';
import TopHeader from './TopHeader';
import PanelAlumnos from './PanelAlumnos';
import PanelInfo from './PanelInfo';
import PanelPlanif from './PanelPlanif';
import PanelAsistencia from './PanelAsistencia';
import { useData } from '../../context/DataContext';

function PanelProfesores({ user, onLogout }) {
  const { docentes, cursoMateria, cursosObj } = useData();
  const [cursoId, setCursoId] = useState('');
  const [materiaSeleccionada, setMateriaSeleccionada] = useState('');
  const [seccionActiva, setSeccionActiva] = useState('alumnos');

  const miDocente = useMemo(
    () => docentes.find((d) => d.id_usuario === user?.id) || null,
    [docentes, user],
  );

  const misAsignaciones = useMemo(
    () => (miDocente ? cursoMateria.filter((cm) => cm.id_docente === miDocente.id) : []),
    [cursoMateria, miDocente],
  );

  const misCursos = useMemo(() => {
    const map = new Map();
    misAsignaciones.forEach((cm) => {
      if (!map.has(cm.id_curso)) {
        const cObj = cursosObj.find((c) => c.id_curso === cm.id_curso);
        map.set(cm.id_curso, {
          id_curso: cm.id_curso,
          nombre: cm.curso_nombre || '',
          anio: cObj?.ciclo_anio || '',
        });
      }
    });
    return [...map.values()];
  }, [misAsignaciones, cursosObj]);

  const materiasCurso = useMemo(
    () =>
      misAsignaciones
        .filter((cm) => String(cm.id_curso) === cursoId)
        .map((cm) => ({ id: cm.id, materia: cm.materia_nombre })),
    [misAsignaciones, cursoId],
  );

  const cursoMateriaActivo = useMemo(
    () =>
      misAsignaciones.find(
        (cm) => String(cm.id_curso) === cursoId && cm.materia_nombre === materiaSeleccionada,
      ) || null,
    [misAsignaciones, cursoId, materiaSeleccionada],
  );

  const cursoNombre = misCursos.find((c) => String(c.id_curso) === cursoId)?.nombre || '';

  const handleCursoChange = (nuevoId) => {
    setCursoId(nuevoId);
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
          cursoSeleccionado={cursoNombre}
          materiaSeleccionada={materiaSeleccionada}
        />

        {seccionActiva !== 'docente' && (
          <div className="card">
            <div className="filter-row">
              <div className="form-group-filter">
                <label htmlFor="curso-select">Curso Activo</label>
                <select
                  id="curso-select"
                  value={cursoId}
                  onChange={(e) => handleCursoChange(e.target.value)}
                >
                  <option value="" disabled hidden>
                    Seleccione un curso...
                  </option>
                  {misCursos.map((c) => (
                    <option key={c.id_curso} value={String(c.id_curso)}>
                      {c.nombre} ({c.anio})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {cursoId && (
              <div className="materias-wrapper">
                <h3>Mis Materias</h3>
                <div className="materias-grid">
                  {materiasCurso.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      className={`materia-btn ${materiaSeleccionada === m.materia ? 'active-materia' : ''}`}
                      onClick={() => setMateriaSeleccionada(m.materia)}
                    >
                      {m.materia}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {seccionActiva === 'docente' ? (
          <div className="view-section active">
            <PanelDocente miDocente={miDocente} />
          </div>
        ) : cursoId && materiaSeleccionada && cursoMateriaActivo ? (
          <>
            <div className={`view-section ${seccionActiva === 'alumnos' ? 'active' : ''}`}>
              {seccionActiva === 'alumnos' && (
                <PanelAlumnos
                  cursoMateriaId={cursoMateriaActivo.id}
                  cursoId={Number(cursoId)}
                  cursoNombre={cursoNombre}
                  materiaNombre={materiaSeleccionada}
                  docenteId={miDocente?.id}
                />
              )}
            </div>
            <div className={`view-section ${seccionActiva === 'info' ? 'active' : ''}`}>
              {seccionActiva === 'info' && (
                <PanelInfo cursoId={Number(cursoId)} docenteId={miDocente?.id} cursoNombre={cursoNombre} />
              )}
            </div>
            <div className={`view-section ${seccionActiva === 'planif' ? 'active' : ''}`}>
              {seccionActiva === 'planif' && <PanelPlanif />}
            </div>
            <div className={`view-section ${seccionActiva === 'asistencia' ? 'active' : ''}`}>
              {seccionActiva === 'asistencia' && (
                <PanelAsistencia
                  cursoMateriaId={cursoMateriaActivo.id}
                  cursoId={Number(cursoId)}
                  cursoNombre={cursoNombre}
                />
              )}
            </div>
          </>
        ) : (
          <div className="card empty-state-card">
            <p className="empty-state-message">
              {!miDocente
                ? 'No se encontró un perfil de docente vinculado a tu usuario.'
                : !cursoId
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
