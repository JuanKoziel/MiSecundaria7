import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { createActa, createActaCurso } from '../../services/api';
import FiltrosAnioCurso from './FiltrosAnioCurso';
import EmptyFiltros from './EmptyFiltros';
import { alumnosPorAnioYCurso, filtrosCompletos } from './preceptorUtils';

function Actas({ anioLectivo, curso, onAnioChange, onCursoChange }) {
  const { actas: actasCurso, actasAlumno, nombreCorto, inscripciones, alumnos, cursosObj, refreshData } = useData();
  const { user } = useAuth();
  const [nuevaActa, setNuevaActa] = useState({
    titulo: '',
    descripcion: '',
    fecha: '',
  });
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const listaAlumnos = alumnosPorAnioYCurso(anioLectivo, curso, inscripciones, alumnos);
  const actasDelCurso = actasCurso.filter((a) => a.curso === curso);

  const actasPorAlumno = (alumnoId) =>
    actasAlumno.filter((a) => a.alumnoId === alumnoId);

  const handleGuardar = async () => {
    if (!nuevaActa.titulo || !nuevaActa.fecha) {
      setMensaje('Completá al menos título y fecha.');
      return;
    }
    setGuardando(true);
    setMensaje('');
    try {
      const anio = Number(anioLectivo);
      const cursoObj = cursosObj.find((c) => c.nombre_curso === curso && c.ciclo_anio === anio);
      const acta = await createActa({
        titulo: nuevaActa.titulo,
        descripcion: nuevaActa.descripcion,
        fecha: nuevaActa.fecha,
        id_tipo_acta: 1,
        id_usuario_creador: user?.id || 1,
      });
      if (cursoObj && acta?.id_acta) {
        await createActaCurso({
          id_acta: acta.id_acta,
          id_curso: cursoObj.id_curso,
        });
      }
      setMensaje('Acta creada exitosamente.');
      setNuevaActa({ titulo: '', descripcion: '', fecha: '' });
      await refreshData();
    } catch (err) {
      const detail = err.response?.data;
      const msg = typeof detail === 'object' ? JSON.stringify(detail) : detail || err.message;
      setMensaje(`Error: ${msg}`);
    } finally {
      setGuardando(false);
    }
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
        <button type="button" className="btn btn-primary" onClick={handleGuardar} disabled={guardando}>
          <i className="fas fa-save" aria-hidden="true" /> {guardando ? 'Guardando...' : 'Guardar'}
        </button>
      </div>

      {mensaje && (
        <p style={{ color: mensaje.startsWith('Error') ? 'red' : 'green', margin: '8px 0' }}>
          {mensaje}
        </p>
      )}

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
