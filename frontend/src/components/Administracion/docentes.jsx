import { Fragment, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { cursoConOrientacion } from '../../utils/orientacion';
import { deleteMiDdjjDocente, verificarPlanificacion, verificarDdjj, createDocente, updateDocente, deleteDocente, BASE_URL } from '../../services/api';
import { formatDNI, cleanDNI } from '../../utils/dni';
import confirmarEliminacion from '../../utils/confirmarEliminacion';
import FormModal from '../../components/Shared/FormModal';

const API_BASE = BASE_URL;
const PREVIEWABLE_EXTENSIONS = new Set(['pdf', 'jpg', 'jpeg', 'png', 'webp']);

function getFileExtension(nombre = '') {
  const clean = String(nombre).split('?')[0].split('#')[0];
  const idx = clean.lastIndexOf('.');
  return idx >= 0 ? clean.slice(idx + 1).toLowerCase() : '';
}

function isPreviewable(nombre = '') {
  return PREVIEWABLE_EXTENSIONS.has(getFileExtension(nombre));
}

function getAbsoluteFileUrl(path) {
  if (!path) return null;
  return path.startsWith('http') ? path : `${API_BASE}${path}`;
}

function buildDownloadUrl(path) {
  const absolute = getAbsoluteFileUrl(path);
  if (!absolute) return null;
  return absolute.includes('?') ? `${absolute}&download=1` : `${absolute}?download=1`;
}

function DdjjPreviewModal({ docente, onClose, onDelete }) {
  if (!docente) return null;

  const archivoUrl = docente.ddjj_url || docente.ruta_ddjj || null;
  const absoluteUrl = getAbsoluteFileUrl(archivoUrl);
  const downloadUrl = buildDownloadUrl(archivoUrl);
  const archivoNombre = docente.ddjj_nombre_archivo || (archivoUrl ? archivoUrl.split('/').pop() : 'Archivo');
  const previewOk = isPreviewable(archivoNombre);
  const extension = getFileExtension(archivoNombre);
  const fechaCarga = docente.ddjj_fecha_carga
    ? new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(docente.ddjj_fecha_carga))
    : null;

  return createPortal(
    <div className="ddjj-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="ddjj-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Vista previa de ${archivoNombre}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ddjj-modal-header">
          <div>
            <h4 className="m-0">D.D.J.J. del docente</h4>
            <p style={{ margin: '4px 0 0', color: 'var(--text-light)', fontSize: '0.9rem' }}>
              {docente.apellido}, {docente.nombre}
            </p>
          </div>
          {docente.ddjj_verificada && (
            <span className="badge badge-success" title="DDJJ verificada">
              <i className="fas fa-check-circle" aria-hidden="true" /> Verificada
            </span>
          )}
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            <i className="fas fa-times" aria-hidden="true" /> Cerrar
          </button>
        </div>

        <div className="ddjj-modal-body">
          <p style={{ margin: '0 0 10px', fontWeight: 600 }}>
            Archivo: {archivoNombre}
          </p>
          {fechaCarga && (
            <p style={{ margin: '0 0 10px' }}>
              Fecha de carga: {fechaCarga}
            </p>
          )}

          {previewOk && absoluteUrl ? (
            extension === 'pdf' ? (
              <iframe
                title={`Vista previa ${archivoNombre}`}
                className="ddjj-preview-frame"
                src={absoluteUrl}
              />
            ) : (
              <div className="ddjj-image-wrap">
                <img
                  src={absoluteUrl}
                  alt={`Vista previa ${archivoNombre}`}
                  className="ddjj-preview-image"
                />
              </div>
            )
          ) : (
            <div className="ddjj-no-preview">
              <p className="m-0">Este archivo no admite vista previa.</p>
            </div>
          )}
        </div>

        <div className="ddjj-modal-footer">
          {downloadUrl && (
            <a
              className="btn btn-secondary"
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="fas fa-download" aria-hidden="true" /> Descargar archivo
            </a>
          )}
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => onDelete(docente)}
          >
            <i className="fas fa-trash-alt" aria-hidden="true" /> Eliminar DDJJ
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

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
  const { refreshData } = useData();
  const toast = useToast();
  const [verificandoId, setVerificandoId] = useState(null);

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

  const handleVerificar = async (planificacion) => {
    setVerificandoId(planificacion.id_planificacion);
    try {
      await verificarPlanificacion(planificacion.id_planificacion);
      toast.success('Planificación marcada como verificada. Se notificó al docente.');
      await refreshData();
    } catch (err) {
      const data = err.response?.data;
      toast.error(data?.detail || data?.error || 'Error al verificar la planificación.');
    } finally {
      setVerificandoId(null);
    }
  };

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
            const esVerificado = planificacion?.estado === 'Verificado';
            return (
              <tr key={cm.id}>
                {index === 0 && (
                  <td rowSpan={asig.items.length} className="table-cell-strong">
                    {nombreCurso}
                  </td>
                )}
                <td>
                  <div className="docente-materia-line">
                    <span>{cm.materia_nombre || '—'}</span>
                  </div>
                </td>
                <td>
                  {planificacion?.ruta_archivo ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                      <a
                        href={`${API_BASE}${planificacion.ruta_archivo}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-success table-download-btn"
                      >
                        <i className="fas fa-folder-open" aria-hidden="true" /> Ver proyecto
                      </a>
                      <span className={`badge ${esVerificado ? 'badge-success' : 'badge-warning'}`}>
                        {esVerificado ? 'Verificado' : planificacion?.estado || 'Borrador'}
                      </span>
                      {!esVerificado && (
                        <button
                          type="button"
                          className="btn btn-secondary table-download-btn"
                          onClick={() => handleVerificar(planificacion)}
                          disabled={verificandoId === planificacion.id_planificacion}
                        >
                          <i className="fas fa-check" aria-hidden="true" />{' '}
                          {verificandoId === planificacion.id_planificacion ? 'Verificando...' : 'Marcar como verificado'}
                        </button>
                      )}
                    </div>
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

function normalize(str) {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\./g, '');
}

function toInputDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function formateaMensajeError(err) {
  const data = err.response?.data;
  if (data && typeof data === 'object' && !data.detail) {
    return Object.entries(data)
      .map(([campo, valor]) => `${campo}: ${Array.isArray(valor) ? valor.join(', ') : valor}`)
      .join(' | ');
  }
  return data?.detail || err.message || 'Error inesperado';
}

const formVacio = {
  usuario_nombre: '',
  contrasena: '',
  estado: true,
  fecha_deshabilitacion_programada: '',
  fecha_habilitacion_programada: '',
  dni: '',
  nombre: '',
  apellido: '',
  correo: '',
  telefono: '',
};

function Docentes() {
  const { docentes, actasDocente, cursoMateria, planificaciones, refreshData } = useData();
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [actasAbierto, setActasAbierto] = useState(null);
  const [cursosAbierto, setCursosAbierto] = useState(null);
  const [previewDocente, setPreviewDocente] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingDocente, setEditingDocente] = useState(null);
  const [formData, setFormData] = useState(formVacio);
  const [guardandoDocente, setGuardandoDocente] = useState(false);
  const [mensajeForm, setMensajeForm] = useState('');

  const abrirCrearDocente = () => {
    setEditingDocente(null);
    setFormData(formVacio);
    setMensajeForm('');
    setShowForm(true);
  };

  const abrirEditarDocente = (docente) => {
    setEditingDocente(docente);
    setFormData({
      usuario_nombre: docente.usuario || '',
      contrasena: '',
      estado: docente.usuario_estado !== false,
      fecha_deshabilitacion_programada: toInputDateTime(docente.usuario_fecha_deshabilitacion_programada),
      fecha_habilitacion_programada: toInputDateTime(docente.usuario_fecha_habilitacion_programada),
      dni: docente.dni || '',
      nombre: docente.nombre || '',
      apellido: docente.apellido || '',
      correo: docente.correo || '',
      telefono: docente.telefono || '',
    });
    setMensajeForm('');
    setShowForm(true);
  };

  const cerrarFormDocente = () => {
    setShowForm(false);
    setEditingDocente(null);
    setFormData(formVacio);
    setMensajeForm('');
  };

  const handleGuardarDocente = async (e) => {
    e.preventDefault();
    if (guardandoDocente) return;
    setMensajeForm('');
    if (!editingDocente && (!formData.usuario_nombre || !formData.contrasena)) {
      toast.warning('Completá usuario y contraseña.');
      return;
    }
    if (!formData.dni || !formData.nombre || !formData.apellido) {
      toast.warning('Completá DNI, nombre y apellido.');
      return;
    }
    setGuardandoDocente(true);
    try {
      if (editingDocente) {
        await updateDocente(editingDocente.id, {
          usuario_nombre: formData.usuario_nombre || undefined,
          contrasena: formData.contrasena || undefined,
          estado: formData.estado,
          fecha_deshabilitacion_programada: formData.fecha_deshabilitacion_programada || null,
          fecha_habilitacion_programada: formData.fecha_habilitacion_programada || null,
          dni: formData.dni,
          nombre: formData.nombre,
          apellido: formData.apellido,
          correo: formData.correo || null,
          telefono: formData.telefono || null,
        });
        toast.success('Docente actualizado correctamente.');
      } else {
        await createDocente({
          estado: formData.estado,
          dni: formData.dni,
          nombre: formData.nombre,
          apellido: formData.apellido,
          correo: formData.correo || null,
          telefono: formData.telefono || null,
          usuario_nombre: formData.usuario_nombre,
          contrasena: formData.contrasena,
          fecha_deshabilitacion_programada: formData.fecha_deshabilitacion_programada || null,
          fecha_habilitacion_programada: formData.fecha_habilitacion_programada || null,
        });
        toast.success('Docente creado correctamente.');
      }
      cerrarFormDocente();
      await refreshData();
    } catch (err) {
      toast.error(formateaMensajeError(err));
    } finally {
      setGuardandoDocente(false);
    }
  };

  const handleToggleEstado = async (docente) => {
    setGuardandoDocente(true);
    try {
      await updateDocente(docente.id, {
        estado: !(docente.usuario_estado !== false),
      });
      toast.success(docente.usuario_estado !== false ? 'Docente deshabilitado correctamente.' : 'Docente habilitado correctamente.');
      await refreshData();
    } catch (err) {
      toast.error(formateaMensajeError(err));
    } finally {
      setGuardandoDocente(false);
    }
  };

  const handleEliminarDocente = async (docente) => {
    await confirmarEliminacion('¿Está seguro de que quiere eliminar este docente?\n\nEsta acción no se puede deshacer.', {
      onConfirm: async () => {
        setGuardandoDocente(true);
        try {
          await deleteDocente(docente.id);
          toast.success('Docente eliminado correctamente.');
          await refreshData();
        } catch (err) {
          toast.error(formateaMensajeError(err));
        } finally {
          setGuardandoDocente(false);
        }
      },
    });
  };

  const filteredDocentes = useMemo(() => {
    if (!searchTerm) return docentes;
    const q = normalize(searchTerm);
    return docentes.filter(
      (d) =>
        normalize(d.nombre).includes(q) ||
        normalize(d.apellido).includes(q) ||
        normalize(`${d.nombre} ${d.apellido}`).includes(q) ||
        normalize(cleanDNI(d.dni)).includes(q),
    );
  }, [docentes, searchTerm]);

  const handleEliminarDdjj = async (docente) => {
    await confirmarEliminacion('¿Está seguro de eliminar esta D.D.J.J.?\n\nEsta acción no se puede deshacer.', {
      onConfirm: async () => {
        try {
          await deleteMiDdjjDocente(docente.id);
          if (previewDocente?.id === docente.id) {
            setPreviewDocente(null);
          }
          await refreshData();
        } catch (error) {
          toast.error(error.response?.data?.error || error.response?.data?.detail || 'No se pudo eliminar la DDJJ.');
        }
      },
    });
  };

  const handleVerificarDdjj = async (docente) => {
    const ddjjId = docente.ddjj_id;
    if (!ddjjId) {
      toast.error('El docente no tiene una DDJJ cargada.');
      return;
    }
    try {
      await verificarDdjj(ddjjId);
      toast.success('DDJJ marcada como verificada. Se notificó al docente.');
      await refreshData();
    } catch (error) {
      toast.error(error.response?.data?.detail || error.response?.data?.error || 'Error al verificar la DDJJ.');
    }
  };

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3><i className="fas fa-chalkboard-teacher" aria-hidden="true" /> Docentes</h3>
        <div className="header-actions">
          <button type="button" className="btn btn-primary" onClick={abrirCrearDocente}>
            <i className="fas fa-plus" aria-hidden="true" /> Nuevo Docente
          </button>
        </div>
      </div>

      <div className="mb-12">
        <input
          type="text"
          placeholder="Buscar por nombre, apellido o DNI..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
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
            {filteredDocentes.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-state-message">
                  No hay docentes registrados.
                </td>
              </tr>
            ) : (
              filteredDocentes.map((d) => {
                const verActas = actasAbierto === d.id;
                const verCursos = cursosAbierto === d.id;
                const actas = actasDocente.filter((a) => a.docenteId === d.id);
                const tieneDdjj = Boolean(d.ddjj_presentada || d.ddjj_id);
                const archivoUrl = d.ddjj_url || d.ruta_ddjj || null;
                const archivoNombre = d.ddjj_nombre_archivo || (archivoUrl ? archivoUrl.split('/').pop() : 'Archivo');

                return (
                  <Fragment key={d.id}>
                    <tr>
                      <td>{d.nombre}</td>
                      <td>{d.apellido}</td>
                      <td><strong>{formatDNI(d.dni)}</strong></td>
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

                          <button
                            type="button"
                            className={`btn btn-sm ${tieneDdjj ? 'btn-success' : 'btn-danger'}`}
                            onClick={() => setPreviewDocente(d)}
                            disabled={!tieneDdjj}
                            title={tieneDdjj ? `Ver ${archivoNombre}` : 'No hay DDJJ cargada'}
                          >
                            <i className="fas fa-file-alt" aria-hidden="true" /> DDJJ
                          </button>

                          {tieneDdjj && d.ddjj_verificada && (
                            <span className="badge badge-success" title="DDJJ verificada">
                              <i className="fas fa-check-circle" aria-hidden="true" /> Verificada
                            </span>
                          )}

                          {tieneDdjj && !d.ddjj_verificada && (
                            <button
                              type="button"
                              className="btn btn-sm btn-secondary"
                              onClick={() => handleVerificarDdjj(d)}
                              title="Marcar la DDJJ como verificada"
                            >
                              <i className="fas fa-check" aria-hidden="true" /> Marcar verificado
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

                          <button
                            type="button"
                            className="btn btn-sm btn-secondary"
                            onClick={() => abrirEditarDocente(d)}
                            title="Editar"
                          >
                            <i className="fas fa-edit" aria-hidden="true" />
                          </button>

                          {d.usuario_estado !== null && d.usuario_estado !== undefined && (
                            <button
                              type="button"
                              className={`btn btn-sm ${d.usuario_estado === false ? 'btn-success' : 'btn-warning'}`}
                              onClick={() => handleToggleEstado(d)}
                              title={d.usuario_estado === false ? 'Habilitar' : 'Deshabilitar'}
                              disabled={guardandoDocente}
                            >
                              <i className={`fas ${d.usuario_estado === false ? 'fa-check' : 'fa-ban'}`} aria-hidden="true" />
                            </button>
                          )}

                          <button
                            type="button"
                            className="btn btn-sm btn-danger"
                            onClick={() => handleEliminarDocente(d)}
                            title="Eliminar"
                          >
                            <i className="fas fa-trash" aria-hidden="true" />
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

      {previewDocente && (
        <DdjjPreviewModal
          docente={previewDocente}
          onClose={() => setPreviewDocente(null)}
          onDelete={handleEliminarDdjj}
        />
      )}

      {showForm && (
        <FormModal
          title={editingDocente ? 'Editar docente' : 'Nuevo docente'}
          onClose={cerrarFormDocente}
        >
          <form onSubmit={handleGuardarDocente}>
            <div className="standard-modal-body" style={{ display: 'grid', gap: '14px' }}>
              {mensajeForm && (
                <div className={`alert ${mensajeForm.startsWith('Error') ? 'alert-danger' : 'alert-success'}`}>
                  {mensajeForm}
                </div>
              )}

              {!editingDocente && (
                <div className="preceptor-form-row preceptor-form-row--two">
                  <div className="form-group-filter">
                    <label>Usuario</label>
                    <input
                      type="text"
                      value={formData.usuario_nombre}
                      onChange={(e) => setFormData((p) => ({ ...p, usuario_nombre: e.target.value }))}
                    />
                  </div>
                  <div className="form-group-filter">
                    <label>Contraseña</label>
                    <input
                      type="password"
                      value={formData.contrasena}
                      onChange={(e) => setFormData((p) => ({ ...p, contrasena: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              <div className="preceptor-form-row preceptor-form-row--two">
                <div className="form-group-filter">
                  <label>Nombre</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData((p) => ({ ...p, nombre: e.target.value }))}
                  />
                </div>
                <div className="form-group-filter">
                  <label>Apellido</label>
                  <input
                    type="text"
                    value={formData.apellido}
                    onChange={(e) => setFormData((p) => ({ ...p, apellido: e.target.value }))}
                  />
                </div>
              </div>

              <div className="preceptor-form-row preceptor-form-row--two">
                <div className="form-group-filter">
                  <label>DNI</label>
                  <input
                    type="text"
                    value={formData.dni}
                    onChange={(e) => setFormData((p) => ({ ...p, dni: formatDNI(e.target.value) }))}
                  />
                </div>
                <div className="form-group-filter">
                  <label>Teléfono</label>
                  <input
                    type="text"
                    value={formData.telefono}
                    onChange={(e) => setFormData((p) => ({ ...p, telefono: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-group-filter">
                <label>Correo electrónico</label>
                <input
                  type="email"
                  value={formData.correo}
                  onChange={(e) => setFormData((p) => ({ ...p, correo: e.target.value }))}
                />
              </div>

              <div className="form-group-filter">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.estado}
                    onChange={(e) => setFormData((p) => ({ ...p, estado: e.target.checked }))}
                  />
                  {' '}Habilitado
                </label>
              </div>
            </div>
            <div className="standard-modal-footer">
              <button type="button" className="btn btn-secondary" onClick={cerrarFormDocente}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={guardandoDocente}>
                {guardandoDocente ? 'Guardando...' : (editingDocente ? 'Actualizar' : 'Crear')}
              </button>
            </div>
          </form>
        </FormModal>
      )}
    </div>
  );
}

export default Docentes;
