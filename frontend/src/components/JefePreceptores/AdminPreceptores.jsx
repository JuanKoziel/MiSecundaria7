import { Fragment, useEffect, useMemo, useState } from 'react';
import { useData } from '../../context/DataContext';
import FormModal from '../../components/Shared/FormModal';
import {
  createPreceptor,
  deletePreceptor,
  getPreceptores,
  updatePreceptor,
} from '../../services/api';
import { formatDNI, cleanDNI } from '../../utils/dni';

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
  if (!value) return '---';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '---';
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
  return '---';
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

function normalizarCursosIds(cursosAsignados) {
  if (!Array.isArray(cursosAsignados)) return [];
  const ids = cursosAsignados
    .map((curso) => {
      if (typeof curso === 'number' || typeof curso === 'string') {
        return Number(curso);
      }
      return Number(curso.id_curso ?? curso.id ?? curso.cursoId);
    })
    .filter((id) => Number.isInteger(id) && id > 0);
  return [...new Set(ids)];
}

function normalize(str) {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function AdminPreceptores() {
  const { cursosObj, refreshData } = useData();
  const [preceptores, setPreceptores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPreceptor, setEditingPreceptor] = useState(null);
  const [formData, setFormData] = useState(formVacio);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [guardando, setGuardando] = useState(false);

  const filteredPreceptores = useMemo(() => {
    if (!searchTerm) return preceptores;
    const q = normalize(searchTerm);
    return preceptores.filter(
      (p) =>
        normalize(p.nombre).includes(q) ||
        normalize(p.apellido).includes(q) ||
        normalize(`${p.nombre} ${p.apellido}`).includes(q) ||
        normalize(cleanDNI(p.dni)).includes(q),
    );
  }, [preceptores, searchTerm]);

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
      cursos_ids: normalizarCursosIds(preceptor.cursos_asignados),
    });
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const cerrarFormulario = () => {
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

  const toggleCurso = (cursoId) => {
    setFormData((prev) => {
      const cursosActuales = normalizarCursosIds(prev.cursos_ids);
      const yaSeleccionado = cursosActuales.includes(cursoId);
      const cursos_ids = yaSeleccionado
        ? cursosActuales.filter((id) => id !== cursoId)
        : [...cursosActuales, cursoId];
      return { ...prev, cursos_ids };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setGuardando(true);

    try {
      const payload = {
        ...formData,
        cursos_ids: normalizarCursosIds(formData.cursos_ids),
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
        setGuardando(false);
        return;
      }

      if (editingPreceptor) {
        await updatePreceptor(editingPreceptor.id_preceptor, payload);
        setSuccess('Preceptor actualizado correctamente');
      } else {
        await createPreceptor(payload);
        setSuccess('Preceptor creado correctamente');
      }

      cerrarFormulario();
      await fetchPreceptores();
      await refreshData();
    } catch (err) {
      setError(`Error al guardar preceptor: ${mensajeError(err)}`);
    } finally {
      setGuardando(false);
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

  const renderFormulario = () => (
    <FormModal title={editingPreceptor ? 'Editar Preceptor' : 'Nuevo Preceptor'} onClose={cerrarFormulario}>
      <form onSubmit={handleSubmit}>
        <div className="standard-modal-body" style={{ display: 'grid', gap: '14px' }}>
          <section className="preceptor-form-section">
            <h4>Datos de acceso</h4>
            <div className="preceptor-form-row preceptor-form-row--two">
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
            </div>
          </section>

          <section className="preceptor-form-section">
            <h4>Estado de la cuenta</h4>
            <div className="preceptor-form-row preceptor-form-row--status">
              <div className="form-group-filter">
                <label>Estado</label>
                <label htmlFor="preceptor-estado" className="preceptor-status-toggle">
                  <input
                    id="preceptor-estado"
                    type="checkbox"
                    checked={formData.estado}
                    onChange={(e) => setFormData((prev) => ({ ...prev, estado: e.target.checked }))}
                  />
                  <span>{estadoLabel(formData.estado)}</span>
                </label>
              </div>

              <div className="form-group-filter">
                <label htmlFor="preceptor-fecha-deshabilitacion">Fecha deshabilitacion programada</label>
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
                <label htmlFor="preceptor-fecha-habilitacion">Fecha habilitacion programada</label>
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
            </div>
          </section>

          <section className="preceptor-form-section">
            <h4>Datos personales</h4>
            <div className="preceptor-form-row preceptor-form-row--two">
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
            </div>

            <div className="preceptor-form-row preceptor-form-row--two">
              <div className="form-group-filter">
                <label htmlFor="preceptor-dni">DNI</label>
                <input
                  id="preceptor-dni"
                  type="text"
                  value={formData.dni}
                  onChange={(e) => setFormData((prev) => ({ ...prev, dni: formatDNI(e.target.value) }))}
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
            </div>
          </section>

          <section className="preceptor-form-section">
            <div className="form-group-filter preceptor-form-full">
              <div className="preceptor-cursos-header">
                <h4 id="preceptor-cursos-label">Cursos asignados</h4>
                <span className="badge badge-neutral">
                  {formData.cursos_ids.length} seleccionados
                </span>
              </div>
              <div
                className="preceptor-cursos-multiselect"
                role="group"
                aria-labelledby="preceptor-cursos-label"
              >
                {cursosOrdenados.map((curso) => {
                  const cursoId = Number(curso.id_curso);
                  const checked = formData.cursos_ids.includes(cursoId);
                  return (
                    <label
                      key={curso.id_curso}
                      className={`preceptor-curso-option${checked ? ' preceptor-curso-option--selected' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCurso(cursoId)}
                      />
                      <span>
                        {curso.nombre_curso}
                        {curso.ciclo_anio ? ` (${curso.ciclo_anio})` : ''}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
        <div className="standard-modal-footer">
          <button type="submit" className="btn btn-primary" disabled={guardando}>
            <i className="fas fa-save" aria-hidden="true" />{' '}
            {guardando ? 'Guardando...' : editingPreceptor ? 'Actualizar' : 'Crear'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={cerrarFormulario}>
            Cancelar
          </button>
        </div>
      </form>
    </FormModal>
  );

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Administrar Preceptores</h3>
        <button type="button" className="btn btn-primary" onClick={abrirCrear}>
          <i className="fas fa-plus" aria-hidden="true" /> Nuevo Preceptor
        </button>
      </div>

      <div className="empty-state-message flex-gap-16--wrap mb-12">
        <span><i className="fas fa-edit" aria-hidden="true" /> Editar</span>
        <span><i className="fas fa-toggle-on" aria-hidden="true" /> Habilitar / Deshabilitar</span>
        <span><i className="fas fa-trash" aria-hidden="true" /> Eliminar</span>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

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
              <th>Telefono</th>
              <th>Usuario</th>
              <th>Estado</th>
              <th>Proxima accion</th>
              <th>Cursos asignados</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredPreceptores.length === 0 ? (
              <tr>
                <td colSpan={9} className="empty-state-message">
                  {searchTerm ? 'No se encontraron preceptores con ese criterio.' : 'No hay preceptores registrados.'}
                </td>
              </tr>
            ) : (
              filteredPreceptores.map((p) => (
                <Fragment key={p.id_preceptor}>
                  <tr>
                    <td>{p.nombre}</td>
                    <td>{p.apellido}</td>
                    <td><strong>{formatDNI(p.dni)}</strong></td>
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
                    <td className="acciones-cell flex-row--center">
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
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && renderFormulario()}
    </div>
  );
}

export default AdminPreceptores;
