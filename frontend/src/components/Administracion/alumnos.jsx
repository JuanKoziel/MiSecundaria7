import { Fragment, useMemo, useState } from 'react';
import { useData } from '../../context/DataContext';
import FiltrosAnioCurso from './FiltrosAnioCurso';

const API_BASE = 'http://localhost:8000';

function ActasDesplegable({ actas, colSpan }) {
  if (actas.length === 0) {
    return (
      <tr className="acta-desplegable-row">
        <td colSpan={colSpan} className="empty-state-message">
          No hay actas cargadas.
        </td>
      </tr>
    );
  }
  return (
    <tr className="acta-desplegable-row">
      <td colSpan={colSpan}>
        <table className="acta-desplegable-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Descripción</th>
              <th>Archivo</th>
              <th>Autor</th>
            </tr>
          </thead>
          <tbody>
            {actas.map((acta) => (
              <tr key={acta.id}>
                <td>{acta.fecha}</td>
                <td>{acta.descripcion || acta.titulo}</td>
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
                  ) : '—'}
                </td>
                <td>{acta.autor || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </td>
    </tr>
  );
}

function Alumnos() {
  const {
    cursosObj,
    actas: actasCurso,
    getActasByAlumnoId,
    getAlumnosByCurso,
  } = useData();

  const [curso, setCurso] = useState('');
  const [expandido, setExpandido] = useState(null);

  const alumnosCurso = useMemo(() => getAlumnosByCurso(curso), [curso, getAlumnosByCurso]);

  return (
    <>
      <div className="card">
        <div className="card-header-flex">
          <h3>Listado de Alumnos</h3>
        </div>

        <FiltrosAnioCurso
          cursosObj={cursosObj}
          defaultToFirst
          onCursoChange={(nuevoCurso) => {
            setCurso(nuevoCurso);
            setExpandido(null);
          }}
        />

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Apellido</th>
                <th>DNI</th>
                <th>Fecha de nacimiento</th>
                <th>Dirección</th>
                <th>Teléfono</th>
                <th>Procedencia</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {alumnosCurso.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty-state-message">
                    No hay alumnos registrados en este curso.
                  </td>
                </tr>
              ) : (
                alumnosCurso.map((a) => {
                  const abierto = expandido === a.id;
                  return (
                    <Fragment key={a.id}>
                      <tr>
                        <td>{a.nombre}</td>
                        <td>{a.apellido}</td>
                        <td><strong>{a.dni}</strong></td>
                        <td>{a.fecha_nacimiento || '—'}</td>
                        <td>{a.direccion || '—'}</td>
                        <td>{a.telefono || '—'}</td>
                        <td>{a.procedencia || '—'}</td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-success table-download-btn"
                            onClick={() => setExpandido(abierto ? null : a.id)}
                          >
                            <i className={`fas fa-chevron-${abierto ? 'up' : 'down'}`} aria-hidden="true" />{' '}
                            {abierto ? 'Ocultar actas' : 'Ver actas'}
                          </button>
                        </td>
                      </tr>
                      {abierto && (
                        <ActasDesplegable actas={getActasByAlumnoId(a.id)} colSpan={8} />
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

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
                      <th>Autor</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {actasCursoFiltradas.map((acta) => (
                      <tr key={acta.id}>
                        <td className="table-cell-strong">{acta.titulo || acta.descripcion}</td>
                        <td>{acta.fecha}</td>
                        <td>{acta.descripcion}</td>
                        <td>{acta.autor || '—'}</td>
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
