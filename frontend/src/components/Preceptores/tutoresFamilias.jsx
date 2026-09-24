import { useState, useEffect, Fragment, useMemo } from 'react';
import { formatDNI, cleanDNI } from '../../utils/dni';
import { useData } from '../../context/DataContext';
import { createPadreTutor, updatePadreTutor, deletePadreTutor, getUsuariosConRol, getUsuariosSinRol, quitarRolUsuario, getEstudiantes } from '../../services/api';
import FormModal from '../../components/Shared/FormModal';
import AgregarRolModal from '../../components/Shared/AgregarRolModal';
import QuitarRolModal from '../../components/Shared/QuitarRolModal';
import TutoresEstudiantesEditor from '../../components/Shared/TutoresEstudiantesEditor';
import AccionesLeyenda from '../../components/Shared/AccionesLeyenda';
import { cursosPorAnio, estudiantesPorAnioYCurso, filtrosCompletos } from './preceptorUtils';
import confirmarEliminacion from '../../utils/confirmarEliminacion';
import { useToast } from '../../context/ToastContext';
import { mensajeErrorAmigable } from '../../utils/errores';

const TIPOS_TUTOR = ['Padre', 'Madre', 'Tutor'];

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
  tipo: '',
  telefono: '',
  direccion: '',
  alumnos_ids: [],
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

