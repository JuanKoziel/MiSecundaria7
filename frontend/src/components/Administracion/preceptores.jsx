import { Fragment, useEffect, useMemo, useState } from 'react';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import FormModal from '../../components/Shared/FormModal';
import ModalProgramarEstado from '../../components/Shared/ModalProgramarEstado';
import AgregarRolModal from '../../components/Shared/AgregarRolModal';
import QuitarRolModal from '../../components/Shared/QuitarRolModal';
import AccionesCelda from '../../components/Shared/AccionesCelda';
import NumericInput from '../../components/Shared/NumericInput';
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
  updateCurso,
} from '../../services/api';
import { getCursos } from '../../services/api';
import { formatDNI, cleanDNI } from '../../utils/dni';
import confirmarEliminacion from '../../utils/confirmarEliminacion';
import LoadingScreen from '../Shared/LoadingScreen';
import AccionesLeyenda from '../Shared/AccionesLeyenda';
import { mensajeErrorAmigable } from '../../utils/errores';
import { aInputDateTime as toInputDateTime, errorProgramacion } from '../../utils/programacionEstado';
import { cursosSinPreceptor, etiquetaCursosSinPreceptor } from '../../utils/cursosSinPreceptor';

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

function formatDateTime(value) {
  if (!value) return '---';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '---';
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short' }).format(date);
}

/**
 * Estado de la cuenta listo para la validación de 5.9: `true`/`false`, o `null`
 * cuando la persona todavía no tiene usuario. Importa conservar el `null`, porque
 * `x !== false` daba `true` para un `usuario_estado` ausente y hacía pasar la
 * validación como si la cuenta estuviera habilitada.
 */
