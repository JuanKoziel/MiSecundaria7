import { useState, useEffect } from 'react';
import { getUsuarios, createUsuario, updateUsuario, deleteUsuario } from '../../services/api';

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
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const data = await getUsuarios();
      console.log('[fetchUsuarios] Usuarios recibidos:', data);
      console.log('[fetchUsuarios] Cantidad de usuarios:', data?.length || 0);

      // Log each user with their roles
      data?.forEach((u, idx) => {
        console.log(`[fetchUsuarios] Usuario ${idx}:`, {
          id: u.id_usuario,
          usuario: u.usuario,
          roles: u.roles,
          hasRoles: !!u.roles,
          isAdmin: u.roles?.includes('admin')
        });
      });

      // Filter only users with admin role
      const adminUsers = data.filter((u) => u.roles && u.roles.includes('admin'));
      console.log('[fetchUsuarios] Administradores filtrados:', adminUsers);
      console.log('[fetchUsuarios] Cantidad de administradores:', adminUsers.length);
      setUsuarios(adminUsers);
    } catch (err) {
      console.error('[fetchUsuarios] Error fetching usuarios:', err);
      setError('Error al cargar administradores');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingUsuario(null);
    setFormData({
      usuario: '',
      contrasena: '',
      nombre: '',
      apellido: '',
      dni: '',
      telefono: '',
      cargo: 'Administrador',
      estado: true,
    });
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const handleEdit = (usuario) => {
    setEditingUsuario(usuario);
    setFormData({
      usuario: usuario.usuario,
      contrasena: '',
      nombre: usuario.directivo_nombre || '',
      apellido: usuario.directivo_apellido || '',
      dni: usuario.directivo_dni || '',
      telefono: usuario.directivo_telefono || '',
      cargo: usuario.directivo_cargo || 'Administrador',
      estado: usuario.estado !== false,
    });
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este administrador?')) return;

    try {
      await deleteUsuario(id);
      setSuccess('Administrador eliminado correctamente');
      fetchUsuarios();
    } catch (err) {
      console.error('Error deleting usuario:', err);
      setError('Error al eliminar administrador');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const payload = {
        ...formData,
        roles: ['admin'],
      };

      if (editingUsuario) {
        // Update - only include password if provided
        if (!formData.contrasena) {
          delete payload.contrasena;
        }
        await updateUsuario(editingUsuario.id_usuario, payload);
        setSuccess('Administrador actualizado correctamente');
      } else {
        // Create - password is required
        if (!formData.contrasena) {
          setError('La contraseña es obligatoria para crear un administrador');
          return;
        }
        await createUsuario(payload);
        setSuccess('Administrador creado correctamente');
      }

      setShowModal(false);
      fetchUsuarios();
    } catch (err) {
      console.error('Error saving usuario:', err);
      setError(err.response?.data?.detail || 'Error al guardar administrador');
    }
  };

  if (loading) {
    return <div className="card">Cargando...</div>;
  }

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Administradores</h3>
        <button type="button" className="btn btn-primary" onClick={handleCreate}>
          <i className="fas fa-plus" aria-hidden="true" /> Nuevo Administrador
        </button>
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
              <th>Teléfono</th>
              <th>Cargo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '24px' }}>
                  No hay administradores registrados
                </td>
              </tr>
            ) : (
              usuarios.map((u) => (
                <tr key={u.id_usuario}>
                  <td className="table-cell-strong">{u.usuario}</td>
                  <td>{u.directivo_nombre || '—'}</td>
                  <td>{u.directivo_apellido || '—'}</td>
                  <td>{u.directivo_dni || '—'}</td>
                  <td>{u.directivo_telefono || '—'}</td>
                  <td>{u.directivo_cargo || '—'}</td>
                  <td>
                    <span className={`badge ${u.estado ? 'badge-success' : 'badge-danger'}`}>
                      {u.estado ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleEdit(u)}
                    >
                      <i className="fas fa-edit" aria-hidden="true" /> Editar
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(u.id_usuario)}
                    >
                      <i className="fas fa-trash" aria-hidden="true" /> Eliminar
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
          <div className="modal-content" style={{ width: '100%', maxWidth: '600px', margin: '0 auto' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>{editingUsuario ? 'Editar Administrador' : 'Nuevo Administrador'}</h3>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '20px',
                  padding: '8px',
                  color: 'var(--text-secondary)',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'}
                onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
              >
                <i className="fas fa-times" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
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

              <div className="form-group">
                <label htmlFor="contrasena">
                  Contraseña {editingUsuario ? '(dejar en blanco para mantener)' : ''}
                </label>
                <input
                  type="password"
                  id="contrasena"
                  value={formData.contrasena}
                  onChange={(e) => setFormData({ ...formData, contrasena: e.target.value })}
                  required={!editingUsuario}
                />
              </div>

              <div className="form-group">
                <label htmlFor="nombre">Nombre</label>
                <input
                  type="text"
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="apellido">Apellido</label>
                <input
                  type="text"
                  id="apellido"
                  value={formData.apellido}
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="dni">DNI</label>
                <input
                  type="text"
                  id="dni"
                  value={formData.dni}
                  onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="telefono">Teléfono</label>
                <input
                  type="text"
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="cargo">Cargo</label>
                <input
                  type="text"
                  id="cargo"
                  value={formData.cargo}
                  onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.checked })}
                  />
                  {' '}Estado Activo
                </label>
              </div>

              <div className="modal-footer">
                <button type="submit" className="btn btn-primary">
                  {editingUsuario ? 'Actualizar' : 'Crear'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
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

export default Administradores;