function normalize(str) {
  if (!str) return '';
  return String(str).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function estadoLabel(estado) {
  if (estado === null || estado === undefined) return 'Sin usuario';
  return estado ? 'Habilitado' : 'Deshabilitado';
}

function proximaAccion(t) {
  if (t.usuario_estado === null || t.usuario_estado === undefined) return '---';
  if (t.usuario_estado && t.usuario_fecha_deshabilitacion_programada) {
    return `Deshabilitar el ${formatDateTime(t.usuario_fecha_deshabilitacion_programada)}`;
  }
  if (!t.usuario_estado && t.usuario_fecha_habilitacion_programada) {
    return `Habilitar el ${formatDateTime(t.usuario_fecha_habilitacion_programada)}`;
  }
  if (t.usuario_fecha_deshabilitacion_programada) {
    return `Deshabilitar el ${formatDateTime(t.usuario_fecha_deshabilitacion_programada)}`;
  }
  if (t.usuario_fecha_habilitacion_programada) {
    return `Habilitar el ${formatDateTime(t.usuario_fecha_habilitacion_programada)}`;
  }
  return '---';
}

function mensajeError(err) {
  return mensajeErrorAmigable(err);
}

function nombreTutor(t) {
  return `${t.apellido}, ${t.nombre}`;
}

function TutoresFamilias({ readOnly = false }) {
  const { aniosLectivos, inscripciones, cursos, cursosObj, estudiantes, padresTutores: lista, refreshData } = useData();
  const toast = useToast();
  const [modo, setModo] = useState(readOnly ? 'vista' : '');
  const [form, setForm] = useState(formVacio);
  const [seleccionado, setSeleccionado] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [programando, setProgramando] = useState(null);
  const [progForm, setProgForm] = useState({ fecha_deshabilitacion_programada: '', fecha_habilitacion_programada: '' });
  const [anioEstudiante, setAnioEstudiante] = useState('');
  const [cursoEstudiante, setCursoEstudiante] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [mostrarAgregarRol, setMostrarAgregarRol] = useState(false);
  const [guardandoAgregarRol, setGuardandoAgregarRol] = useState(false);
  const [mostrarQuitarRol, setMostrarQuitarRol] = useState(false);
  const [quitandoRol, setQuitandoRol] = useState(false);
  const [personasConRol, setPersonasConRol] = useState([]);

  const [personasParaAgregarRol, setPersonasParaAgregarRol] = useState([]);
  const [cargandoPersonasSinRol, setCargandoPersonasSinRol] = useState(false);

  const cargarPersonasSinRol = async () => {
    setCargandoPersonasSinRol(true);
    try {
      const data = await getUsuariosSinRol('familia');
      setPersonasParaAgregarRol(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(mensajeError(err));
    } finally {
      setCargandoPersonasSinRol(false);
    }
  };

  useEffect(() => {
    cargarPersonasSinRol();
  }, []);

  const tutorSel = lista.find((t) => String(t.id_tutor) === seleccionado);

  const listaFiltrada = useMemo(() => {
    if (!searchTerm) return lista;
    const q = normalize(searchTerm);
    return lista.filter((t) => {
      if (
        normalize(t.nombre).includes(q) ||
        normalize(t.apellido).includes(q) ||
        normalize(`${t.nombre} ${t.apellido}`).includes(q) ||
        normalize(cleanDNI(t.dni)).includes(q) ||
        normalize(t.usuario).includes(q)
      ) {
        return true;
      }
      return (t.estudiantes || []).some(
        (al) =>
          normalize(al.nombre).includes(q) ||
          normalize(al.apellido).includes(q) ||
          normalize(`${al.nombre} ${al.apellido}`).includes(q),
      );
    });
  }, [lista, searchTerm]);

  const cerrarFormulario = () => {
    setModo(readOnly ? 'vista' : '');
    setSeleccionado('');
    setForm(formVacio);
    setAnioEstudiante('');
    setCursoEstudiante('');
  };

  const abrirCrear = () => {
    setModo('crear');
    setSeleccionado('');
    setForm(formVacio);
    setAnioEstudiante('');
    setCursoEstudiante('');
  };

  const abrirEditar = (t) => {
    setModo('modificar');
    setSeleccionado(String(t.id_tutor));
    setForm({
      usuario_nombre: t.usuario || '',
      contrasena: '',
      estado: t.usuario_estado !== false,
      fecha_deshabilitacion_programada: toInputDateTime(t.usuario_fecha_deshabilitacion_programada),
      fecha_habilitacion_programada: toInputDateTime(t.usuario_fecha_habilitacion_programada),
      dni: t.dni,
      nombre: t.nombre,
      apellido: t.apellido,
      correo: t.correo || '',
      tipo: t.tipo || '',
      telefono: t.telefono || '',
      direccion: t.direccion || '',
      alumnos_ids: (t.estudiantes || []).map((a) => a.id_alumno),
    });
    setMensaje('');
  };

  const handleGuardar = async () => {
    setGuardando(true);
    setMensaje('');
    try {
      if (modo === 'crear') {
        if (!form.usuario_nombre || !form.contrasena) {
          toast.warning('Completá usuario y contraseña.');
          setGuardando(false);
          return;
        }
        if (!form.dni || !form.nombre || !form.apellido) {
          toast.warning('Completá DNI, nombre y apellido.');
          setGuardando(false);
          return;
        }
        const tutorPayload = {
          estado: form.estado,
          dni: form.dni,
          nombre: form.nombre,
          apellido: form.apellido,
          correo: form.correo || null,
          tipo: form.tipo || null,
          telefono: form.telefono || null,
          direccion: form.direccion || null,
          alumnos_ids: form.alumnos_ids,
          usuario_nombre: form.usuario_nombre,
          contrasena: form.contrasena,
          fecha_deshabilitacion_programada: form.fecha_deshabilitacion_programada || null,
          fecha_habilitacion_programada: form.fecha_habilitacion_programada || null,
        };
        await createPadreTutor(tutorPayload);
        toast.success('Tutor creado correctamente.');
        cerrarFormulario();
      } else if (modo === 'modificar') {
        if (!seleccionado) {
          toast.warning('Seleccioná un tutor para modificar.');
          setGuardando(false);
          return;
        }
        await updatePadreTutor(seleccionado, {
          usuario_nombre: form.usuario_nombre || undefined,
          contrasena: form.contrasena || undefined,
          estado: form.estado,
          fecha_deshabilitacion_programada: form.fecha_deshabilitacion_programada || null,
          fecha_habilitacion_programada: form.fecha_habilitacion_programada || null,
          dni: form.dni,
          nombre: form.nombre,
          apellido: form.apellido,
          correo: form.correo || null,
          tipo: form.tipo || null,
          telefono: form.telefono || null,
          direccion: form.direccion || null,
          alumnos_ids: form.alumnos_ids,
        });
        toast.success('Tutor actualizado correctamente.');
        cerrarFormulario();
      }
      await refreshData();
    } catch (err) {
      toast.error(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  };

  const eliminarTutor = async (t) => {
    await confirmarEliminacion('¿Estás seguro de que querés eliminar este tutor?\n\nEsta acción no se puede deshacer.', {
      onConfirm: async () => {
        setGuardando(true);
        setMensaje('');
        try {
          await deletePadreTutor(t.id_tutor);
          toast.success('Tutor eliminado correctamente.');
          await refreshData();
        } catch (err) {
          toast.error(mensajeError(err));
        } finally {
          setGuardando(false);
        }
      },
    });
  };

  const handleAgregarRol = async ({ persona, asignaciones }) => {
    setGuardandoAgregarRol(true);
    try {
      await createPadreTutor({
        id_usuario_existente: Number(persona.id_usuario ?? persona.id),
        dni: persona.dni || '',
        nombre: persona.nombre || '',
        apellido: persona.apellido || '',
        correo: persona.correo || null,
        telefono: persona.telefono || null,
        tipo: 'Tutor',
        direccion: null,
        alumnos_ids: asignaciones.alumnos_ids || [],
      });
      toast.success('Rol "Tutor" asignado correctamente.');
      setMostrarAgregarRol(false);
      await refreshData();
      await cargarPersonasSinRol();
    } catch (err) {
      toast.error(mensajeError(err));
    } finally {
      setGuardandoAgregarRol(false);
    }
  };

  const fetchEstudiantesParaTutor = async () => {
    try {
      const data = await getEstudiantes({ estado: '1' });
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('Error al cargar estudiantes:', err);
      return [];
    }
  };

  const cargarPersonasConRol = async () => {
    try {
      const data = await getUsuariosConRol('familia');
      setPersonasConRol(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(mensajeError(err));
    }
  };

  const handleQuitarRol = async (persona) => {
    setQuitandoRol(true);
    try {
      await quitarRolUsuario(Number(persona.id_usuario), 'familia');
      toast.success('Rol "Tutor" quitado correctamente.');
      setMostrarQuitarRol(false);
      await refreshData();
      await cargarPersonasSinRol();
    } catch (err) {
      toast.error(mensajeError(err));
    } finally {
      setQuitandoRol(false);
    }
  };

  const toggleEstado = async (t) => {
    setGuardando(true);
    setMensaje('');
    try {
      await updatePadreTutor(t.id_tutor, {
        estado: !(t.usuario_estado !== false),
      });
      toast.success(t.usuario_estado !== false ? 'Tutor deshabilitado correctamente.' : 'Tutor habilitado correctamente.');
      await refreshData();
    } catch (err) {
      toast.error(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  };

  const abrirProgramar = (t) => {
    setProgramando(t.id_tutor);
    setProgForm({
      fecha_deshabilitacion_programada: toInputDateTime(t.usuario_fecha_deshabilitacion_programada),
      fecha_habilitacion_programada: toInputDateTime(t.usuario_fecha_habilitacion_programada),
    });
  };

  const cerrarProgramar = () => {
    setProgramando(null);
    setMensaje('');
  };

  const guardarProgramar = async () => {
    if (!programando) return;
    const deshab = progForm.fecha_deshabilitacion_programada;
    const hab = progForm.fecha_habilitacion_programada;
    if (deshab && hab && new Date(hab) > new Date(deshab)) {
      toast.warning('La fecha de habilitación no puede ser posterior a la fecha de deshabilitación.');
      return;
    }
    setGuardando(true);
    setMensaje('');
    try {
      await updatePadreTutor(programando, {
        fecha_deshabilitacion_programada: deshab || null,
        fecha_habilitacion_programada: hab || null,
      });
      toast.success('Fechas actualizadas correctamente.');
      setProgramando(null);
      await refreshData();
    } catch (err) {
      toast.error(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  };

  const limpiarProgramar = async () => {
    if (!programando) return;
    await confirmarEliminacion('¿Desea eliminar todas las fechas programadas para este usuario?\n\nEsta acción no se puede deshacer.', {
      onConfirm: async () => {
        setGuardando(true);
        setMensaje('');
        try {
          await updatePadreTutor(programando, {
            fecha_deshabilitacion_programada: null,
            fecha_habilitacion_programada: null,
          });
          toast.success('Fechas eliminadas correctamente.');
          setProgramando(null);
          await refreshData();
        } catch (err) {
          toast.error(mensajeError(err));
        } finally {
          setGuardando(false);
        }
      },
    });
  };

  const renderTablaVista = () => (
    <>
      {!readOnly && <AccionesLeyenda acciones={['editar', 'programar', 'habilitar', 'deshabilitar', 'eliminar']} />}
      <div className="table-responsive">
        <table>
        <thead>
          <tr>
            <th>Nombre y Apellido</th>
            <th>DNI</th>
            <th>Teléfono</th>
            <th>Email</th>
            <th>Tipo</th>
            <th>Estudiantes asignados</th>
            <th>Estado</th>
            {!readOnly && <th>Próxima acción</th>}
            {!readOnly && <th>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {listaFiltrada.length === 0 ? (
            <tr>
              <td colSpan={readOnly ? 7 : 9} className="empty-state-message">
                {searchTerm
                  ? 'No se encontraron tutores con ese criterio.'
                  : 'No hay tutores registrados.'}
              </td>
            </tr>
          ) : (
            listaFiltrada.map((t) => {
              const puedeCambiarEstado = t.usuario_estado !== null && t.usuario_estado !== undefined;
              const estudiantesAsignados = t.estudiantes || [];
              return [
                <tr key={t.id_tutor}>
                  <td className="table-cell-strong">{nombreTutor(t)}</td>
                  <td><strong>{formatDNI(t.dni)}</strong></td>
                  <td>{t.telefono || '---'}</td>
                  <td>{t.correo || '---'}</td>
                  <td>{t.tipo || '---'}</td>
                  <td>
                    {estudiantesAsignados.length === 0 ? (
                      <span style={{ color: '#888' }}>Sin estudiantes</span>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {estudiantesAsignados.map((al) => (
                          <span key={al.id_alumno} className="badge badge-neutral">
                            {al.apellido}, {al.nombre}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${t.usuario_estado === false ? 'badge-danger' : t.usuario_estado !== null && t.usuario_estado !== undefined ? 'badge-success' : 'badge-neutral'}`}>
                      {estadoLabel(t.usuario_estado)}
                    </span>
                  </td>
                  {!readOnly && <td>{proximaAccion(t)}</td>}
                  {!readOnly && (
                    <td className="acciones-cell" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', justifyItems: 'center' }}>
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => abrirEditar(t)}
                        title="Editar"
                      >
                        <i className="fas fa-edit" aria-hidden="true" />
                      </button>
                      {puedeCambiarEstado && (
                        <button
                          type="button"
                          className={`btn btn-sm ${t.usuario_estado === false ? 'btn-success' : 'btn-warning'}`}
                          onClick={() => toggleEstado(t)}
                          title={t.usuario_estado === false ? 'Habilitar' : 'Deshabilitar'}
                          disabled={guardando}
                        >
                          <i className={`fas ${t.usuario_estado === false ? 'fa-check' : 'fa-ban'}`} aria-hidden="true" />
                        </button>
                      )}
                      <button
                        type="button"
                        className={`btn btn-sm btn-secondary${programando === t.id_tutor ? ' active' : ''}`}
                        onClick={() => abrirProgramar(t)}
                        title="Programar"
                      >
                        <i className="fas fa-calendar-alt" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => eliminarTutor(t)}
                        title="Eliminar"
                      >
                        <i className="fas fa-trash" aria-hidden="true" />
                      </button>
                    </td>
                  )}
                </tr>,
                !readOnly && programando === t.id_tutor && (
                  <tr key={t.id_tutor + '-prog'}>
                    <td colSpan={9} style={{ padding: 0 }}>
                      <div className="inline-form-container">
                        <div className="preceptor-form-row preceptor-form-row--two">
                          <div className="form-group-filter">
                            <label>Fecha deshabilitación programada</label>
                            <input
                              type="datetime-local"
                              value={progForm.fecha_deshabilitacion_programada}
                              onChange={(e) => setProgForm((p) => ({ ...p, fecha_deshabilitacion_programada: e.target.value }))}
                            />
                          </div>
                          <div className="form-group-filter">
                            <label>Fecha habilitación programada</label>
                            <input
                              type="datetime-local"
                              value={progForm.fecha_habilitacion_programada}
                              onChange={(e) => setProgForm((p) => ({ ...p, fecha_habilitacion_programada: e.target.value }))}
                            />
                          </div>
                        </div>
                        <div className="flex-row flex-gap-16 mt-16">
                          <button type="button" className="btn btn-primary" onClick={guardarProgramar} disabled={guardando}>
                            {guardando ? 'Guardando...' : 'Guardar'}
                          </button>
                          <button type="button" className="btn btn-danger" onClick={limpiarProgramar} disabled={guardando}>
                            Limpiar
                          </button>
                          <button type="button" className="btn btn-secondary" onClick={cerrarProgramar}>
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ),
              ];
            })
          )}
        </tbody>
      </table>
    </div>
    </>
  );

  const tituloModal = modo === 'crear' ? 'Crear tutor' : 'Modificar tutor';

  const renderFormTutor = () => (
    <div style={{ maxWidth: 760 }} className="preceptor-form-grid">
      <div className="form-group-filter preceptor-form-full">
        <label htmlFor="tut-usuario">Usuario</label>
        <input
          id="tut-usuario"
          type="text"
          value={form.usuario_nombre}
          onChange={(e) => setForm((p) => ({ ...p, usuario_nombre: e.target.value }))}
          required
        />
      </div>
      <div className="form-group-filter">
        <label htmlFor="tut-contrasena">Contraseña</label>
        <input
          id="tut-contrasena"
          type="password"
          value={form.contrasena}
          onChange={(e) => setForm((p) => ({ ...p, contrasena: e.target.value }))}
        />
      </div>
      <div className="form-group-filter">
        <label>Estado</label>
        <label htmlFor="tut-estado" className="preceptor-status-toggle">
          <input
            id="tut-estado"
            type="checkbox"
            checked={form.estado}
            onChange={(e) => setForm((p) => ({ ...p, estado: e.target.checked }))}
          />
          <span>{estadoLabel(form.estado)}</span>
        </label>
      </div>
      <div className="form-group-filter">
        <label htmlFor="tut-fecha-deshabilitacion">Fecha deshabilitación programada</label>
        <input
          id="tut-fecha-deshabilitacion"
          type="datetime-local"
          value={form.fecha_deshabilitacion_programada}
          onChange={(e) => setForm((p) => ({ ...p, fecha_deshabilitacion_programada: e.target.value }))}
        />
      </div>
      <div className="form-group-filter">
        <label htmlFor="tut-fecha-habilitacion">Fecha habilitación programada</label>
        <input
          id="tut-fecha-habilitacion"
          type="datetime-local"
          value={form.fecha_habilitacion_programada}
          onChange={(e) => setForm((p) => ({ ...p, fecha_habilitacion_programada: e.target.value }))}
        />
      </div>
      <div className="form-group-filter preceptor-form-full">
        <label htmlFor="tut-dni">DNI</label>
        <input
          id="tut-dni"
          type="text"
          value={form.dni}
          onChange={(e) => setForm((p) => ({ ...p, dni: formatDNI(e.target.value) }))}
        />
      </div>
      <div className="form-group-filter">
        <label htmlFor="tut-nombre">Nombre</label>
        <input
          id="tut-nombre"
          type="text"
          value={form.nombre}
          onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
        />
      </div>
      <div className="form-group-filter">
        <label htmlFor="tut-apellido">Apellido</label>
        <input
          id="tut-apellido"
          type="text"
          value={form.apellido}
          onChange={(e) => setForm((p) => ({ ...p, apellido: e.target.value }))}
        />
      </div>
      <div className="form-group-filter">
        <label htmlFor="tut-tipo">Tipo de tutor</label>
        <select
          id="tut-tipo"
          value={form.tipo}
          onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value }))}
        >
          <option value="">Seleccione...</option>
          {TIPOS_TUTOR.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group-filter">
        <label htmlFor="tut-correo">Correo</label>
        <input
          id="tut-correo"
          type="email"
          value={form.correo}
          onChange={(e) => setForm((p) => ({ ...p, correo: e.target.value }))}
        />
      </div>
      <div className="form-group-filter">
        <label htmlFor="tut-telefono">Teléfono</label>
        <input
          id="tut-telefono"
          type="text"
          value={form.telefono}
          onChange={(e) => setForm((p) => ({ ...p, telefono: e.target.value }))}
        />
      </div>
      <div className="form-group-filter">
        <label htmlFor="tut-direccion">Dirección</label>
        <input
          id="tut-direccion"
          type="text"
          value={form.direccion}
          onChange={(e) => setForm((p) => ({ ...p, direccion: e.target.value }))}
        />
      </div>
      <div className="preceptor-form-full">
        <TutoresEstudiantesEditor
          anioEstudiante={anioEstudiante}
          setAnioEstudiante={setAnioEstudiante}
          cursoEstudiante={cursoEstudiante}
          setCursoEstudiante={setCursoEstudiante}
          alumnos_ids={form.alumnos_ids}
          setEstudiantesIds={(ids) => setForm((p) => ({ ...p, alumnos_ids: ids }))}
          idPrefix="tut"
        />
      </div>
    </div>
  );

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3><i className="fas fa-user-shield" aria-hidden="true" /> Tutores/familias</h3>
        {!readOnly && (
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
              <i className="fas fa-plus" aria-hidden="true" /> Nuevo Tutor
            </button>
          </div>
        )}
      </div>

      <div className="mb-12">
        <input
          type="text"
          placeholder="Buscar por nombre, apellido, DNI, usuario o estudiante..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {mensaje && (
        <p style={{ color: mensaje.startsWith('Error') ? 'red' : 'green', margin: '8px 0' }}>
          {mensaje}
        </p>
      )}

      {renderTablaVista()}

      {(modo === 'crear' || (modo === 'modificar' && seleccionado)) && (
        <FormModal title={tituloModal} onClose={cerrarFormulario} error={mensaje && mensaje.startsWith('Error') ? mensaje : null} onClearError={() => setMensaje('')}>
          <div className="standard-modal-body" style={{ display: 'grid', gap: '14px' }}>
            {renderFormTutor()}
          </div>
          <div className="standard-modal-footer">
            <button type="button" className="btn btn-secondary" onClick={cerrarFormulario}>
              Cancelar
            </button>
            <button type="button" className="btn btn-primary" onClick={handleGuardar} disabled={guardando}>
              <i className="fas fa-save" aria-hidden="true" /> {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </FormModal>
      )}

      {mostrarAgregarRol && (
        <AgregarRolModal
          titulo="Agregar rol: tutor"
          subtitulo="Seleccioná una persona existente para asignarle el rol. Se reutilizará su mismo usuario: no se crean usuarios y no se sobrescriben roles."
          personas={personasParaAgregarRol}
          onClose={() => setMostrarAgregarRol(false)}
          onAgregar={handleAgregarRol}
          guardando={guardandoAgregarRol}
          rol="familia"
          fetchAssignmentsFn={fetchEstudiantesParaTutor}
        />
      )}

      {mostrarQuitarRol && (
        <QuitarRolModal
          titulo="Quitar rol: tutor"
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

export default TutoresFamilias;