function programaEstadoActual(persona) {
  const estado = persona?.usuario_estado;
  return estado === null || estado === undefined ? null : !!estado;
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
  const [mostrarProgramar, setMostrarProgramar] = useState(false);
  const [programandoPreceptor, setProgramandoPreceptor] = useState(null);
  const [guardandoProgramar, setGuardandoProgramar] = useState(false);

  // Punto 9.2: Asignación de Cursos (solo para Admin, no para Jefe de Preceptores)
  const [activeTab, setActiveTab] = useState('admin'); // 'admin' | 'asignacion-cursos'
  const [asignacionPreceptores, setAsignacionPreceptores] = useState([]);
  const [selectedPreceptorId, setSelectedPreceptorId] = useState('');
  const [searchAsignados, setSearchAsignados] = useState('');
  const [searchDisponibles, setSearchDisponibles] = useState('');

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

  // Punto 9.2: Funciones para Asignación de Cursos (Admin)
  const fetchAsignacionPreceptores = async () => {
    try {
      const data = await getPreceptores('preceptor');
      const arr = Array.isArray(data) ? data : [];
      const mapeados = arr.map((p) => ({
        id: p.id_preceptor,
        id_usuario: p.id_usuario || null,
        apellido: p.apellido || '',
        nombre: p.nombre || '',
        cursos: Array.isArray(p.cursos_asignados) ? p.cursos_asignados : [],
      }));
      setAsignacionPreceptores(mapeados);
    } catch (err) {
      toast.error('Error al cargar preceptores para asignación.');
    }
  };

  useEffect(() => {
    if (!esJefe) {
      fetchAsignacionPreceptores();
    }
  }, [esJefe]);

  const preceptoresOrdenadosAsignacion = useMemo(
    () => [...(asignacionPreceptores || [])].sort((a, b) => (a.apellido || '').localeCompare(b.apellido || '')),
    [asignacionPreceptores],
  );

  const preceptorObjAsignacion = useMemo(
    () => asignacionPreceptores.find((p) => String(p.id) === String(selectedPreceptorId)),
    [asignacionPreceptores, selectedPreceptorId],
  );

  const cursosAsignadosIds = useMemo(() => {
    if (!preceptorObjAsignacion) return new Set();
    return new Set((preceptorObjAsignacion.cursos || []).map((c) => c.id_curso));
  }, [preceptorObjAsignacion]);

  const cursosAsignados = useMemo(() => {
    const ids = cursosAsignadosIds;
    let arr = (cursosObj || []).filter((c) => ids.has(c.id_curso));
    if (searchAsignados) {
      const q = normalize(searchAsignados);
      arr = arr.filter(
        (c) => normalize(c.nombre_curso).includes(q) || String(c.ciclo_anio || '').includes(q),
      );
    }
    return arr.sort((a, b) => {
      const cicloA = a.ciclo_anio || 0;
      const cicloB = b.ciclo_anio || 0;
      if (cicloA !== cicloB) return cicloB - cicloA;
      return String(a.nombre_curso).localeCompare(String(b.nombre_curso));
    });
  }, [cursosObj, cursosAsignadosIds, searchAsignados]);

  const cursosDisponibles = useMemo(() => {
    let arr = (cursosObj || []).filter((c) => !cursosAsignadosIds.has(c.id_curso));
    if (searchDisponibles) {
      const q = normalize(searchDisponibles);
      arr = arr.filter(
        (c) => normalize(c.nombre_curso).includes(q) || String(c.ciclo_anio || '').includes(q),
      );
    }
    return arr.sort((a, b) => {
      const cicloA = a.ciclo_anio || 0;
      const cicloB = b.ciclo_anio || 0;
      if (cicloA !== cicloB) return cicloB - cicloA;
      return String(a.nombre_curso).localeCompare(String(b.nombre_curso));
    });
  }, [cursosObj, cursosAsignadosIds, searchDisponibles]);

  const preceptorDeCurso = (cursoId) => {
    return asignacionPreceptores.find((p) =>
      (p.cursos || []).some((c) => c.id_curso === cursoId),
    );
  };

  const handleAsignar = async (cursoId) => {
    setError('');
    setSuccess('');
    const yaTienePreceptor = preceptorDeCurso(cursoId);
    if (yaTienePreceptor) {
      setError('Este curso ya tiene un preceptor asignado. Desasígnelo primero.');
      return;
    }
    setGuardando(true);
    try {
      await updateCurso(cursoId, { id_preceptor: selectedPreceptorId });
      toast.success('Curso asignado correctamente.');
      await refreshData();
      await fetchAsignacionPreceptores();
    } catch (err) {
      toast.error(`Error al asignar curso: ${mensajeError(err)}`);
    } finally {
      setGuardando(false);
    }
  };

  const handleQuitar = async (cursoId) => {
    await confirmarEliminacion('¿Quitar este curso del preceptor?\n\nEsta acción no se puede deshacer.', {
      onConfirm: async () => {
        setError('');
        setSuccess('');
        setGuardando(true);
        try {
          await updateCurso(cursoId, { id_preceptor: null });
          toast.success('Curso quitado correctamente.');
          await refreshData();
          await fetchAsignacionPreceptores();
        } catch (err) {
          toast.error(`Error al quitar curso: ${mensajeError(err)}`);
        } finally {
          setGuardando(false);
        }
      },
    });
  };

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
      await cargarPersonasSinRol();
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
      await cargarPersonasSinRol();
    } catch (err) {
      toast.error(`Error al quitar rol: ${mensajeError(err)}`);
    } finally {
      setQuitandoRol(false);
    }
  };

  const abrirProgramar = (preceptor) => {
    setProgramandoPreceptor(preceptor);
    setError('');
    setSuccess('');
    setMostrarProgramar(true);
  };

  const handleGuardarProgramar = async (fechas) => {
    if (!fechas.fecha_deshabilitacion_programada && !fechas.fecha_habilitacion_programada) {
      toast.warning('Ingresá al menos una fecha programada (deshabilitación o habilitación).');
      return;
    }
    // 5.9 — el modal ya valida el orden contra el estado actual de la cuenta;
    // acá se repite como red, porque este handler también se puede disparar con
    // fechas que vienen de otro camino.
    const errorFecha = errorProgramacion({
      estadoInicial: programaEstadoActual(programandoPreceptor),
      deshabilitacion: fechas.fecha_deshabilitacion_programada,
      habilitacion: fechas.fecha_habilitacion_programada,
    });
    if (errorFecha) {
      toast.warning(errorFecha);
      return;
    }
    setGuardandoProgramar(true);
    setError('');
    setSuccess('');
    try {
      await updatePreceptor(programandoPreceptor.id_preceptor, {
        fecha_deshabilitacion_programada: fechas.fecha_deshabilitacion_programada || null,
        fecha_habilitacion_programada: fechas.fecha_habilitacion_programada || null,
      }, rol);
      toast.success(`Fechas programadas actualizadas correctamente.`);
      setMostrarProgramar(false);
      await fetchPreceptores();
      await refreshData();
    } catch (err) {
      toast.error(`Error al programar fechas: ${mensajeError(err)}`);
    } finally {
      setGuardandoProgramar(false);
    }
  };

  const handleCancelarProgramacion = async (campo) => {
    setGuardandoProgramar(true);
    try {
      await updatePreceptor(programandoPreceptor.id_preceptor, { [campo]: null }, rol);
      toast.success('Programación cancelada correctamente.');
      await fetchPreceptores();
      await refreshData();
    } catch (err) {
      toast.error(`Error al cancelar la programación: ${mensajeError(err)}`);
    } finally {
      setGuardandoProgramar(false);
    }
  };

  if (loading) {
    return <LoadingScreen text={`Cargando ${entidad}`} />;
  }

  const renderFormulario = () => (
    <FormModal title={editingPreceptor ? `Editar ${etiquetaSingular}` : `Nuevo ${etiquetaSingular}`} onClose={cerrarFormulario} error={error} onClearError={() => setError('')}>
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
            {/* Punto 6.3 / 6.4: mismo control de estado que Docentes. */}
            <div className="form-group-filter">
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

            <div className="preceptor-form-row preceptor-form-row--two">
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
                <NumericInput
                  id="preceptor-telefono"
                  label="Telefono"
                  value={formData.telefono}
                  onChange={(val) => setFormData((prev) => ({ ...prev, telefono: val }))}
                  placeholder="Ej: 1123456789"
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
        <h3><i className="fas fa-user-tie" aria-hidden="true" /> {etiquetaPlural}</h3>
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

      <AccionesLeyenda acciones={['editar', 'programar', 'habilitar', 'deshabilitar', 'eliminar']} />

      {/* Punto 9.2: Tabs para Administrar Preceptores / Asignación de Cursos (solo Admin) */}
      {!esJefe && (
        <div className="asist-tipo-selector mb-16">
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('admin')}
          >
            <i className="fas fa-user-tie" aria-hidden="true" /> Administrar Preceptores
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'asignacion-cursos' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setActiveTab('asignacion-cursos'); fetchAsignacionPreceptores(); }}
          >
            <i className="fas fa-calendar-day" aria-hidden="true" /> Asignación de Cursos
          </button>
        </div>
      )}

      {activeTab === 'asignacion-cursos' ? (
        <AsignacionCursosAdmin
          preceptores={asignacionPreceptores}
          preceptoresOrdenados={preceptoresOrdenadosAsignacion}
          selectedPreceptorId={selectedPreceptorId}
          setSelectedPreceptorId={setSelectedPreceptorId}
          cursosObj={cursosObj}
          cursosAsignados={cursosAsignados}
          cursosDisponibles={cursosDisponibles}
          searchAsignados={searchAsignados}
          setSearchAsignados={setSearchAsignados}
          searchDisponibles={searchDisponibles}
          setSearchDisponibles={setSearchDisponibles}
          handleAsignar={handleAsignar}
          handleQuitar={handleQuitar}
          guardando={guardando}
          error={error}
          success={success}
          fetchAsignacionPreceptores={fetchAsignacionPreceptores}
        />
      ) : (
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
                    <td>
                      <AccionesCelda
                        acciones={[
                          { accion: 'editar', onClick: () => abrirEditar(p) },
                          { accion: p.usuario_estado === false ? 'habilitar' : 'deshabilitar', onClick: () => toggleEstado(p), disabled: p.usuario_estado === null || p.usuario_estado === undefined },
                          { accion: 'programar', onClick: () => abrirProgramar(p) },
                          { accion: 'eliminar', onClick: () => handleDelete(p) },
                        ]}
                        entidad={entidad}
                      />
                    </td>
                  </tr>
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
      )}

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

      {mostrarProgramar && programandoPreceptor && (
        <ModalProgramarEstado
          abierto={mostrarProgramar}
          persona={programandoPreceptor}
          estadoActual={programaEstadoActual(programandoPreceptor)}
          fechaDeshabilitacion={programandoPreceptor.usuario_fecha_deshabilitacion_programada}
          fechaHabilitacion={programandoPreceptor.usuario_fecha_habilitacion_programada}
          guardando={guardandoProgramar}
          onCerrar={() => setMostrarProgramar(false)}
          onGuardar={handleGuardarProgramar}
          onCancelarProgramacion={handleCancelarProgramacion}
        />
      )}
    </div>
  );
}

