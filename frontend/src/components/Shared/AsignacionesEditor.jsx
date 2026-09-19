import { useData } from '../../context/DataContext';

function AsignacionesEditor({ asignaciones, setAsignaciones, idPrefix = 'asig' }) {
  const { aniosLectivos, cursosObj, materiasObj } = useData();

  const cursosDelCiclo = (anioLectivo) =>
    (cursosObj || []).filter((c) => String(c.ciclo_anio) === String(anioLectivo));

  const actualizar = (index, campo, valor) => {
    setAsignaciones((prev) =>
      prev.map((a, i) => (i === index ? { ...a, [campo]: valor } : a)),
    );
  };

  const agregarFila = () => {
    setAsignaciones((prev) => [
      ...prev,
      {
        materia: '',
        anioLectivo: aniosLectivos?.[0] ? String(aniosLectivos[0]) : '',
        curso: '',
        isNew: true,
      },
    ]);
  };

  const quitarFila = (index) => {
    setAsignaciones((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="preceptor-form-full">
      <label>Asignaciones (curso - materia)</label>
      {asignaciones.length === 0 ? (
        <p className="empty-state-message">
          Sin asignaciones. Agregá una materia para el docente.
        </p>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {asignaciones.map((asig, index) => {
            const cursos = cursosDelCiclo(asig.anioLectivo);
            return (
              <div
                key={asig.cmId || `${idPrefix}-${index}`}
                className="filter-row"
                style={{ alignItems: 'end' }}
              >
                <div className="form-group-filter">
                  <label htmlFor={`${idPrefix}-anio-${index}`}>Año lectivo</label>
                  <select
                    id={`${idPrefix}-anio-${index}`}
                    value={asig.anioLectivo || ''}
                    onChange={(e) =>
                      actualizar(index, 'anioLectivo', e.target.value)
                    }
                  >
                    <option value="">Seleccione año...</option>
                    {(aniosLectivos || []).map((anio) => (
                      <option key={anio} value={anio}>
                        {anio}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group-filter">
                  <label htmlFor={`${idPrefix}-curso-${index}`}>Curso</label>
                  <select
                    id={`${idPrefix}-curso-${index}`}
                    value={asig.curso || ''}
                    onChange={(e) =>
                      actualizar(index, 'curso', e.target.value)
                    }
                    disabled={!asig.anioLectivo}
                  >
                    <option value="">Seleccione curso...</option>
                    {cursos.map((c) => (
                      <option key={c.id_curso} value={c.nombre_curso}>
                        {c.nombre_curso}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group-filter">
                  <label htmlFor={`${idPrefix}-materia-${index}`}>Materia</label>
                  <select
                    id={`${idPrefix}-materia-${index}`}
                    value={asig.materia || ''}
                    onChange={(e) =>
                      actualizar(index, 'materia', e.target.value)
                    }
                  >
                    <option value="">Seleccione materia...</option>
                    {(materiasObj || []).map((m) => (
                      <option key={m.id_materia} value={m.nombre_materia}>
                        {m.nombre_materia}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  onClick={() => quitarFila(index)}
                  title="Quitar asignación"
                >
                  <i className="fas fa-times" aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </div>
      )}
      <div className="mt-12">
        <button
          type="button"
          className="btn btn-sm btn-secondary"
          onClick={agregarFila}
        >
          <i className="fas fa-plus" aria-hidden="true" /> Agregar materia
        </button>
      </div>
    </div>
  );
}

export default AsignacionesEditor;