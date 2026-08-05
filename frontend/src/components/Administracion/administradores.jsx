import { Fragment, useEffect, useState } from 'react';
import FormModal from '../../components/Shared/FormModal';
import { createUsuario, deleteUsuario, getUsuarios, updateUsuario } from '../../services/api';
import { formatDNI, cleanDNI } from '../../utils/dni';
import confirmarEliminacion from '../../utils/confirmarEliminacion';

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
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

function estadoLabel(estado) {
  return estado ? 'Habilitado' : 'Deshabilitado';
}

function getNextAction(usuario) {
  if (usuario.estado && usuario.fecha_deshabilitacion_programada) {
    return `Deshabilitar el ${formatDateTime(usuario.fecha_deshabilitacion_programada)}`;
  }
  if (!usuario.estado && usuario.fecha_habilitacion_programada) {
    return `Habilitar el ${formatDateTime(usuario.fecha_habilitacion_programada)}`;
  }
  if (usuario.fecha_deshabilitacion_programada) {
    return `Deshabilitar el ${formatDateTime(usuario.fecha_deshabilitacion_programada)}`;
  }
  if (usuario.fecha_habilitacion_programada) {
    return `Habilitar el ${formatDateTime(usuario.fecha_habilitacion_programada)}`;
  }
  return '---';
}

