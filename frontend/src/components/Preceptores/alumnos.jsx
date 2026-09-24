import { useState, Fragment, useMemo } from 'react';
import { formatDNI, cleanDNI } from '../../utils/dni';
import { useData } from '../../context/DataContext';
import { createAlumno, updateAlumno, deleteAlumno } from '../../services/api';
import FiltrosAnioCurso from '../Shared/FiltrosAnioCurso';
import EmptyFiltros from './EmptyFiltros';
import FormModal from '../../components/Shared/FormModal';
import AccionesLeyenda from '../../components/Shared/AccionesLeyenda';
import { alumnosPorAnioYCurso, cursosPorAnio, filtrosCompletos } from './preceptorUtils';
import confirmarEliminacion from '../../utils/confirmarEliminacion';
import { useToast } from '../../context/ToastContext';
import { mensajeErrorAmigable } from '../../utils/errores';

const formVacio = {
  usuario_nombre: '',
  contrasena: '',
  estado: true,
  fecha_deshabilitacion_programada: '',
  fecha_habilitacion_programada: '',
  dni: '',
  nombre: '',
  apellido: '',
  direccion: '',
  telefono: '',
  fechaNacimiento: '',
  anioLectivo: '',
  curso: '',
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

function proximaAccion(usuario) {
  if (usuario.usuario_estado === null || usuario.usuario_estado === undefined) return '---';
  if (usuario.usuario_estado && usuario.usuario_fecha_deshabilitacion_programada) {
    return `Deshabilitar el ${formatDateTime(usuario.usuario_fecha_deshabilitacion_programada)}`;
  }
  if (!usuario.usuario_estado && usuario.usuario_fecha_habilitacion_programada) {
    return `Habilitar el ${formatDateTime(usuario.usuario_fecha_habilitacion_programada)}`;
  }
  if (usuario.usuario_fecha_deshabilitacion_programada) {
    return `Deshabilitar el ${formatDateTime(usuario.usuario_fecha_deshabilitacion_programada)}`;
  }
  if (usuario.usuario_fecha_habilitacion_programada) {
    return `Habilitar el ${formatDateTime(usuario.usuario_fecha_habilitacion_programada)}`;
  }
  return '---';
}

function mensajeError(err) {
  return mensajeErrorAmigable(err);
}

function Alumnos({ readOnly = false, preceptorCursos = [], anioLectivo: anioGlobal, curso: cursoGlobal, onAnioChange, onCursoChange }) {
  const { aniosLectivos, inscripciones, cursos, alumnos, nombreCompleto, cursosObj, refreshData } = useData();
  const toast = useToast();
  const [modo, setModo] = useState(readOnly ? 'vista' : '');
  const [anioLectivoLocal, setAnioLectivoLocal] = useState('');
  const [cursoLocal, setCursoLocal] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState(formVacio);
  const [seleccionado, setSeleccionado] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [programando, setProgramando] = useState(null);
  const [progForm, setProgForm] = useState({ fecha_deshabilitacion_programada: '', fecha_habilitacion_programada: '' });

  const esControlado =
    anioGlobal !== undefined &&
    typeof onAnioChange === 'function' &&
    typeof onCursoChange === 'function';
  const anioLectivo = esControlado ? anioGlobal : anioLectivoLocal;
  const curso = esControlado ? cursoGlobal : cursoLocal;
  const setAnioLectivo = esControlado ? onAnioChange : setAnioLectivoLocal;
  const setCurso = esControlado ? onCursoChange : setCursoLocal;

  const esPreceptor = preceptorCursos && preceptorCursos.length > 0;
  const cursosPermitidos = esPreceptor ? preceptorCursos : [];

  const lista = alumnosPorAnioYCurso(anioLectivo, curso, inscripciones, alumnos, cursosPermitidos);
  const alumnoSel = lista.find((a) => String(a.id) === seleccionado);
  const filtrosOk = filtrosCompletos(anioLectivo, curso);
  const cursosCrear = cursosPorAnio(form.anioLectivo, inscripciones, cursos, cursosObj, cursosPermitidos);

  const listaFiltrada = useMemo(() => {
    if (!searchTerm) return lista;
    const q = normalize(searchTerm);
    return lista.filter(
      (a) =>
        normalize(a.nombre).includes(q) ||
        normalize(a.apellido).includes(q) ||
        normalize(`${a.nombre} ${a.apellido}`).includes(q) ||
        normalize(cleanDNI(a.dni)).includes(q) ||
        normalize(a.usuario).includes(q),
    );
  }, [lista, searchTerm]);

  const cerrarFormulario = () => {
    setModo('');
    setSeleccionado('');
    setForm(formVacio);
    setMensaje('');
  };

  const abrirCrear = () => {
    setModo('crear');
    setSeleccionado('');
    setForm(formVacio);
    setMensaje('');
  };

  const abrirEditar = (alumno) => {
    setModo('modificar');
    setSeleccionado(String(alumno.id));
    setForm({
      usuario_nombre: alumno.usuario || '',
      contrasena: '',
      estado: alumno.usuario_estado !== false,
      fecha_deshabilitacion_programada: toInputDateTime(alumno.usuario_fecha_deshabilitacion_programada),
      fecha_habilitacion_programada: toInputDateTime(alumno.usuario_fecha_habilitacion_programada),
      dni: alumno.dni,
      nombre: alumno.nombre,
      apellido: alumno.apellido,
      direccion: alumno.direccion || '',
      telefono: alumno.telefono || '',
      fechaNacimiento: alumno.fecha_nacimiento || '',
    });
    setMensaje('');
  };

  const handleAnioFiltro = (nuevoAnio) => {
    setAnioLectivo(nuevoAnio);
    setCurso('');
    setSeleccionado('');
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
        const cursoObj = cursosObj.find((c) => c.nombre_curso === form.curso);
        const alumnoPayload = {
          estado: form.estado,
          dni: form.dni,
          nombre: form.nombre,
          apellido: form.apellido,
          direccion: form.direccion || null,
          fecha_nacimiento: form.fechaNacimiento || null,
          telefono: form.telefono || null,
          id_curso: cursoObj?.id_curso || null,
          usuario_nombre: form.usuario_nombre,
          contrasena: form.contrasena,
          fecha_deshabilitacion_programada: form.fecha_deshabilitacion_programada || null,
          fecha_habilitacion_programada: form.fecha_habilitacion_programada || null,
        };
        await createAlumno(alumnoPayload);
        toast.success('Estudiante creado correctamente.');
        cerrarFormulario();
      } else if (modo === 'modificar') {
        if (!seleccionado) {
          toast.warning('Seleccioná un estudiante para modificar.');
          setGuardando(false);
          return;
        }
        await updateAlumno(seleccionado, {
          usuario_nombre: form.usuario_nombre || undefined,
          contrasena: form.contrasena || undefined,
          estado: form.estado,
          fecha_deshabilitacion_programada: form.fecha_deshabilitacion_programada || null,
          fecha_habilitacion_programada: form.fecha_habilitacion_programada || null,
          dni: form.dni,
          nombre: form.nombre,
          apellido: form.apellido,
          direccion: form.direccion || null,
          fecha_nacimiento: form.fechaNacimiento || null,
          telefono: form.telefono || null,
        });
        toast.success('Estudiante actualizado correctamente.');
        cerrarFormulario();
      }
      await refreshData();
    } catch (err) {
      toast.error(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  };

  const eliminarAlumno = async (alumno) => {
    await confirmarEliminacion('¿Estás seguro de que querés eliminar este estudiante?\n\nEsta acción no se puede deshacer.', {
      onConfirm: async () => {
        setGuardando(true);
        setMensaje('');
        try {
          await deleteAlumno(alumno.id);
          toast.success('Alumno eliminado correctamente.');
          await refreshData();
        } catch (err) {
          toast.error(mensajeError(err));
        } finally {
          setGuardando(false);
        }
      },
    });
  };

  const toggleEstado = async (alumno) => {
    setGuardando(true);
    setMensaje('');
    try {
      await updateAlumno(alumno.id, {
        estado: !(alumno.usuario_estado !== false),
      });
      toast.success(alumno.usuario_estado !== false ? 'Estudiante deshabilitado correctamente.' : 'Estudiante habilitado correctamente.');
      await refreshData();
    } catch (err) {
      toast.error(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  };

  const abrirProgramar = (alumno) => {
    setProgramando(alumno.id);
    setProgForm({
      fecha_deshabilitacion_programada: toInputDateTime(alumno.usuario_fecha_deshabilitacion_programada),
      fecha_habilitacion_programada: toInputDateTime(alumno.usuario_fecha_habilitacion_programada),
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
      await updateAlumno(programando, {
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
          await updateAlumno(programando, {
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

  const renderFormCrear = () => (
    <div className="preceptor-form-grid" style={{ maxWidth: 720 }}>
      <div className="form-group-filter preceptor-form-full">
        <label htmlFor="alumno-usuario">Usuario</label>
        <input
          id="alumno-usuario"
          type="text"
          value={form.usuario_nombre}
          onChange={(e) => setForm((p) => ({ ...p, usuario_nombre: e.target.value }))}
          required
        />
      </div>
      <div className="form-group-filter">
        <label htmlFor="alumno-contrasena">Contraseña</label>
        <input
          id="alumno-contrasena"
          type="password"
          value={form.contrasena}
          onChange={(e) => setForm((p) => ({ ...p, contrasena: e.target.value }))}
          required
        />
      </div>
      <div className="form-group-filter">
        <label>Estado</label>
        <label htmlFor="alumno-estado" className="preceptor-status-toggle">
          <input
            id="alumno-estado"
            type="checkbox"
            checked={form.estado}
            onChange={(e) => setForm((p) => ({ ...p, estado: e.target.checked }))}
          />
          <span>{estadoLabel(form.estado)}</span>
        </label>
      </div>
      <div className="form-group-filter">
        <label htmlFor="alumno-fecha-deshabilitacion">Fecha deshabilitación programada</label>
        <input
          id="alumno-fecha-deshabilitacion"
          type="datetime-local"
          value={form.fecha_deshabilitacion_programada}
          onChange={(e) => setForm((p) => ({ ...p, fecha_deshabilitacion_programada: e.target.value }))}
        />
      </div>
      <div className="form-group-filter">
        <label htmlFor="alumno-fecha-habilitacion">Fecha habilitación programada</label>
        <input
          id="alumno-fecha-habilitacion"
          type="datetime-local"
          value={form.fecha_habilitacion_programada}
          onChange={(e) => setForm((p) => ({ ...p, fecha_habilitacion_programada: e.target.value }))}
        />
      </div>
      <div className="form-group-filter preceptor-form-full">
        <p className="preceptor-section-title" style={{ margin: '8px 0 0' }}>
          Datos personales
        </p>
      </div>
      <div className="form-group-filter preceptor-form-full">
        <label htmlFor="alumno-dni">DNI</label>
        <input
          id="alumno-dni"
          type="text"
          value={form.dni}
          onChange={(e) => setForm((p) => ({ ...p, dni: formatDNI(e.target.value) }))}
        />
      </div>
      <div className="form-group-filter">
        <label htmlFor="alumno-nombre">Nombre</label>
        <input
          id="alumno-nombre"
          type="text"
          value={form.nombre}
          onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
        />
      </div>
      <div className="form-group-filter">
        <label htmlFor="alumno-apellido">Apellido</label>
        <input
          id="alumno-apellido"
          type="text"
          value={form.apellido}
          onChange={(e) => setForm((p) => ({ ...p, apellido: e.target.value }))}
        />
      </div>
      <div className="form-group-filter preceptor-form-full">
        <p className="preceptor-section-title" style={{ margin: '8px 0 0' }}>
          Inscripción
        </p>
      </div>
      <div className="form-group-filter">
        <label htmlFor="alumno-anio-crear">Año lectivo</label>
        <select
          id="alumno-anio-crear"
          value={form.anioLectivo}
          onChange={(e) =>
            setForm((p) => ({ ...p, anioLectivo: e.target.value, curso: '' }))
          }
        >
          <option value="">Seleccionar año...</option>
          {aniosLectivos.map((anio) => (
            <option key={anio} value={anio}>
              {anio}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group-filter">
        <label htmlFor="alumno-curso-crear">Curso</label>
        <select
          id="alumno-curso-crear"
          value={form.curso}
          onChange={(e) => setForm((p) => ({ ...p, curso: e.target.value }))}
          disabled={!form.anioLectivo}
        >
          <option value="">Seleccionar curso...</option>
          {cursosCrear.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  const renderFormModificar = () => (
    <div className="preceptor-form-grid" style={{ maxWidth: 720 }}>
      <div className="form-group-filter preceptor-form-full">
        <label htmlFor="alumno-usuario-mod">Usuario</label>
        <input
          id="alumno-usuario-mod"
          type="text"
          value={form.usuario_nombre}
          onChange={(e) => setForm((p) => ({ ...p, usuario_nombre: e.target.value }))}
          required
        />
      </div>
      <div className="form-group-filter">
        <label htmlFor="alumno-contrasena-mod">Contraseña {alumnoSel?.usuario ? '(dejar en blanco para mantener)' : ''}</label>
        <input
          id="alumno-contrasena-mod"
          type="password"
          value={form.contrasena}
          onChange={(e) => setForm((p) => ({ ...p, contrasena: e.target.value }))}
        />
      </div>
      <div className="form-group-filter">
        <label>Estado</label>
        <label htmlFor="alumno-estado-mod" className="preceptor-status-toggle">
          <input
            id="alumno-estado-mod"
            type="checkbox"
            checked={form.estado}
            onChange={(e) => setForm((p) => ({ ...p, estado: e.target.checked }))}
          />
          <span>{estadoLabel(form.estado)}</span>
        </label>
      </div>
      <div className="form-group-filter">
        <label htmlFor="alumno-fecha-deshabilitacion-mod">Fecha deshabilitación programada</label>
        <input
          id="alumno-fecha-deshabilitacion-mod"
          type="datetime-local"
          value={form.fecha_deshabilitacion_programada}
          onChange={(e) => setForm((p) => ({ ...p, fecha_deshabilitacion_programada: e.target.value }))}
        />
      </div>
      <div className="form-group-filter">
        <label htmlFor="alumno-fecha-habilitacion-mod">Fecha habilitación programada</label>
        <input
          id="alumno-fecha-habilitacion-mod"
          type="datetime-local"
          value={form.fecha_habilitacion_programada}
          onChange={(e) => setForm((p) => ({ ...p, fecha_habilitacion_programada: e.target.value }))}
        />
      </div>
      <div className="form-group-filter preceptor-form-full">
        <label htmlFor="alumno-dni-mod">DNI</label>
        <input
          id="alumno-dni-mod"
          type="text"
          value={form.dni}
          onChange={(e) => setForm((p) => ({ ...p, dni: formatDNI(e.target.value) }))}
        />
      </div>
      <div className="form-group-filter">
        <label htmlFor="alumno-nombre-mod">Nombre</label>
        <input
          id="alumno-nombre-mod"
          type="text"
          value={form.nombre}
          onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
        />
      </div>
      <div className="form-group-filter">
        <label htmlFor="alumno-apellido-mod">Apellido</label>
        <input
          id="alumno-apellido-mod"
          type="text"
          value={form.apellido}
          onChange={(e) => setForm((p) => ({ ...p, apellido: e.target.value }))}
        />
      </div>
      <div className="form-group-filter preceptor-form-full">
        <p className="preceptor-section-title" style={{ margin: '8px 0 0' }}>
          Datos personales
        </p>
      </div>
      <div className="form-group-filter">
        <label htmlFor="alumno-telefono-mod">Teléfono</label>
        <input
          id="alumno-telefono-mod"
          type="text"
          value={form.telefono}
          onChange={(e) => setForm((p) => ({ ...p, telefono: e.target.value }))}
        />
      </div>
      <div className="form-group-filter">
        <label htmlFor="alumno-fecha-nac-mod">Fecha de Nacimiento</label>
        <input
          id="alumno-fecha-nac-mod"
          type="date"
          value={form.fechaNacimiento}
          onChange={(e) => setForm((p) => ({ ...p, fechaNacimiento: e.target.value }))}
        />
      </div>
    </div>
  );

  const renderTabla = () => (
    <>
      {!readOnly && <AccionesLeyenda acciones={['editar', 'programar', 'habilitar', 'deshabilitar', 'eliminar']} />}
      <div className="table-responsive">
        <table>
        <thead>
          <tr>
            <th>DNI</th>
            <th>Nombre Completo</th>
            <th>Usuario</th>
            <th>Estado</th>
            {!readOnly && <th>Próxima acción</th>}
            {!readOnly && <th>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {listaFiltrada.length === 0 ? (
            <tr>
              <td colSpan={readOnly ? 4 : 6} className="empty-state-message">
                {searchTerm
                  ? 'No se encontraron estudiantes con ese criterio.'
                  : 'No hay alumnos inscriptos en este curso.'}
              </td>
            </tr>
          ) : (
            listaFiltrada.map((a) => {
              const puedeCambiarEstado = a.usuario_estado !== null && a.usuario_estado !== undefined;
              return [
                <tr key={a.id}>
                  <td><strong>{formatDNI(a.dni)}</strong></td>
                  <td>{nombreCompleto(a)}</td>
                  <td className="table-cell-strong">{a.usuario || 'Sin usuario'}</td>
                  <td>
                    <span className={`badge ${a.usuario_estado === false ? 'badge-danger' : a.usuario_estado !== null && a.usuario_estado !== undefined ? 'badge-success' : 'badge-neutral'}`}>
                      {estadoLabel(a.usuario_estado)}
                    </span>
                  </td>
                  {!readOnly && <td>{proximaAccion(a)}</td>}
                  {!readOnly && (
                    <td className="acciones-cell" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', justifyItems: 'center' }}>
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => abrirEditar(a)}
                        title="Editar"
                      >
                        <i className="fas fa-edit" aria-hidden="true" />
                      </button>
                      {puedeCambiarEstado && (
                        <button
                          type="button"
                          className={`btn btn-sm ${a.usuario_estado === false ? 'btn-success' : 'btn-warning'}`}
                          onClick={() => toggleEstado(a)}
                          title={a.usuario_estado === false ? 'Habilitar' : 'Deshabilitar'}
                          disabled={guardando}
                        >
                          <i className={`fas ${a.usuario_estado === false ? 'fa-check' : 'fa-ban'}`} aria-hidden="true" />
                        </button>
                      )}
                      <button
                        type="button"
                        className={`btn btn-sm btn-secondary${programando === a.id ? ' active' : ''}`}
                        onClick={() => abrirProgramar(a)}
                        title="Programar"
                      >
                        <i className="fas fa-calendar-alt" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => eliminarAlumno(a)}
                        title="Eliminar"
                      >
                        <i className="fas fa-trash" aria-hidden="true" />
                      </button>
                    </td>
                  )}
                </tr>,
                !readOnly && programando === a.id && (
                  <tr key={a.id + '-prog'}>
                    <td colSpan={6} style={{ padding: 0 }}>
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

  const tituloModal = modo === 'crear' ? 'Crear estudiante' : 'Modificar estudiante';

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3><i className="fas fa-user-graduate" aria-hidden="true" /> Estudiantes</h3>
        {!readOnly && (
          <div className="header-actions">
            <button type="button" className="btn btn-primary" onClick={abrirCrear}>
              <i className="fas fa-plus" aria-hidden="true" /> Nuevo Estudiante
            </button>
          </div>
        )}
      </div>

      {!esControlado && (
        <FiltrosAnioCurso
          anioLectivo={anioLectivo}
          curso={curso}
          onAnioChange={handleAnioFiltro}
          onCursoChange={setCurso}
        />
      )}

      {filtrosOk ? (
        <>
          <div className="mb-12">
            <input
              type="text"
              placeholder="Buscar por nombre, apellido, DNI o usuario..."
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
          {renderTabla()}
        </>
      ) : (
        <EmptyFiltros />
      )}

      {(modo === 'crear' || modo === 'modificar') && (
        <FormModal
          title={`${tituloModal}${modo === 'modificar' ? ` — ${curso} (${anioLectivo})` : ''}`}
          onClose={cerrarFormulario}
          error={mensaje && mensaje.startsWith('Error') ? mensaje : null}
          onClearError={() => setMensaje('')}
        >
          <div className="standard-modal-body" style={{ display: 'grid', gap: '14px' }}>
            {modo === 'crear' ? renderFormCrear() : renderFormModificar()}
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
    </div>
  );
}

export default Alumnos;