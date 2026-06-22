import { useEffect, useMemo, useState } from 'react';
import { createActividad, deleteActividad, getActividades, updateActividad } from '../../services/api';

const API_BASE = 'http://localhost:8000';
const PREVIEWABLE = ['pdf', 'png', 'jpg', 'jpeg', 'webp'];

function getExtension(nombre = '') {
  const limpio = String(nombre).split('?')[0].split('#')[0];
  const partes = limpio.split('.');
  return partes.length > 1 ? partes.pop().toLowerCase() : '';
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
  const fechaObj = new Date(value);
  if (Number.isNaN(fechaObj.getTime())) return { fecha: '—', hora: '—' };
  return {
    fecha: new Intl.DateTimeFormat('es-AR', { dateStyle: 'short' }).format(fechaObj),
    hora: new Intl.DateTimeFormat('es-AR', { timeStyle: 'short' }).format(fechaObj),
  };
}

function getErrorMessage(err) {
  const data = err?.response?.data;
  if (!data) return err?.message || 'No se pudo cargar la actividad.';
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
  return 'No se pudo cargar la actividad.';
}

function ModalActividad({ actividad, onClose }) {
  const archivoUrl = resolveUrl(actividad?.archivo_url);
  const nombreArchivo = actividad?.nombre_archivo || (archivoUrl ? archivoUrl.split('/').pop() : null);
  const previewable = isPreviewable(nombreArchivo || '');
  const fechaInfo = formatDateTime(actividad?.fecha_creacion);

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
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            Cerrar
          </button>
        </div>

        <div className="ddjj-modal-body">
          <p style={{ marginTop: 0 }}>
            <strong>Descripción:</strong> {actividad?.descripcion || 'Sin descripción.'}
          </p>
          <p>
            <strong>Fecha de subida:</strong> {fechaInfo.fecha}
          </p>
          <p>
            <strong>Hora de subida:</strong> {fechaInfo.hora}
          </p>
          <p>
            <strong>Archivo:</strong> {nombreArchivo || 'Sin archivo'}
          </p>

          {archivoUrl ? (
            previewable ? (
              getExtension(nombreArchivo || '') === 'pdf' ? (
                <iframe
                  title={`Vista previa ${nombreArchivo}`}
                  className="ddjj-preview-frame"
                  src={archivoUrl}
                />
              ) : (
                <div className="ddjj-image-wrap">
                  <img
                    src={archivoUrl}
                    alt={`Vista previa ${nombreArchivo}`}
                    className="ddjj-preview-image"
                  />
                </div>
              )
            ) : (
              <div className="ddjj-no-preview">
                <p style={{ margin: 0 }}>Este archivo no admite vista previa.</p>
              </div>
            )
          ) : (
            <div className="ddjj-no-preview">
              <p style={{ margin: 0 }}>La actividad no tiene archivo adjunto.</p>
            </div>
          )}
        </div>

        <div className="ddjj-modal-footer">
          {archivoUrl && (
            <a
              href={archivoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-success"
            >
              <i className="fas fa-download" aria-hidden="true" /> Descargar archivo
            </a>
          )}
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalFormularioActividad({
  cursoMateriaId,
  docenteId,
  cursoNombre,
  materiaNombre,
  actividadEditando,
  form,
  setForm,
  onClose,
  onGuardar,
  guardando,
}) {
  return (
    <div className="ddjj-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="ddjj-modal"
        role="dialog"
        aria-modal="true"
        aria-label={actividadEditando ? 'Editar actividad' : 'Nueva actividad'}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ddjj-modal-header">
          <h3>{actividadEditando ? 'Editar actividad' : 'Nueva actividad'}</h3>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            Cerrar
          </button>
        </div>

        <form onSubmit={onGuardar} className="ddjj-modal-body" style={{ display: 'grid', gap: '14px' }}>
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
            <label htmlFor="actividad-archivo">Archivo *</label>
            <input
              id="actividad-archivo"
              type="file"
              onChange={(e) => {
                const archivo = e.target.files?.[0] || null;
                setForm((prev) => ({ ...prev, archivo }));
              }}
            />
            {actividadEditando?.nombre_archivo && !form.archivo && (
              <small className="upload-hint">Archivo actual: {actividadEditando.nombre_archivo}</small>
            )}
            {form.archivo && <small className="upload-hint">Nuevo archivo: {form.archivo.name}</small>}
          </div>

          <div className="comunicados-destino-preview">
            {cursoNombre} - {materiaNombre}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={guardando}>
              <i className="fas fa-save" aria-hidden="true" /> {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>

          <input type="hidden" value={cursoMateriaId || ''} readOnly />
          <input type="hidden" value={docenteId || ''} readOnly />
        </form>
      </div>
    </div>
  );
}

function PanelActividades({ cursoMateriaId, docenteId, materiaNombre, cursoNombre }) {
  const [actividades, setActividades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [actividadEditando, setActividadEditando] = useState(null);
  const [actividadVista, setActividadVista] = useState(null);
  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    archivo: null,
  });

  const cargaLista = async () => {
    if (!cursoMateriaId) return;
    setLoading(true);
    try {
      const data = await getActividades({ curso_materia: cursoMateriaId });
      setActividades(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      setMensaje(getErrorMessage(err));
      setActividades([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargaLista();
  }, [cursoMateriaId]);

  const resetFormulario = () => {
    setForm({ titulo: '', descripcion: '', archivo: null });
    setActividadEditando(null);
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
      archivo: null,
    });
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
      setMensaje('No se pudo identificar la asignación actual.');
      return;
    }
    if (!form.titulo.trim()) {
      setMensaje('El título es obligatorio.');
      return;
    }
    if (!actividadEditando && !form.archivo) {
      setMensaje('Debes adjuntar un archivo para la actividad.');
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
      if (form.archivo) {
        payload.append('archivo', form.archivo);
      }

      if (actividadEditando) {
        await updateActividad(actividadEditando.id_actividad, payload);
        setMensaje('Actividad actualizada correctamente.');
      } else {
        await createActividad(payload);
        setMensaje('Actividad creada correctamente.');
      }

      await cargaLista();
      cerrarFormulario();
    } catch (err) {
      setMensaje(`Error: ${getErrorMessage(err)}`);
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (actividad) => {
    if (!window.confirm('¿Estás seguro de que querés eliminar esta actividad?')) return;
    try {
      await deleteActividad(actividad.id_actividad);
      setMensaje('Actividad eliminada correctamente.');
      await cargaLista();
    } catch (err) {
      setMensaje(`Error: ${getErrorMessage(err)}`);
    }
  };

  const fechaHoraEtiqueta = (valor) => {
    const parsed = formatDateTime(valor);
    return `${parsed.fecha} - ${parsed.hora}`;
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
        <button type="button" className="btn btn-primary" onClick={abrirNueva}>
          <i className="fas fa-plus" aria-hidden="true" /> Nueva actividad
        </button>
      </div>

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
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn btn-success btn-sm"
                          onClick={() => setActividadVista(actividad)}
                        >
                          <i className="fas fa-eye" aria-hidden="true" /> Ver
                        </button>
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
          cursoMateriaId={cursoMateriaId}
          docenteId={docenteId}
          cursoNombre={cursoNombre}
          materiaNombre={materiaNombre}
          actividadEditando={actividadEditando}
          form={form}
          setForm={setForm}
          onClose={cerrarFormulario}
          onGuardar={handleGuardar}
          guardando={guardando}
        />
      )}

      {actividadVista && (
        <ModalActividad actividad={actividadVista} onClose={() => setActividadVista(null)} />
      )}
    </div>
  );
}

export default PanelActividades;
