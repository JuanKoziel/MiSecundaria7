import { useState, useMemo, Fragment } from 'react';
import { useData } from '../../context/DataContext';
import { createDocente, updateDocente, deleteDocente, createCursoMateria, updateCursoMateria, deleteCursoMateria } from '../../services/api';
import { cursosPorAnio, docentesPorFiltros, nombreDocente } from './preceptorUtils';
import FiltrosAnioCurso from './FiltrosAnioCurso';
import EmptyFiltros from './EmptyFiltros';
import SelectorModo from './SelectorModo';
import { formatDNI } from '../../utils/dni';
import FormModal from '../../components/Shared/FormModal';
import confirmarEliminacion from '../../utils/confirmarEliminacion';
import { useToast } from '../../context/ToastContext';

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
  telefono: '',
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

function proximaAccion(docente) {
  if (docente.usuario_estado === null || docente.usuario_estado === undefined) return '---';
  if (docente.usuario_estado && docente.usuario_fecha_deshabilitacion_programada) {
    return `Deshabilitar el ${formatDateTime(docente.usuario_fecha_deshabilitacion_programada)}`;
  }
  if (!docente.usuario_estado && docente.usuario_fecha_habilitacion_programada) {
    return `Habilitar el ${formatDateTime(docente.usuario_fecha_habilitacion_programada)}`;
  }
  if (docente.usuario_fecha_deshabilitacion_programada) {
    return `Deshabilitar el ${formatDateTime(docente.usuario_fecha_deshabilitacion_programada)}`;
  }
  if (docente.usuario_fecha_habilitacion_programada) {
    return `Habilitar el ${formatDateTime(docente.usuario_fecha_habilitacion_programada)}`;
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

function nuevaAsignacion() {
  return { id: Date.now(), materia: '', anioLectivo: '', curso: '' };
}

function FiltrosDocentesVista({ anioLectivo, curso, materia, onAnio, onCurso, onMateria }) {
  const { aniosLectivos, inscripciones, cursos, materias, cursosObj } = useData();
  const cursosFiltrados = cursosPorAnio(anioLectivo, inscripciones, cursos, cursosObj);

  return (
    <div className="filter-row">
      <div className="form-group-filter">
        <label htmlFor="doc-anio">Año lectivo</label>
        <select
          id="doc-anio"
          value={anioLectivo}
          onChange={(e) => onAnio(e.target.value)}
        >
          <option value="">Todos los años</option>
          {aniosLectivos.map((anio) => (
            <option key={anio} value={anio}>
              {anio}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group-filter">
        <label htmlFor="doc-curso">Curso</label>
        <select
          id="doc-curso"
          value={curso}
          onChange={(e) => onCurso(e.target.value)}
          disabled={!anioLectivo}
        >
          <option value="">Todos los cursos</option>
          {cursosFiltrados.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group-filter">
        <label htmlFor="doc-materia-filtro">Materia</label>
        <select id="doc-materia-filtro" value={materia} onChange={(e) => onMateria(e.target.value)}>
          <option value="">Todas las materias</option>
          {materias.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function AsignacionesEditor({ asignaciones, setAsignaciones, idPrefix }) {
  const { aniosLectivos, inscripciones, cursos, materias, cursosObj, cursoMateria, materiasObj } = useData();
  const toast = useToast();
  const [borrador, setBorrador] = useState(nuevaAsignacion());
  const cursosBorrador = cursosPorAnio(borrador.anioLectivo, inscripciones, cursos, cursosObj);

  // Filtrar materias según el curso seleccionado
  const materiasFiltradas = useMemo(() => {
    if (!borrador.curso || !borrador.anioLectivo) return [];
    
    // Obtener nombres de materias directamente de cursoMateria para el curso seleccionado
    const materiasCurso = cursoMateria
      .filter((cm) => cm.curso_nombre === borrador.curso)
      .map((cm) => cm.materia_nombre)
      .filter((m) => m); // Eliminar null/undefined
    
    return materiasCurso;
  }, [borrador.curso, borrador.anioLectivo, cursoMateria]);

  const agregarAsignacion = () => {
    if (!borrador.materia || !borrador.anioLectivo || !borrador.curso) {
      toast.warning('Completá año, curso y materia antes de agregar.');
      return;
    }
    const duplicada = asignaciones.some(
      (a) =>
        a.materia === borrador.materia &&
        a.anioLectivo === borrador.anioLectivo &&
        a.curso === borrador.curso,
    );
    if (duplicada) {
      toast.warning('Esa combinación de materia, año y curso ya fue agregada.');
      return;
    }
    setAsignaciones((prev) => [...prev, { ...borrador, id: Date.now(), isNew: true }]);
    setBorrador(nuevaAsignacion());
  };

  const quitarAsignacion = (id) => {
    setAsignaciones((prev) => prev.filter((a) => a.id !== id));
  };

  const prefix = idPrefix || 'asig';

  return (
    <div>
      <h4 className="preceptor-section-title">Materias y asignaciones</h4>
      <p className="preceptor-modo-hint">
        Seleccioná el año lectivo y curso, luego elegí la materia asignada a ese curso. Podés agregar varias.
      </p>

      <div className="upload-dashed-box">
        <div className="filter-row">
          <div className="form-group-filter">
            <label htmlFor={`${prefix}-anio`}>Año lectivo</label>
            <select
              id={`${prefix}-anio`}
              value={borrador.anioLectivo}
              onChange={(e) =>
                setBorrador((p) => ({ ...p, anioLectivo: e.target.value, curso: '', materia: '' }))
              }
            >
              <option value="">Año...</option>
              {aniosLectivos.map((anio) => (
                <option key={anio} value={anio}>
                  {anio}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group-filter">
            <label htmlFor={`${prefix}-curso`}>Curso</label>
            <select
              id={`${prefix}-curso`}
              value={borrador.curso}
              onChange={(e) => setBorrador((p) => ({ ...p, curso: e.target.value, materia: '' }))}
              disabled={!borrador.anioLectivo}
            >
              <option value="">Curso...</option>
              {cursosBorrador.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group-filter">
            <label htmlFor={`${prefix}-materia`}>Materia</label>
            <select
              id={`${prefix}-materia`}
              value={borrador.materia}
              onChange={(e) => setBorrador((p) => ({ ...p, materia: e.target.value }))}
              disabled={!borrador.curso}
            >
              <option value="">Seleccionar...</option>
              {materiasFiltradas.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button type="button" className="btn btn-success" onClick={agregarAsignacion}>
          <i className="fas fa-plus" aria-hidden="true" /> Agregar materia
        </button>
      </div>

      {asignaciones.length > 0 && (
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Materia</th>
                <th>Año</th>
                <th>Curso</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {asignaciones.map((a) => (
                <tr key={a.id}>
                  <td className="table-cell-strong">{a.materia}</td>
                  <td>{a.anioLectivo}</td>
                  <td>{a.curso}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => quitarAsignacion(a.id)}
                    >
                      Quitar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Docentes({ readOnly = false }) {
  const dataCtx = useData();
  const toast = useToast();
  const [modo, setModo] = useState(readOnly ? 'vista' : '');
  const [anioLectivo, setAnioLectivo] = useState('');
  const [curso, setCurso] = useState('');
  const [materia, setMateria] = useState('');
  const [form, setForm] = useState(formVacio);
  const [asignaciones, setAsignaciones] = useState([]);
  const [asignacionesOriginales, setAsignacionesOriginales] = useState([]);
  const [seleccionado, setSeleccionado] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [programando, setProgramando] = useState(null);
  const [progForm, setProgForm] = useState({ fecha_deshabilitacion_programada: '', fecha_habilitacion_programada: '' });

  const esCrear = modo === 'crear';
  const esVista = modo === 'vista';
  const necesitaFiltroVista = esVista;
  const necesitaFiltroCurso = modo === 'modificar' || modo === 'borrar';

  const allDocentes = dataCtx.docentes;
  const tieneAlgunFiltro = anioLectivo || curso || materia;
  const lista = esVista
    ? (tieneAlgunFiltro
        ? docentesPorFiltros(anioLectivo, curso, materia, allDocentes, dataCtx.asignacionesDocente)
        : allDocentes)
    : allDocentes;
  const docenteSel = lista.find((d) => String(d.id) === seleccionado);

  const resetModo = (m) => {
    setModo(m);
    setSeleccionado('');
    setForm(formVacio);
    setAsignaciones([]);
    setAsignacionesOriginales([]);
    setAnioLectivo('');
    setCurso('');
    setMateria('');
    setMensaje('');
  };

  const resolveIds = (asig) => {
    const cursoObj = (dataCtx.cursosObj || []).find(
      (c) => c.nombre_curso === asig.curso && c.ciclo_anio === Number(asig.anioLectivo),
    );
    const materiaObj = (dataCtx.materiasObj || []).find(
      (m) => m.nombre_materia === asig.materia,
    );
    return { id_curso: cursoObj?.id_curso, id_materia: materiaObj?.id_materia };
  };

  const handleGuardar = async () => {
    setGuardando(true);
    setMensaje('');
    try {
      if (esCrear) {
        if (!form.usuario_nombre || !form.contrasena || !form.dni || !form.nombre || !form.apellido) {
          toast.warning('Completá usuario, contraseña, DNI, nombre y apellido.');
          setGuardando(false);
          return;
        }
        const docente = await createDocente({
          usuario_nombre: form.usuario_nombre,
          contrasena: form.contrasena,
          estado: form.estado,
          fecha_deshabilitacion_programada: form.fecha_deshabilitacion_programada || null,
          fecha_habilitacion_programada: form.fecha_habilitacion_programada || null,
          dni: form.dni,
          nombre: form.nombre,
          apellido: form.apellido,
          correo: form.correo || null,
          telefono: form.telefono || null,
        });
        const docenteId = docente.id_docente;
        let asigOk = 0;
        const errores = [];
        for (const asig of asignaciones) {
          const { id_curso, id_materia } = resolveIds(asig);
          if (!id_curso || !id_materia) {
            errores.push(`No se encontró curso/materia para ${asig.materia} - ${asig.curso} (${asig.anioLectivo})`);
            continue;
          }
          try {
            const existing = dataCtx.cursoMateria.find(
              (cm) => cm.id_curso === id_curso && cm.id_materia === id_materia,
            );
            if (existing) {
              await updateCursoMateria(existing.id, { id_docente: docenteId });
            } else {
              await createCursoMateria({ id_curso, id_materia, id_docente: docenteId });
            }
            asigOk++;
          } catch (e) {
            const d = e.response?.data;
            const msg = d && typeof d === 'object'
              ? Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ')
              : (d?.detail || e.message);
            errores.push(`${asig.materia} - ${asig.curso}: ${msg}`);
          }
        }
        if (errores.length > 0) {
          toast.error(`Docente creado. ${asigOk} asignación(es) guardadas. Errores: ${errores.join('; ')}`);
        } else {
          toast.success(`Docente creado correctamente con ${asigOk} asignación(es).`);
        }
        setForm(formVacio);
        setAsignaciones([]);
      } else if (modo === 'modificar') {
        if (!seleccionado) {
          toast.warning('Seleccioná un docente para modificar.');
          setGuardando(false);
          return;
        }
        await updateDocente(seleccionado, {
          usuario_nombre: form.usuario_nombre || undefined,
          contrasena: form.contrasena || undefined,
          estado: form.estado,
          fecha_deshabilitacion_programada: form.fecha_deshabilitacion_programada || null,
          fecha_habilitacion_programada: form.fecha_habilitacion_programada || null,
          dni: form.dni,
          nombre: form.nombre,
          apellido: form.apellido,
          correo: form.correo || null,
          telefono: form.telefono || null,
        });
        const originalesIds = asignacionesOriginales.map((a) => a.cmId);
        const actualesIds = asignaciones.filter((a) => a.cmId).map((a) => a.cmId);
        const paraEliminar = originalesIds.filter((id) => !actualesIds.includes(id));
        const paraCrear = asignaciones.filter((a) => a.isNew);
        for (const cmId of paraEliminar) {
          await deleteCursoMateria(cmId);
        }
        for (const asig of paraCrear) {
          const { id_curso, id_materia } = resolveIds(asig);
          if (id_curso && id_materia) {
            const existing = dataCtx.cursoMateria.find(
              (cm) => cm.id_curso === id_curso && cm.id_materia === id_materia,
            );
            if (existing) {
              await updateCursoMateria(existing.id, { id_docente: Number(seleccionado) });
            } else {
              await createCursoMateria({ id_curso, id_materia, id_docente: Number(seleccionado) });
            }
          }
        }
        toast.success('Docente actualizado correctamente.');
      } else if (modo === 'borrar') {
        if (!seleccionado) {
          toast.warning('Seleccioná un docente para eliminar.');
          setGuardando(false);
          return;
        }
        await confirmarEliminacion('¿Estás seguro de que querés eliminar este docente y todas sus asignaciones?\n\nEsta acción no se puede deshacer.', {
          onConfirm: async () => {
            await deleteDocente(seleccionado);
            toast.success('Docente eliminado correctamente.');
            setSeleccionado('');
          },
        });
      }
      await dataCtx.refreshData();
    } catch (err) {
      toast.error(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  };

  const toggleEstado = async (docente) => {
    setGuardando(true);
    setMensaje('');
    try {
      await updateDocente(docente.id, {
        estado: !(docente.usuario_estado !== false),
      });
      toast.success(docente.usuario_estado !== false ? 'Docente deshabilitado correctamente.' : 'Docente habilitado correctamente.');
      await dataCtx.refreshData();
    } catch (err) {
      toast.error(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  };

  const abrirProgramar = (docente) => {
    setProgramando(docente.id);
    setProgForm({
      fecha_deshabilitacion_programada: toInputDateTime(docente.usuario_fecha_deshabilitacion_programada),
      fecha_habilitacion_programada: toInputDateTime(docente.usuario_fecha_habilitacion_programada),
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
      await updateDocente(programando, {
        fecha_deshabilitacion_programada: deshab || null,
        fecha_habilitacion_programada: hab || null,
      });
      toast.success('Fechas actualizadas correctamente.');
      setProgramando(null);
      await dataCtx.refreshData();
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
          await updateDocente(programando, {
            fecha_deshabilitacion_programada: null,
            fecha_habilitacion_programada: null,
          });
          toast.success('Fechas eliminadas correctamente.');
          setProgramando(null);
          await dataCtx.refreshData();
        } catch (err) {
          toast.error(mensajeError(err));
        } finally {
          setGuardando(false);
        }
      },
    });
  };

  const cargarAsignacionesDocente = (docenteId) => {
    const cms = (dataCtx.cursoMateria || []).filter((cm) => cm.id_docente === docenteId);
    const mapped = cms.map((cm) => {
      const cursoObj = (dataCtx.cursosObj || []).find((c) => c.id_curso === cm.id_curso);
      return {
        id: cm.id,
        cmId: cm.id,
        materia: cm.materia_nombre || '',
        anioLectivo: cursoObj?.ciclo_anio ? String(cursoObj.ciclo_anio) : '',
        curso: cm.curso_nombre || '',
        isNew: false,
      };
    });
    setAsignaciones(mapped);
    setAsignacionesOriginales(mapped);
  };

  const tablaVista = (
    <div className="table-responsive">
      <table>
        <thead>
          <tr>
            <th>DNI</th>
            <th>Nombre</th>
            <th>Usuario</th>
            {!readOnly && <th>Próxima acción</th>}
            <th>Asignaciones</th>
            {!readOnly && <th>Acción</th>}
          </tr>
        </thead>
        <tbody>
          {lista.length === 0 ? (
            <tr>
              <td colSpan={readOnly ? 4 : 6} className="empty-state-message">
                No hay docentes con los filtros seleccionados.
              </td>
            </tr>
          ) : (
            lista.map((d) => {
              const asigs = (dataCtx.cursoMateria || []).filter((cm) => cm.id_docente === d.id);
              const asigTexto = asigs.length > 0
                ? asigs.map((cm) => `${cm.materia_nombre} (${cm.curso_nombre})`).join(', ')
                : 'Sin asignaciones';
              const puedeCambiarEstado = d.usuario_estado !== null && d.usuario_estado !== undefined;
              return (
                <Fragment key={d.id}>
                  <tr>
                    <td>{formatDNI(d.dni)}</td>
                    <td>{nombreDocente(d)}</td>
                    <td>{d.usuario || 'Sin usuario'}</td>
                    {!readOnly && <td>{proximaAccion(d)}</td>}
                    <td>{asigTexto}</td>
                    {!readOnly && (
                    <td>
                      {puedeCambiarEstado ? (
                        <div className="flex-row--center flex-gap-16">
                          <button
                            type="button"
                            className={`btn btn-sm ${d.usuario_estado === false ? 'btn-danger' : 'btn-success'}`}
                            onClick={() => toggleEstado(d)}
                            disabled={guardando}
                          >
                            <i className="fas fa-toggle-on" aria-hidden="true" />{' '}
                            {d.usuario_estado === false ? 'Deshabilitado' : 'Habilitado'}
                          </button>
                          <button
                            type="button"
                            className={`btn btn-sm btn-secondary${programando === d.id ? ' active' : ''}`}
                            onClick={() => abrirProgramar(d)}
                            title="Programar"
                          >
                            <i className="fas fa-calendar-alt" aria-hidden="true" />
                          </button>
                        </div>
                      ) : '—'}
                    </td>
                    )}
                  </tr>
                  {!readOnly && programando === d.id && (
                    <tr>
                      <td colSpan={6} className="p-0">
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

  const renderContenido = () => {
    if (esVista) return tablaVista;

    if (esCrear) {
      return (
        <div style={{ maxWidth: 760 }}>
          <div className="preceptor-form-grid">
            <div className="form-group-filter preceptor-form-full">
              <label htmlFor="doc-usuario">Usuario</label>
              <input
                id="doc-usuario"
                type="text"
                value={form.usuario_nombre}
                onChange={(e) => setForm((p) => ({ ...p, usuario_nombre: e.target.value }))}
                required
              />
            </div>
            <div className="form-group-filter">
              <label htmlFor="doc-contrasena">Contraseña</label>
              <input
                id="doc-contrasena"
                type="password"
                value={form.contrasena}
                onChange={(e) => setForm((p) => ({ ...p, contrasena: e.target.value }))}
                required
              />
            </div>
            <div className="form-group-filter">
              <label>Estado</label>
              <label htmlFor="doc-estado" className="preceptor-status-toggle">
                <input
                  id="doc-estado"
                  type="checkbox"
                  checked={form.estado}
                  onChange={(e) => setForm((p) => ({ ...p, estado: e.target.checked }))}
                />
                <span>{estadoLabel(form.estado)}</span>
              </label>
            </div>
            <div className="form-group-filter">
              <label htmlFor="doc-fecha-deshabilitacion">Fecha deshabilitación programada</label>
              <input
                id="doc-fecha-deshabilitacion"
                type="datetime-local"
                value={form.fecha_deshabilitacion_programada}
                onChange={(e) => setForm((p) => ({ ...p, fecha_deshabilitacion_programada: e.target.value }))}
              />
            </div>
            <div className="form-group-filter">
              <label htmlFor="doc-fecha-habilitacion">Fecha habilitación programada</label>
              <input
                id="doc-fecha-habilitacion"
                type="datetime-local"
                value={form.fecha_habilitacion_programada}
                onChange={(e) => setForm((p) => ({ ...p, fecha_habilitacion_programada: e.target.value }))}
              />
            </div>
            <div className="form-group-filter preceptor-form-full">
               <label htmlFor="doc-dni">DNI</label>
               <input
                 id="doc-dni"
                 type="text"
                 value={form.dni}
                 onChange={(e) => setForm((p) => ({ ...p, dni: formatDNI(e.target.value) }))}
               />
             </div>
             <div className="form-group-filter">
               <label htmlFor="doc-nombre">Nombre</label>
              <input
                id="doc-nombre"
                type="text"
                value={form.nombre}
                onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
              />
            </div>
            <div className="form-group-filter">
              <label htmlFor="doc-apellido">Apellido</label>
              <input
                id="doc-apellido"
                type="text"
                value={form.apellido}
                onChange={(e) => setForm((p) => ({ ...p, apellido: e.target.value }))}
              />
            </div>
            <div className="form-group-filter">
              <label htmlFor="doc-correo">Correo</label>
              <input
                id="doc-correo"
                type="email"
                value={form.correo}
                onChange={(e) => setForm((p) => ({ ...p, correo: e.target.value }))}
              />
            </div>
            <div className="form-group-filter">
              <label htmlFor="doc-telefono">Teléfono</label>
              <input
                id="doc-telefono"
                type="text"
                value={form.telefono}
                onChange={(e) => setForm((p) => ({ ...p, telefono: e.target.value }))}
              />
            </div>
          </div>
          <AsignacionesEditor
            asignaciones={asignaciones}
            setAsignaciones={setAsignaciones}
            idPrefix="asig-crear"
          />
        </div>
      );
    }

    if (modo === 'modificar') {
      return (
        <div>
          <div className="filter-row">
            <div className="form-group-filter">
              <label htmlFor="doc-select-mod">Docente</label>
              <select
                id="doc-select-mod"
                value={seleccionado}
                onChange={(e) => {
                  const val = e.target.value;
                  setSeleccionado(val);
                  const d = allDocentes.find((doc) => String(doc.id) === val);
                  if (d) {
                    setForm({
                      usuario_nombre: d.usuario || '',
                      contrasena: '',
                      estado: d.usuario_estado !== false,
                      fecha_deshabilitacion_programada: toInputDateTime(d.usuario_fecha_deshabilitacion_programada),
                      fecha_habilitacion_programada: toInputDateTime(d.usuario_fecha_habilitacion_programada),
                      dni: d.dni,
                      nombre: d.nombre,
                      apellido: d.apellido,
                      correo: d.correo || '',
                      telefono: d.telefono || '',
                    });
                    cargarAsignacionesDocente(d.id);
                  }
                }}
              >
                <option value="">Seleccionar...</option>
                {allDocentes.map((d) => (
                  <option key={d.id} value={d.id}>
                    {nombreDocente(d)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {docenteSel && (
            <div style={{ maxWidth: 760 }}>
              <div className="preceptor-form-grid">
                <div className="form-group-filter preceptor-form-full">
                  <label htmlFor="doc-usuario-mod">Usuario</label>
                  <input
                    id="doc-usuario-mod"
                    type="text"
                    value={form.usuario_nombre}
                    onChange={(e) => setForm((p) => ({ ...p, usuario_nombre: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group-filter">
                  <label htmlFor="doc-contrasena-mod">Contraseña {docenteSel.usuario ? '(dejar en blanco para mantener)' : ''}</label>
                  <input
                    id="doc-contrasena-mod"
                    type="password"
                    value={form.contrasena}
                    onChange={(e) => setForm((p) => ({ ...p, contrasena: e.target.value }))}
                  />
                </div>
                <div className="form-group-filter">
                  <label>Estado</label>
                  <label htmlFor="doc-estado-mod" className="preceptor-status-toggle">
                    <input
                      id="doc-estado-mod"
                      type="checkbox"
                      checked={form.estado}
                      onChange={(e) => setForm((p) => ({ ...p, estado: e.target.checked }))}
                    />
                    <span>{estadoLabel(form.estado)}</span>
                  </label>
                </div>
                <div className="form-group-filter">
                  <label htmlFor="doc-fecha-deshabilitacion-mod">Fecha deshabilitación programada</label>
                  <input
                    id="doc-fecha-deshabilitacion-mod"
                    type="datetime-local"
                    value={form.fecha_deshabilitacion_programada}
                    onChange={(e) => setForm((p) => ({ ...p, fecha_deshabilitacion_programada: e.target.value }))}
                  />
                </div>
                <div className="form-group-filter">
                  <label htmlFor="doc-fecha-habilitacion-mod">Fecha habilitación programada</label>
                  <input
                    id="doc-fecha-habilitacion-mod"
                    type="datetime-local"
                    value={form.fecha_habilitacion_programada}
                    onChange={(e) => setForm((p) => ({ ...p, fecha_habilitacion_programada: e.target.value }))}
                  />
                </div>
                <div className="form-group-filter preceptor-form-full">
               <label htmlFor="doc-dni-mod">DNI</label>
                   <input
                     id="doc-dni-mod"
                     type="text"
                     value={form.dni}
                     onChange={(e) => setForm((p) => ({ ...p, dni: formatDNI(e.target.value) }))}
                   />
                 </div>
                 <div className="form-group-filter">
                   <label htmlFor="doc-nombre-mod">Nombre</label>
                  <input
                    id="doc-nombre-mod"
                    type="text"
                    value={form.nombre}
                    onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                  />
                </div>
                <div className="form-group-filter">
                  <label htmlFor="doc-apellido-mod">Apellido</label>
                  <input
                    id="doc-apellido-mod"
                    type="text"
                    value={form.apellido}
                    onChange={(e) => setForm((p) => ({ ...p, apellido: e.target.value }))}
                  />
                </div>
                <div className="form-group-filter">
                  <label htmlFor="doc-correo-mod">Correo</label>
                  <input
                    id="doc-correo-mod"
                    type="email"
                    value={form.correo}
                    onChange={(e) => setForm((p) => ({ ...p, correo: e.target.value }))}
                  />
                </div>
                <div className="form-group-filter">
                  <label htmlFor="doc-telefono-mod">Teléfono</label>
                  <input
                    id="doc-telefono-mod"
                    type="text"
                    value={form.telefono}
                    onChange={(e) => setForm((p) => ({ ...p, telefono: e.target.value }))}
                  />
                </div>
              </div>
              <AsignacionesEditor
                asignaciones={asignaciones}
                setAsignaciones={setAsignaciones}
                idPrefix="asig-mod"
              />
            </div>
          )}
        </div>
      );
    }

    if (modo === 'borrar') {
      return (
        <div className="filter-row">
          <div className="form-group-filter">
            <label htmlFor="doc-select-del">Docente a eliminar</label>
            <select
              id="doc-select-del"
              value={seleccionado}
              onChange={(e) => setSeleccionado(e.target.value)}
            >
              <option value="">Seleccionar...</option>
              {allDocentes.map((d) => (
                <option key={d.id} value={d.id}>
                  {nombreDocente(d)}
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
    crear: 'Crear docente',
    modificar: 'Modificar docente',
    borrar: 'Borrar docente',
  };

  return (
    <div className="card">
      {!readOnly && <SelectorModo modo={modo} onModoChange={resetModo} titulo="Docentes — ¿Qué deseás hacer?" />}
      {readOnly && (
        <div className="card-header-flex card-header-flex--compact">
          <h3>Docentes</h3>
          <span className="badge role-badge-display">Solo lectura</span>
        </div>
      )}

      {modo && modo !== 'crear' && modo !== 'modificar' && (
        <div>
          {necesitaFiltroVista && (
            <FiltrosDocentesVista
              anioLectivo={anioLectivo}
              curso={curso}
              materia={materia}
              onAnio={(v) => {
                setAnioLectivo(v);
                setCurso('');
              }}
              onCurso={setCurso}
              onMateria={setMateria}
            />
          )}

          <div>
            <div className="card-header-flex">
              <h3>{tituloModo[modo]}</h3>
            </div>
            {mensaje && (
              <p style={{ color: mensaje.startsWith('Error') ? 'red' : 'green', margin: '8px 0' }}>
                {mensaje}
              </p>
            )}
            {renderContenido()}
          </div>
        </div>
      )}

      {(modo === 'crear' || modo === 'modificar') && (
        <FormModal title={tituloModo[modo]} onClose={() => resetModo('')}>
          {mensaje && (
            <p style={{ color: mensaje.startsWith('Error') ? 'red' : 'green', margin: '0 0 8px' }}>
              {mensaje}
            </p>
          )}
          <div className="standard-modal-body" style={{ display: 'grid', gap: '14px' }}>
            {renderContenido()}
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

export default Docentes;
