import { useState, useRef } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { createActa, createActaCurso, createActaAlumno, updateActa, uploadFile } from '../../services/api';
import FiltrosAnioCurso from './FiltrosAnioCurso';
import EmptyFiltros from './EmptyFiltros';
import { alumnosPorAnioYCurso, filtrosCompletos } from './preceptorUtils';

const API_BASE = 'http://localhost:8000';

function Actas({ anioLectivo, curso, onAnioChange, onCursoChange }) {
  const { actas: actasCurso, actasAlumno, nombreCorto, inscripciones, alumnos, cursosObj, refreshData } = useData();
  const { user } = useAuth();
  const [nuevaActa, setNuevaActa] = useState({ titulo: '', descripcion: '', fecha: '' });
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [subiendoAlumno, setSubiendoAlumno] = useState(null);
  const fileInputRef = useRef(null);

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

  const handleSubirActaAlumno = (alumnoId) => {
    setSubiendoAlumno(alumnoId);
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e) => {
    const file = e.target.files[0];
    if (!file || !subiendoAlumno) return;
    setMensaje('');
    try {
      const uploaded = await uploadFile(file, 'actas');
      const anio = Number(anioLectivo);
      const cursoObj = cursosObj.find((c) => c.nombre_curso === curso && c.ciclo_anio === anio);
      const acta = await createActa({
        titulo: file.name,
        descripcion: `Acta subida para alumno`,
        fecha: new Date().toISOString().slice(0, 10),
        id_tipo_acta: 1,
        id_usuario_creador: user?.id || 1,
        ruta_archivo: uploaded.url,
      });
      if (acta?.id_acta) {
        await createActaAlumno({ id_acta: acta.id_acta, id_alumno: subiendoAlumno });
        if (cursoObj) {
          await createActaCurso({ id_acta: acta.id_acta, id_curso: cursoObj.id_curso });
        }
      }
      setMensaje('Acta subida exitosamente.');
      await refreshData();
    } catch (err) {
      const detail = err.response?.data;
      const msg = typeof detail === 'object' ? JSON.stringify(detail) : detail || err.message;
      setMensaje(`Error: ${msg}`);
    } finally {
      setSubiendoAlumno(null);
      e.target.value = '';
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
        <h3>Actas — {curso} ({anioLectivo})</h3>
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
              <th>Archivo</th>
            </tr>
          </thead>
          <tbody>
            {actasDelCurso.length === 0 ? (
              <tr>
                <td colSpan={3} className="empty-state-message">
                  No hay actas registradas para este curso.
                </td>
              </tr>
            ) : (
              actasDelCurso.map((a) => (
                <tr key={a.id}>
                  <td>{a.fecha}</td>
                  <td>{a.descripcion}</td>
                  <td>
                    {a.ruta_archivo ? (
                      <a
                        href={`${API_BASE}${a.ruta_archivo}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-success table-download-btn"
                      >
                        <i className="fas fa-file-pdf" aria-hidden="true" /> Ver
                      </a>
                    ) : '—'}
                  </td>
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

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.doc,.jpg,.png"
        style={{ display: 'none' }}
        onChange={handleFileSelected}
      />

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
                            <strong>{acta.titulo}</strong> ({acta.fecha})
                            {acta.ruta_archivo && (
                              <>
                                {' '}
                                <a
                                  href={`${API_BASE}${acta.ruta_archivo}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <i className="fas fa-download" aria-hidden="true" /> Descargar
                                </a>
                              </>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-success table-download-btn"
                      onClick={() => handleSubirActaAlumno(a.id)}
                      disabled={subiendoAlumno === a.id}
                    >
                      <i className="fas fa-upload" aria-hidden="true" />{' '}
                      {subiendoAlumno === a.id ? 'Subiendo...' : 'Subir Acta'}
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
