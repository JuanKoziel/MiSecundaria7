import { Fragment, useEffect, useMemo, useState } from 'react';
import { useToast } from '../../context/ToastContext';
import FormModal from '../../components/Shared/FormModal';
import AgregarRolModal from '../../components/Shared/AgregarRolModal';
import QuitarRolModal from '../../components/Shared/QuitarRolModal';
import { createUsuario, deleteUsuario, getUsuarios, updateUsuario, getDocentes, getPreceptores, getDirectivos, getUsuariosConRol, getUsuariosSinRol, quitarRolUsuario } from '../../services/api';
import { formatDNI, cleanDNI } from '../../utils/dni';
import confirmarEliminacion from '../../utils/confirmarEliminacion';
import LoadingScreen from '../Shared/LoadingScreen';

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

function getNextAction(usuario) {
  if (usuario.estado === null || usuario.estado === undefined) return 'Sin usuario';
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

const formVacio = {
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
  id_usuario_existente: '',
  modo_creacion: 'nuevo', // 'nuevo' | 'existente'
};

function Administradores() {
  const toast = useToast();
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
    id_usuario_existente: '',
    modo_creacion: 'nuevo', // 'nuevo' | 'existente'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mostrarAgregarRol, setMostrarAgregarRol] = useState(false);
  const [guardandoAgregarRol, setGuardandoAgregarRol] = useState(false);
  const [mostrarQuitarRol, setMostrarQuitarRol] = useState(false);
  const [quitandoRol, setQuitandoRol] = useState(false);
  const [personasConRol, setPersonasConRol] = useState([]);

  // Fetch personas disponibles para Admin (Docentes, Preceptores, Directivos)
  const [personasDisponibles, setPersonasDisponibles] = useState([]);

  const cargarPersonas = async () => {
    try {
      const [docentesData, preceptoresData, directivosData] = await Promise.all([
        getDocentes(),
        getPreceptores(),
        getDirectivos(),
      ]);
      const personas = [];
      (docentesData || []).forEach((d) => {
        personas.push({
          id: d.id_usuario,
          tipo: 'docente',
          label: `${d.apellido}, ${d.nombre} (Docente)`,
          dni: d.dni,
          nombre: d.nombre,
          apellido: d.apellido,
          correo: d.correo,
          telefono: d.telefono,
          usuario: d.usuario || '',
        });
      });
      (preceptoresData || []).forEach((p) => {
        if (p.id_usuario && p.usuario) {
          personas.push({
            id: p.id_usuario,
            tipo: 'preceptor',
            label: `${p.apellido}, ${p.nombre} (Preceptor)`,
            dni: p.dni,
            nombre: p.nombre,
            apellido: p.apellido,
            correo: p.correo,
            telefono: p.telefono,
            usuario: p.usuario || '',
          });
        }
      });
      (directivosData || []).forEach((a) => {
        if (a.id_usuario) {
          personas.push({
            id: a.id_usuario,
            tipo: 'administrador',
            label: `${a.apellido}, ${a.nombre} (Administrador)`,
            dni: a.dni,
            nombre: a.nombre,
            apellido: a.apellido,
            correo: a.correo,
            telefono: a.telefono,
            usuario: a.usuario || '',
          });
        }
      });
      setPersonasDisponibles(personas);
    } catch (err) {
      console.error('Error cargando personas:', err);
    }
  };

  const [personasParaAgregarRol, setPersonasParaAgregarRol] = useState([]);
  const [cargandoPersonasSinRol, setCargandoPersonasSinRol] = useState(false);

  const cargarPersonasSinRol = async () => {
    setCargandoPersonasSinRol(true);
    try {
      const data = await getUsuariosSinRol('admin');
      setPersonasParaAgregarRol(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al cargar administradores');
    } finally {
      setCargandoPersonasSinRol(false);
    }
  };

  useEffect(() => {
    cargarPersonasSinRol();
  }, []);

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
    id_usuario_existente: '',
    modo_creacion: 'nuevo',
  });

  const fetchUsuarios = async () => {
    try {
      const data = await getUsuarios();
      const adminUsers = (Array.isArray(data) ? data : []).filter(
        (u) => u.roles && u.roles.includes('admin'),
      );
      setUsuarios(adminUsers);
    } catch (err) {
      toast.error('Error al cargar administradores');
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
    cargarPersonas();
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
      id_usuario_existente: '',
      modo_creacion: 'nuevo',
    });
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    await confirmarEliminacion('¿Está seguro de que desea eliminar este administrador?\n\nEsta acción no se puede deshacer.', {
      onConfirm: async () => {
        try {
          await deleteUsuario(id);
          toast.success('Administrador eliminado correctamente.');
          fetchUsuarios();
        } catch (err) {
          toast.error('Error al eliminar administrador');
        }
      },
    });
  };

  const handleToggleEstado = async (usuario) => {
    try {
      await updateUsuario(usuario.id_usuario, {
        estado: !usuario.estado,
      });
      toast.success(usuario.estado ? 'Administrador deshabilitado correctamente.' : 'Administrador habilitado correctamente.');
      fetchUsuarios();
    } catch (err) {
      toast.error('Error al actualizar el estado del administrador');
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

      // Clean up fields not needed for API
      delete payload.modo_creacion;
      delete payload.id_usuario;

      if (editingUsuario) {
        if (!formData.contrasena) {
          delete payload.contrasena;
        }
        await updateUsuario(editingUsuario.id_usuario, payload);
        toast.success('Administrador actualizado correctamente.');
      } else {
        // Validar contraseña solo si es creación nueva
        if (!payload.contrasena) {
          toast.warning('La contrasena es obligatoria para crear un administrador.');
          return;
        }
        await createUsuario(payload);
        toast.success('Administrador creado correctamente.');
      }

      cerrarModal();
      fetchUsuarios();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al guardar administrador');
    }
  };

  const handleAgregarRol = async ({ persona }) => {
    setGuardandoAgregarRol(true);
    try {
      await createUsuario({
        id_usuario_existente: Number(persona.id_usuario ?? persona.id),
        roles: ['admin'],
        nombre: persona.nombre || '',
        apellido: persona.apellido || '',
        dni: persona.dni || '',
        telefono: persona.telefono || '',
        cargo: 'Administrador',
      });
      toast.success('Rol "Administrador" asignado correctamente.');
      setMostrarAgregarRol(false);
      fetchUsuarios();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al asignar rol');
    } finally {
      setGuardandoAgregarRol(false);
    }
  };

  const cargarPersonasConRol = async () => {
    try {
      const data = await getUsuariosConRol('admin');
      setPersonasConRol(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al cargar administradores');
    }
  };

  const handleQuitarRol = async (persona) => {
    setQuitandoRol(true);
    try {
      await quitarRolUsuario(Number(persona.id_usuario), 'admin');
      toast.success('Rol "Administrador" quitado correctamente.');
      setMostrarQuitarRol(false);
      fetchUsuarios();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al quitar rol');
    } finally {
      setQuitandoRol(false);
    }
  };

  if (loading) {
    return <LoadingScreen text="Cargando administradores" />;
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
        <div className="header-actions">
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={() => {
              cargarPersonas();
              setMostrarAgregarRol(true);
            }}
          >
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
          <button type="button" className="btn btn-primary" onClick={handleCreate}>
            <i className="fas fa-plus" aria-hidden="true" /> Nuevo Administrador
          </button>
        </div>
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

      {mostrarAgregarRol && (
        <AgregarRolModal
          titulo="Agregar rol: administrador"
          subtitulo="Seleccioná una persona existente para asignarle el rol. Se reutilizará su mismo usuario: no se crean usuarios y no se sobrescriben roles."
          personas={personasParaAgregarRol}
          onClose={() => setMostrarAgregarRol(false)}
          onAgregar={handleAgregarRol}
          guardando={guardandoAgregarRol}
        />
      )}

      {mostrarQuitarRol && (
        <QuitarRolModal
          titulo="Quitar rol: administrador"
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

export default Administradores;
