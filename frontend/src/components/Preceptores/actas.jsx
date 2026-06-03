import { useState, useRef } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import {
  createActa,
  createActaCurso,
  createActaAlumno,
  createActaDocente,
  deleteActa,
  deleteActaAlumno,
  deleteActaCurso,
  deleteActaDocente,
  uploadFile,
} from '../../services/api';
import FiltrosAnioCurso from './FiltrosAnioCurso';
import EmptyFiltros from './EmptyFiltros';
import { alumnosPorAnioYCurso, filtrosCompletos } from './preceptorUtils';

const API_BASE = 'http://localhost:8000';

function SeccionToggle({ titulo, visible, onToggle }) {
  return (
    <div className="card-header-flex">
      <h4 className="preceptor-section-title">{titulo}</h4>
      <button type="button" className="btn btn-secondary" onClick={onToggle}>
        <i className={`fas fa-eye${visible ? '-slash' : ''}`} aria-hidden="true" />{' '}
        {visible ? 'Ocultar' : 'Mostrar'}
      </button>
    </div>
  );
}

function Actas({ anioLectivo, curso, onAnioChange, onCursoChange }) {
  const {
    actas: actasCurso,
    actasAlumno,
    actasDocente,
    docentes,
    nombreCorto,
    inscripciones,
    alumnos,
    cursosObj,
    refreshData,
  } = useData();
  const { user } = useAuth();
  const [nuevaActa, setNuevaActa] = useState({ titulo: '', descripcion: '', fecha: '' });
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [subiendoAlumno, setSubiendoAlumno] = useState(null);
  const fileInputRef = useRef(null);

  const [actaDoc, setActaDoc] = useState({ docenteId: '', observacion: '', fecha: '' });
  const [guardandoDoc, setGuardandoDoc] = useState(false);
  const docFileRef = useRef(null);

  const [showForm, setShowForm] = useState(true);
  const [showCurso, setShowCurso] = useState(true);
  const [showAlumno, setShowAlumno] = useState(true);
  const [showDocente, setShowDocente] = useState(true);

  const listaAlumnos = alumnosPorAnioYCurso(anioLectivo, curso, inscripciones, alumnos);
  const actasDelCurso = actasCurso.filter((a) => a.curso === curso);

  const actasPorAlumno = (alumnoId) =>
    actasAlumno.filter((a) => a.alumnoId === alumnoId);
  const actasPorDocente = (docenteId) =>
    actasDocente.filter((a) => a.docenteId === docenteId);
  const docenteLabel = (d) => `${d.apellido}, ${d.nombre}`;

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

  const handleGuardarDocente = async () => {
    if (!actaDoc.docenteId || !actaDoc.observacion) {
      setMensaje('Seleccioná un docente y cargá una observación.');
      return;
    }
    setGuardandoDoc(true);
    setMensaje('');
    try {
      let rutaArchivo;
      const file = docFileRef.current?.files?.[0];
      if (file) {
        const uploaded = await uploadFile(file, 'actas');
        rutaArchivo = uploaded.url;
      }
      const acta = await createActa({
        titulo: `Acta docente`,
        descripcion: actaDoc.observacion,
        fecha: actaDoc.fecha || new Date().toISOString().slice(0, 10),
        id_tipo_acta: 1,
        id_usuario_creador: user?.id || 1,
        ...(rutaArchivo ? { ruta_archivo: rutaArchivo } : {}),
      });
      if (acta?.id_acta) {
        await createActaDocente({
          id_acta: acta.id_acta,
          id_docente: Number(actaDoc.docenteId),
        });
      }
      setMensaje('Acta de docente guardada exitosamente.');
      setActaDoc({ docenteId: '', observacion: '', fecha: '' });
      if (docFileRef.current) docFileRef.current.value = '';
      await refreshData();
    } catch (err) {
      const detail = err.response?.data;
      const msg = typeof detail === 'object' ? JSON.stringify(detail) : detail || err.message;
      setMensaje(`Error: ${msg}`);
    } finally {
      setGuardandoDoc(false);
    }
  };

  const handleBorrar = async (acta, tipo) => {
    if (!window.confirm('¿Seguro que querés borrar esta acta?')) return;
    setMensaje('');
    try {
      if (tipo === 'alumno') await deleteActaAlumno(acta.id);
      else if (tipo === 'curso') await deleteActaCurso(acta.id);
      else if (tipo === 'docente') await deleteActaDocente(acta.id);
      if (acta.actaId) await deleteActa(acta.actaId);
      setMensaje('Acta borrada.');
      await refreshData();
    } catch (err) {
      const detail = err.response?.data;
      const msg = typeof detail === 'object' ? JSON.stringify(detail) : detail || err.message;
      setMensaje(`Error: ${msg}`);
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

      <h3>Actas — {curso} ({anioLectivo})</h3>

      {mensaje && (
        <p style={{ color: mensaje.startsWith('Error') ? 'red' : 'green', margin: '8px 0' }}>
          {mensaje}
        </p>
      )}

      {/* 1. Formulario */}
      <SeccionToggle titulo="Formulario" visible={showForm} onToggle={() => setShowForm((v) => !v)} />
      {showForm && (
        <div className="upload-dashed-box">
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
          <button type="button" className="btn btn-primary" onClick={handleGuardar} disabled={guardando}>
            <i className="fas fa-save" aria-hidden="true" /> {guardando ? 'Guardando...' : 'Guardar acta de curso'}
          </button>
        </div>
      )}

      {/* 2. Actas de Curso */}
      <SeccionToggle titulo="Actas de Curso" visible={showCurso} onToggle={() => setShowCurso((v) => !v)} />
      {showCurso && (
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Descripción</th>
                <th>Archivo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {actasDelCurso.length === 0 ? (
                <tr>
                  <td colSpan={4} className="empty-state-message">
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
                    <td>
                      <button
                        type="button"
                        className="btn btn-danger table-download-btn"
                        onClick={() => handleBorrar(a, 'curso')}
                      >
                        <i className="fas fa-trash" aria-hidden="true" /> Borrar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.doc,.jpg,.png"
        style={{ display: 'none' }}
        onChange={handleFileSelected}
      />

      {/* 3. Actas de Alumno */}
      <SeccionToggle titulo="Actas de Alumno" visible={showAlumno} onToggle={() => setShowAlumno((v) => !v)} />
      {showAlumno && (
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
                              {' '}
                              <button
                                type="button"
                                className="btn-link-danger"
                                onClick={() => handleBorrar(acta, 'alumno')}
                              >
                                <i className="fas fa-trash" aria-hidden="true" /> Borrar
                              </button>
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
      )}

      {/* 4. Actas de Docente */}
      <SeccionToggle titulo="Actas de Docente" visible={showDocente} onToggle={() => setShowDocente((v) => !v)} />
      {showDocente && (
        <>
          <div className="upload-dashed-box">
            <div className="preceptor-form-grid">
              <div className="form-group-filter">
                <label htmlFor="acta-doc-sel">Docente</label>
                <select
                  id="acta-doc-sel"
                  value={actaDoc.docenteId}
                  onChange={(e) => setActaDoc((p) => ({ ...p, docenteId: e.target.value }))}
                >
                  <option value="">Seleccionar docente</option>
                  {docentes.map((d) => (
                    <option key={d.id} value={d.id}>{docenteLabel(d)}</option>
                  ))}
                </select>
              </div>
              <div className="form-group-filter">
                <label htmlFor="acta-doc-fecha">Fecha</label>
                <input
                  id="acta-doc-fecha"
                  type="date"
                  value={actaDoc.fecha}
                  onChange={(e) => setActaDoc((p) => ({ ...p, fecha: e.target.value }))}
                />
              </div>
              <div className="form-group-filter preceptor-form-full">
                <label htmlFor="acta-doc-obs">Observación</label>
                <textarea
                  id="acta-doc-obs"
                  rows={3}
                  value={actaDoc.observacion}
                  onChange={(e) => setActaDoc((p) => ({ ...p, observacion: e.target.value }))}
                />
              </div>
              <div className="form-group-filter preceptor-form-full">
                <label htmlFor="acta-doc-file">Adjuntar archivo (opcional)</label>
                <input
                  id="acta-doc-file"
                  ref={docFileRef}
                  type="file"
                  accept=".pdf,.docx,.doc,.jpg,.png"
                />
              </div>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleGuardarDocente}
              disabled={guardandoDoc}
            >
              <i className="fas fa-save" aria-hidden="true" /> {guardandoDoc ? 'Guardando...' : 'Guardar acta de docente'}
            </button>
          </div>

          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Docente</th>
                  <th>Actas</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {docentes.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="empty-state-message">No hay docentes.</td>
                  </tr>
                ) : (
                  docentes.map((d) => {
                    const actas = actasPorDocente(d.id);
                    return (
                      <tr key={d.id}>
                        <td className="table-cell-strong">{docenteLabel(d)}</td>
                        <td>
                          {actas.length === 0 ? (
                            <span className="empty-state-message">Sin actas</span>
                          ) : (
                            <ul className="preceptor-acta-list">
                              {actas.map((acta) => (
                                <li key={acta.id}>
                                  <strong>{acta.fecha}</strong> — {acta.descripcion}
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
                                  {' '}
                                  <button
                                    type="button"
                                    className="btn-link-danger"
                                    onClick={() => handleBorrar(acta, 'docente')}
                                  >
                                    <i className="fas fa-trash" aria-hidden="true" /> Borrar
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                        <td>—</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default Actas;
