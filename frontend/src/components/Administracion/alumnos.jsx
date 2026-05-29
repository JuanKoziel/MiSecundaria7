import { useEffect, useMemo, useState } from 'react';
import { useData } from '../../context/DataContext';

const API_BASE = 'http://localhost:8000';

function Alumnos() {
  const {
    alumnos,
    cursos,
    actas: actasCurso,
    getActasByAlumnoId,
    getAlumnosByCurso,
    nombreCompleto,
  } = useData();

  const [curso, setCurso] = useState('');
  const [alumnoActasId, setAlumnoActasId] = useState(null);

  useEffect(() => {
    if (!curso && cursos.length > 0) {
      setCurso(cursos[0]);
    }
  }, [cursos, curso]);

  const alumnosCurso = useMemo(() => getAlumnosByCurso(curso), [curso, getAlumnosByCurso]);
  const actasSeleccionadas = useMemo(() => {
    if (!alumnoActasId) return [];
    return getActasByAlumnoId(alumnoActasId);
  }, [alumnoActasId, getActasByAlumnoId]);

  const alumnoActas = alumnos.find((a) => a.id === alumnoActasId);

  const handleVerActa = (acta) => {
    if (acta.ruta_archivo) {
      window.open(`${API_BASE}${acta.ruta_archivo}`, '_blank');
    } else {
      alert('Esta acta no tiene archivo adjunto.');
    }
  };

  return (
    <>
      <div className="card">
        <div className="card-header-flex">
          <h3>Listado de Alumnos</h3>
        </div>

        <div className="filter-row">
          <div className="form-group-filter">
            <label htmlFor="curso-alumnos">Curso</label>
            <select
              id="curso-alumnos"
              value={curso}
              onChange={(e) => {
                setCurso(e.target.value);
                setAlumnoActasId(null);
              }}
            >
              {cursos.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>DNI</th>
                <th>Nombre Completo</th>
                <th>Curso</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {alumnosCurso.length === 0 ? (
                <tr>
                  <td colSpan={4} className="empty-state-message">
                    No hay alumnos registrados en este curso.
                  </td>
                </tr>
              ) : (
                alumnosCurso.map((a) => (
                  <tr key={a.id}>
                    <td><strong>{a.dni}</strong></td>
                    <td>{nombreCompleto(a)}</td>
                    <td>{a.curso}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-success table-download-btn"
                        onClick={() => setAlumnoActasId(a.id)}
                      >
                        <i className="fas fa-file-pdf" aria-hidden="true" /> Ver actas
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {alumnoActas && (
        <div className="card" style={{ marginTop: '20px' }}>
          <div className="card-header-flex">
            <h3>Actas — {nombreCompleto(alumnoActas)}</h3>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setAlumnoActasId(null)}
            >
              Cerrar
            </button>
          </div>

          {actasSeleccionadas.length === 0 ? (
            <p className="empty-state-message">
              No hay actas cargadas para este alumno en este momento.
            </p>
          ) : (
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Documento</th>
                    <th>Fecha de carga</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {actasSeleccionadas.map((acta) => (
                    <tr key={acta.id}>
                      <td className="table-cell-strong">{acta.titulo}</td>
                      <td>{acta.fecha}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-success table-download-btn"
                          onClick={() => handleVerActa(acta)}
                        >
                          <i className="fas fa-file-pdf" aria-hidden="true" /> Ver Acta
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {curso && (
        <div className="card" style={{ marginTop: '20px' }}>
          <div className="card-header-flex">
            <h3>Actas del Curso — {curso}</h3>
          </div>
          {(() => {
            const actasCursoFiltradas = actasCurso.filter((a) => a.curso === curso);
            return actasCursoFiltradas.length === 0 ? (
              <p className="empty-state-message">No hay actas registradas para este curso.</p>
            ) : (
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Título</th>
                      <th>Fecha</th>
                      <th>Descripción</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {actasCursoFiltradas.map((acta) => (
                      <tr key={acta.id}>
                        <td className="table-cell-strong">{acta.titulo || acta.descripcion}</td>
                        <td>{acta.fecha}</td>
                        <td>{acta.descripcion}</td>
                        <td>
                          {acta.ruta_archivo ? (
                            <a
                              href={`${API_BASE}${acta.ruta_archivo}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-success table-download-btn"
                            >
                              <i className="fas fa-file-pdf" aria-hidden="true" /> Ver
                            </a>
                          ) : (
                            <span className="empty-state-message">Sin archivo</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      )}
    </>
  );
}

export default Alumnos;
