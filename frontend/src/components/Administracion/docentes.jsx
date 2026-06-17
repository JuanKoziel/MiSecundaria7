import { Fragment, useMemo, useState } from 'react';
import { useData } from '../../context/DataContext';
import { cursoConOrientacion, parseCurso } from '../../utils/orientacion';

const API_BASE = 'http://localhost:8000';

function ActasDocenteDesplegable({ actas }) {
  if (actas.length === 0) {
    return <p className="empty-state-message">No hay actas cargadas.</p>;
  }

  return (
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
              ) : (
                '—'
              )}
            </td>
            <td>{acta.autor || '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CursosMateriasDesplegable({ docenteId, cursoMateria, planificaciones }) {
  const asignaciones = useMemo(() => {
    const map = new Map();
    cursoMateria
      .filter((cm) => cm.id_docente === docenteId)
      .forEach((cm) => {
        const key = `${cm.id_curso}-${cm.curso_nombre}`;
        if (!map.has(key)) {
          map.set(key, { curso: cm.curso_nombre, items: [] });
        }
        map.get(key).items.push(cm);
      });
    return [...map.values()];
  }, [cursoMateria, docenteId]);

  if (!asignaciones.length) {
    return <p className="empty-state-message">Sin cursos ni materias asignadas.</p>;
  }

  return (
    <table className="acta-desplegable-table docente-materias-table">
      <thead>
        <tr>
          <th>Curso</th>
          <th>Materia</th>
          <th>Proyecto</th>
        </tr>
      </thead>
      <tbody>
        {asignaciones.map((asig) =>
          asig.items.map((cm, index) => {
            const planificacion = planificaciones.find((p) => p.id_curso_materia === cm.id);
            const nombreCurso = cursoConOrientacion(asig.curso);
            const { anio, division } = parseCurso(asig.curso);
            return (
              <tr key={cm.id}>
                {index === 0 && (
                  <td rowSpan={asig.items.length} className="table-cell-strong">
                    {nombreCurso}
                    {anio && division ? (
                      <span className="empty-state-message" style={{ display: 'block', marginTop: '4px' }}>
                        {anio}°{division}
                      </span>
                    ) : null}
                  </td>
                )}
                <td>
                  <div className="docente-materia-line">
                    <span>{cm.materia_nombre || '—'}</span>
                  </div>
                </td>
                <td>
                  {planificacion?.ruta_archivo ? (
                    <a
                      href={`${API_BASE}${planificacion.ruta_archivo}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-success table-download-btn"
                    >
                      <i className="fas fa-folder-open" aria-hidden="true" /> Ver proyecto
                    </a>
                  ) : (
                    <button type="button" className="btn btn-danger table-download-btn" disabled>
                      <i className="fas fa-folder-open" aria-hidden="true" /> Ver proyecto
                    </button>
                  )}
                </td>
              </tr>
            );
          }),
        )}
      </tbody>
    </table>
  );
}

function Docentes() {
  const { docentes, actasDocente, cursoMateria, planificaciones } = useData();
  const [actasAbierto, setActasAbierto] = useState(null);
  const [cursosAbierto, setCursosAbierto] = useState(null);

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Docentes</h3>
      </div>

      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Apellido</th>
              <th>DNI</th>
              <th>Correo electrónico</th>
              <th>Teléfono</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {docentes.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-state-message">
                  No hay docentes registrados.
                </td>
              </tr>
            ) : (
              docentes.map((d) => {
                const verActas = actasAbierto === d.id;
                const verCursos = cursosAbierto === d.id;
                const actas = actasDocente.filter((a) => a.docenteId === d.id);
                const tieneDdjj = Boolean(d.ruta_ddjj);

                return (
                  <Fragment key={d.id}>
                    <tr>
                      <td>{d.nombre}</td>
                      <td>{d.apellido}</td>
                      <td><strong>{d.dni}</strong></td>
                      <td>{d.correo || '—'}</td>
                      <td>{d.telefono || '—'}</td>
                      <td className="acciones-cell">
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                            gap: '8px',
                            width: '100%',
                          }}
                        >
                          <button
                            type="button"
                            className="btn btn-success table-download-btn"
                            onClick={() => {
                              setActasAbierto(verActas ? null : d.id);
                              setCursosAbierto(null);
                            }}
                          >
                            <i
                              className={`fas fa-chevron-${verActas ? 'up' : 'down'}`}
                              aria-hidden="true"
                            />{' '}
                            Ver Actas
                          </button>

                          {tieneDdjj ? (
                            <a
                              href={`${API_BASE}${d.ruta_ddjj}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-success table-download-btn"
                              style={{ textAlign: 'center' }}
                            >
                              <i className="fas fa-file-alt" aria-hidden="true" /> Ver D.D.J.J
                            </a>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-danger table-download-btn"
                              disabled
                            >
                              <i className="fas fa-file-alt" aria-hidden="true" /> Ver D.D.J.J
                            </button>
                          )}

                          <button
                            type="button"
                            className="btn btn-secondary table-download-btn"
                            style={{ gridColumn: '1 / -1', width: '100%' }}
                            onClick={() => {
                              setCursosAbierto(verCursos ? null : d.id);
                              setActasAbierto(null);
                            }}
                          >
                            <i
                              className={`fas fa-chevron-${verCursos ? 'up' : 'down'}`}
                              aria-hidden="true"
                            />{' '}
                            Ver Cursos y Materias
                          </button>
                        </div>
                      </td>
                    </tr>
                    {verActas && (
                      <tr className="acta-desplegable-row">
                        <td colSpan={6}>
                          <ActasDocenteDesplegable actas={actas} />
                        </td>
                      </tr>
                    )}
                    {verCursos && (
                      <tr className="acta-desplegable-row">
                        <td colSpan={6}>
                          <CursosMateriasDesplegable
                            docenteId={d.id}
                            cursoMateria={cursoMateria}
                            planificaciones={planificaciones}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Docentes;
