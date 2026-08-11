import { useState, Fragment } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import {
  createActa,
  createActaCurso,
  createActaAlumno,
  createActaDocente,
  updateActa,
  updateActaAlumno,
  updateActaDocente,
  deleteActa,
  deleteActaAlumno,
  deleteActaCurso,
  deleteActaDocente,
  uploadFile,
} from '../../services/api';
import FiltrosAnioCurso from './FiltrosAnioCurso';
import confirmarEliminacion from '../../utils/confirmarEliminacion';
import EmptyFiltros from './EmptyFiltros';
import { alumnosPorAnioYCurso, filtrosCompletos } from './preceptorUtils';
import FormModal from '../../components/Shared/FormModal';
import { useToast } from '../../context/ToastContext';

const API_BASE = 'http://localhost:8000';

const formVacio = { tipo: '', titulo: '', fecha: '', descripcion: '', alumnoId: '', docenteId: '' };

function FormActa({ formData, setFormData, editing, guardando, onSubmit, onCancel, listaAlumnos, docentesDelCurso, curso, nombreCorto, archivo, setArchivo, editando, removeArchivo, setRemoveArchivo, mensaje }) {
  return (
    <FormModal title={editing ? 'Editar acta' : 'Nueva acta'} onClose={onCancel}>
      <form onSubmit={onSubmit}>
        <div className="standard-modal-body" style={{ display: 'grid', gap: '14px' }}>
          {mensaje && (
            <div className={`alert ${mensaje.startsWith('Error') ? 'alert-danger' : 'alert-success'} mb-12`}>
              {mensaje}
            </div>
          )}

          {editing ? (
            <div className="preceptor-form-row preceptor-form-row--two">
              <div className="form-group-filter">
                <label>Fecha</label>
                <input type="date" value={formData.fecha} onChange={(e) => setFormData((p) => ({ ...p, fecha: e.target.value }))} />
              </div>
              <div className="form-group-filter">
                <label>Título</label>
                <input type="text" value={formData.titulo} onChange={(e) => setFormData((p) => ({ ...p, titulo: e.target.value }))} />
              </div>
            </div>
          ) : (
            <div>
              <div className="preceptor-form-row preceptor-form-row--two">
                <div className="form-group-filter">
                  <label>Tipo de acta</label>
                  <select value={formData.tipo} onChange={(e) => setFormData((p) => ({ ...p, tipo: e.target.value, alumnoId: '', docenteId: '' }))}>
                    <option value="">Seleccionar tipo</option>
                    <option value="alumno">Alumno</option>
                    <option value="docente">Docente</option>
                    <option value="curso">Curso</option>
                  </select>
                </div>
                <div className="form-group-filter">
                  <label>Fecha</label>
                  <input type="date" value={formData.fecha} onChange={(e) => setFormData((p) => ({ ...p, fecha: e.target.value }))} />
                </div>
              </div>
              <div className="preceptor-form-row">
                <div className="form-group-filter">
                  <label>Título</label>
                  <input type="text" value={formData.titulo} onChange={(e) => setFormData((p) => ({ ...p, titulo: e.target.value }))} />
                </div>
              </div>
            </div>
          )}

          <div className="preceptor-form-row preceptor-form-row--two">
            <div className="form-group-filter">
              {formData.tipo === 'alumno' && (
                <div>
                  <label>Alumno</label>
                  <select value={formData.alumnoId} onChange={(e) => setFormData((p) => ({ ...p, alumnoId: e.target.value }))}>
                    <option value="">Seleccionar alumno</option>
                    {listaAlumnos.map((a) => (
                      <option key={a.id} value={a.id}>{nombreCorto(a)}</option>
                    ))}
                  </select>
                </div>
              )}
              {formData.tipo === 'docente' && (
                <div>
                  <label>Docente</label>
                  <select value={formData.docenteId} onChange={(e) => setFormData((p) => ({ ...p, docenteId: e.target.value }))}>
                    <option value="">Seleccionar docente</option>
                    {docentesDelCurso.map((d) => (
                      <option key={d.id} value={d.id}>{d.apellido}, {d.nombre}</option>
                    ))}
                  </select>
                </div>
              )}
              {formData.tipo === 'curso' && (
                <div className="mt-10">
                  <p className="font-bold m-0">
                    <i className="fas fa-graduation-cap" aria-hidden="true" /> Curso: {curso}
                  </p>
                </div>
              )}
              {!formData.tipo && (
                <p className="mt-10 text-muted">Seleccioná un tipo de acta primero.</p>
              )}
            </div>
            <div className="form-group-filter">
              <label>Archivo</label>
              {editando?.ruta_archivo && !removeArchivo && (
                <div style={{ marginBottom: '4px' }}>
                  <a href={`${API_BASE}${editando.ruta_archivo}`} target="_blank" rel="noopener noreferrer">Archivo actual</a>
                  <button type="button" className="btn-link-danger" style={{ marginLeft: '8px' }} onClick={() => setRemoveArchivo(true)}>
                    <i className="fas fa-times" aria-hidden="true" /> Quitar
                  </button>
                </div>
              )}
              {(!editando?.ruta_archivo || removeArchivo) && (
                <input type="file" accept=".pdf,.docx,.doc,.jpg,.png" onChange={(e) => setArchivo(e.target.files[0] || null)} />
              )}
            </div>
          </div>

          <div className="preceptor-form-row">
            <div className="form-group-filter">
              <label>Descripción</label>
              <textarea rows={2} value={formData.descripcion} onChange={(e) => setFormData((p) => ({ ...p, descripcion: e.target.value }))} />
            </div>
          </div>
        </div>

        <div className="standard-modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={guardando}>
            {guardando ? 'Guardando...' : (editing ? 'Actualizar' : 'Crear')}
          </button>
        </div>
      </form>
    </FormModal>
  );
}

