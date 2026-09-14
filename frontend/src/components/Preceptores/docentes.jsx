import { useState, useEffect, useMemo, Fragment } from 'react';
import { useData } from '../../context/DataContext';
import { createDocente, updateDocente, deleteDocente, createCursoMateria, updateCursoMateria, deleteCursoMateria, getUsuariosConRol, getUsuariosSinRol, quitarRolUsuario, getCursoMateria, getCursos, getMaterias } from '../../services/api';
import { cursosPorAnio, docentesPorFiltros, nombreDocente } from './preceptorUtils';
import FiltrosAnioCurso from '../Shared/FiltrosAnioCurso';
import FiltrosDocentesVista from './FiltrosDocentesVista';
import { formatDNI, cleanDNI } from '../../utils/dni';
import FormModal from '../../components/Shared/FormModal';
import AgregarRolModal from '../../components/Shared/AgregarRolModal';
import QuitarRolModal from '../../components/Shared/QuitarRolModal';
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

function proximaAccion(d) {
  if (d.usuario_estado === null || d.usuario_estado === undefined) return '---';
  if (d.usuario_estado && d.usuario_fecha_deshabilitacion_programada) {
    return `Deshabilitar el ${formatDateTime(d.usuario_fecha_deshabilitacion_programada)}`;
  }
  if (!d.usuario_estado && d.usuario_fecha_habilitacion_programada) {
    return `Habilitar el ${formatDateTime(d.usuario_fecha_habilitacion_programada)}`;
  }
  if (d.usuario_fecha_deshabilitacion_programada) {
    return `Deshabilitar el ${formatDateTime(d.usuario_fecha_deshabilitacion_programada)}`;
  }
  if (d.usuario_fecha_habilitacion_programada) {
    return `Habilitar el ${formatDateTime(d.usuario_fecha_habilitacion_programada)}`;
  }
  return '---';
}