function Administradores() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState(null);
  const [formData, setFormData] = useState({
    usuario: '',
    contrasena: '',
    nombre: '',
    apellido: '',
    dni: '',
    telefono: '',
    cargo: 'Administrador',
    estado: true,
    fecha_deshabilitacion_programada: '',
    fecha_habilitacion_programada: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const resetForm = () => ({
    usuario: '',
    contrasena: '',
    nombre: '',
    apellido: '',
    dni: '',
    telefono: '',
    cargo: 'Administrador',
    estado: true,
    fecha_deshabilitacion_programada: '',
    fecha_habilitacion_programada: '',
  });

  const fetchUsuarios = async () => {
    try {
      const data = await getUsuarios();
      const adminUsers = (Array.isArray(data) ? data : []).filter(
        (u) => u.roles && u.roles.includes('admin'),
      );
      setUsuarios(adminUsers);
    } catch (err) {
      setError('Error al cargar administradores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const cerrarModal = () => {
    setShowModal(false);
    setEditingUsuario(null);
    setFormData(resetForm());
  };

  const handleCreate = () => {
    setEditingUsuario(null);
    setFormData(resetForm());
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const handleEdit = (usuario) => {
    setEditingUsuario(usuario);
    setFormData({
      usuario: usuario.usuario || '',
      contrasena: '',
      nombre: usuario.directivo_nombre || '',
      apellido: usuario.directivo_apellido || '',
      dni: usuario.directivo_dni || '',
      telefono: usuario.directivo_telefono || '',
      cargo: usuario.directivo_cargo || 'Administrador',
      estado: usuario.estado !== false,
      fecha_deshabilitacion_programada: toInputDateTime(usuario.fecha_deshabilitacion_programada),
      fecha_habilitacion_programada: toInputDateTime(usuario.fecha_habilitacion_programada),
    });
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirmarEliminacion()) return;

    try {
      await deleteUsuario(id);
      setSuccess('Administrador eliminado correctamente');
      fetchUsuarios();
    } catch (err) {
      setError('Error al eliminar administrador');
    }
  };

  const handleToggleEstado = async (usuario) => {
    try {
      await updateUsuario(usuario.id_usuario, {
        estado: !usuario.estado,
      });
      setSuccess(usuario.estado ? 'Administrador deshabilitado correctamente' : 'Administrador habilitado correctamente');
      fetchUsuarios();
    } catch (err) {
      setError('Error al actualizar el estado del administrador');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const normalisedPayload = {
        ...formData,
        fecha_deshabilitacion_programada: formData.fecha_deshabilitacion_programada || null,
        fecha_habilitacion_programada: formData.fecha_habilitacion_programada || null,
      };
      const payload = {
        ...normalisedPayload,
        roles: ['admin'],
      };

      if (editingUsuario) {
        if (!formData.contrasena) {
          delete payload.contrasena;
        }
        await updateUsuario(editingUsuario.id_usuario, payload);
        setSuccess('Administrador actualizado correctamente');
      } else {
        if (!formData.contrasena) {
          setError('La contrasena es obligatoria para crear un administrador');
          return;
        }
        await createUsuario(payload);
        setSuccess('Administrador creado correctamente');
      }

      cerrarModal();
      fetchUsuarios();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al guardar administrador');
    }
  };

  if (loading) {
    return <div className="card">Cargando...</div>;
  }

  const renderFormulario = () => (
    <FormModal title={editingUsuario ? 'Editar Administrador' : 'Nuevo Administrador'} onClose={cerrarModal}>
      <form onSubmit={handleSubmit}>
        <div className="standard-modal-body" style={{ display: 'grid', gap: '14px' }}>
          <section className="preceptor-form-section">
            <h4>Datos de acceso</h4>
            <div className="preceptor-form-row preceptor-form-row--two">
              <div className="form-group-filter">
                <label htmlFor="usuario">Usuario</label>
                <input
                  type="text"
                  id="usuario"
                  value={formData.usuario}
                  onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
                  required
                  disabled={!!editingUsuario}
                />
              </div>

              <div className="form-group-filter">
                <label htmlFor="contrasena">
                  Contrasena {editingUsuario ? '(dejar en blanco para mantener)' : ''}
                </label>
                <input
                  type="password"
                  id="contrasena"
                  value={formData.contrasena}
                  onChange={(e) => setFormData({ ...formData, contrasena: e.target.value })}
                  required={!editingUsuario}
                />
              </div>
            </div>
          </section>

          <section className="preceptor-form-section">
            <h4>Estado de la cuenta</h4>
            <div className="preceptor-form-row preceptor-form-row--status">
              <div className="form-group-filter">
                <label>Estado</label>
                <label htmlFor="estado" className="preceptor-status-toggle">
                  <input
                    type="checkbox"
                    id="estado"
                    checked={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.checked })}
                  />
                  <span>{estadoLabel(formData.estado)}</span>
                </label>
              </div>

              <div className="form-group-filter">
                <label htmlFor="fecha_deshabilitacion_programada">Fecha deshabilitacion programada</label>
                <input
                  type="datetime-local"
                  id="fecha_deshabilitacion_programada"
                  value={formData.fecha_deshabilitacion_programada}
                  onChange={(e) => setFormData({ ...formData, fecha_deshabilitacion_programada: e.target.value })}
                />
              </div>

              <div className="form-group-filter">
                <label htmlFor="fecha_habilitacion_programada">Fecha habilitacion programada</label>
                <input
                  type="datetime-local"
                  id="fecha_habilitacion_programada"
                  value={formData.fecha_habilitacion_programada}
                  onChange={(e) => setFormData({ ...formData, fecha_habilitacion_programada: e.target.value })}
                />
              </div>
            </div>
          </section>

          <section className="preceptor-form-section">
            <h4>Datos personales</h4>
            <div className="preceptor-form-row preceptor-form-row--two">
              <div className="form-group-filter">
                <label htmlFor="nombre">Nombre</label>
                <input
                  type="text"
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                />
              </div>

              <div className="form-group-filter">
                <label htmlFor="apellido">Apellido</label>
                <input
                  type="text"
                  id="apellido"
                  value={formData.apellido}
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="preceptor-form-row preceptor-form-row--two">
              <div className="form-group-filter">
                <label htmlFor="dni">DNI</label>
                <input
                  type="text"
                  id="dni"
                  value={formData.dni}
                  onChange={(e) => setFormData({ ...formData, dni: formatDNI(e.target.value) })}
                  required
                />
              </div>

              <div className="form-group-filter">
                <label htmlFor="telefono">Telefono</label>
                <input
                  type="text"
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                />
              </div>
            </div>
          </section>

          <section className="preceptor-form-section">
            <h4>Datos administrativos</h4>
            <div className="preceptor-form-row preceptor-form-row--two">
              <div className="form-group-filter">
                <label htmlFor="cargo">Cargo</label>
                <input
                  type="text"
                  id="cargo"
                  value={formData.cargo}
                  onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                />
              </div>
            </div>
          </section>
        </div>
        <div className="standard-modal-footer">
          <button type="submit" className="btn btn-primary">
            <i className="fas fa-save" aria-hidden="true" /> {editingUsuario ? 'Actualizar' : 'Crear'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={cerrarModal}>Cancelar</button>
        </div>
      </form>
    </FormModal>
  );

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Administradores</h3>
        <button type="button" className="btn btn-primary" onClick={handleCreate}>
          <i className="fas fa-plus" aria-hidden="true" /> Nuevo Administrador
        </button>
      </div>

      <div className="empty-state-message flex-gap-16--wrap mb-12">
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
              <th>Usuario</th>
              <th>Nombre</th>
              <th>Apellido</th>
              <th>DNI</th>
              <th>Telefono</th>
              <th>Cargo</th>
              <th>Estado</th>
              <th>Proxima accion</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.length === 0 ? (
              <tr>
                <td colSpan="9" className="empty-state-message">
                  No hay administradores registrados.
                </td>
              </tr>
            ) : (
              usuarios.map((u) => (
                <Fragment key={u.id_usuario}>
                  <tr>
                    <td className="table-cell-strong">{u.usuario}</td>
                    <td>{u.directivo_nombre || '---'}</td>
                    <td>{u.directivo_apellido || '---'}</td>
                    <td>{formatDNI(u.directivo_dni) || '---'}</td>
                    <td>{u.directivo_telefono || '---'}</td>
                    <td>{u.directivo_cargo || '---'}</td>
                    <td>
                      <span className={`badge ${u.estado ? 'badge-success' : 'badge-danger'}`}>
                        {estadoLabel(u.estado)}
                      </span>
                    </td>
                    <td>{getNextAction(u)}</td>
                    <td className="acciones-cell flex-row--center">
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleEdit(u)}
                        aria-label="Editar administrador"
                        title="Editar"
                      >
                        <i className="fas fa-edit" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm ${u.estado ? 'btn-warning' : 'btn-success'}`}
                        onClick={() => handleToggleEstado(u)}
                        aria-label={u.estado ? 'Deshabilitar administrador' : 'Habilitar administrador'}
                        title={u.estado ? 'Deshabilitar' : 'Habilitar'}
                      >
                        <i className={`fas ${u.estado ? 'fa-ban' : 'fa-check'}`} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(u.id_usuario)}
                        aria-label="Eliminar administrador"
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

export default Administradores;
