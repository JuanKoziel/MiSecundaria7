import { useEffect, useMemo, useState } from 'react';
import { useData } from '../../context/DataContext';
import {
  createPreceptor,
  deletePreceptor,
  getPreceptores,
  updatePreceptor,
} from '../../services/api';

const formVacio = {
  usuario_nombre: '',
  contrasena: '',
  estado: true,
  fecha_deshabilitacion_programada: '',
  fecha_habilitacion_programada: '',
  nombre: '',
  apellido: '',
  dni: '',
  telefono: '',
  cursos_ids: [],
};

function toInputDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short' }).format(date);
}

function estadoLabel(estado) {
  if (estado === null || estado === undefined) return 'Sin usuario';
  return estado ? 'Habilitado' : 'Deshabilitado';
}

function proximaAccion(preceptor) {
  if (preceptor.usuario_estado === null || preceptor.usuario_estado === undefined) return 'Sin usuario';
  if (preceptor.usuario_estado && preceptor.usuario_fecha_deshabilitacion_programada) {
    return `Deshabilitar el ${formatDateTime(preceptor.usuario_fecha_deshabilitacion_programada)}`;
  }
  if (!preceptor.usuario_estado && preceptor.usuario_fecha_habilitacion_programada) {
    return `Habilitar el ${formatDateTime(preceptor.usuario_fecha_habilitacion_programada)}`;
  }
  if (preceptor.usuario_fecha_deshabilitacion_programada) {
    return `Deshabilitar el ${formatDateTime(preceptor.usuario_fecha_deshabilitacion_programada)}`;
  }
  if (preceptor.usuario_fecha_habilitacion_programada) {
    return `Habilitar el ${formatDateTime(preceptor.usuario_fecha_habilitacion_programada)}`;
  }
  return '—';
}

function mensajeError(err) {
  const data = err.response?.data;
  if (data && typeof data === 'object' && !data.detail) {
    return Object.entries(data)
      .map(([campo, valor]) => `${campo}: ${Array.isArray(valor) ? valor.join(', ') : valor}`)
      .join(' | ');
  }
  return data?.detail || err.message || 'Error inesperado';
}

