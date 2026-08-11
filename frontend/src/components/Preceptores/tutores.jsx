import { useState, Fragment } from 'react';
import { formatDNI } from '../../utils/dni';
import { useData } from '../../context/DataContext';
import { createPadreTutor, updatePadreTutor, deletePadreTutor } from '../../services/api';
import SelectorModo from './SelectorModo';
import FormModal from '../../components/Shared/FormModal';
import { cursosPorAnio, alumnosPorAnioYCurso, filtrosCompletos } from './preceptorUtils';
import confirmarEliminacion from '../../utils/confirmarEliminacion';
import { useToast } from '../../context/ToastContext';

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
  const data = err.response?.data;
  if (data && typeof data === 'object' && !data.detail) {
    return Object.entries(data)
      .map(([campo, valor]) => `${campo}: ${Array.isArray(valor) ? valor.join(', ') : valor}`)
      .join(' | ');
  }
  return data?.detail || err.message || 'Error inesperado';
}

function nombreTutor(t) {
  return `${t.apellido}, ${t.nombre}`;
}

function Tutores({ readOnly = false }) {
  const { aniosLectivos, inscripciones, cursos, cursosObj, alumnos, padresTutores, refreshData } = useData();
  const toast = useToast();
  const [modo, setModo] = useState(readOnly ? 'vista' : '');
  const [form, setForm] = useState(formVacio);
  const [seleccionado, setSeleccionado] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [programando, setProgramando] = useState(null);
  const [progForm, setProgForm] = useState({ fecha_deshabilitacion_programada: '', fecha_habilitacion_programada: '' });
  const [anioAlumno, setAnioAlumno] = useState('');
  const [cursoAlumno, setCursoAlumno] = useState('');

  const lista = padresTutores || [];
  const tutorSel = lista.find((t) => String(t.id_tutor) === seleccionado);
  const esCrear = modo === 'crear';

  const resetModo = (m) => {
    setModo(readOnly ? 'vista' : m);
    setSeleccionado('');
    setForm(formVacio);
    setMensaje('');
    setAnioAlumno('');
    setCursoAlumno('');
  };

  const handleGuardar = async () => {
    setGuardando(true);
    setMensaje('');
    try {
      if (modo === 'crear') {
        if (!form.usuario_nombre || !form.contrasena || !form.dni || !form.nombre || !form.apellido) {
          toast.warning('Completá usuario, contraseña, DNI, nombre y apellido.');
          setGuardando(false);
          return;
        }
        await createPadreTutor({
          usuario_nombre: form.usuario_nombre,
          contrasena: form.contrasena,
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
        toast.success('Tutor creado correctamente.');
        setForm(formVacio);
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
      } else if (modo === 'borrar') {
        if (!seleccionado) {
          toast.warning('Seleccioná un tutor para eliminar.');
          setGuardando(false);
          return;
        }
        await confirmarEliminacion('¿Estás seguro de que querés eliminar este tutor?\n\nEsta acción no se puede deshacer.', {
          onConfirm: async () => {
            await deletePadreTutor(seleccionado);
            toast.success('Tutor eliminado correctamente.');
            setSeleccionado('');
          },
        });
      }
      await refreshData();
    } catch (err) {
      toast.error(mensajeError(err));
    } finally {
      setGuardando(false);
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
    <div className="table-responsive">
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Apellido</th>
            <th>DNI</th>
            <th>Teléfono</th>
            <th>Email</th>
            <th>Tipo</th>
            <th>Alumnos asignados</th>
            {!readOnly && <th>Acción</th>}
          </tr>
        </thead>
        <tbody>
          {lista.length === 0 ? (
            <tr>
              <td colSpan={readOnly ? 7 : 8} className="empty-state-message">
                No hay tutores registrados.
              </td>
            </tr>
          ) : (
            lista.map((t) => {
              const puedeCambiarEstado = t.usuario_estado !== null && t.usuario_estado !== undefined;
              const alumnosAsignados = t.alumnos || [];
              return (
                <Fragment key={t.id_tutor}>
                  <tr>
                    <td>{t.nombre}</td>
                    <td>{t.apellido}</td>
                    <td><strong>{formatDNI(t.dni)}</strong></td>
                    <td>{t.telefono || '---'}</td>
                    <td>{t.correo || '---'}</td>
                    <td>{t.tipo || '---'}</td>
                    <td>
                      {alumnosAsignados.length === 0 ? (
                        <span style={{ color: '#888' }}>Sin alumnos</span>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {alumnosAsignados.map((al) => (
                            <span key={al.id_alumno} className="badge badge-neutral">
                              {al.apellido}, {al.nombre}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    {!readOnly && (
                      <td>
                        {puedeCambiarEstado ? (
                          <div className="flex-row--center flex-gap-16">
                            <button
                              type="button"
                              className={`btn btn-sm ${t.usuario_estado === false ? 'btn-danger' : 'btn-success'}`}
                              onClick={() => toggleEstado(t)}
                              disabled={guardando}
                            >
                              <i className="fas fa-toggle-on" aria-hidden="true" />{' '}
                              {t.usuario_estado === false ? 'Deshabilitado' : 'Habilitado'}
                            </button>
                            <button
                              type="button"
                              className={`btn btn-sm btn-secondary${programando === t.id_tutor ? ' active' : ''}`}
                              onClick={() => abrirProgramar(t)}
                              title="Programar"
                            >
                              <i className="fas fa-calendar-alt" aria-hidden="true" />
                            </button>
                          </div>
                        ) : '—'}
                      </td>
                    )}
                  </tr>
                  {!readOnly && programando === t.id_tutor && (
                    <tr>
                      <td colSpan={8} style={{ padding: 0 }}>
                        <div style={{ padding: '16px', background: 'var(--sidebar-hover)', borderRadius: 'var(--radius)', margin: '8px 0' }}>
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
                  )}
                </Fragment>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );

  const renderSelectTutor = (label) => (
    <div className="filter-row">
      <div className="form-group-filter">
        <label htmlFor="tutor-select">{label}</label>
        <select
          id="tutor-select"
          value={seleccionado}
          onChange={(e) => {
            setSeleccionado(e.target.value);
            const t = lista.find((x) => String(x.id_tutor) === e.target.value);
            if (t) {
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
                alumnos_ids: (t.alumnos || []).map((a) => a.id_alumno),
              });
            }
          }}
        >
          <option value="">Seleccionar tutor...</option>
          {lista.map((t) => (
            <option key={t.id_tutor} value={t.id_tutor}>
              {nombreTutor(t)} — {formatDNI(t.dni)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  const renderFormTutor = () => (
    <>
      <div className="preceptor-form-grid" style={{ maxWidth: 720 }}>
        <div className="form-group-filter preceptor-form-full">
          <label htmlFor="tutor-usuario">Usuario</label>
          <input
            id="tutor-usuario"
            type="text"
            value={form.usuario_nombre}
            onChange={(e) => setForm((p) => ({ ...p, usuario_nombre: e.target.value }))}
            required
          />
        </div>
        <div className="form-group-filter">
          <label htmlFor="tutor-contrasena">
            Contraseña {modo === 'modificar' && tutorSel?.usuario ? '(dejar en blanco para mantener)' : ''}
          </label>
          <input
            id="tutor-contrasena"
            type="password"
            value={form.contrasena}
            onChange={(e) => setForm((p) => ({ ...p, contrasena: e.target.value }))}
            required={modo === 'crear'}
          />
        </div>
        <div className="form-group-filter">
          <label>Estado</label>
          <label htmlFor="tutor-estado" className="preceptor-status-toggle">
            <input
              id="tutor-estado"
              type="checkbox"
              checked={form.estado}
              onChange={(e) => setForm((p) => ({ ...p, estado: e.target.checked }))}
            />
            <span>{estadoLabel(form.estado)}</span>
          </label>
        </div>
        <div className="form-group-filter">
          <label htmlFor="tutor-fecha-deshabilitacion">Fecha deshabilitación programada</label>
          <input
            id="tutor-fecha-deshabilitacion"
            type="datetime-local"
            value={form.fecha_deshabilitacion_programada}
            onChange={(e) => setForm((p) => ({ ...p, fecha_deshabilitacion_programada: e.target.value }))}
          />
        </div>
        <div className="form-group-filter">
          <label htmlFor="tutor-fecha-habilitacion">Fecha habilitación programada</label>
          <input
            id="tutor-fecha-habilitacion"
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
          <label htmlFor="tutor-dni">DNI</label>
          <input
            id="tutor-dni"
            type="text"
            value={form.dni}
            onChange={(e) => setForm((p) => ({ ...p, dni: formatDNI(e.target.value) }))}
          />
        </div>
        <div className="form-group-filter">
          <label htmlFor="tutor-nombre">Nombre</label>
          <input
            id="tutor-nombre"
            type="text"
            value={form.nombre}
            onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
          />
        </div>
        <div className="form-group-filter">
          <label htmlFor="tutor-apellido">Apellido</label>
          <input
            id="tutor-apellido"
            type="text"
            value={form.apellido}
            onChange={(e) => setForm((p) => ({ ...p, apellido: e.target.value }))}
          />
        </div>
        <div className="form-group-filter">
          <label htmlFor="tutor-tipo">Tipo</label>
          <select
            id="tutor-tipo"
            value={form.tipo}
            onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value }))}
          >
            <option value="">Seleccionar...</option>
            {TIPOS_TUTOR.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="form-group-filter">
          <label htmlFor="tutor-email">Email</label>
          <input
            id="tutor-email"
            type="email"
            value={form.correo}
            onChange={(e) => setForm((p) => ({ ...p, correo: e.target.value }))}
          />
        </div>
        <div className="form-group-filter preceptor-form-full">
          <label htmlFor="tutor-telefono">Teléfono</label>
          <input
            id="tutor-telefono"
            type="text"
            value={form.telefono}
            onChange={(e) => setForm((p) => ({ ...p, telefono: e.target.value }))}
          />
        </div>
        <div className="form-group-filter preceptor-form-full">
          <label htmlFor="tutor-direccion">Dirección</label>
          <input
            id="tutor-direccion"
            type="text"
            value={form.direccion}
            onChange={(e) => setForm((p) => ({ ...p, direccion: e.target.value }))}
          />
        </div>
      </div>

      <div className="preceptor-form-grid" style={{ maxWidth: 720 }}>
        <div className="form-group-filter preceptor-form-full">
          <p className="preceptor-section-title" style={{ margin: '8px 0 0' }}>
            Alumnos asignados
          </p>
        </div>
        <div className="form-group-filter">
          <label htmlFor="alumno-anio">Año lectivo</label>
          <select
            id="alumno-anio"
            value={anioAlumno}
            onChange={(e) => { setAnioAlumno(e.target.value); setCursoAlumno(''); }}
          >
            <option value="">Seleccionar año...</option>
            {aniosLectivos.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <div className="form-group-filter">
          <label htmlFor="alumno-curso">Curso</label>
          <select
            id="alumno-curso"
            value={cursoAlumno}
            onChange={(e) => setCursoAlumno(e.target.value)}
            disabled={!anioAlumno}
          >
            <option value="">Seleccionar curso...</option>
            {cursosPorAnio(anioAlumno, inscripciones, cursos, cursosObj).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="form-group-filter preceptor-form-full">
          {alumnos.length === 0 ? (
            <p style={{ color: '#888', margin: 0 }}>No hay alumnos disponibles.</p>
          ) : filtrosCompletos(anioAlumno, cursoAlumno) ? (() => {
            const alumnosFiltrados = alumnosPorAnioYCurso(anioAlumno, cursoAlumno, inscripciones, alumnos);
            const seleccionadosExistentes = (alumnos || []).filter((a) => form.alumnos_ids.includes(a.id) && !alumnosFiltrados.some((f) => f.id === a.id));
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 260, overflowY: 'auto', padding: '4px 0' }}>
                {seleccionadosExistentes.length > 0 && (
                  <>
                    <span style={{ fontSize: 12, color: '#888', marginBottom: 2 }}>Ya asignados (no en este curso):</span>
                    {seleccionadosExistentes.map((a) => (
                      <label
                        key={a.id}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                      >
                        <input
                          type="checkbox"
                          checked
                          onChange={() => {
                            setForm((p) => ({
                              ...p,
                              alumnos_ids: p.alumnos_ids.filter((x) => x !== a.id),
                            }));
                          }}
                        />
                        <span>{a.apellido}, {a.nombre} — {a.curso || 'Sin curso'}</span>
                      </label>
                    ))}
                    {alumnosFiltrados.length > 0 && <span style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Del curso seleccionado:</span>}
                  </>
                )}
                {alumnosFiltrados.map((a) => {
                  const aId = a.id;
                  const checked = form.alumnos_ids.includes(aId);
                  return (
                    <label
                      key={aId}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          setForm((p) => ({
                            ...p,
                            alumnos_ids: checked
                              ? p.alumnos_ids.filter((x) => x !== aId)
                              : [...p.alumnos_ids, aId],
                          }));
                        }}
                      />
                      <span>{a.apellido}, {a.nombre} — {a.curso || 'Sin curso'}</span>
                    </label>
                  );
                })}
                {alumnosFiltrados.length === 0 && seleccionadosExistentes.length === 0 && (
                  <p style={{ color: '#888', margin: 0 }}>No se encontraron alumnos en este curso.</p>
                )}
              </div>
            );
          })() : (
            <p style={{ color: '#888', margin: 0 }}>Seleccioná año y curso para ver los alumnos disponibles.</p>
          )}
        </div>
      </div>
    </>
  );

  const tituloModo = {
    vista: 'Vista general',
    crear: 'Crear tutor',
    modificar: 'Modificar tutor',
    borrar: 'Borrar tutor',
  };

  return (
    <div className="card">
      {!readOnly && <SelectorModo modo={modo} onModoChange={resetModo} titulo="Tutores — ¿Qué deseás hacer?" />}

      {modo === 'vista' && (
        <div>
          <div className="card-header-flex">
            <h3>{tituloModo.vista}</h3>
          </div>
          {mensaje && (
            <p style={{ color: mensaje.startsWith('Error') ? 'red' : 'green', margin: '8px 0' }}>
              {mensaje}
            </p>
          )}
          {renderTablaVista()}
        </div>
      )}

      {modo === 'modificar' && (
        <div>
          <div className="card-header-flex">
            <h3>{tituloModo.modificar}</h3>
          </div>
          {mensaje && (
            <p style={{ color: mensaje.startsWith('Error') ? 'red' : 'green', margin: '8px 0' }}>
              {mensaje}
            </p>
          )}
          {renderSelectTutor('Tutor a modificar')}
        </div>
      )}

      {modo === 'borrar' && (
        <div>
          <div className="card-header-flex">
            <h3>{tituloModo.borrar}</h3>
          </div>
          {mensaje && (
            <p style={{ color: mensaje.startsWith('Error') ? 'red' : 'green', margin: '8px 0' }}>
              {mensaje}
            </p>
          )}
          {renderSelectTutor('Tutor a eliminar')}
        </div>
      )}

      {(modo === 'crear' || (modo === 'modificar' && seleccionado)) && (
        <FormModal
          title={tituloModo[modo]}
          onClose={() => resetModo('')}
        >
          {mensaje && (
            <p style={{ color: mensaje.startsWith('Error') ? 'red' : 'green', margin: '0 0 8px' }}>
              {mensaje}
            </p>
          )}
          <div className="standard-modal-body" style={{ display: 'grid', gap: '14px' }}>
            {renderFormTutor()}
          </div>
          <div className="standard-modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => resetModo('')}>
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

export default Tutores;