function Actas({ anioLectivo, curso, onAnioChange, onCursoChange, ownerOnly = false }) {
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
  const toast = useToast();

  const canEditActa = (acta) => {
    if (!ownerOnly) return true;
    return acta.id_usuario_creador != null && acta.id_usuario_creador === user?.id;
  };

  const [showNewForm, setShowNewForm] = useState(false);
  const [formData, setFormData] = useState(formVacio);
  const [editando, setEditando] = useState(null);
  const [archivo, setArchivo] = useState(null);
  const [removeArchivo, setRemoveArchivo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [showAlumnos, setShowAlumnos] = useState(true);
  const [showDocentes, setShowDocentes] = useState(true);
  const [showCurso, setShowCurso] = useState(true);

  const listaAlumnos = alumnosPorAnioYCurso(anioLectivo, curso, inscripciones, alumnos);
  const cursoObj = cursosObj.find((c) => c.nombre_curso === curso && c.ciclo_anio === Number(anioLectivo));

  const docentesDelCurso = docentes.filter((d) =>
    d.asignaciones?.some((a) => a.curso === curso),
  );

  const alumnoActas = {};
  actasAlumno.forEach((a) => {
    const alumno = listaAlumnos.find((al) => al.id === a.alumnoId);
    if (alumno) {
      if (!alumnoActas[a.alumnoId]) alumnoActas[a.alumnoId] = [];
      alumnoActas[a.alumnoId].push(a);
    }
  });

  const docenteActas = {};
  actasDocente.forEach((a) => {
    const docente = docentesDelCurso.find((d) => d.id === a.docenteId);
    if (docente) {
      if (!docenteActas[a.docenteId]) docenteActas[a.docenteId] = [];
      docenteActas[a.docenteId].push(a);
    }
  });

  const actasDelCurso = actasCurso.filter((a) => a.curso === curso);

  const limpiar = () => {
    setShowNewForm(false);
    setFormData(formVacio);
    setEditando(null);
    setArchivo(null);
    setRemoveArchivo(false);
    setMensaje('');
  };

  const abrirNuevo = () => {
    if (showNewForm) {
      limpiar();
    } else {
      setFormData(formVacio);
      setEditando(null);
      setArchivo(null);
      setRemoveArchivo(false);
      setMensaje('');
      setShowNewForm(true);
    }
  };

  const guardarActa = async (payload) => {
    const anio = Number(anioLectivo);
    const cObj = cursoObj || cursosObj.find((c) => c.nombre_curso === curso && c.ciclo_anio === anio);
    let rutaArchivo;
    if (archivo) {
      const uploaded = await uploadFile(archivo, 'actas');
      rutaArchivo = uploaded.url;
    }
    const actaPayload = {
      titulo: payload.titulo,
      fecha: payload.fecha,
      descripcion: payload.descripcion,
      id_tipo_acta: 1,
      id_usuario_creador: user?.id || 1,
      ...(rutaArchivo ? { ruta_archivo: rutaArchivo } : {}),
    };

    const acta = await createActa(actaPayload);
    if (acta?.id_acta && cObj) {
      if (payload.tipo === 'alumno') {
        await createActaAlumno({ id_acta: acta.id_acta, id_alumno: Number(payload.alumnoId) });
        await createActaCurso({ id_acta: acta.id_acta, id_curso: cObj.id_curso });
      } else if (payload.tipo === 'docente') {
        await createActaDocente({ id_acta: acta.id_acta, id_docente: Number(payload.docenteId) });
      } else if (payload.tipo === 'curso') {
        await createActaCurso({ id_acta: acta.id_acta, id_curso: cObj.id_curso });
      }
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.tipo || !formData.titulo || !formData.fecha) {
      toast.warning('Completá tipo, título y fecha.');
      return;
    }
    if ((formData.tipo === 'alumno' && !formData.alumnoId) ||
        (formData.tipo === 'docente' && !formData.docenteId)) {
      toast.warning('Seleccioná el destinatario correspondiente.');
      return;
    }
    setGuardando(true);
    setMensaje('');
    try {
      await guardarActa(formData);
      toast.success('Acta creada correctamente.');
      limpiar();
      await refreshData();
    } catch (err) {
      const data = err.response?.data;
      const msg = data && typeof data === 'object' ? Object.values(data).flat().join(' | ') : (data || err.message);
      toast.error(msg);
    } finally {
      setGuardando(false);
    }
  };

  const startEdit = (item, tipo) => {
    setEditando({ ...item, tipo });
    setFormData({
      tipo,
      titulo: item.titulo || '',
      fecha: (item.fecha || '').slice(0, 10),
      descripcion: item.descripcion || '',
      alumnoId: item.alumnoId ? String(item.alumnoId) : '',
      docenteId: item.docenteId ? String(item.docenteId) : '',
    });
    setArchivo(null);
    setRemoveArchivo(false);
    setMensaje('');
  };

  const cancelEdit = () => {
    limpiar();
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!formData.titulo || !formData.fecha) {
      toast.warning('Completá título y fecha.');
      return;
    }
    setGuardando(true);
    setMensaje('');
    try {
      let rutaArchivo;
      if (removeArchivo) {
        rutaArchivo = null;
      } else if (archivo) {
        const uploaded = await uploadFile(archivo, 'actas');
        rutaArchivo = uploaded.url;
      }
      const payload = {
        titulo: formData.titulo,
        fecha: formData.fecha,
        descripcion: formData.descripcion,
        ...(rutaArchivo !== undefined ? { ruta_archivo: rutaArchivo } : {}),
      };
      await updateActa(editando.actaId, payload);
      if (editando.tipo === 'alumno' && formData.alumnoId && String(formData.alumnoId) !== String(editando.alumnoId)) {
        await updateActaAlumno(editando.id, { id_alumno: Number(formData.alumnoId) });
      }
      if (editando.tipo === 'docente' && formData.docenteId && String(formData.docenteId) !== String(editando.docenteId)) {
        await updateActaDocente(editando.id, { id_docente: Number(formData.docenteId) });
      }
      toast.success('Acta actualizada correctamente.');
      limpiar();
      await refreshData();
    } catch (err) {
      const data = err.response?.data;
      const msg = data && typeof data === 'object' ? Object.values(data).flat().join(' | ') : (data || err.message);
      toast.error(msg);
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (item, tipo) => {
    await confirmarEliminacion('¿Seguro que querés eliminar esta acta?\n\nEsta acción no se puede deshacer.', {
      onConfirm: async () => {
        setMensaje('');
        try {
          if (tipo === 'alumno') await deleteActaAlumno(item.id);
          else if (tipo === 'docente') await deleteActaDocente(item.id);
          else if (tipo === 'curso') await deleteActaCurso(item.id);
          if (item.actaId) await deleteActa(item.actaId);
          toast.success('Acta eliminada correctamente.');
          await refreshData();
        } catch (err) {
          const data = err.response?.data;
          const msg = data && typeof data === 'object' ? Object.values(data).flat().join(' | ') : (data || err.message);
          toast.error(msg);
        }
      },
    });
  };

  if (!filtrosCompletos(anioLectivo, curso)) {
    return (
      <div>
        <div className="card">
          <FiltrosAnioCurso anioLectivo={anioLectivo} curso={curso} onAnioChange={onAnioChange} onCursoChange={onCursoChange} />
        </div>
        <EmptyFiltros />
      </div>
    );
  }

  return (
    <div className="card">
      <FiltrosAnioCurso anioLectivo={anioLectivo} curso={curso} onAnioChange={onAnioChange} onCursoChange={onCursoChange} />
      <h3>Actas — {curso} ({anioLectivo})</h3>

      {mensaje && !editando && !showNewForm && (
        <div className={`alert ${mensaje.startsWith('Error') ? 'alert-danger' : 'alert-success'}`}>
          {mensaje}
        </div>
      )}

      <div className="flex-row--end mb-16">
        <button type="button" className="btn btn-primary" onClick={abrirNuevo}>
          <i className="fas fa-plus" aria-hidden="true" /> Nueva Acta
        </button>
      </div>

      {showNewForm && (
        <FormActa
          formData={formData}
          setFormData={setFormData}
          editing={null}
          guardando={guardando}
          onSubmit={handleCreate}
          onCancel={limpiar}
          listaAlumnos={listaAlumnos}
          docentesDelCurso={docentesDelCurso}
          curso={curso}
          nombreCorto={nombreCorto}
          archivo={archivo}
          setArchivo={setArchivo}
          editando={null}
          removeArchivo={removeArchivo}
          setRemoveArchivo={setRemoveArchivo}
          mensaje={!editando ? mensaje : ''}
        />
      )}

      {/* Actas de Alumnos */}
      <div className="card-header-flex mt-20">
        <h4 className="preceptor-section-title">Actas de Alumnos</h4>
        <button type="button" className="btn btn-secondary" onClick={() => setShowAlumnos((v) => !v)}>
          <i className={`fas fa-eye${showAlumnos ? '-slash' : ''}`} aria-hidden="true" /> {showAlumnos ? 'Ocultar' : 'Mostrar'}
        </button>
      </div>
      {showAlumnos && (
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Alumno</th>
                <th>Título</th>
                <th>Fecha</th>
                <th>Descripción</th>
                <th>Archivo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(alumnoActas).length === 0 ? (
                <tr><td colSpan={6} className="empty-state-message">No hay actas de alumnos para este curso.</td></tr>
              ) : (
                Object.entries(alumnoActas).map(([alumnoId, actas]) => {
                  const alumno = listaAlumnos.find((a) => String(a.id) === alumnoId);
                  return actas.map((acta, idx) => {
                    const esEditando = editando && editando.id === acta.id && editando.tipo === 'alumno';
                    return (
                      <Fragment key={acta.id}>
                        <tr>
                          <td className="table-cell-strong">{idx === 0 && alumno ? nombreCorto(alumno) : ''}</td>
                          <td>{acta.titulo}</td>
                          <td>{(acta.fecha || '').slice(0, 10)}</td>
                          <td>{acta.descripcion}</td>
                          <td>
                            {acta.ruta_archivo ? (
                              <a href={`${API_BASE}${acta.ruta_archivo}`} target="_blank" rel="noopener noreferrer" className="btn btn-success table-download-btn">
                                <i className="fas fa-file-pdf" aria-hidden="true" /> Ver
                              </a>
                            ) : '—'}
                          </td>
                          <td>
                            {canEditActa(acta) && (
                              <>
                                <button type="button" className="btn btn-sm btn-secondary" onClick={() => startEdit(acta, 'alumno')}>
                                  <i className="fas fa-edit" aria-hidden="true" />
                                </button>
                                {' '}
                                <button type="button" className="btn btn-sm btn-danger" onClick={() => handleEliminar(acta, 'alumno')}>
                                  <i className="fas fa-trash" aria-hidden="true" />
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      </Fragment>
                    );
                  });
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Actas de Docentes */}
      <div className="card-header-flex mt-20">
        <h4 className="preceptor-section-title">Actas de Docentes</h4>
        <button type="button" className="btn btn-secondary" onClick={() => setShowDocentes((v) => !v)}>
          <i className={`fas fa-eye${showDocentes ? '-slash' : ''}`} aria-hidden="true" /> {showDocentes ? 'Ocultar' : 'Mostrar'}
        </button>
      </div>
      {showDocentes && (
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Docente</th>
                <th>Título</th>
                <th>Fecha</th>
                <th>Descripción</th>
                <th>Archivo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(docenteActas).length === 0 ? (
                <tr><td colSpan={6} className="empty-state-message">No hay actas de docentes para este curso.</td></tr>
              ) : (
                Object.entries(docenteActas).map(([docenteId, actas]) => {
                  const docente = docentesDelCurso.find((d) => String(d.id) === docenteId);
                  return actas.map((acta, idx) => {
                    const esEditando = editando && editando.id === acta.id && editando.tipo === 'docente';
                    return (
                      <Fragment key={acta.id}>
                        <tr>
                          <td className="table-cell-strong">{idx === 0 && docente ? `${docente.apellido}, ${docente.nombre}` : ''}</td>
                          <td>{acta.titulo}</td>
                          <td>{(acta.fecha || '').slice(0, 10)}</td>
                          <td>{acta.descripcion}</td>
                          <td>
                            {acta.ruta_archivo ? (
                              <a href={`${API_BASE}${acta.ruta_archivo}`} target="_blank" rel="noopener noreferrer" className="btn btn-success table-download-btn">
                                <i className="fas fa-file-pdf" aria-hidden="true" /> Ver
                              </a>
                            ) : '—'}
                          </td>
                          <td>
                            {canEditActa(acta) && (
                              <>
                                <button type="button" className="btn btn-sm btn-secondary" onClick={() => startEdit(acta, 'docente')}>
                                  <i className="fas fa-edit" aria-hidden="true" />
                                </button>
                                {' '}
                                <button type="button" className="btn btn-sm btn-danger" onClick={() => handleEliminar(acta, 'docente')}>
                                  <i className="fas fa-trash" aria-hidden="true" />
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      </Fragment>
                    );
                  });
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Actas de Curso */}
      <div className="card-header-flex mt-20">
        <h4 className="preceptor-section-title">Actas de Curso</h4>
        <button type="button" className="btn btn-secondary" onClick={() => setShowCurso((v) => !v)}>
          <i className={`fas fa-eye${showCurso ? '-slash' : ''}`} aria-hidden="true" /> {showCurso ? 'Ocultar' : 'Mostrar'}
        </button>
      </div>
      {showCurso && (
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Título</th>
                <th>Fecha</th>
                <th>Descripción</th>
                <th>Archivo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {actasDelCurso.length === 0 ? (
                <tr><td colSpan={5} className="empty-state-message">No hay actas de curso.</td></tr>
              ) : (
                actasDelCurso.map((acta) => {
                  const esEditando = editando && editando.id === acta.id && editando.tipo === 'curso';
                  return (
                    <Fragment key={acta.id}>
                      <tr>
                        <td className="table-cell-strong">{acta.titulo}</td>
                        <td>{(acta.fecha || '').slice(0, 10)}</td>
                        <td>{acta.descripcion}</td>
                        <td>
                          {acta.ruta_archivo ? (
                            <a href={`${API_BASE}${acta.ruta_archivo}`} target="_blank" rel="noopener noreferrer" className="btn btn-success table-download-btn">
                              <i className="fas fa-file-pdf" aria-hidden="true" /> Ver
                            </a>
                          ) : '—'}
                        </td>
                          <td>
                            {canEditActa(acta) && (
                              <>
                                <button type="button" className="btn btn-sm btn-secondary" onClick={() => startEdit(acta, 'curso')}>
                                  <i className="fas fa-edit" aria-hidden="true" />
                                </button>
                                {' '}
                                <button type="button" className="btn btn-sm btn-danger" onClick={() => handleEliminar(acta, 'curso')}>
                                  <i className="fas fa-trash" aria-hidden="true" />
                                </button>
                              </>
                            )}
                          </td>
                      </tr>
                      </Fragment>
                    );
                  })
                )}
            </tbody>
          </table>
        </div>
      )}

      {editando && (
        <FormActa
          editing={editando}
          formData={formData}
          setFormData={setFormData}
          guardando={guardando}
          onSubmit={handleUpdate}
          onCancel={cancelEdit}
          listaAlumnos={listaAlumnos}
          docentesDelCurso={docentesDelCurso}
          curso={curso}
          nombreCorto={nombreCorto}
          archivo={archivo}
          setArchivo={setArchivo}
          editando={editando}
          removeArchivo={removeArchivo}
          setRemoveArchivo={setRemoveArchivo}
          mensaje={mensaje}
        />
      )}
    </div>
  );
}

export default Actas;