function Docentes({ readOnly = false }) {
  const dataCtx = useData();
  const allDocentes = dataCtx.docentes || [];
  const toast = useToast();
  const [modo, setModo] = useState(readOnly ? 'vista' : '');
  const esCrear = modo === 'crear';
  const esModificar = modo === 'modificar';
  const [anioLectivo, setAnioLectivo] = useState('');
  const [curso, setCurso] = useState('');
  const [materia, setMateria] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState(formVacio);
  const [asignaciones, setAsignaciones] = useState([]);
  const [asignacionesOriginales, setAsignacionesOriginales] = useState([]);
  const [seleccionado, setSeleccionado] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [programando, setProgramando] = useState(null);
  const [progForm, setProgForm] = useState({ fecha_deshabilitacion_programada: '', fecha_habilitacion_programada: '' });
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
      const data = await getUsuariosSinRol('docente');
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

  const tieneAlgunFiltro = anioLectivo || curso || materia;
  const lista = tieneAlgunFiltro
    ? docentesPorFiltros(anioLectivo, curso, materia, allDocentes, dataCtx.asignacionesDocente)
    : allDocentes;
  const docenteSel = lista.find((d) => String(d.id) === seleccionado) || allDocentes.find((d) => String(d.id) === seleccionado);

  const listaFiltrada = useMemo(() => {
    if (!searchTerm) return lista;
    const q = normalize(searchTerm);
    return lista.filter(
      (d) =>
        normalize(d.nombre).includes(q) ||
        normalize(d.apellido).includes(q) ||
        normalize(`${d.nombre} ${d.apellido}`).includes(q) ||
        normalize(cleanDNI(d.dni)).includes(q) ||
        normalize(d.usuario).includes(q),
    );
  }, [lista, searchTerm]);

const cerrarFormulario = () => {
    setModo(readOnly ? 'vista' : '');
    setSeleccionado('');
    setForm(formVacio);
    setAsignaciones([]);
    setAsignacionesOriginales([]);
    setMensaje('');
  };

const abrirCrear = () => {
    setModo('crear');
    setSeleccionado('');
    setForm(formVacio);
    setAsignaciones([]);
    setAsignacionesOriginales([]);
    setMensaje('');
  };

  const abrirEditar = (docente) => {
    setModo('modificar');
    setSeleccionado(String(docente.id));
    setForm({
      usuario_nombre: docente.usuario || '',
      contrasena: '',
      estado: docente.usuario_estado !== false,
      fecha_deshabilitacion_programada: toInputDateTime(docente.usuario_fecha_deshabilitacion_programada),
      fecha_habilitacion_programada: toInputDateTime(docente.usuario_fecha_habilitacion_programada),
      dni: docente.dni,
      nombre: docente.nombre,
      apellido: docente.apellido,
      correo: docente.correo || '',
      telefono: docente.telefono || '',
    });
    cargarAsignacionesDocente(docente.id);
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
        const docentePayload = {
          estado: form.estado,
          dni: form.dni,
          nombre: form.nombre,
          apellido: form.apellido,
          correo: form.correo || null,
          telefono: form.telefono || null,
          usuario_nombre: form.usuario_nombre,
          contrasena: form.contrasena,
          fecha_deshabilitacion_programada: form.fecha_deshabilitacion_programada || null,
          fecha_habilitacion_programada: form.fecha_habilitacion_programada || null,
        };
        const docente = await createDocente(docentePayload);
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
        cerrarFormulario();
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
        cerrarFormulario();
      }
      await dataCtx.refreshData();
    } catch (err) {
      toast.error(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  };

  const eliminarDocente = async (docente) => {
    await confirmarEliminacion('¿Estás seguro de que querés eliminar este docente y todas sus asignaciones?\n\nEsta acción no se puede deshacer.', {
      onConfirm: async () => {
        setGuardando(true);
        setMensaje('');
        try {
          await deleteDocente(docente.id);
          toast.success('Docente eliminado correctamente.');
          await dataCtx.refreshData();
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
      await createDocente({
        id_usuario_existente: Number(persona.id_usuario ?? persona.id),
        dni: persona.dni || '',
        nombre: persona.nombre || '',
        apellido: persona.apellido || '',
        correo: persona.correo || persona.email || null,
        telefono: persona.telefono || null,
        curso_materia_ids: asignaciones.curso_materia_ids || [],
      });
      toast.success('Rol "Docente" asignado correctamente.');
      setMostrarAgregarRol(false);
      await dataCtx.refreshData();
    } catch (err) {
      toast.error(mensajeError(err));
    } finally {
      setGuardandoAgregarRol(false);
    }
  };

  const fetchCursoMateriaParaDocente = async () => {
    try {
      const data = await getCursoMateria({ activo: '1', estado: '1', id_docente: '' });
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('Error al cargar curso-materias:', err);
      return [];
    }
  };

  const fetchCursosParaDocente = async () => {
    try {
      const data = await getCursos({ activo: '1', estado: '1' });
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('Error al cargar cursos:', err);
      return [];
    }
  };

  const fetchMateriasParaDocente = async () => {
    try {
      const data = await getMaterias({ activo: '1' });
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('Error al cargar materias:', err);
      return [];
    }
  };

  const cargarPersonasConRol = async () => {
    try {
      const data = await getUsuariosConRol('docente');
      setPersonasConRol(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(mensajeError(err));
    }
  };

  const handleQuitarRol = async (persona) => {
    setQuitandoRol(true);
    try {
      await quitarRolUsuario(Number(persona.id_usuario), 'docente');
      toast.success('Rol "Docente" quitado correctamente.');
      setMostrarQuitarRol(false);
      await dataCtx.refreshData();
    } catch (err) {
      toast.error(mensajeError(err));
    } finally {
      setQuitandoRol(false);
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

  const renderTablaVista = () => (
    <div className="table-responsive">
      <table>
        <thead>
          <tr>
            <th>DNI</th>
            <th>Nombre</th>
            <th>Usuario</th>
            <th>Estado</th>
            <th>Asignaciones</th>
            {!readOnly && <th>Próxima acción</th>}
            {!readOnly && <th>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {listaFiltrada.length === 0 ? (
            <tr>
              <td colSpan={readOnly ? 5 : 7} className="empty-state-message">
                {searchTerm
                  ? 'No se encontraron docentes con ese criterio.'
                  : 'No hay docentes con los filtros seleccionados.'}
              </td>
            </tr>
          ) : (
            listaFiltrada.map((d) => {
              const asigs = (dataCtx.cursoMateria || []).filter((cm) => cm.id_docente === d.id);
              const asigTexto = asigs.length > 0
                ? asigs.map((cm) => `${cm.materia_nombre} (${cm.curso_nombre})`).join(', ')
                : 'Sin asignaciones';
              const puedeCambiarEstado = d.usuario_estado !== null && d.usuario_estado !== undefined;
              return [
                <tr key={d.id}>
                  <td><strong>{formatDNI(d.dni)}</strong></td>
                  <td className="table-cell-strong">{nombreDocente(d)}</td>
                  <td>{d.usuario || 'Sin usuario'}</td>
                  <td>
                    <span className={`badge ${d.usuario_estado === false ? 'badge-danger' : d.usuario_estado !== null && d.usuario_estado !== undefined ? 'badge-success' : 'badge-neutral'}`}>
                      {estadoLabel(d.usuario_estado)}
                    </span>
                  </td>
                  <td>{asigTexto}</td>
                  {!readOnly && <td>{proximaAccion(d)}</td>}
                  {!readOnly && (
                    <td className="acciones-cell" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', justifyItems: 'center' }}>
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => abrirEditar(d)}
                        title="Editar"
                      >
                        <i className="fas fa-edit" aria-hidden="true" />
                      </button>
                      {puedeCambiarEstado && (
                        <button
                          type="button"
                          className={`btn btn-sm ${d.usuario_estado === false ? 'btn-success' : 'btn-warning'}`}
                          onClick={() => toggleEstado(d)}
                          title={d.usuario_estado === false ? 'Habilitar' : 'Deshabilitar'}
                          disabled={guardando}
                        >
                          <i className={`fas ${d.usuario_estado === false ? 'fa-check' : 'fa-ban'}`} aria-hidden="true" />
                        </button>
                      )}
                      <button
                        type="button"
                        className={`btn btn-sm btn-secondary${programando === d.id ? ' active' : ''}`}
                        onClick={() => abrirProgramar(d)}
                        title="Programar"
                      >
                        <i className="fas fa-calendar-alt" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => eliminarDocente(d)}
                        title="Eliminar"
                      >
                        <i className="fas fa-trash" aria-hidden="true" />
                      </button>
                    </td>
)}
                </tr>,
                !readOnly && programando === d.id && (
                  <tr key={d.id + '-prog'}>
                    <td colSpan={7} className="p-0">
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
                ),
              ];
            })
          )}
        </tbody>
      </table>
    </div>
  );

  const renderFormCrear = () => (
  <div style={{ maxWidth: 760 }} className="preceptor-form-grid">
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
        <AsignacionesEditor
          asignaciones={asignaciones}
          setAsignaciones={setAsignaciones}
          idPrefix="asig-crear"
        />
      </div>
  );

const renderFormModificar = () => (
  <div style={{ maxWidth: 760 }} className="preceptor-form-grid">
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
          <label htmlFor="doc-contrasena-mod">Contraseña {docenteSel?.usuario ? '(dejar en blanco para mantener)' : ''}</label>
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
        <AsignacionesEditor
          asignaciones={asignaciones}
          setAsignaciones={setAsignaciones}
          idPrefix="asig-mod"
        />
      </div>
  );

  const tituloModal = esCrear ? 'Crear docente' : 'Modificar docente';

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3><i className="fas fa-chalkboard-teacher" aria-hidden="true" /> Docentes</h3>
        {!readOnly && (
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
              <i className="fas fa-plus" aria-hidden="true" /> Nuevo Docente
            </button>
          </div>
        )}
      </div>

      {!readOnly && (
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

      {renderTablaVista()}

      {(modo === 'crear' || (modo === 'modificar' && seleccionado)) && (
        <FormModal title={tituloModal} onClose={cerrarFormulario}>
          {mensaje && (
            <p style={{ color: mensaje.startsWith('Error') ? 'red' : 'green', margin: '0 0 8px' }}>
              {mensaje}
            </p>
          )}
          <div className="standard-modal-body" style={{ display: 'grid', gap: '14px' }}>
            {esCrear ? renderFormCrear() : renderFormModificar()}
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
          titulo="Agregar rol: docente"
          subtitulo="Seleccioná una persona existente para asignarle el rol. Se reutilizará su mismo usuario: no se crean usuarios y no se sobrescriben roles."
          personas={personasParaAgregarRol}
          onClose={() => setMostrarAgregarRol(false)}
          onAgregar={handleAgregarRol}
          guardando={guardandoAgregarRol}
          rol="docente"
          fetchAssignmentsFn={fetchCursoMateriaParaDocente}
          fetchCursosFn={fetchCursosParaDocente}
          fetchMateriasFn={fetchMateriasParaDocente}
        />
      )}

      {mostrarQuitarRol && (
        <QuitarRolModal
          titulo="Quitar rol: docente"
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

export default Docentes;
