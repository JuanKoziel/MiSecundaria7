import { Fragment, useEffect, useMemo, useState } from 'react';
import { useData } from '../../context/DataContext';
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
  getUsuariosConRol,
  getUsuariosSinRol,
  quitarRolUsuario,
} from '../../services/api';
import { formatDNI, cleanDNI } from '../../utils/dni';
import { getCursos } from '../../services/api';
import confirmarEliminacion from '../../utils/confirmarEliminacion';
import { useToast } from '../../context/ToastContext';
import LoadingScreen from '../Shared/LoadingScreen';
import AccionesLeyenda from '../Shared/AccionesLeyenda';
import { mensajeErrorAmigable } from '../../utils/errores';

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
  modo_creacion: 'nuevo',
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
  return mensajeErrorAmigable(err);
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
  const [personasParaAgregarRol, setPersonasParaAgregarRol] = useState([]);
  const [personasConRol, setPersonasConRol] = useState([]);
  const [cargandoPersonasSinRol, setCargandoPersonasSinRol] = useState(false);

  const cargarPersonasSinRol = async () => {
    setCargandoPersonasSinRol(true);
    try {
      const data = await getUsuariosSinRol('preceptor');
      setPersonasParaAgregarRol(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(`Error al cargar personas: ${mensajeError(err)}`);
    } finally {
      setCargandoPersonasSinRol(false);
    }
  };

  useEffect(() => {
    cargarPersonasSinRol();
  }, []);

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
      const [perfiles, conRol] = await Promise.all([
        getPreceptores('preceptor'),
        getUsuariosConRol('preceptor'),
      ]);
      const perfilesArr = Array.isArray(perfiles) ? perfiles : [];
      const conRolArr = Array.isArray(conRol) ? conRol : [];
      const perfilPorUsuario = new Map(
        perfilesArr.filter((p) => p.id_usuario != null).map((p) => [String(p.id_usuario), p]),
      );
      const lista = conRolArr.map((u) => {
        const perfil = perfilPorUsuario.get(String(u.id_usuario));
        if (perfil) return perfil;
        return {
          id_preceptor: null,
          id_usuario: u.id_usuario,
          usuario: u.usuario || '',
          nombre: u.nombre || '',
          apellido: u.apellido || '',
          dni: u.dni || '',
          telefono: u.telefono || '',
          correo: u.correo || '',
          usuario_estado: u.usuario_estado ?? null,
          usuario_fecha_deshabilitacion_programada: null,
          usuario_fecha_habilitacion_programada: null,
          cursos_asignados: [],
          sin_perfil: true,
        };
      });
      const enLista = new Set(lista.map((l) => String(l.id_usuario)));
      const extra = perfilesArr.filter((p) => p.id_usuario != null && !enLista.has(String(p.id_usuario)));
      setPreceptores([...lista, ...extra]);
    } catch (err) {
      toast.error(`Error al cargar preceptores: ${mensajeError(err)}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreceptores();
  }, []);

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
      }, 'preceptor');
      toast.success(preceptor.usuario_estado !== false ? 'Preceptor deshabilitado correctamente' : 'Preceptor habilitado correctamente');
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
      delete payload.modo_creacion;
      delete payload.id_usuario;
      if (editingPreceptor && !payload.contrasena) {
        delete payload.contrasena;
      }
      if (editingPreceptor && payload.estado === undefined) {
        delete payload.estado;
      }

      if (!editingPreceptor && !payload.contrasena) {
        toast.warning('La contrasena es obligatoria para crear un preceptor');
        setGuardando(false);
        return;
      }

      const esPerfilIncompleto = editingPreceptor && !editingPreceptor.id_preceptor;

      if (esPerfilIncompleto) {
        if (normalizarCursosIds(payload.cursos_ids).length === 0) {
          toast.warning('Debe asignar al menos un curso para completar el perfil del preceptor');
          setGuardando(false);
          return;
        }
        payload.id_usuario_existente = Number(editingPreceptor.id_usuario);
        delete payload.usuario_nombre;
        delete payload.estado;
        delete payload.fecha_deshabilitacion_programada;
        delete payload.fecha_habilitacion_programada;
        await createPreceptor(payload, 'preceptor');
        toast.success('Perfil de preceptor completado correctamente');
      } else if (editingPreceptor) {
        await updatePreceptor(editingPreceptor.id_preceptor, payload, 'preceptor');
        toast.success('Preceptor actualizado correctamente');
      } else {
        await createPreceptor(payload, 'preceptor');
        toast.success('Preceptor creado correctamente');
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
    await confirmarEliminacion(`Eliminar al preceptor ${preceptor.apellido}, ${preceptor.nombre}?\n\nEsta acción no se puede deshacer.`, {
      onConfirm: async () => {
        setError('');
        setSuccess('');
        try {
          await deletePreceptor(preceptor.id_preceptor, 'preceptor');
          toast.success('Preceptor eliminado correctamente');
          await fetchPreceptores();
          await refreshData();
        } catch (err) {
          toast.error(`Error al eliminar preceptor: ${mensajeError(err)}`);
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
      }, 'preceptor');
      toast.success('Rol "Preceptor" asignado correctamente.');
      setMostrarAgregarRol(false);
      await fetchPreceptores();
      await refreshData();
    } catch (err) {
      toast.error(`Error al asignar rol: ${mensajeError(err)}`);
    } finally {
      setGuardandoAgregarRol(false);
    }
  };

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

  const cargarPersonasConRol = async () => {
    try {
      const data = await getUsuariosConRol('preceptor');
      setPersonasConRol(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(`Error al cargar personas: ${mensajeError(err)}`);
    }
  };

  const handleQuitarRol = async (persona) => {
    setQuitandoRol(true);
    try {
      await quitarRolUsuario(Number(persona.id_usuario), 'preceptor');
      toast.success('Rol "Preceptor" quitado correctamente.');
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
    return <LoadingScreen text="Cargando preceptores" />;
  }

  const renderFormulario = () => (
    <FormModal title={editingPreceptor ? 'Editar Preceptor' : 'Nuevo Preceptor'} onClose={cerrarFormulario} error={error} onClearError={() => setError('')}>
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
        <h3><i className="fas fa-user-cog" aria-hidden="true" /> Administrar Preceptores</h3>
        <div className="header-actions">
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={() => {
              cargarPersonasSinRol();
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
          <button type="button" className="btn btn-primary" onClick={abrirCrear}>
            <i className="fas fa-plus" aria-hidden="true" /> Nuevo Preceptor
          </button>
        </div>
      </div>

      <div className="empty-state-message flex-gap-16--wrap mb-12">
        <span><i className="fas fa-edit" aria-hidden="true" /> Editar</span>
        <span><i className="fas fa-toggle-on" aria-hidden="true" /> Habilitar / Deshabilitar</span>
        <span><i className="fas fa-trash" aria-hidden="true" /> Eliminar</span>
      </div>

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

      <AccionesLeyenda acciones={['editar', 'habilitar', 'deshabilitar', 'eliminar']} />

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
                      {p.sin_perfil ? (
                        <span className="badge badge-neutral">Sin perfil</span>
                      ) : (p.cursos_asignados || []).length > 0 ? (
                        p.cursos_asignados.map((c) => c.nombre_curso).join(', ')
                      ) : (
                        '---'
                      )}
                    </td>
                    <td className="acciones-cell flex-row--center">
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => abrirEditar(p)}
                        aria-label="Editar preceptor"
                        title={p.sin_perfil ? 'Completar perfil de preceptor' : 'Editar'}
                      >
                        <i className="fas fa-edit" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm ${p.usuario_estado === false ? 'btn-success' : 'btn-warning'}`}
                        onClick={() => toggleEstado(p)}
                        aria-label={p.usuario_estado === false ? 'Habilitar preceptor' : 'Deshabilitar preceptor'}
                        title={p.usuario_estado === false ? 'Habilitar' : 'Deshabilitar'}
                        disabled={p.usuario_estado === null || p.usuario_estado === undefined || !p.id_preceptor}
                      >
                        <i className={`fas ${p.usuario_estado === false ? 'fa-check' : 'fa-ban'}`} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(p)}
                        aria-label="Eliminar preceptor"
                        title="Eliminar"
                        disabled={!p.id_preceptor}
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
          titulo="Agregar rol: preceptor"
          subtitulo="Seleccioná una persona existente para asignarle el rol. Se reutilizará su mismo usuario: no se crean usuarios y no se sobrescriben roles."
          personas={personasParaAgregarRol}
          onClose={() => setMostrarAgregarRol(false)}
          onAgregar={handleAgregarRol}
          guardando={guardandoAgregarRol}
          rol="preceptor"
          fetchAssignmentsFn={fetchCursosParaPreceptor}
        />
      )}

      {mostrarQuitarRol && (
        <QuitarRolModal
          titulo="Quitar rol: preceptor"
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

export default AdminPreceptores;
