import { Fragment, useCallback, useMemo, useState } from 'react';
import { useData } from '../../context/DataContext';
import { formatDNI, cleanDNI } from '../../utils/dni';
import { BASE_URL } from '../../services/api';

const API_BASE = BASE_URL;

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
    alumnos: todosAlumnos,
    actas: actasCurso,
    getActasByAlumnoId,
    getAlumnosByCurso,
  } = useData();

  const [curso, setCurso] = useState('');
  const [expandido, setExpandido] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  const alumnosCurso = useMemo(() => {
    if (!curso) {
      return todosAlumnos;
    }
    return getAlumnosByCurso(curso);
  }, [curso, getAlumnosByCurso, todosAlumnos]);

  const alumnosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return alumnosCurso;
    return alumnosCurso.filter((a) => {
      const nombre = `${a.nombre || ''} ${a.apellido || ''}`.toLowerCase();
      const dni = cleanDNI(a.dni || '');
      return (
        a.nombre?.toLowerCase().includes(texto) ||
        a.apellido?.toLowerCase().includes(texto) ||
        nombre.includes(texto) ||
        dni.includes(texto.replace(/\s/g, ''))
      );
    });
  }, [alumnosCurso, busqueda]);
  const handleCursoChange = useCallback((nuevoCurso) => {
    setCurso((prevCurso) => {
      if (prevCurso !== nuevoCurso) {
        setExpandido(null);
      }
      return nuevoCurso;
    });
  }, []);

  return (
    <div>
      <div className="card">
        <div className="card-header-flex">
          <h3><i className="fas fa-user-graduate" aria-hidden="true" /> Listado de Estudiantes</h3>
        </div>

        <div className="filter-row">
          <div className="form-group-filter">
            <label htmlFor="curso-select">Curso</label>
            <select
              id="curso-select"
              value={curso}
              onChange={(e) => handleCursoChange(e.target.value)}
            >
              <option value="">Todos los cursos</option>
              {cursosObj.map((c) => (
                <option key={c.id_curso} value={c.nombre_curso}>
                  {c.nombre_curso} (Ciclo {c.ciclo_anio})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group-filter">
            <label htmlFor="busqueda-alumno">Buscar por nombre, apellido o DNI</label>
            <input
              id="busqueda-alumno"
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Ej: Pérez o 45123456"
            />
          </div>
        </div>

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
              {alumnosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty-state-message">
                    {busqueda.trim()
                      ? 'No hay estudiantes que coincidan con la búsqueda.'
                      : 'No hay estudiantes registrados en este curso.'}
                  </td>
                </tr>
              ) : (
                alumnosFiltrados.map((a) => {
                  const abierto = expandido === a.id;
                  return (
                    <Fragment key={a.id}>
                      <tr>
                        <td>{a.nombre}</td>
                        <td>{a.apellido}</td>
                        <td><strong>{formatDNI(a.dni)}</strong></td>
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
            <h3><i className="fas fa-file-signature" aria-hidden="true" /> Actas del Curso — {curso}</h3>
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
    </div>
  );
}

export default Alumnos;
