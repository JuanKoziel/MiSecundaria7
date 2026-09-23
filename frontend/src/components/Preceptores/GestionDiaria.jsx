import { useEffect, useMemo, useState } from 'react';
import { useData } from '../../context/DataContext';
import { getLibroTemas, enviarCargaUnica, getAsistencias } from '../../services/api';
import EmptyFiltros from './EmptyFiltros';
import { filtrosCompletos } from './preceptorUtils';
import LoadingSpinner from '../Shared/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import { mensajeErrorAmigable } from '../../utils/errores';

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function formatFecha(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'short' }).format(date);
}

function mensajeError(err) {
  return mensajeErrorAmigable(err);
}

function ultimaFecha(items, keyF = 'fecha') {
  let ultima = null;
  (items || []).forEach((it) => {
    const f = it[keyF];
    if (f && (!ultima || String(f) > String(ultima))) ultima = f;
  });
  return ultima;
}

function CargaTipoItem({ tipo, ok, detalle, onVer, neutro = false }) {
  const estado = !ok ? (neutro ? 'neutro' : 'no') : 'ok';
  const icono = ok ? 'fa-check' : (neutro ? 'fa-info' : 'fa-times');
  return (
    <div className={`carga-item carga-item-${estado}`}>
      <span className={`carga-item-icon ${estado}`}>
        <i className={`fas ${icono}`} aria-hidden="true" />
      </span>
      <div className="carga-item-info">
        <span className="carga-item-tipo">{tipo}</span>
        <span className="carga-item-detalle">{detalle}</span>
      </div>
      {ok && (
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary carga-item-btn"
          onClick={onVer}
          title={`Ver ${tipo.toLowerCase()}`}
        >
          <i className="fas fa-eye" aria-hidden="true" /> Ver
        </button>
      )}
    </div>
  );
}

