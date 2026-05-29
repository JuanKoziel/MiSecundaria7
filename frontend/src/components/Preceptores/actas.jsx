import { useState } from 'react';
import { actas as actasCurso, actasAlumno, nombreCorto } from '../../data/mockData';
import FiltrosAnioCurso from './FiltrosAnioCurso';
import EmptyFiltros from './EmptyFiltros';
import { alumnosPorAnioYCurso, filtrosCompletos } from './preceptorUtils';

function Actas({ anioLectivo, curso, onAnioChange, onCursoChange }) {
  const [nuevaActa, setNuevaActa] = useState({
    titulo: '',
    descripcion: '',
    fecha: '',
  });

  const listaAlumnos = alumnosPorAnioYCurso(anioLectivo, curso);
  const actasDelCurso = actasCurso.filter((a) => a.curso === curso);

  const actasPorAlumno = (alumnoId) =>
    actasAlumno.filter((a) => a.alumnoId === alumnoId);

  const handleGuardar = () => {
    alert(`Actas guardadas — ${curso} (${anioLectivo}).`);
  };

  if (!filtrosCompletos(anioLectivo, curso)) {
    return (
      <>
        <div className="card">
          <FiltrosAnioCurso
            anioLectivo={anioLectivo}
            curso={curso}
            onAnioChange={onAnioChange}
            onCursoChange={onCursoChange}
          />
        </div>
        <EmptyFiltros />
      </>
    );
  }

  return (
    <div className="card">
      <FiltrosAnioCurso
        anioLectivo={anioLectivo}
        curso={curso}
        onAnioChange={onAnioChange}
        onCursoChange={onCursoChange}
      />

      <div className="card-header-flex">
        <h3>
          Actas — {curso} ({anioLectivo})
        </h3>
        <button type="button" className="btn btn-primary" onClick={handleGuardar}>
          <i className="fas fa-save" aria-hidden="true" /> Guardar
        </button>
      </div>

      <h4 className="preceptor-section-title">Actas del curso</h4>
      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Descripción</th>
            </tr>
          </thead>
          <tbody>
            {actasDelCurso.length === 0 ? (
              <tr>
                <td colSpan={2} className="empty-state-message">
                  No hay actas registradas para este curso.
                </td>
              </tr>
            ) : (
              actasDelCurso.map((a) => (
                <tr key={a.id}>
                  <td>{a.fecha}</td>
                  <td>{a.descripcion}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="upload-dashed-box">
        <h4 className="preceptor-section-title">Nueva acta del curso</h4>
        <div className="preceptor-form-grid">
          <div className="form-group-filter">
            <label htmlFor="acta-titulo">Título</label>
            <input
              id="acta-titulo"
              type="text"
              value={nuevaActa.titulo}
              onChange={(e) => setNuevaActa((p) => ({ ...p, titulo: e.target.value }))}
            />
          </div>
          <div className="form-group-filter">
            <label htmlFor="acta-fecha">Fecha</label>
            <input
              id="acta-fecha"
              type="date"
              value={nuevaActa.fecha}
              onChange={(e) => setNuevaActa((p) => ({ ...p, fecha: e.target.value }))}
            />
          </div>
          <div className="form-group-filter preceptor-form-full">
            <label htmlFor="acta-desc">Descripción</label>
            <input
              id="acta-desc"
              type="text"
              value={nuevaActa.descripcion}
              onChange={(e) => setNuevaActa((p) => ({ ...p, descripcion: e.target.value }))}
            />
          </div>
        </div>
      </div>

      <h4 className="preceptor-section-title">Actas por alumno</h4>
      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Alumno</th>
              <th>Actas</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {listaAlumnos.map((a) => {
              const actas = actasPorAlumno(a.id);
              return (
                <tr key={a.id}>
                  <td className="table-cell-strong">{nombreCorto(a)}</td>
                  <td>
                    {actas.length === 0 ? (
                      <span className="empty-state-message">Sin actas</span>
                    ) : (
                      <ul className="preceptor-acta-list">
                        {actas.map((acta) => (
                          <li key={acta.id}>
                            <strong>{acta.titulo}</strong> — {acta.materia} ({acta.fecha})
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-success table-download-btn"
                      onClick={() =>
                        alert(`Ver actas de ${nombreCorto(a)} (modo demostración).`)
                      }
                    >
                      <i className="fas fa-file-pdf" aria-hidden="true" /> Ver / Subir
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Actas;
