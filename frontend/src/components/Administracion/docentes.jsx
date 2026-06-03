import { Fragment, useState } from 'react';
import { useData } from '../../context/DataContext';
import { parseCurso, cursoConOrientacion } from '../../utils/orientacion';

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
              ) : '—'}
            </td>
            <td>{acta.autor || '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CursosMateriasDesplegable({ asignaciones }) {
  if (!asignaciones?.length) {
    return <p className="empty-state-message">Sin cursos ni materias asignadas.</p>;
  }
  return (
    <table className="acta-desplegable-table">
      <thead>
        <tr>
          <th>Curso</th>
          <th>División</th>
          <th>Materia(s)</th>
        </tr>
      </thead>
      <tbody>
        {asignaciones.map((asig) => {
          const { division } = parseCurso(asig.curso);
          return (
            <tr key={asig.curso}>
              <td>{cursoConOrientacion(asig.curso)}</td>
              <td>{division ?? '—'}</td>
              <td>{asig.materias.join(', ')}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function Docentes() {
  const { docentes, actasDocente } = useData();
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
                <td colSpan={6} className="empty-state-message">No hay docentes registrados.</td>
              </tr>
            ) : (
              docentes.map((d) => {
                const verActas = actasAbierto === d.id;
                const verCursos = cursosAbierto === d.id;
                const actas = actasDocente.filter((a) => a.docenteId === d.id);
                return (
                  <Fragment key={d.id}>
                    <tr>
                      <td>{d.nombre}</td>
                      <td>{d.apellido}</td>
                      <td><strong>{d.dni}</strong></td>
                      <td>{d.correo || '—'}</td>
                      <td>{d.telefono || '—'}</td>
                      <td className="acciones-cell">
                        <button
                          type="button"
                          className="btn btn-success table-download-btn"
                          onClick={() => {
                            setActasAbierto(verActas ? null : d.id);
                            setCursosAbierto(null);
                          }}
                        >
                          <i className={`fas fa-chevron-${verActas ? 'up' : 'down'}`} aria-hidden="true" /> Ver Actas
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary table-download-btn"
                          onClick={() => {
                            setCursosAbierto(verCursos ? null : d.id);
                            setActasAbierto(null);
                          }}
                        >
                          <i className={`fas fa-chevron-${verCursos ? 'up' : 'down'}`} aria-hidden="true" /> Ver Cursos y Materias
                        </button>
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
                          <CursosMateriasDesplegable asignaciones={d.asignaciones} />
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
