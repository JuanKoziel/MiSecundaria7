import { useEffect, useMemo, useState } from 'react';
import {
  createActividad,
  deleteActividad,
  deleteActividadArchivo,
  getActividades,
  updateActividad,
} from '../../services/api';
import confirmarEliminacion from '../../utils/confirmarEliminacion';
import { useToast } from '../../context/ToastContext';

const API_BASE = 'http://localhost:8000';
const PREVIEWABLE = ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'gif'];

function getExtension(nombre = '') {
  const limpio = String(nombre).split('?')[0].split('#')[0];
  const parts = limpio.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

function isPreviewable(nombre = '') {
  return PREVIEWABLE.includes(getExtension(nombre));
}

function resolveUrl(url) {
  if (!url) return null;
  return url.startsWith('http') ? url : `${API_BASE}${url}`;
}

function formatDateTime(value) {
  if (!value) return { fecha: '—', hora: '—' };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { fecha: '—', hora: '—' };
  return {
    fecha: new Intl.DateTimeFormat('es-AR', { dateStyle: 'short' }).format(date),
    hora: new Intl.DateTimeFormat('es-AR', { timeStyle: 'short' }).format(date),
  };
}

function getErrorMessage(err) {
  const data = err?.response?.data;
  if (!data) return err?.message || 'No se pudo completar la operación.';
  if (typeof data === 'string') return data;
  if (data.error) return data.error;
  if (data.detail) return data.detail;
  if (typeof data === 'object') {
    return Object.entries(data)
      .map(([key, value]) => {
        if (Array.isArray(value)) return `${key}: ${value.join(' ')}`;
        if (value && typeof value === 'object') return `${key}: ${JSON.stringify(value)}`;
        return `${key}: ${String(value)}`;
      })
      .join(' | ');
  }
  return 'No se pudo completar la operación.';
}

function ArchivoRow({ archivo, onVer, onDescargar, onEliminar, editable = false }) {
  const nombre = archivo?.nombre_archivo || 'Archivo';
  return (
    <div className="flex-row--between"
      style={{
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        padding: '10px 12px',
        background: 'var(--card-bg)',
      }}>
      <div style={{ minWidth: 0 }}>
        <div className="font-bold" style={{ wordBreak: 'break-word' }}>
          {nombre}
          {archivo?.es_principal ? ' · principal' : ''}
        </div>
        <div className="upload-hint" style={{ marginTop: '4px' }}>
          {archivo?.fecha_carga ? formatDateTime(archivo.fecha_carga).fecha : ''}
        </div>
      </div>
      <div className="flex-row--end flex-row--wrap">
        {archivo?.archivo_url && (
          <button type="button" className="btn btn-success btn-sm" onClick={onVer}>
            <i className="fas fa-eye" aria-hidden="true" /> Ver
          </button>
        )}
        {onDescargar && archivo?.archivo_url && (
          <a
            href={resolveUrl(archivo.archivo_url)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-sm"
          >
            <i className="fas fa-download" aria-hidden="true" /> Descargar
          </a>
        )}
        {editable && (
          <button type="button" className="btn btn-danger btn-sm" onClick={onEliminar}>
            <i className="fas fa-trash-alt" aria-hidden="true" /> Eliminar
          </button>
        )}
      </div>
    </div>
  );
}

function ModalActividad({ actividad, onClose }) {
  const archivos = Array.isArray(actividad?.archivos) ? actividad.archivos : [];
  const [previewArchivo, setPreviewArchivo] = useState(null);
  const fechaInfo = formatDateTime(actividad?.fecha_creacion);

  const handleVerArchivo = (archivo) => {
    setPreviewArchivo((prev) => (prev === archivo ? null : archivo));
  };

  const renderPreview = (archivo) => {
    const url = resolveUrl(archivo.archivo_url);
    const ext = getExtension(archivo.nombre_archivo || '');
    const previewable = isPreviewable(archivo.nombre_archivo || '');
    if (!url) return null;
    return (
      <div className="ddjj-no-preview" style={{ marginTop: '8px' }}>
        {previewable ? (
          ext === 'pdf' ? (
            <iframe
              title={`Vista previa ${archivo.nombre_archivo || 'archivo'}`}
              className="ddjj-preview-frame"
              src={url}
            />
          ) : (
            <div className="ddjj-image-wrap">
              <img
                src={url}
                alt={`Vista previa ${archivo.nombre_archivo || 'archivo'}`}
                className="ddjj-preview-image"
              />
            </div>
          )
        ) : (
          <p className="m-0">Este archivo no admite vista previa.</p>
        )}
      </div>
    );
  };

  return (
    <div className="ddjj-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="ddjj-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Vista previa de ${actividad?.titulo || 'actividad'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ddjj-modal-header">
          <h3>{actividad?.titulo || 'Actividad'}</h3>
        </div>

        <div className="ddjj-modal-body" style={{ display: 'grid', gap: '14px' }}>
          <p style={{ marginTop: 0 }}>
            <strong>Descripción:</strong> {actividad?.descripcion || 'Sin descripción.'}
          </p>
          <p>
            <strong>Fecha de subida:</strong> {fechaInfo.fecha}
          </p>
          <p>
            <strong>Hora de subida:</strong> {fechaInfo.hora}
          </p>

          {archivos.length > 0 ? (
            <div style={{ display: 'grid', gap: '10px' }}>
              <p className="m-0 font-bold">Archivos adjuntos</p>
              {archivos.map((archivo) => (
                <ArchivoRow
                  key={archivo.id_archivo || archivo.nombre_archivo}
                  archivo={archivo}
                  onVer={() => handleVerArchivo(archivo)}
                  onDescargar
                />
              ))}
              {previewArchivo && renderPreview(previewArchivo)}
            </div>
          ) : (
            <div className="ddjj-no-preview">
              <p className="m-0">La actividad no tiene archivos adjuntos.</p>
            </div>
          )}
        </div>

        <div className="ddjj-modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalFormularioActividad({
  actividadEditando,
  cursoNombre,
  materiaNombre,
  form,
  setForm,
  onClose,
  onGuardar,
  guardando,
  nuevosArchivos,
  setNuevosArchivos,
  onEliminarArchivo,
}) {
  const archivosExistentes = useMemo(
    () => (Array.isArray(actividadEditando?.archivos) ? actividadEditando.archivos : []),
    [actividadEditando],
  );

  const agregarArchivos = (event) => {
    const incoming = Array.from(event.target.files || []);
    if (incoming.length === 0) return;
    setNuevosArchivos((prev) => [...prev, ...incoming]);
    event.target.value = '';
  };

  const quitarNuevoArchivo = (index) => {
    setNuevosArchivos((prev) => prev.filter((_, idx) => idx !== index));
  };

  return (
    <div className="ddjj-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="standard-modal"
        role="dialog"
        aria-modal="true"
        aria-label={actividadEditando ? 'Editar actividad' : 'Nueva actividad'}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="standard-modal-header">
          <h3>{actividadEditando ? 'Editar actividad' : 'Nueva actividad'}</h3>
        </div>

        <form onSubmit={onGuardar} className="standard-modal-body" style={{ display: 'grid', gap: '14px' }}>
          <div className="form-group-filter">
            <label htmlFor="actividad-titulo">Título *</label>
            <input
              id="actividad-titulo"
              type="text"
              value={form.titulo}
              onChange={(e) => setForm((prev) => ({ ...prev, titulo: e.target.value }))}
              placeholder="Trabajo Práctico Nº1"
              required
            />
          </div>

          <div className="form-group-filter preceptor-form-full">
            <label htmlFor="actividad-descripcion">Descripción</label>
            <textarea
              id="actividad-descripcion"
              rows={5}
              value={form.descripcion}
              onChange={(e) => setForm((prev) => ({ ...prev, descripcion: e.target.value }))}
              placeholder="Consigna, criterios o aclaraciones opcionales"
            />
          </div>

          <div className="form-group-filter preceptor-form-full">
            <label htmlFor="actividad-archivos">Archivos *</label>
            <input
              id="actividad-archivos"
              type="file"
              multiple
              onChange={agregarArchivos}
            />
            <small className="upload-hint">Podés agregar uno o más archivos.</small>
          </div>

          {archivosExistentes.length > 0 && (
            <div style={{ display: 'grid', gap: '10px' }}>
              <p className="m-0 font-bold">Archivos actuales</p>
              {archivosExistentes.map((archivo) => (
                <ArchivoRow
                  key={archivo.id_archivo || archivo.nombre_archivo}
                  archivo={archivo}
                  editable
                  onVer={() => window.open(resolveUrl(archivo.archivo_url), '_blank', 'noopener,noreferrer')}
                  onEliminar={() => onEliminarArchivo(archivo)}
                />
              ))}
            </div>
          )}

          {nuevosArchivos.length > 0 && (
            <div style={{ display: 'grid', gap: '10px' }}>
              <p className="m-0 font-bold">Nuevos archivos a agregar</p>
              {nuevosArchivos.map((file, index) => (
                <ArchivoRow
                  key={`${file.name}-${file.size}-${file.lastModified}`}
                  archivo={{ nombre_archivo: file.name }}
                  editable
                  onVer={() => window.open(URL.createObjectURL(file), '_blank', 'noopener,noreferrer')}
                  onEliminar={() => quitarNuevoArchivo(index)}
                />
              ))}
            </div>
          )}

          <div className="comunicados-destino-preview">
            {cursoNombre} - {materiaNombre}
          </div>

          <div className="standard-modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={guardando}>
              <i className="fas fa-save" aria-hidden="true" /> {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PanelActividades({ cursoMateriaId, docenteId, materiaNombre, cursoNombre, puedeEditar = true }) {
  const toast = useToast();
  const [actividades, setActividades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [actividadEditando, setActividadEditando] = useState(null);
  const [actividadVista, setActividadVista] = useState(null);
  const [nuevosArchivos, setNuevosArchivos] = useState([]);
  const [form, setForm] = useState({ titulo: '', descripcion: '' });

  const cargaLista = async () => {
    if (!cursoMateriaId) return [];
    setLoading(true);
    try {
      const data = await getActividades({ curso_materia: cursoMateriaId });
      const lista = Array.isArray(data) ? data : data.results || [];
      setActividades(lista);
      return lista;
    } catch (err) {
      toast.error(getErrorMessage(err));
      setActividades([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargaLista();
  }, [cursoMateriaId]);

  const resetFormulario = () => {
    setActividadEditando(null);
    setForm({ titulo: '', descripcion: '' });
    setNuevosArchivos([]);
  };

  const abrirNueva = () => {
    resetFormulario();
    setMensaje('');
    setMostrarFormulario(true);
  };

  const abrirEdicion = (actividad) => {
    setActividadEditando(actividad);
    setForm({
      titulo: actividad.titulo || '',
      descripcion: actividad.descripcion || '',
    });
    setNuevosArchivos([]);
    setMensaje('');
    setMostrarFormulario(true);
  };

  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    resetFormulario();
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!cursoMateriaId || !docenteId) {
      toast.warning('No se pudo identificar la asignación actual.');
      return;
    }
    if (!form.titulo.trim()) {
      toast.warning('El título es obligatorio.');
      return;
    }
    if (!actividadEditando && nuevosArchivos.length === 0) {
      toast.warning('Debes adjuntar al menos un archivo para la actividad.');
      return;
    }

    setGuardando(true);
    setMensaje('');
    try {
      const payload = new FormData();
      payload.append('titulo', form.titulo.trim());
      payload.append('descripcion', form.descripcion || '');
      payload.append('id_curso_materia', String(cursoMateriaId));
      payload.append('id_docente', String(docenteId));
      nuevosArchivos.forEach((file) => payload.append('archivos', file));

      if (actividadEditando) {
        await updateActividad(actividadEditando.id_actividad, payload);
        toast.success('Actividad actualizada correctamente.');
      } else {
        await createActividad(payload);
        toast.success('Actividad creada correctamente.');
      }

      await cargaLista();
      cerrarFormulario();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (actividad) => {
    if (!confirmarEliminacion('¿Estás seguro de que querés eliminar esta actividad?\n\nEsta acción no se puede deshacer.')) return;
    try {
      await deleteActividad(actividad.id_actividad);
      toast.success('Actividad eliminada correctamente.');
      await cargaLista();
      if (actividadVista?.id_actividad === actividad.id_actividad) {
        setActividadVista(null);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleEliminarArchivo = async (archivo) => {
    const archivoId = archivo?.id_archivo;
    if (!actividadEditando || !archivoId) return;
    if (!confirmarEliminacion('¿Estás seguro de que querés eliminar este archivo?\n\nEsta acción no se puede deshacer.')) return;

    try {
      const actualizada = await deleteActividadArchivo(actividadEditando.id_actividad, archivoId);
      toast.success('Archivo eliminado correctamente.');
      const fresh = await cargaLista();
      const actividadFresh =
        fresh.find((item) => item.id_actividad === actividadEditando.id_actividad) ||
        actualizada ||
        null;
      if (actividadFresh) {
        setActividadEditando(actividadFresh);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="card">
      <div className="card-header-flex">
        <div>
          <h3>Actividades — {materiaNombre} ({cursoNombre})</h3>
          <p className="empty-state-message" style={{ margin: '6px 0 0' }}>
            Gestioná actividades para esta materia y curso.
          </p>
        </div>
        {puedeEditar && (
          <button type="button" className="btn btn-primary" onClick={abrirNueva}>
            <i className="fas fa-plus" aria-hidden="true" /> Nueva actividad
          </button>
        )}
      </div>

      {!puedeEditar && (
        <p
          style={{
            background: '#fff4cf',
            borderLeft: '4px solid #d97706',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '0.9rem',
            color: '#854d0e',
            lineHeight: '1.6',
          }}
        >
          <i className="fas fa-lock" style={{ marginRight: '8px' }} aria-hidden="true" />
          Esta materia está asignada temporalmente a un docente suplente. Las actividades son de solo lectura hasta que finalice la suplencia.
        </p>
      )}

      {mensaje && (
        <p style={{ color: mensaje.startsWith('Error') ? '#b91c1c' : '#15803d', margin: '8px 0' }}>
          {mensaje}
        </p>
      )}

      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Título</th>
              <th>Fecha de subida</th>
              <th>Hora de subida</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="empty-state-message">
                  Cargando actividades...
                </td>
              </tr>
            ) : actividades.length === 0 ? (
              <tr>
                <td colSpan={4} className="empty-state-message">
                  No hay actividades para esta materia.
                </td>
              </tr>
            ) : (
              actividades.map((actividad) => {
                const fecha = formatDateTime(actividad.fecha_creacion);
                return (
                  <tr key={actividad.id_actividad}>
                    <td className="table-cell-strong">{actividad.titulo}</td>
                    <td>{fecha.fecha}</td>
                    <td>{fecha.hora}</td>
                    <td>
                      <div className="flex-row--wrap">
                        <button
                          type="button"
                          className="btn btn-success btn-sm"
                          onClick={() => setActividadVista(actividad)}
                        >
                          <i className="fas fa-eye" aria-hidden="true" /> Ver
                        </button>
                        {puedeEditar && (
                          <>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => abrirEdicion(actividad)}
                            >
                              <i className="fas fa-edit" aria-hidden="true" /> Editar
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => handleEliminar(actividad)}
                            >
                              <i className="fas fa-trash-alt" aria-hidden="true" /> Eliminar
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {mostrarFormulario && (
        <ModalFormularioActividad
          actividadEditando={actividadEditando}
          cursoNombre={cursoNombre}
          materiaNombre={materiaNombre}
          form={form}
          setForm={setForm}
          onClose={cerrarFormulario}
          onGuardar={handleGuardar}
          guardando={guardando}
          nuevosArchivos={nuevosArchivos}
          setNuevosArchivos={setNuevosArchivos}
          onEliminarArchivo={handleEliminarArchivo}
        />
      )}

      {actividadVista && (
        <ModalActividad actividad={actividadVista} onClose={() => setActividadVista(null)} />
      )}
    </div>
  );
}

export default PanelActividades;