function Preceptores() {
  const { cursosObj, refreshData } = useData();
  const [preceptores, setPreceptores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPreceptor, setEditingPreceptor] = useState(null);
  const [formData, setFormData] = useState(formVacio);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const cursosOrdenados = useMemo(
    () => [...(cursosObj || [])].sort((a, b) => {
      const cicloA = a.ciclo_anio || 0;
      const cicloB = b.ciclo_anio || 0;
      if (cicloA !== cicloB) return cicloB - cicloA;
      return String(a.nombre_curso).localeCompare(String(b.nombre_curso));
    }),
    [cursosObj],
  );

  const fetchPreceptores = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getPreceptores();
      setPreceptores(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(`Error al cargar preceptores: ${mensajeError(err)}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreceptores();
  }, []);

  const abrirCrear = () => {
    setEditingPreceptor(null);
    setFormData(formVacio);
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const abrirEditar = (preceptor) => {
    setEditingPreceptor(preceptor);
    setFormData({
      usuario_nombre: preceptor.usuario || '',
      contrasena: '',
      estado: preceptor.usuario_estado !== false,
      fecha_deshabilitacion_programada: toInputDateTime(preceptor.usuario_fecha_deshabilitacion_programada),
      fecha_habilitacion_programada: toInputDateTime(preceptor.usuario_fecha_habilitacion_programada),
      nombre: preceptor.nombre || '',
      apellido: preceptor.apellido || '',
      dni: preceptor.dni || '',
      telefono: preceptor.telefono || '',
      cursos_ids: (preceptor.cursos_asignados || []).map((c) => c.id_curso),
    });
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setEditingPreceptor(null);
    setFormData(formVacio);
  };

  const toggleEstado = async (preceptor) => {
    setError('');
    setSuccess('');
    try {
      await updatePreceptor(preceptor.id_preceptor, {
        estado: !(preceptor.usuario_estado !== false),
      });
      setSuccess(preceptor.usuario_estado !== false ? 'Preceptor deshabilitado correctamente' : 'Preceptor habilitado correctamente');
      await fetchPreceptores();
      await refreshData();
    } catch (err) {
      setError(`Error al actualizar estado: ${mensajeError(err)}`);
    }
  };

  const handleCursosChange = (event) => {
    const selected = Array.from(event.target.selectedOptions).map((option) => Number(option.value));
    setFormData((prev) => ({ ...prev, cursos_ids: selected }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const payload = {
        ...formData,
        fecha_deshabilitacion_programada: formData.fecha_deshabilitacion_programada || null,
        fecha_habilitacion_programada: formData.fecha_habilitacion_programada || null,
      };
      if (editingPreceptor && !payload.contrasena) {
        delete payload.contrasena;
      }
      if (editingPreceptor && payload.estado === undefined) {
        delete payload.estado;
      }

      if (!editingPreceptor && !payload.contrasena) {
        setError('La contrasena es obligatoria para crear un preceptor');
        setSaving(false);
        return;
      }

      if (editingPreceptor) {
        await updatePreceptor(editingPreceptor.id_preceptor, payload);
        setSuccess('Preceptor actualizado correctamente');
      } else {
        await createPreceptor(payload);
        setSuccess('Preceptor creado correctamente');
      }

      cerrarModal();
      await fetchPreceptores();
      await refreshData();
    } catch (err) {
      setError(`Error al guardar preceptor: ${mensajeError(err)}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (preceptor) => {
    if (!window.confirm(`Eliminar al preceptor ${preceptor.apellido}, ${preceptor.nombre}?`)) return;

    setError('');
    setSuccess('');
    try {
      await deletePreceptor(preceptor.id_preceptor);
      setSuccess('Preceptor eliminado correctamente');
      await fetchPreceptores();
      await refreshData();
    } catch (err) {
      setError(`Error al eliminar preceptor: ${mensajeError(err)}`);
    }
  };

  if (loading) {
    return <div className="card">Cargando...</div>;
  }

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Preceptores</h3>
        <button type="button" className="btn btn-primary" onClick={abrirCrear}>
          <i className="fas fa-plus" aria-hidden="true" /> Nuevo Preceptor
        </button>
      </div>

      <div className="empty-state-message" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '12px' }}>
        <span><i className="fas fa-edit" aria-hidden="true" /> Editar</span>
        <span><i className="fas fa-toggle-on" aria-hidden="true" /> Habilitar / Deshabilitar</span>
        <span><i className="fas fa-trash" aria-hidden="true" /> Eliminar</span>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Apellido</th>
              <th>DNI</th>
              <th>Telefono</th>
              <th>Usuario</th>
              <th>Estado</th>
              <th>Próxima acción</th>
              <th>Cursos asignados</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {preceptores.length === 0 ? (
              <tr>
                <td colSpan={9} className="empty-state-message">
                  No hay preceptores registrados.
                </td>
              </tr>
            ) : (
              preceptores.map((p) => (
                <tr key={p.id_preceptor}>
                  <td>{p.nombre}</td>
                  <td>{p.apellido}</td>
                  <td><strong>{p.dni}</strong></td>
                  <td>{p.telefono || '---'}</td>
                  <td className="table-cell-strong">{p.usuario || '---'}</td>
                  <td>
                    <span className={`badge ${p.usuario_estado === false ? 'badge-danger' : 'badge-success'}`}>
                      {estadoLabel(p.usuario_estado)}
                    </span>
                  </td>
                  <td>{proximaAccion(p)}</td>
                  <td>
                    {(p.cursos_asignados || []).length > 0
                      ? p.cursos_asignados.map((c) => c.nombre_curso).join(', ')
                      : '---'}
                  </td>
                  <td className="acciones-cell" style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => abrirEditar(p)}
                      aria-label="Editar preceptor"
                      title="Editar"
                    >
                      <i className="fas fa-edit" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${p.usuario_estado === false ? 'btn-success' : 'btn-warning'}`}
                      onClick={() => toggleEstado(p)}
                      aria-label={p.usuario_estado === false ? 'Habilitar preceptor' : 'Deshabilitar preceptor'}
                      title={p.usuario_estado === false ? 'Habilitar' : 'Deshabilitar'}
                      disabled={p.usuario_estado === null || p.usuario_estado === undefined}
                    >
                      <i className={`fas ${p.usuario_estado === false ? 'fa-check' : 'fa-ban'}`} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(p)}
                      aria-label="Eliminar preceptor"
                      title="Eliminar"
                    >
                      <i className="fas fa-trash" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" style={{ width: '100%', maxWidth: '720px', margin: '0 auto' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>{editingPreceptor ? 'Editar Preceptor' : 'Nuevo Preceptor'}</h3>
              <button
                type="button"
                className="btn-close"
                onClick={cerrarModal}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '20px',
                  padding: '8px',
                  color: 'var(--text-secondary)',
                }}
              >
                <i className="fas fa-times" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="preceptor-form-grid">
                <div className="form-group-filter">
                  <label htmlFor="preceptor-usuario">Usuario</label>
                  <input
                    id="preceptor-usuario"
                    type="text"
                    value={formData.usuario_nombre}
                    onChange={(e) => setFormData((prev) => ({ ...prev, usuario_nombre: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group-filter">
                  <label htmlFor="preceptor-contrasena">
                    Contrasena {editingPreceptor ? '(dejar en blanco para mantener)' : ''}
                  </label>
                  <input
                    id="preceptor-contrasena"
                    type="password"
                    value={formData.contrasena}
                    onChange={(e) => setFormData((prev) => ({ ...prev, contrasena: e.target.value }))}
                    required={!editingPreceptor}
                  />
                </div>

                <div className="form-group-filter">
                  <label htmlFor="preceptor-estado">
                    <input
                      id="preceptor-estado"
                      type="checkbox"
                      checked={formData.estado}
                      onChange={(e) => setFormData((prev) => ({ ...prev, estado: e.target.checked }))}
                    />
                    {' '}
                    Estado actual: {estadoLabel(formData.estado)}
                  </label>
                </div>

                <div className="form-group-filter">
                  <label htmlFor="preceptor-fecha-deshabilitacion">Fecha deshabilitación programada</label>
                  <input
                    id="preceptor-fecha-deshabilitacion"
                    type="datetime-local"
                    value={formData.fecha_deshabilitacion_programada}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        fecha_deshabilitacion_programada: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="form-group-filter">
                  <label htmlFor="preceptor-fecha-habilitacion">Fecha habilitación programada</label>
                  <input
                    id="preceptor-fecha-habilitacion"
                    type="datetime-local"
                    value={formData.fecha_habilitacion_programada}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        fecha_habilitacion_programada: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="form-group-filter">
                  <label htmlFor="preceptor-nombre">Nombre</label>
                  <input
                    id="preceptor-nombre"
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData((prev) => ({ ...prev, nombre: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group-filter">
                  <label htmlFor="preceptor-apellido">Apellido</label>
                  <input
                    id="preceptor-apellido"
                    type="text"
                    value={formData.apellido}
                    onChange={(e) => setFormData((prev) => ({ ...prev, apellido: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group-filter">
                  <label htmlFor="preceptor-dni">DNI</label>
                  <input
                    id="preceptor-dni"
                    type="text"
                    value={formData.dni}
                    onChange={(e) => setFormData((prev) => ({ ...prev, dni: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group-filter">
                  <label htmlFor="preceptor-telefono">Telefono</label>
                  <input
                    id="preceptor-telefono"
                    type="text"
                    value={formData.telefono}
                    onChange={(e) => setFormData((prev) => ({ ...prev, telefono: e.target.value }))}
                  />
                </div>

                <div className="form-group-filter preceptor-form-full">
                  <label htmlFor="preceptor-cursos">Cursos asignados</label>
                  <select
                    id="preceptor-cursos"
                    multiple
                    value={formData.cursos_ids.map(String)}
                    onChange={handleCursosChange}
                    style={{ minHeight: '180px' }}
                  >
                    {cursosOrdenados.map((curso) => (
                      <option key={curso.id_curso} value={curso.id_curso}>
                        {curso.nombre_curso}
                        {curso.ciclo_anio ? ` (${curso.ciclo_anio})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <i className="fas fa-save" aria-hidden="true" />{' '}
                  {saving ? 'Guardando...' : editingPreceptor ? 'Actualizar' : 'Crear'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={cerrarModal}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Preceptores;