function fechaHoyLocal() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function hhmmAhora() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function GestionDiaria({ anioLectivo, curso, onNavigate }) {
  const { cursosObj, cursoMateria, calificacionesCompletas, horarios, preceptores } = useData();
  const toast = useToast();
  const [libroTemas, setLibroTemas] = useState([]);
  const [asistenciasHoy, setAsistenciasHoy] = useState([]);
  const [cargandoLibro, setCargandoLibro] = useState(false);
  const [modoCargaUnica, setModoCargaUnica] = useState(null); // { id_curso_materia, temporizador }
  const [guardandoCargaUnica, setGuardandoCargaUnica] = useState(false);
  const [notificacionesEnviadas, setNotificacionesEnviadas] = useState(new Set());

  const filtrosOk = filtrosCompletos(anioLectivo, curso);

  const cursoId = useMemo(() => {
    if (!curso) return null;
    const c = (cursosObj || []).find((x) => x.nombre_curso === curso);
    return c?.id_curso || null;
  }, [curso, cursosObj]);

  const diaHoy = DIAS_SEMANA[new Date().getDay()];

  const cmIdsConClaseHoy = useMemo(() => {
    if (!cursoId) return new Set();
    return new Set(
      (horarios || [])
        .filter((h) => Number(h.id_curso) === Number(cursoId) && h.dia_semana === diaHoy)
        .map((h) => h.id_curso_materia),
    );
  }, [cursoId, horarios, diaHoy]);

  // Bloques horarios de HOY de un curso-materia (para mostrar el horario real
  // y saber si la clase ya comenzó).
  const bloquesHoraDe = (cmId) =>
    (horarios || [])
      .filter((h) => Number(h.id_curso_materia) === Number(cmId) && h.dia_semana === diaHoy)
      .map((h) => ({ inicio: h.hora_inicio || '', fin: h.hora_fin || '' }))
      .filter((b) => b.inicio)
      .sort((a, b) => a.inicio.localeCompare(b.inicio));

  const materiasCurso = useMemo(() => {
    if (!cursoId) return [];
    return (cursoMateria || [])
      .filter((cm) => Number(cm.id_curso) === Number(cursoId) && cmIdsConClaseHoy.has(cm.id))
      .sort((a, b) => (a.materia_nombre || '').localeCompare(b.materia_nombre || ''));
  }, [cursoId, cursoMateria, cmIdsConClaseHoy]);

  const libroPorMateria = useMemo(() => {
    const mapa = {};
    (libroTemas || []).forEach((lt) => {
      const cmId = lt.id_curso_materia;
      if (cmId === null || cmId === undefined) return;
      const f = lt.fecha || lt.fecha_creacion || '';
      if (!mapa[cmId] || String(f) > String(mapa[cmId])) mapa[cmId] = f;
    });
    return mapa;
  }, [libroTemas]);

  useEffect(() => {
    if (!cursoId) {
      setLibroTemas([]);
      setCargandoLibro(false);
      return;
    }
    setCargandoLibro(true);
    getLibroTemas({ curso: cursoId })
      .then((data) => {
        setLibroTemas(Array.isArray(data) ? data : data.results || []);
      })
      .catch(() => setLibroTemas([]))
      .finally(() => setCargandoLibro(false));
  }, [cursoId]);

  // Las asistencias del panel diario se piden puntualmente por curso y fecha
  // (la tabla completa no se baja al DataContext desde B13).
  useEffect(() => {
    if (!cursoId) {
      setAsistenciasHoy([]);
      return;
    }
    getAsistencias({ curso: cursoId, fecha: fechaHoyLocal() })
      .then((data) => {
        setAsistenciasHoy(Array.isArray(data) ? data : data.results || []);
      })
      .catch(() => setAsistenciasHoy([]));
  }, [cursoId]);

  if (!filtrosOk) {
    return (
      <div className="card">
        <div className="card-header-flex">
          <h3><i className="fas fa-clipboard-check" aria-hidden="true" /> Panel Diario — Gestión Diaria</h3>
        </div>
        <EmptyFiltros />
      </div>
    );
  }

  const asistenciasDe = (cmId) => asistenciasHoy.filter((a) => Number(a.id_curso_materia) === Number(cmId));
  const calificacionesDe = (cmId) => (calificacionesCompletas || []).filter((c) => c.id_curso_materia === cmId);

  const toggleCargaUnica = async (cmId) => {
    if (modoCargaUnica && modoCargaUnica.id_curso_materia === cmId) {
      // Ya está activo, cerrarlo
      setModoCargaUnica(null);
      return;
    }
    // Solo las cargas diarias obligatorias disparan la notificación:
    // asistencias y libro de temas. Las calificaciones no son diarias.
    const asigs = asistenciasDe(cmId);
    const hayAsistencias = asigs.length > 0;
    const libros = (libroTemas || []).filter((lt) => lt.id_curso_materia === cmId);
    const hayLibro = libros.length > 0;
    const faltantes = [];
    if (!hayAsistencias) faltantes.push('asistencias');
    if (!hayLibro) faltantes.push('libro_temas');

    if (faltantes.length === 0) {
      toast.info('No hay cargas pendientes para notificar.');
      return;
    }

    setGuardandoCargaUnica(true);
    try {
      const resultado = await enviarCargaUnica({ id_curso_materia: cmId, pendientes: faltantes });
      if (resultado && resultado.enviado === false) {
        toast.info(resultado.detail || 'No se pudo enviar la notificación.');
        return;
      }
      if (resultado && resultado.recordatorio) {
        // Rama 1 (B12): el docente sigue en horario de clase; solo se envía un
        // recordatorio, sin ventana de 20 minutos ni temporizador.
        setModoCargaUnica(null);
        toast.success(resultado.detail || 'Recordatorio enviado: el docente sigue en horario. No se abrió un plazo de 20 minutos.');
      } else if (resultado && resultado.destinatarios === 'preceptores_curso') {
        // Rama 2 (B12): terminó el horario sin cargar; se notificó a los
        // preceptores del curso para que revisen el panel diario.
        setModoCargaUnica(null);
        toast.success(resultado.detail || 'El docente no cargó en su horario: se notificó a los preceptores del curso.');
      } else {
        // Flujo original: ventana de carga única de 20 minutos para el docente.
        setModoCargaUnica({ id_curso_materia: cmId, inicio: new Date() });
        toast.success('Notificación enviada: el docente tiene 20 minutos para cargar.');
      }
    } catch (err) {
      toast.error(mensajeError(err));
    } finally {
      setGuardandoCargaUnica(false);
    }
  };

  const puedeEnviarCargaUnica = (cmId) => {
    if (!modoCargaUnica || modoCargaUnica.id_curso_materia !== cmId) return false;
    const diffMin = Math.round((new Date().getTime() - modoCargaUnica.inicio.getTime()) / 60000);
    return diffMin <= 20;
  };

  const obtenerTiempoRestante = (cmId) => {
    if (!modoCargaUnica || modoCargaUnica.id_curso_materia !== cmId) return null;
    const diffMin = Math.round((new Date().getTime() - modoCargaUnica.inicio.getTime()) / 60000);
    const restante = 20 - diffMin;
    return restante <= 0 ? 0 : restante;
  };

  const hayClasesHoy = diaHoy !== 'Sábado' && diaHoy !== 'Domingo' && cmIdsConClaseHoy.size > 0;

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3><i className="fas fa-clipboard-check" aria-hidden="true" /> Panel Diario — Gestión Diaria</h3>
      </div>

      <p className="upload-hint m-0 mb-12">
        Verificación por materia: el preceptor verifica si el docente cargó las asistencias y subió el libro de temas.
        Con <strong>"Recordar carga"</strong> se envía una notificación al docente para que complete lo pendiente en un plazo de 20 minutos.
        La sección de calificaciones es solo informativa (no son cargas diarias).
        {hayClasesHoy && (
          <> Mostrando únicamente las materias con clases el <strong>{diaHoy}</strong>.</>
        )}
      </p>

      {hayClasesHoy ? (
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Materia</th>
                <th>Docente</th>
                <th>Hora de clase</th>
                <th>Carga realizada</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {materiasCurso.map((cm) => {
                const asigs = asistenciasDe(cm.id);
                const ultAsig = ultimaFecha(asigs, 'fecha');
                const ultLibro = libroPorMateria[cm.id] || null;
                const cals = calificacionesDe(cm.id);
                const ultCal = ultimaFecha(cals, 'fecha_carga');
                const librosMateria = (libroTemas || []).filter((lt) => lt.id_curso_materia === cm.id);

                const { texto: txtAsist, hayCarga: haAsist } = (() => {
                  const asigs = asistenciasDe(cm.id);
                  if (asigs.length > 0) {
                    const ultAsig = ultimaFecha(asigs, 'fecha');
                    return {
                      texto: ultAsig ? `Última carga: ${formatFecha(ultAsig)}` : 'Sin asistencias registradas',
                      hayCarga: true,
                    };
                  }
                  return { texto: 'Sin asistencias registradas', hayCarga: false };
                })();

                // B12: el libro de temas es una carga DIARIA — solo cuenta
                // como realizado si hay una subida de HOY. Un libro de temas
                // viejo (de un día anterior) no debe mostrarse como "ya
                // subido": el docente tiene que subirlo de nuevo cada día que
                // tenga clase.
                const { texto: txtLibro, hayCarga: haLibro } = (() => {
                  const librosMateria = (libroTemas || []).filter((lt) => lt.id_curso_materia === cm.id);
                  const libroHoy = librosMateria.filter((lt) => String(lt.fecha || '').slice(0, 10) === diaHoyLocal());
                  if (libroHoy.length > 0) {
                    return {
                      texto: `Libro de temas cargado hoy (${formatFecha(libroHoy[0].fecha)})`,
                      hayCarga: true,
                    };
                  }
                  const ultLibro = libroPorMateria[cm.id];
                  return {
                    texto: ultLibro ? `Pendiente: solo hay libro del ${formatFecha(ultLibro)} — subí uno de hoy` : 'Sin libro de temas',
                    hayCarga: false,
                  };
                })();

                const { texto: txtCal, hayCarga: haCal } = (() => {
                  const cals = calificacionesDe(cm.id);
                  if (cals.length > 0) {
                    const ultCal = ultimaFecha(cals, 'fecha_carga');
                    return {
                      texto: ultCal ? `Última carga: ${formatFecha(ultCal)}` : 'Sin calificaciones',
                      hayCarga: true,
                    };
                  }
                  return { texto: 'Sin calificaciones', hayCarga: false };
                })();

                // B12: la hora de clase se toma de los bloques de HOY de la
                // materia (bloquesHoraDe ya filtra por diaHoy), no del primer
                // horario de la tabla que puede corresponder a otro día
                // (ej. clase hoy de 12 a 13 pero primer registro de 9:55).
                const horaClase = (() => {
                  const bloques = bloquesHoraDe(cm.id);
                  if (bloques.length === 0) return '—';
                  return bloques
                    .map((b) => (b.inicio && b.fin ? `${b.inicio} - ${b.fin}` : b.inicio))
                    .join(', ');
                })();

                // Las calificaciones no son una carga diaria: no marcan
                // pendiente. La fila solo se resalta por asistencias o
                // libro de temas faltantes.
                const filaPendiente = !haAsist || !haLibro;
                const sinPendientes = haAsist && haLibro;

                // B12: la clase de HOY todavía puede NO haber comenzado (ej.
                // son las 10:24 pero la clase es de 12 a 13). En ese caso el
                // botón queda deshabilitado: no tiene sentido abrir una
                // ventana de 20 min antes de que el docente esté en horario.
                const bloquesCm = bloquesHoraDe(cm.id);
                const primerInicioHoy = bloquesCm.length ? bloquesCm[0].inicio : null;
                const claseNoComenzo = !!primerInicioHoy && hhmmAhora() < primerInicioHoy;

                return (
                  <tr key={cm.id} style={filaPendiente ? { background: 'rgba(220, 53, 69, 0.06)' } : undefined}>
                    <td className="table-cell-strong">{cm.materia_nombre || '—'}</td>
                    <td>{cm.docente_nombre || '—'}</td>
                    <td>{horaClase}</td>
                    <td>
                      <div className="carga-realizada">
                        <CargaTipoItem
                          tipo="Asistencias"
                          ok={haAsist}
                          detalle={txtAsist}
                          onVer={() => onNavigate && onNavigate('asistencias')}
                        />
                        <CargaTipoItem
                          tipo="Libro de temas"
                          ok={haLibro}
                          detalle={txtLibro}
                          onVer={() => onNavigate && onNavigate('libro-temas')}
                        />
                        <CargaTipoItem
                          tipo="Calificaciones"
                          ok={haCal}
                          neutro
                          detalle={txtCal}
                          onVer={() => onNavigate && onNavigate('notas')}
                        />
                      </div>
                    </td>
                    <td>
                      {modoCargaUnica && modoCargaUnica.id_curso_materia === cm.id ? (
                        <div style={{
                          margin: '8px 0',
                          padding: '8px',
                          background: '#fff3cd',
                          border: '1px solid #ffeeba',
                          borderRadius: '4px',
                        }}>
                          <span>Notificación enviada — el docente cargará en {obtenerTiempoRestante(cm.id)} min</span>
                          <br />
                          <small>Plazo máximo: 20 minutos para cargar asistencias y libro de temas</small>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => toggleCargaUnica(cm.id)}
                          title={
                            claseNoComenzo
                              ? `La clase de HOY todavía no comenzó (empieza a las ${primerInicioHoy}). Esperá a que el docente esté en horario para abrir el plazo de 20 minutos.`
                              : sinPendientes
                              ? 'No hay cargas pendientes para recordar'
                              : 'Recordar al docente cargar asistencias y libro de temas (plazo de 20 minutos)'
                          }
                          disabled={guardandoCargaUnica || sinPendientes || claseNoComenzo}
                        >
                          {guardandoCargaUnica ? (
                            <LoadingSpinner text="" size="sm" inline />
                          ) : (
                            <i className="fas fa-bell" aria-hidden="true" />
                          )}{' '}
                          Recordar carga
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="empty-state-message empty-state-centered">
          No hay materias con clases el {diaHoy} en este curso ({curso}).
        </p>
      )}

      <p className="upload-hint m-0 mt-12" style={{ fontSize: '12.5px' }}>
        <i className="fas fa-info-circle" aria-hidden="true" /> Los proyectos y archivos subidos por los docentes se encuentran en la sección Contenido del menú lateral.
      </p>
    </div>
  );
}

export default GestionDiaria;