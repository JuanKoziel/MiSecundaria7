import { Fragment, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { cursoConOrientacion } from '../../utils/orientacion';
import { deleteMiDdjjDocente, verificarPlanificacion, verificarDdjj, enviarRecordatorioDdjj, createDocente, updateDocente, deleteDocente, getUsuariosConRol, getUsuariosSinRol, quitarRolUsuario, getCursoMateria, getCursos, getMaterias, BASE_URL } from '../../services/api';
import { formatDNI, cleanDNI } from '../../utils/dni';
import confirmarEliminacion from '../../utils/confirmarEliminacion';
import FormModal from '../../components/Shared/FormModal';
import AgregarRolModal from '../../components/Shared/AgregarRolModal';
import QuitarRolModal from '../../components/Shared/QuitarRolModal';
import { mensajeErrorAmigable } from '../../utils/errores';
import { aInputDateTime as toInputDateTime, errorProgramacion } from '../../utils/programacionEstado';

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

function DdjjRecordatorioModal({ docente, onConfirm, onCancel }) {
  if (!docente) return null;

  return createPortal(
    <div className="ddjj-modal-overlay" role="presentation" onClick={onCancel}>
      <div
        className="ddjj-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Recordatorio de DDJJ"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ddjj-modal-header">
          <div>
            <h4 className="m-0">DDJJ pendiente</h4>
            <p style={{ margin: '4px 0 0', color: 'var(--text-light)', fontSize: '0.9rem' }}>
              {docente.apellido}, {docente.nombre}
            </p>
          </div>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            <i className="fas fa-times" aria-hidden="true" /> Cerrar
          </button>
        </div>

        <div className="ddjj-modal-body">
          <p style={{ margin: '0 0 10px', fontWeight: 600 }}>
            El docente aún no cargó su DDJJ. ¿Quiere enviar un recordatorio?
          </p>
        </div>

        <div className="ddjj-modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancelar
          </button>
          <button type="button" className="btn btn-primary" onClick={() => onConfirm(docente)}>
            <i className="fas fa-bell" aria-hidden="true" /> Confirmar
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
                    <div className="docente-materia-line">
                      <a
                        href={`${API_BASE}${planificacion.ruta_archivo}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-success table-download-btn"
                      >
                        <i className="fas fa-folder-open" aria-hidden="true" /> Ver proyecto
                      </a>
                      {esVerificado ? (
                        <span className="badge badge-success badge-verificado">
                          <i className="fas fa-check-circle" aria-hidden="true" /> Verificado
                        </span>
                      ) : (
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

function formateaMensajeError(err) {
  return mensajeErrorAmigable(err);
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
  const [verDdjj, setVerDdjj] = useState(null);
  const [previewDocente, setPreviewDocente] = useState(null);
  const [recordatorioDocente, setRecordatorioDocente] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingDocente, setEditingDocente] = useState(null);
  const [formData, setFormData] = useState(formVacio);
  const [guardandoDocente, setGuardandoDocente] = useState(false);
  const [mensajeForm, setMensajeForm] = useState('');
  const [errorForm, setErrorForm] = useState('');
  const [mostrarAgregarRol, setMostrarAgregarRol] = useState(false);
  const [guardandoAgregarRol, setGuardandoAgregarRol] = useState(false);
  const [mostrarQuitarRol, setMostrarQuitarRol] = useState(false);
  const [quitandoRol, setQuitandoRol] = useState(false);
  const [personasConRol, setPersonasConRol] = useState([]);
  const [personasParaAgregarRol, setPersonasParaAgregarRol] = useState([]);
  const [cargandoPersonasSinRol, setCargandoPersonasSinRol] = useState(false);
  const [idsDocentesSinRol, setIdsDocentesSinRol] = useState([]);

  const cargarPersonasSinRol = async () => {
    setCargandoPersonasSinRol(true);
    try {
      const data = await getUsuariosSinRol('docente');
      setPersonasParaAgregarRol(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(formateaMensajeError(err));
    } finally {
      setCargandoPersonasSinRol(false);
    }
  };

  useEffect(() => {
    cargarPersonasSinRol();
  }, []);

  const cargarPersonasConRol = async () => {
    try {
      const data = await getUsuariosConRol('docente');
      setPersonasConRol(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(formateaMensajeError(err));
    }
  };

  const fetchCursoMateriaParaDocente = async () => {
    try {
      const data = await getCursoMateria({ activo: '1', estado: '1', id_docente: '' });
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('Error al cargar curso-materias:', err);
      return [];
    }
  };

  const fetchCursosParaDocente = async () => {
    try {
      const data = await getCursos({ activo: '1', estado: '1' });
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('Error al cargar cursos:', err);
      return [];
    }
  };

  const fetchMateriasParaDocente = async () => {
    try {
      const data = await getMaterias({ activo: '1' });
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('Error al cargar materias:', err);
      return [];
    }
  };

  const handleAgregarRol = async ({ persona, asignaciones }) => {
    setGuardandoAgregarRol(true);
    try {
      await createDocente({
        id_usuario_existente: Number(persona.id_usuario ?? persona.id),
        dni: persona.dni || '',
        nombre: persona.nombre || '',
        apellido: persona.apellido || '',
        correo: persona.correo || persona.email || null,
        telefono: persona.telefono || null,
        curso_materia_ids: asignaciones.curso_materia_ids || [],
      });
      toast.success('Rol "Docente" asignado correctamente.');
      setMostrarAgregarRol(false);
      setIdsDocentesSinRol((prev) =>
        prev.filter((idu) => Number(idu) !== Number(persona.id_usuario ?? persona.id)),
      );
      await refreshData();
      await cargarPersonasSinRol();
    } catch (err) {
      toast.error(formateaMensajeError(err));
    } finally {
      setGuardandoAgregarRol(false);
    }
  };

  const handleQuitarRol = async (persona) => {
    setQuitandoRol(true);
    try {
      await quitarRolUsuario(Number(persona.id_usuario), 'docente');
      toast.success('Rol "Docente" quitado correctamente.');
      setMostrarQuitarRol(false);
      setIdsDocentesSinRol((prev) => [...prev, Number(persona.id_usuario)]);
      await refreshData();
      await cargarPersonasSinRol();
    } catch (err) {
      toast.error(formateaMensajeError(err));
    } finally {
      setQuitandoRol(false);
    }
  };

  const abrirCrearDocente = () => {
    setEditingDocente(null);
    setFormData(formVacio);
    setMensajeForm('');
    setErrorForm('');
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
    setErrorForm('');
  };

  const handleGuardarDocente = async (e) => {
    e.preventDefault();
    if (guardandoDocente) return;
    setMensajeForm('');
    setErrorForm('');
    if (!editingDocente && (!formData.usuario_nombre || !formData.contrasena)) {
      toast.warning('Completá usuario y contraseña.');
      return;
    }
    if (!formData.dni || !formData.nombre || !formData.apellido) {
      toast.warning('Completá DNI, nombre y apellido.');
      return;
    }
    // 5.9 — con las dos fechas cargadas, la primera de la línea de tiempo tiene
    // que ser la opuesta al estado que se está guardando; si no, la primera de
    // las dos no haría nada.
    const errorFechas = errorProgramacion({
      estadoInicial: formData.estado !== false,
      deshabilitacion: formData.fecha_deshabilitacion_programada,
      habilitacion: formData.fecha_habilitacion_programada,
    });
    if (errorFechas && (formData.fecha_deshabilitacion_programada || formData.fecha_habilitacion_programada)) {
      toast.warning(errorFechas);
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
      setErrorForm(formateaMensajeError(err));
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
    const visibles = docentes.filter(
      (d) => !idsDocentesSinRol.includes(Number(d.id_usuario)),
    );
    if (!searchTerm) return visibles;
    const q = normalize(searchTerm);
    return visibles.filter(
      (d) =>
        normalize(d.nombre).includes(q) ||
        normalize(d.apellido).includes(q) ||
        normalize(`${d.nombre} ${d.apellido}`).includes(q) ||
        normalize(cleanDNI(d.dni)).includes(q),
    );
  }, [docentes, searchTerm, idsDocentesSinRol]);

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

  const handleEnviarRecordatorio = async (docente) => {
    setRecordatorioDocente(null);
    setGuardandoDocente(true);
    try {
      const res = await enviarRecordatorioDdjj(docente.id_docente || docente.id);
      toast.success(
        res?.detail || `Recordatorio enviado al docente ${docente.apellido}, ${docente.nombre}.`
      );
      await refreshData();
    } catch (error) {
      toast.error(error.response?.data?.detail || error.response?.data?.error || 'No se pudo enviar el recordatorio.');
    } finally {
      setGuardandoDocente(false);
    }
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
          <button type="button" className="btn btn-outline-primary" onClick={() => setMostrarAgregarRol(true)}>
            <i className="fas fa-user-tag" aria-hidden="true" /> Agregar rol
          </button>
          <button
            type="button"
            className="btn btn-outline-danger"
            onClick={() => {
              cargarPersonasConRol();
              setMostrarQuitarRol(true);
            }}
          >
            <i className="fas fa-user-minus" aria-hidden="true" /> Quitar rol
          </button>
          <span className="header-actions-sep" aria-hidden="true" />
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
                const verDdjjOpen = verDdjj === d.id;
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
                        <div style={{ display: 'grid', gap: '6px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '6px' }}>
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
                              className="btn btn-secondary table-download-btn"
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

                          {tieneDdjj ? (
                            <button
                              type="button"
                              className={`btn btn-primary table-download-btn ${d.ddjj_verificada ? 'btn-success' : ''}`}
                              onClick={() => { setVerDdjj(verDdjjOpen ? null : d.id); setActasAbierto(null); setCursosAbierto(null); }}
                            >
                              <i className={`fas fa-chevron-${verDdjjOpen ? 'up' : 'down'}`} aria-hidden="true" />{' '}
                              {d.ddjj_verificada ? 'DDJJ ✓' : 'DDJJ'}
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-sm btn-danger"
                              onClick={() => setRecordatorioDocente(d)}
                              title="El docente aún no cargó su DDJJ"
                            >
                              <i className="fas fa-file-alt" aria-hidden="true" /> Ver DDJJ
                            </button>
                          )}

                          <div style={{ display: 'grid', gridTemplateColumns: d.usuario_estado !== null && d.usuario_estado !== undefined ? 'repeat(3, minmax(0, 1fr))' : 'repeat(2, minmax(0, 1fr))', gap: '6px' }}>
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
                    {tieneDdjj && verDdjjOpen && (
                      <tr className="acta-desplegable-row">
                        <td colSpan={6}>
                          <div style={{ padding: '16px', background: '#f8fafc', borderTop: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <i className="fas fa-file-alt" style={{ color: 'var(--primary-color)', fontSize: '1.2rem' }} aria-hidden="true" />
                                <strong>DDJJ</strong>
                                {d.ddjj_verificada && <span className="badge badge-success" style={{ marginLeft: '8px' }}>Verificada</span>}
                              </div>
                              {d.ddjj_fecha_subida && (
                                <span style={{ color: '#666', fontSize: '0.9rem' }}>
                                  <i className="fas fa-calendar-alt" aria-hidden="true" /> Subida: {new Date(d.ddjj_fecha_subida).toLocaleDateString('es-AR')}
                                </span>
                              )}
                              {d.ddjj_nombre_archivo && (
                                <span style={{ color: '#666', fontSize: '0.9rem', marginLeft: 'auto' }}>
                                  <i className="fas fa-file" aria-hidden="true" /> {d.ddjj_nombre_archivo}
                                </span>
                              )}
                            </div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              {tieneDdjj && archivoUrl && (
                                <a
                                  href={buildDownloadUrl(archivoUrl)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-sm btn-secondary"
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                >
                                  <i className="fas fa-download" aria-hidden="true" /> Descargar
                                </a>
                              )}
                              {!d.ddjj_verificada && (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-secondary"
                                  onClick={() => handleVerificarDdjj(d)}
                                  disabled={guardandoDocente}
                                >
                                  <i className="fas fa-check" aria-hidden="true" /> Verificar
                                </button>
                              )}
                              {d.ddjj_verificada && (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-danger"
                                  onClick={() => handleEliminarDdjj(d)}
                                  disabled={guardandoDocente}
                                >
                                  <i className="fas fa-trash" aria-hidden="true" /> Eliminar DDJJ
                                </button>
                              )}
                              <button
                                type="button"
                                className="btn btn-sm btn-secondary"
                                onClick={() => setRecordatorioDocente(d)}
                                disabled={tieneDdjj || guardandoDocente}
                              >
                                <i className="fas fa-bell" aria-hidden="true" /> Recordar
                              </button>
                            </div>
                          </div>
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

      {recordatorioDocente && (
        <DdjjRecordatorioModal
          docente={recordatorioDocente}
          onConfirm={handleEnviarRecordatorio}
          onCancel={() => setRecordatorioDocente(null)}
        />
      )}

      {showForm && (
        <FormModal
          title={editingDocente ? 'Editar docente' : 'Nuevo docente'}
          onClose={cerrarFormDocente}
          error={errorForm}
          onClearError={() => setErrorForm('')}
        >
          <form onSubmit={handleGuardarDocente} style={{ position: 'relative' }}>
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

      {mostrarAgregarRol && (
        <AgregarRolModal
          titulo="Agregar rol: docente"
          subtitulo="Seleccioná una persona existente para asignarle el rol. Se reutilizará su mismo usuario: no se crean usuarios y no se sobrescriben roles."
          personas={personasParaAgregarRol}
          onClose={() => setMostrarAgregarRol(false)}
          onAgregar={handleAgregarRol}
          guardando={guardandoAgregarRol}
          rol="docente"
          fetchAssignmentsFn={fetchCursoMateriaParaDocente}
          fetchCursosFn={fetchCursosParaDocente}
          fetchMateriasFn={fetchMateriasParaDocente}
        />
      )}

      {mostrarQuitarRol && (
        <QuitarRolModal
          titulo="Quitar rol: docente"
          subtitulo="Seleccioná una persona para quitarle el rol. Se eliminará únicamente la asignación de este rol; el usuario, la persona y sus otros roles permanecerán intactos."
          personas={personasConRol}
          onClose={() => setMostrarQuitarRol(false)}
          onQuitar={handleQuitarRol}
          quitando={quitandoRol}
        />
      )}
    </div>
  );
}

export default Docentes;

