import { useMemo, useState } from 'react';
import {
  alumnos,
  cursos,
  getActasByAlumnoId,
  getAlumnosByCurso,
  nombreCompleto,
} from '../../data/mockData';

function Alumnos() {
  const [curso, setCurso] = useState(cursos[0]);
  const [alumnoActasId, setAlumnoActasId] = useState(null);

  const alumnosCurso = useMemo(() => getAlumnosByCurso(curso), [curso]);
  const actasSeleccionadas = useMemo(() => {
    if (!alumnoActasId) return [];
    return getActasByAlumnoId(alumnoActasId);
  }, [alumnoActasId]);

  const alumnoActas = alumnos.find((a) => a.id === alumnoActasId);

  const handleVerActa = (acta) => {
    alert(`Abriendo ${acta.archivo} — ${acta.titulo} (modo demostración).`);
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
                    <th>Materia</th>
                    <th>Fecha de carga</th>
                    <th>Cargado por</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {actasSeleccionadas.map((acta) => (
                    <tr key={acta.id}>
                      <td className="table-cell-strong">{acta.titulo}</td>
                      <td>{acta.materia}</td>
                      <td>{acta.fecha}</td>
                      <td>{acta.cargadoPor}</td>
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
    </>
  );
}

export default Alumnos;
