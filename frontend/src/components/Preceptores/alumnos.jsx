import { useState } from 'react';
import { formatDNI } from '../../utils/dni';
import { useData } from '../../context/DataContext';
import { createAlumno, updateAlumno, deleteAlumno } from '../../services/api';
import FiltrosAnioCurso from './FiltrosAnioCurso';
import EmptyFiltros from './EmptyFiltros';
import SelectorModo from './SelectorModo';
import { alumnosPorAnioYCurso, cursosPorAnio, filtrosCompletos } from './preceptorUtils';

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
  const data = err.response?.data;
  if (data && typeof data === 'object' && !data.detail) {
    return Object.entries(data)
      .map(([campo, valor]) => `${campo}: ${Array.isArray(valor) ? valor.join(', ') : valor}`)
      .join(' | ');
  }
  return data?.detail || err.message || 'Error inesperado';
}

function Alumnos() {
  const { aniosLectivos, inscripciones, cursos, alumnos, nombreCompleto, cursosObj, refreshData } = useData();
  const [modo, setModo] = useState('');
  const [anioLectivo, setAnioLectivo] = useState('');
  const [curso, setCurso] = useState('');
  const [observaciones, setObservaciones] = useState({});
  const [form, setForm] = useState(formVacio);
  const [seleccionado, setSeleccionado] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const lista = alumnosPorAnioYCurso(anioLectivo, curso, inscripciones, alumnos);
  const alumnoSel = lista.find((a) => String(a.id) === seleccionado);
  const esCrear = modo === 'crear';
  const necesitaFiltroCurso = modo && !esCrear;
  const filtrosOk = filtrosCompletos(anioLectivo, curso);
  const cursosCrear = cursosPorAnio(form.anioLectivo, inscripciones, cursos, cursosObj);

  const resetModo = (m) => {
    setModo(m);
    setSeleccionado('');
    setForm(formVacio);
    setAnioLectivo('');
    setCurso('');
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
        if (!form.usuario_nombre || !form.contrasena || !form.dni || !form.nombre || !form.apellido) {
          setMensaje('Completá usuario, contraseña, DNI, nombre y apellido.');
          setGuardando(false);
          return;
        }
        const cursoObj = cursosObj.find((c) => c.nombre_curso === form.curso);
        await createAlumno({
          usuario_nombre: form.usuario_nombre,
          contrasena: form.contrasena,
          estado: form.estado,
          fecha_deshabilitacion_programada: form.fecha_deshabilitacion_programada || null,
          fecha_habilitacion_programada: form.fecha_habilitacion_programada || null,
          dni: form.dni,
          nombre: form.nombre,
          apellido: form.apellido,
          direccion: form.direccion || null,
          fecha_nacimiento: form.fechaNacimiento || null,
          telefono: form.telefono || null,
          id_curso: cursoObj?.id_curso || null,
        });
        setMensaje('Alumno creado exitosamente.');
        setForm(formVacio);
      } else if (modo === 'modificar') {
        if (!seleccionado) {
          setMensaje('Seleccioná un alumno para modificar.');
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
        setMensaje('Alumno modificado exitosamente.');
      } else if (modo === 'borrar') {
        if (!seleccionado) {
          setMensaje('Seleccioná un alumno para eliminar.');
          setGuardando(false);
          return;
        }
        if (!confirm('¿Estás seguro de que querés eliminar este alumno?')) {
          setGuardando(false);
          return;
        }
        await deleteAlumno(seleccionado);
        setMensaje('Alumno eliminado exitosamente.');
        setSeleccionado('');
      }
      await refreshData();
    } catch (err) {
      setMensaje(`Error: ${mensajeError(err)}`);
    } finally {
      setGuardando(false);
    }
  };

  const toggleEstado = async (alumno) => {
    setGuardando(true);
    setMensaje('');
    try {
      await updateAlumno(alumno.id, {
        estado: !(alumno.usuario_estado !== false),
      });
      setMensaje(alumno.usuario_estado !== false ? 'Alumno deshabilitado correctamente.' : 'Alumno habilitado correctamente.');
      await refreshData();
    } catch (err) {
      setMensaje(`Error: ${mensajeError(err)}`);
    } finally {
      setGuardando(false);
    }
  };
  const renderContenido = () => {
    if (modo === 'vista') {
      return (
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>DNI</th>
                <th>Nombre Completo</th>
                <th>Usuario</th>
                <th>Próxima acción</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {lista.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-state-message">
                    No hay alumnos inscriptos en este curso.
                  </td>
                </tr>
              ) : (
                lista.map((a) => {
                  const puedeCambiarEstado = a.usuario_estado !== null && a.usuario_estado !== undefined;
                  return (
                    <tr key={a.id}>
                      <td>
                        <strong>{formatDNI(a.dni)}</strong>
                      </td>
                      <td>{nombreCompleto(a)}</td>
                      <td>{a.usuario || 'Sin usuario'}</td>
                      <td>{proximaAccion(a)}</td>
                      <td>
                        {puedeCambiarEstado ? (
                          <button
                            type="button"
                            className={`btn btn-sm ${a.usuario_estado === false ? 'btn-danger' : 'btn-success'}`}
                            onClick={() => toggleEstado(a)}
                            disabled={guardando}
                          >
                            <i className="fas fa-toggle-on" aria-hidden="true" />{' '}
                            {a.usuario_estado === false ? 'Deshabilitado' : 'Habilitado'}
                          </button>
                        ) : '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      );
    }

    if (esCrear) {
      return (
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
            <label htmlFor="alumno-direccion">Dirección</label>
            <input
              id="alumno-direccion"
              type="text"
              value={form.direccion}
              onChange={(e) => setForm((p) => ({ ...p, direccion: e.target.value }))}
            />
          </div>
          <div className="form-group-filter">
            <label htmlFor="alumno-telefono">Teléfono</label>
            <input
              id="alumno-telefono"
              type="text"
              value={form.telefono}
              onChange={(e) => setForm((p) => ({ ...p, telefono: e.target.value }))}
            />
          </div>
          <div className="form-group-filter">
            <label htmlFor="alumno-fecha-nac">Fecha de Nacimiento</label>
            <input
              id="alumno-fecha-nac"
              type="date"
              value={form.fechaNacimiento}
              onChange={(e) => setForm((p) => ({ ...p, fechaNacimiento: e.target.value }))}
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
    }

    if (modo === 'modificar') {
      return (
        <>
          <div className="filter-row">
            <div className="form-group-filter">
              <label htmlFor="alumno-select-mod">Alumno</label>
              <select
                id="alumno-select-mod"
                value={seleccionado}
                onChange={(e) => {
                  setSeleccionado(e.target.value);
                  const a = lista.find((al) => String(al.id) === e.target.value);
                  if (a) {
                    setForm({
                      usuario_nombre: a.usuario || '',
                      contrasena: '',
                      estado: a.usuario_estado !== false,
                      fecha_deshabilitacion_programada: toInputDateTime(a.usuario_fecha_deshabilitacion_programada),
                      fecha_habilitacion_programada: toInputDateTime(a.usuario_fecha_habilitacion_programada),
                      dni: a.dni,
                      nombre: a.nombre,
                      apellido: a.apellido,
                      direccion: a.direccion || '',
                      telefono: a.telefono || '',
                      fechaNacimiento: a.fecha_nacimiento || '',
                      anioLectivo: '',
                      curso: '',
                    });
                  }
                }}
              >
                <option value="">Seleccionar...</option>
                {lista.map((a) => (
                  <option key={a.id} value={a.id}>
                    {nombreCompleto(a)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {alumnoSel && (
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
                <label htmlFor="alumno-contrasena-mod">Contraseña {alumnoSel.usuario ? '(dejar en blanco para mantener)' : ''}</label>
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
                <label htmlFor="alumno-direccion-mod">Dirección</label>
                <input
                  id="alumno-direccion-mod"
                  type="text"
                  value={form.direccion}
                  onChange={(e) => setForm((p) => ({ ...p, direccion: e.target.value }))}
                />
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
              <div className="form-group-filter preceptor-form-full">
                <label htmlFor="alumno-obs-mod">Observaciones</label>
                <input
                  id="alumno-obs-mod"
                  type="text"
                  value={observaciones[alumnoSel.id] || ''}
                  onChange={(e) =>
                    setObservaciones((prev) => ({
                      ...prev,
                      [alumnoSel.id]: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          )}
        </>
      );
    }

    if (modo === 'borrar') {
      return (
        <div className="filter-row">
          <div className="form-group-filter">
            <label htmlFor="alumno-select-del">Alumno a eliminar</label>
            <select
              id="alumno-select-del"
              value={seleccionado}
              onChange={(e) => setSeleccionado(e.target.value)}
            >
              <option value="">Seleccionar...</option>
              {lista.map((a) => (
                <option key={a.id} value={a.id}>
                  {nombreCompleto(a)} — {formatDNI(a.dni)}
                </option>
              ))}
            </select>
          </div>
        </div>
      );
    }

    return null;
  };
  const tituloModo = {
    vista: 'Vista general',
    crear: 'Crear alumno',
    modificar: 'Modificar alumno',
    borrar: 'Borrar alumno',
  };

  return (
    <div className="card">
      <SelectorModo modo={modo} onModoChange={resetModo} titulo="Alumnos — ¿Qué deseás hacer?" />

      {modo && (
        <>
          {necesitaFiltroCurso && (
            <FiltrosAnioCurso
              anioLectivo={anioLectivo}
              curso={curso}
              onAnioChange={handleAnioFiltro}
              onCursoChange={setCurso}
            />
          )}

          {necesitaFiltroCurso && !filtrosOk ? (
            <EmptyFiltros />
          ) : (
            <>
              <div className="card-header-flex">
                <h3>
                  {tituloModo[modo]}
                  {filtrosOk && ` — ${curso} (${anioLectivo})`}
                </h3>
                {modo !== 'vista' && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleGuardar}
                    disabled={guardando}
                  >
                    <i className="fas fa-save" aria-hidden="true" />{' '}
                    {guardando ? 'Guardando...' : 'Guardar'}
                  </button>
                )}
              </div>
              {mensaje && (
                <p style={{ color: mensaje.startsWith('Error') ? 'red' : 'green', margin: '8px 0' }}>
                  {mensaje}
                </p>
              )}
              {renderContenido()}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default Alumnos;
