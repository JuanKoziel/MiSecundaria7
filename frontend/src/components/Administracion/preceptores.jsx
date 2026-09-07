import { Fragment, useEffect, useMemo, useState } from 'react';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import FormModal from '../../components/Shared/FormModal';
import AgregarRolModal from '../../components/Shared/AgregarRolModal';
import QuitarRolModal from '../../components/Shared/QuitarRolModal';
import {
  createPreceptor,
  deletePreceptor,
  getPreceptores,
  updatePreceptor,
  getDocentes,
  getDirectivos,
  getUsuarios,
  getUsuariosConRol,
  getUsuariosSinRol,
  quitarRolUsuario,
} from '../../services/api';
import { getCursos } from '../../services/api';
import { formatDNI, cleanDNI } from '../../utils/dni';
import confirmarEliminacion from '../../utils/confirmarEliminacion';
import LoadingScreen from '../Shared/LoadingScreen';

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
  id_usuario_existente: '',
  modo_creacion: 'nuevo', // 'nuevo' | 'existente'
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

function Preceptores({ rol = 'preceptor' }) {
  const esJefe = rol === 'jefe_preceptores';
  const etiquetaSingular = esJefe ? 'Jefe de Preceptores' : 'Preceptor';
  const etiquetaPlural = esJefe ? 'Jefes de Preceptores' : 'Preceptores';
  const entidad = esJefe ? 'jefe de preceptores' : 'preceptor';

  const { cursosObj, refreshData, docentes, preceptores: listaPreceptores, administradores } = useData();
  const toast = useToast();
  const [preceptores, setPreceptores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPreceptor, setEditingPreceptor] = useState(null);
  const [formData, setFormData] = useState(formVacio);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [personasDisponibles, setPersonasDisponibles] = useState([]);
  const [mostrarAgregarRol, setMostrarAgregarRol] = useState(false);
  const [guardandoAgregarRol, setGuardandoAgregarRol] = useState(false);
  const [mostrarQuitarRol, setMostrarQuitarRol] = useState(false);
  const [quitandoRol, setQuitandoRol] = useState(false);
  const [personasConRol, setPersonasConRol] = useState([]);

  // Fetch personas disponibles para Jefe de Preceptores
  const cargarPersonasDisponibles = useMemo(() => {
    const personasMap = new Map();
    const agregar = (list, tipo) => (list || []).forEach((p) => {
      if (p.id_usuario && !personasMap.has(p.id_usuario)) {
        personasMap.set(p.id_usuario, {
          id: p.id_usuario,
          tipo,
          label: `${p.apellido}, ${p.nombre} (${tipo})`,
          dni: p.dni,
          nombre: p.nombre,
          apellido: p.apellido,
          email: p.correo,
          usuario: p.usuario || '',
        });
      }
    });
    agregar(docentes, 'Docente');
    if (esJefe) {
      agregar(listaPreceptores, 'Preceptor');
    }
    agregar(administradores, 'Administrador');
    return Array.from(personasMap.values());
  }, [docentes, listaPreceptores, administradores, esJefe]);

  useEffect(() => {
    setPersonasDisponibles(cargarPersonasDisponibles);
  }, [cargarPersonasDisponibles]);

  // Estado para personas sin el rol (cargado desde backend)
  const [personasParaAgregarRol, setPersonasParaAgregarRol] = useState([]);
  const [cargandoPersonasSinRol, setCargandoPersonasSinRol] = useState(false);

  const cargarPersonasSinRol = async () => {
    setCargandoPersonasSinRol(true);
    try {
      const data = await getUsuariosSinRol(rol);
      setPersonasParaAgregarRol(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(`Error al cargar personas: ${mensajeError(err)}`);
    } finally {
      setCargandoPersonasSinRol(false);
    }
  };

  useEffect(() => {
    cargarPersonasSinRol();
  }, [rol]);

  // Función para obtener cursos disponibles para asignar a preceptores
  const fetchCursosParaPreceptor = async () => {
    try {
      const data = await getCursos({ activo: '1', estado: '1' });
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('Error al cargar cursos:', err);
      return [];
    }
  };

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
      const data = await getPreceptores(rol);
      setPreceptores(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(`Error al cargar ${etiquetaPlural.toLowerCase()}: ${mensajeError(err)}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreceptores();
  }, [rol]);

  const abrirCrear = () => {
    setEditingPreceptor(null);
    setFormData({ ...formVacio, modo_creacion: 'nuevo' });
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
      modo_creacion: 'nuevo',
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
      }, rol);
      toast.success(preceptor.usuario_estado !== false
        ? `${etiquetaSingular} deshabilitado correctamente.`
        : `${etiquetaSingular} habilitado correctamente.`);
      await fetchPreceptores();
      await refreshData();
    } catch (err) {
      toast.error(`Error al actualizar estado: ${mensajeError(err)}`);
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
      // El Jefe de Preceptores no se vincula a un Curso.id_preceptor: su alcance es dinámico a todos los cursos.
      if (esJefe) {
        payload.cursos_ids = [];
      }
      delete payload.modo_creacion;
      delete payload.id_usuario;

      if (editingPreceptor && !payload.contrasena) {
        delete payload.contrasena;
      }
      if (editingPreceptor && payload.estado === undefined) {
        delete payload.estado;
      }

      // Validar contraseña solo si es creación nueva
      if (!editingPreceptor && !payload.contrasena) {
        toast.warning(`La contrasena es obligatoria para crear un ${entidad}.`);
        setGuardando(false);
        return;
      }

      if (editingPreceptor) {
        await updatePreceptor(editingPreceptor.id_preceptor, payload, rol);
        toast.success(`${etiquetaSingular} actualizado correctamente.`);
      } else {
        await createPreceptor(payload, rol);
        toast.success(`${etiquetaSingular} creado correctamente.`);
      }

      cerrarFormulario();
      await fetchPreceptores();
      await refreshData();
    } catch (err) {
      toast.error(`Error al guardar preceptor: ${mensajeError(err)}`);
    } finally {
      setGuardando(false);
    }
  };

  const handleDelete = async (preceptor) => {
    await confirmarEliminacion(`Eliminar al ${entidad} ${preceptor.apellido}, ${preceptor.nombre}?\n\nEsta acción no se puede deshacer.`, {
      onConfirm: async () => {
        setError('');
        setSuccess('');
        try {
          await deletePreceptor(preceptor.id_preceptor, rol);
          toast.success(`${etiquetaSingular} eliminado correctamente.`);
          await fetchPreceptores();
          await refreshData();
        } catch (err) {
          toast.error(`Error al eliminar ${entidad}: ${mensajeError(err)}`);
        }
      },
    });
  };

  const handleAgregarRol = async ({ persona, asignaciones }) => {
    setGuardandoAgregarRol(true);
    try {
      await createPreceptor({
        id_usuario_existente: Number(persona.id_usuario ?? persona.id),
        nombre: persona.nombre || '',
        apellido: persona.apellido || '',
        dni: persona.dni || '',
        cursos_ids: asignaciones.cursos_ids || [],
      }, rol);
      toast.success(`Rol "${etiquetaSingular}" asignado correctamente.`);
      setMostrarAgregarRol(false);
      await fetchPreceptores();
      await refreshData();
    } catch (err) {
      toast.error(`Error al asignar rol: ${mensajeError(err)}`);
    } finally {
      setGuardandoAgregarRol(false);
    }
  };

  const cargarPersonasConRol = async () => {
    try {
      const data = await getUsuariosConRol(rol);
      setPersonasConRol(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(`Error al cargar personas: ${mensajeError(err)}`);
    }
  };

  const handleQuitarRol = async (persona) => {
    setQuitandoRol(true);
    try {
      await quitarRolUsuario(Number(persona.id_usuario), rol);
      toast.success(`Rol "${etiquetaSingular}" quitado correctamente.`);
      setMostrarQuitarRol(false);
      await fetchPreceptores();
      await refreshData();
    } catch (err) {
      toast.error(`Error al quitar rol: ${mensajeError(err)}`);
    } finally {
      setQuitandoRol(false);
    }
  };

  if (loading) {
    return <LoadingScreen text={`Cargando ${entidad}`} />;
  }

  const renderFormulario = () => (
    <FormModal title={editingPreceptor ? `Editar ${etiquetaSingular}` : `Nuevo ${etiquetaSingular}`} onClose={cerrarFormulario}>
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
              {esJefe ? (
                <div className="preceptor-cursos-header">
                  <h4 id="preceptor-cursos-label">Supervisión de cursos</h4>
                  <span className="badge badge-neutral">Todos los cursos</span>
                </div>
              ) : (
                <>
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
                </>
              )}
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
        <h3>{etiquetaPlural}</h3>
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
          <button type="button" className="btn btn-primary" onClick={abrirCrear}>
            <i className="fas fa-plus" aria-hidden="true" /> Nuevo {etiquetaSingular}
          </button>
        </div>
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
                  {searchTerm
                    ? `No se encontraron ${etiquetaPlural.toLowerCase()} con ese criterio.`
                    : `No hay ${etiquetaPlural.toLowerCase()} registrados.`}
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
                        aria-label={`Editar ${entidad}`}
                        title="Editar"
                      >
                        <i className="fas fa-edit" aria-hidden="true" /> Editar
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm ${p.usuario_estado === false ? 'btn-success' : 'btn-warning'}`}
                        onClick={() => toggleEstado(p)}
                        aria-label={p.usuario_estado === false ? `Habilitar ${entidad}` : `Deshabilitar ${entidad}`}
                        title={p.usuario_estado === false ? 'Habilitar' : 'Deshabilitar'}
                        disabled={p.usuario_estado === null || p.usuario_estado === undefined}
                      >
                        <i className={`fas ${p.usuario_estado === false ? 'fa-check' : 'fa-ban'}`} aria-hidden="true" />{' '}
                        {p.usuario_estado === false ? 'Habilitar' : 'Deshabilitar'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(p)}
                        aria-label={`Eliminar ${entidad}`}
                        title="Eliminar"
                      >
                        <i className="fas fa-trash" aria-hidden="true" /> Eliminar
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
          titulo={`Agregar rol: ${entidad}`}
          subtitulo={`Seleccioná una persona existente para asignarle el rol "${etiquetaSingular}". Se reutilizará su mismo usuario: no se crean usuarios y no se sobrescriben roles.`}
          personas={personasParaAgregarRol}
          onClose={() => setMostrarAgregarRol(false)}
          onAgregar={handleAgregarRol}
          guardando={guardandoAgregarRol}
          rol={rol}
          fetchAssignmentsFn={fetchCursosParaPreceptor}
        />
      )}

      {mostrarQuitarRol && (
        <QuitarRolModal
          titulo={`Quitar rol: ${entidad}`}
          subtitulo={`Seleccioná una persona para quitarle el rol "${etiquetaSingular}". Se eliminará únicamente la asignación de este rol; el usuario, la persona y sus otros roles permanecerán intactos.`}
          personas={personasConRol}
          onClose={() => setMostrarQuitarRol(false)}
          onQuitar={handleQuitarRol}
          quitando={quitandoRol}
        />
      )}
    </div>
  );
}

export default Preceptores;
