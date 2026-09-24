import { useData } from '../../context/DataContext';
import FiltrosAnioCurso from '../Shared/FiltrosAnioCurso';
import { alumnosPorAnioYCurso } from '../Preceptores/preceptorUtils';

function TutoresAlumnosEditor({
  anioAlumno,
  setAnioAlumno,
  cursoAlumno,
  setCursoAlumno,
  alumnos_ids,
  setAlumnosIds,
  idPrefix = 'tut-alumno',
}) {
  const { inscripciones, alumnos, aniosLectivos, cursosObj } = useData();

  const listaAlumnos = alumnosPorAnioYCurso(
    anioAlumno,
    cursoAlumno,
    inscripciones,
    alumnos,
  );

  const toggleAlumno = (id) => {
    const idNum = Number(id);
    const yaExiste = alumnos_ids.includes(idNum);
    if (yaExiste) {
      setAlumnosIds(alumnos_ids.filter((x) => x !== idNum));
    } else {
      setAlumnosIds([...alumnos_ids, idNum]);
    }
  };

  return (
    <div style={{ display: 'grid', gap: '10px' }}>
      <FiltrosAnioCurso
        aniosLectivos={aniosLectivos}
        cursosObj={cursosObj}
        anioLectivo={anioAlumno}
        curso={cursoAlumno}
        onAnioChange={setAnioAlumno}
        onCursoChange={setCursoAlumno}
      />
      {!anioAlumno || !cursoAlumno ? (
        <p className="empty-state-message">
          Seleccioná año lectivo y curso para asignar estudiantes.
        </p>
      ) : listaAlumnos.length === 0 ? (
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
          {listaAlumnos.map((al) => {
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
                  onChange={() => toggleAlumno(al.id)}
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

export default TutoresAlumnosEditor;