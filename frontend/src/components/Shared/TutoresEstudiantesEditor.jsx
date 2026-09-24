import { useData } from '../../context/DataContext';
import FiltrosAnioCurso from '../Shared/FiltrosAnioCurso';
import { estudiantesPorAnioYCurso } from '../Preceptores/preceptorUtils';

function TutoresEstudiantesEditor({
  anioEstudiante,
  setAnioEstudiante,
  cursoEstudiante,
  setCursoEstudiante,
  alumnos_ids,
  setEstudiantesIds,
  idPrefix = 'tut-estudiante',
}) {
  const { inscripciones, estudiantes, aniosLectivos, cursosObj } = useData();

  const listaEstudiantes = estudiantesPorAnioYCurso(
    anioEstudiante,
    cursoEstudiante,
    inscripciones,
    estudiantes,
  );

  const toggleEstudiante = (id) => {
    const idNum = Number(id);
    const yaExiste = alumnos_ids.includes(idNum);
    if (yaExiste) {
      setEstudiantesIds(alumnos_ids.filter((x) => x !== idNum));
    } else {
      setEstudiantesIds([...alumnos_ids, idNum]);
    }
  };

  return (
    <div style={{ display: 'grid', gap: '10px' }}>
      <FiltrosAnioCurso
        aniosLectivos={aniosLectivos}
        cursosObj={cursosObj}
        anioLectivo={anioEstudiante}
        curso={cursoEstudiante}
        onAnioChange={setAnioEstudiante}
        onCursoChange={setCursoEstudiante}
      />
      {!anioEstudiante || !cursoEstudiante ? (
        <p className="empty-state-message">
          Seleccioná año lectivo y curso para asignar estudiantes.
        </p>
      ) : listaEstudiantes.length === 0 ? (
        <p className="empty-state-message">
          No hay estudiantes registrados en ese curso.
        </p>
      ) : (
        <div
          style={{
            maxHeight: 220,
            overflowY: 'auto',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
          }}
        >
          {listaEstudiantes.map((al) => {
            const activo = alumnos_ids.includes(Number(al.id));
            return (
              <label
                key={al.id}
                className={`preceptor-curso-option${activo ? ' preceptor-curso-option--selected' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '9px 12px',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--border-color)',
                  margin: 0,
                }}
              >
                <input
                  type="checkbox"
                  id={`${idPrefix}-${al.id}`}
                  checked={activo}
                  onChange={() => toggleEstudiante(al.id)}
                />
                <span>
                  {al.apellido}, {al.nombre}
                </span>
              </label>
            );
          })}
        </div>
      )}
      <p className="m-0" style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
        Asignados: <strong>{alumnos_ids.length}</strong> estudiante(s)
      </p>
    </div>
  );
}

export default TutoresEstudiantesEditor;