function AsignacionCursosAdmin({
  preceptores,
  preceptoresOrdenados,
  selectedPreceptorId,
  setSelectedPreceptorId,
  cursosObj,
  cursosAsignados,
  cursosDisponibles,
  searchAsignados,
  setSearchAsignados,
  searchDisponibles,
  setSearchDisponibles,
  handleAsignar,
  handleQuitar,
  guardando,
  error,
  success,
  fetchAsignacionPreceptores,
}) {
  const preceptorObj = preceptores.find((p) => String(p.id) === String(selectedPreceptorId));
  // Punto 5.14: cursos que ningún preceptor tiene asignados.
  const sinPreceptor = cursosSinPreceptor(cursosObj, preceptores);

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3><i className="fas fa-calendar-day" aria-hidden="true" /> Asignación de Cursos a Preceptores</h3>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Punto 5.14: avisador de cursos sin preceptor */}
      {sinPreceptor.length > 0 && (
        <div className="alert alert-warning" role="alert">
          <i className="fas fa-exclamation-triangle" aria-hidden="true" />{' '}
          {etiquetaCursosSinPreceptor(sinPreceptor)}
        </div>
      )}

      {selectedPreceptorId && preceptorObj ? (
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 280px', minWidth: '260px' }}>
            <div className="card" style={{ height: '100%' }}>
              <div className="card-header-flex card-header-flex--compact">
                <h4>
                  <i className="fas fa-user-tie icon-muted" aria-hidden="true" />
                  {' '}{preceptorObj.apellido}, {preceptorObj.nombre}
                </h4>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => setSelectedPreceptorId('')}
                  title="Volver a la lista"
                >
                  <i className="fas fa-arrow-left" aria-hidden="true" /> Volver
                </button>
              </div>

              <div className="mb-12">
                <div className="empty-state-message flex-gap-16--wrap">
                  <span>
                    <strong>Cursos asignados:</strong> {cursosAsignados.length}
                  </span>
                </div>
              </div>

              <div className="mb-12">
                <input
                  type="text"
                  placeholder="Buscar cursos asignados..."
                  value={searchAsignados}
                  onChange={(e) => setSearchAsignados(e.target.value)}
                  className="search-input"
                />
              </div>

              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Curso</th>
                      <th>Año</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cursosAsignados.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="empty-state-message">
                          {searchAsignados ? 'No se encontraron cursos.' : 'No tiene cursos asignados.'}
                        </td>
                      </tr>
                    ) : (
                      cursosAsignados.map((curso) => (
                        <tr key={curso.id_curso}>
                          <td className="table-cell-strong">{curso.nombre_curso}</td>
                          <td>{curso.ciclo_anio || '---'}</td>
                          <td className="acciones-cell">
                            <button
                              type="button"
                              className="btn btn-sm btn-danger"
                              onClick={() => handleQuitar(curso.id_curso)}
                              disabled={guardando}
                              title="Quitar curso"
                            >
                              <i className="fas fa-times" aria-hidden="true" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div style={{ flex: '1 1 280px', minWidth: '260px' }}>
            <div className="card" style={{ height: '100%' }}>
              <div className="card-header-flex card-header-flex--compact">
                <h4>Cursos disponibles</h4>
                <span className="badge badge-neutral">{cursosDisponibles.length}</span>
              </div>

              <div className="mb-12">
                <input
                  type="text"
                  placeholder="Buscar cursos disponibles..."
                  value={searchDisponibles}
                  onChange={(e) => setSearchDisponibles(e.target.value)}
                  className="search-input"
                />
              </div>

              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Curso</th>
                      <th>Año</th>
                      <th>Preceptor actual</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cursosDisponibles.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="empty-state-message">
                          {searchDisponibles ? 'No se encontraron cursos.' : 'No hay cursos disponibles.'}
                        </td>
                      </tr>
                    ) : (
                      cursosDisponibles.map((curso) => {
                        const preceptorActual = preceptores.find((p) =>
                          (p.cursos || []).some((c) => c.id_curso === curso.id_curso),
                        );
                        return (
                          <tr key={curso.id_curso}>
                            <td className="table-cell-strong">{curso.nombre_curso}</td>
                            <td>{curso.ciclo_anio || '---'}</td>
                            <td>
                              {preceptorActual
                                ? `${preceptorActual.apellido}, ${preceptorActual.nombre}`
                                : <span style={{ color: '#999' }}>Sin asignar</span>}
                            </td>
                            <td className="acciones-cell">
                              <button
                                type="button"
                                className="btn btn-sm btn-success"
                                onClick={() => handleAsignar(curso.id_curso)}
                                disabled={guardando}
                                title="Asignar a este preceptor"
                              >
                                <i className="fas fa-plus" aria-hidden="true" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-12">
            <div className="empty-state-message flex-gap-16--wrap mb-12">
              <span><i className="fas fa-mouse-pointer" aria-hidden="true" /> Seleccioná un preceptor para ver y administrar sus cursos</span>
            </div>
          </div>

          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Preceptor</th>
                  <th>Cursos Asignados</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {preceptoresOrdenados.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="empty-state-message">
                      No hay preceptores registrados.
                    </td>
                  </tr>
                ) : (
                  preceptoresOrdenados.map((p) => (
                    <tr key={p.id_preceptor}>
                      <td className="table-cell-strong">
                        <i className="fas fa-user-tie icon-muted" aria-hidden="true" />
                        {' '}{p.apellido}, {p.nombre}
                      </td>
                      <td>
                        {(p.cursos || []).length > 0
                          ? (p.cursos || []).map((c) => c.nombre_curso).join(', ')
                          : <span style={{ color: '#999' }}>Sin cursos</span>}
                      </td>
                      <td className="acciones-cell">
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={() => setSelectedPreceptorId(p.id)}
                          title="Administrar cursos"
                        >
                          <i className="fas fa-edit" aria-hidden="true" /> Administrar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Preceptores;
