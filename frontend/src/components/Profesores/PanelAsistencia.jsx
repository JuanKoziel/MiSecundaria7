import { useState, useEffect, useMemo, useCallback } from 'react';
import { useData } from '../../context/DataContext';
import { getServerTime, createAsistencia, getAsistencias, getCargasUnica, marcarCargaUnica } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

function serverTimestamp(serverInfo) {
  if (!serverInfo?.fecha) return Date.now();
  if (serverInfo.hora) return Date.parse(`${serverInfo.fecha}T${serverInfo.hora}`) || Date.now();
  return Date.parse(serverInfo.fecha) || Date.now();
}

function formatearTiempoRestante(fechaVencimiento, refMs) {
  if (!fechaVencimiento) return '--:--';
  const restaMs = Date.parse(fechaVencimiento) - (refMs || Date.now());
  if (restaMs <= 0) return '0:00';
  const totalSeg = Math.floor(restaMs / 1000);
  const mm = Math.floor(totalSeg / 60);
  const ss = totalSeg % 60;
  return `${mm}:${String(ss).padStart(2, '0')}`;
}

function PanelAsistencia({ cursoMateriaId, cursoId, cursoNombre, puedeEditar = true }) {
  const { alumnos, estadosAsistencia, refreshData } = useData();
  const { user } = useAuth();
  const toast = useToast();
  const [serverInfo, setServerInfo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [filas, setFilas] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [fechaSeleccionada, setFechaSeleccionada] = useState('');
  const [cargaUnica, setCargaUnica] = useState(null);
  const [, setSegundoTick] = useState(0);

  const alumnosCurso = useMemo(
    () => alumnos.filter((a) => a.id_curso === cursoId),
    [alumnos, cursoId],
  );

  const cargarServerTime = useCallback(async () => {
    setCargando(true);
    setMensaje('');
    try {
      const info = await getServerTime(cursoMateriaId);
      setServerInfo(info);
      if (info?.fecha && !fechaSeleccionada) {
        setFechaSeleccionada(info.fecha);
      }
    } catch (err) {
      toast.error(`Error al obtener hora del servidor: ${err.message}`);
    } finally {
      setCargando(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursoMateriaId]);

  useEffect(() => {
    cargarServerTime();
  }, [cargarServerTime]);

  const cargarCargaUnica = useCallback(async () => {
    if (!cursoMateriaId || !serverInfo?.fecha) return;
    try {
      const data = await getCargasUnica({ curso_materia: cursoMateriaId, fecha: serverInfo.fecha });
      setCargaUnica(Array.isArray(data) ? (data[0] || null) : data);
    } catch {
      setCargaUnica(null);
    }
  }, [cursoMateriaId, serverInfo?.fecha]);

  useEffect(() => {
    cargarCargaUnica();
  }, [cargarCargaUnica]);

  useEffect(() => {
    const iv = setInterval(() => setSegundoTick((t) => t + 1), 1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (serverInfo?.fecha && !fechaSeleccionada) {
      setFechaSeleccionada(serverInfo.fecha);
    }
  }, [serverInfo?.fecha, fechaSeleccionada]);

  useEffect(() => {
    if (alumnosCurso.length === 0 || !cursoMateriaId || !fechaSeleccionada) {
      setFilas([]);
      return;
    }

    let cancelado = false;

    const cargarAsistencias = async () => {
      const filasBase = alumnosCurso.map((a) => ({
        id: a.id,
        nombre: `${a.apellido}, ${a.nombre}`,
        estado: '',
      }));

      try {
        const data = await getAsistencias({
          curso_materia: cursoMateriaId,
          fecha: fechaSeleccionada,
        });

        if (cancelado) return;

        const asistenciaMap = {};
        if (Array.isArray(data)) {
          data.forEach((a) => {
            const alumnoId = typeof a.id_alumno === 'object' ? a.id_alumno?.id_alumno : a.id_alumno;
            const estadoNombre = a.estado_nombre
              || a.id_estado_asistencia?.nombre_estado
              || (typeof a.id_estado_asistencia === 'object' ? a.id_estado_asistencia?.nombre_estado : null);
            if (alumnoId && estadoNombre) {
              asistenciaMap[alumnoId] = estadoNombre;
            }
          });
        }

        setFilas(
          filasBase.map((fila) => ({
            ...fila,
            estado: asistenciaMap[fila.id] || '',
          })),
        );
      } catch {
        if (!cancelado) {
          setFilas(filasBase);
        }
      }
    };

    cargarAsistencias();

    return () => {
      cancelado = true;
    };
  }, [alumnosCurso, cursoMateriaId, fechaSeleccionada]);

  // Carga única de 20 minutos otorgada por el preceptor: la ventana activa
  // autoriza cargar aunque no se esté en horario; al cargar (o vencer) el
  // panel queda de solo lectura.
  const cargaDelDia = cargaUnica && cargaUnica.fecha === serverInfo?.fecha ? cargaUnica : null;
  const asistenciasPedida = Boolean(cargaDelDia?.pendientes?.includes('asistencias'));
  const asistCargada = Boolean(cargaDelDia?.asistencias_cargada);
  const cargaVencida = cargaDelDia?.estado === 'vencida';
  const ventanaActiva = Boolean(cargaDelDia) && asistenciasPedida && !asistCargada && !cargaVencida;

  const enHorario = serverInfo?.estado?.codigo === 'en_horario';
  const esFechaHoy = fechaSeleccionada === serverInfo?.fecha;
  const enHorarioEfectivo = enHorario || ventanaActiva;

  const handleEstadoChange = (id, nuevoEstado) => {
    setFilas((prev) =>
      prev.map((a) => (a.id === id ? { ...a, estado: nuevoEstado } : a)),
    );
  };

  const handleFechaChange = (nuevaFecha) => {
    setFechaSeleccionada(nuevaFecha);
  };

  const handleGuardar = async () => {
    if (!enHorarioEfectivo) return;
    if (!esFechaHoy) {
      toast.warning('Solo puede guardar asistencias para la fecha de hoy.');
      return;
    }
    const alumnosConEstado = filas.filter((a) => a.estado);
    if (alumnosConEstado.length === 0) {
      toast.warning('Seleccioná un estado de asistencia para al menos un estudiante.');
      return;
    }
    setGuardando(true);
    setMensaje('');
    try {
      const estadoMap = {};
      estadosAsistencia.forEach((e) => {
        estadoMap[e.nombre_estado] = e.id_estado_asistencia;
      });
      const promises = alumnosConEstado.map((a) => {
        const idEstado = estadoMap[a.estado];
        return createAsistencia({
          id_alumno: a.id,
          id_curso_materia: cursoMateriaId,
          id_estado_asistencia: idEstado,
          fecha: fechaSeleccionada,
        });
      });
      await Promise.all(promises);
      if (ventanaActiva) {
        try {
          await marcarCargaUnica({
            id_curso_materia: cursoMateriaId,
            fecha: fechaSeleccionada,
            item: 'asistencias',
          });
        } catch {
          // La carga igual quedó guardada; el banner se refresca en pantalla.
        }
        await cargarCargaUnica();
      }
      toast.success('Asistencia guardada exitosamente.');
      await refreshData();
      await cargarServerTime();
    } catch (err) {
      const detail = err.response?.data;
      const msg = typeof detail === 'object' ? JSON.stringify(detail) : detail || err.message;
      toast.error(msg);
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className="card">
        <h3><i className="fas fa-calendar-check" aria-hidden="true" /> Planilla de Asistencia</h3>
        <p>Obteniendo información del servidor...</p>
      </div>
    );
  }

  if (serverInfo?.docente_ausente) {
    return (
      <div className="card" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px', textAlign: 'center' }}>
        <div style={{ maxWidth: '480px' }}>
          <div style={{ fontSize: '3em', marginBottom: '16px' }}>&#128683;</div>
          <h3 style={{ marginBottom: '12px', color: '#dc3545' }}>No puede registrar asistencias</h3>
          <p style={{ color: '#555', lineHeight: '1.6', margin: 0 }}>
            Fue marcado como <strong style={{ color: '#dc3545' }}>AUSENTE</strong> por el preceptor:
          </p>
          {serverInfo.preceptor && (
            <p style={{ color: '#333', fontWeight: 600, fontSize: '1.1em', margin: '8px 0' }}>
              {serverInfo.preceptor}
            </p>
          )}
          <p style={{ color: '#555', lineHeight: '1.6', margin: 0 }}>
            para este bloque horario.
          </p>
          <p style={{ color: '#555', lineHeight: '1.6', marginTop: '8px', marginBottom: 0 }}>
            Por ese motivo no puede registrar la asistencia de los alumnos durante esta clase.
          </p>
        </div>
      </div>
    );
  }

  if (serverInfo?.evento_activo) {
    return (
      <div className="card" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px', textAlign: 'center' }}>
        <div style={{ maxWidth: '480px' }}>
          <div style={{ fontSize: '3em', marginBottom: '16px' }}>&#128683;</div>
          <h3 style={{ marginBottom: '12px', color: '#dc3545' }}>No es posible registrar asistencias</h3>
          <p style={{ color: '#555', lineHeight: '1.6', margin: 0 }}>
            Actualmente existe un evento institucional activo.
          </p>
          <p style={{ color: '#555', lineHeight: '1.6', marginTop: '8px', marginBottom: 0 }}>
            Evento: <strong style={{ color: '#333' }}>{serverInfo.evento_tipo}</strong>
          </p>
          {serverInfo.evento_descripcion && (
            <p style={{ color: '#555', lineHeight: '1.6', marginTop: '4px', marginBottom: 0 }}>
              Descripción: <strong style={{ color: '#333' }}>{serverInfo.evento_descripcion}</strong>
            </p>
          )}
          {serverInfo.evento_horario && (
            <p style={{ color: '#555', lineHeight: '1.6', marginTop: '4px', marginBottom: 0 }}>
              Horario afectado: <strong style={{ color: '#333' }}>{serverInfo.evento_horario}</strong>
            </p>
          )}
          <p style={{ color: '#555', lineHeight: '1.6', marginTop: '12px', marginBottom: 0, fontStyle: 'italic' }}>
            Las asistencias volverán a habilitarse automáticamente al finalizar el evento.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3><i className="fas fa-calendar-check" aria-hidden="true" /> Planilla de Asistencia</h3>
        <div className="flex-row">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={cargarServerTime}
            disabled={cargando}
          >
            <i className="fas fa-sync" aria-hidden="true" /> Actualizar
          </button>
          {puedeEditar && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleGuardar}
              disabled={guardando || !enHorarioEfectivo || !esFechaHoy || filas.length === 0}
            >
              <i className="fas fa-save" aria-hidden="true" /> {guardando ? 'Guardando...' : 'Guardar Asistencia'}
            </button>
          )}
        </div>
      </div>

      {!puedeEditar && (
        <p
          style={{
            background: '#fff4cf',
            borderLeft: '4px solid #d97706',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '0.9rem',
            color: '#854d0e',
            lineHeight: '1.6',
          }}
        >
          <i className="fas fa-lock" style={{ marginRight: '8px' }} aria-hidden="true" />
          Esta materia está asignada temporalmente a un docente suplente. La asistencia es de solo lectura hasta que finalice la suplencia.
        </p>
      )}

      {mensaje && (
        <p style={{ color: mensaje.startsWith('Error') ? 'red' : 'green', margin: '8px 0' }}>
          {mensaje}
        </p>
      )}

      {cargaDelDia && asistenciasPedida && !asistCargada && !cargaVencida && (
        <p
          className="mb-12"
          style={{
            padding: '10px 14px', borderRadius: '6px', fontSize: '0.9rem',
            background: '#d1e7dd', borderLeft: '4px solid #198754', color: '#0f5132', lineHeight: '1.5',
          }}
        >
          <i className="fas fa-hourglass-half" style={{ marginRight: '8px' }} aria-hidden="true" />
          <strong>Carga única activa (20 minutos):</strong>{' '}
          te quedan <strong>{formatearTiempoRestante(cargaDelDia.fecha_vencimiento, serverTimestamp(serverInfo))}</strong> para
          cargar las asistencias. Se guarda una sola vez: al cargarlas ya no podrás editarlas.
        </p>
      )}

      {asistCargada && (
        <p
          className="mb-12"
          style={{
            padding: '10px 14px', borderRadius: '6px', fontSize: '0.9rem',
            background: '#f8f9fa', borderLeft: '4px solid #6c757d', color: '#495057', lineHeight: '1.5',
          }}
        >
          <i className="fas fa-lock" style={{ marginRight: '8px' }} aria-hidden="true" />
          <strong>Carga única realizada.</strong> Las asistencias de hoy quedaron bloqueadas y no
          pueden modificarse de nuevo.
        </p>
      )}

      {cargaDelDia && asistenciasPedida && !asistCargada && cargaVencida && (
        <p
          className="mb-12"
          style={{
            padding: '10px 14px', borderRadius: '6px', fontSize: '0.9rem',
            background: '#f8d7da', borderLeft: '4px solid #dc3545', color: '#842029', lineHeight: '1.5',
          }}
        >
          <i className="fas fa-lock" style={{ marginRight: '8px' }} aria-hidden="true" />
          <strong>La carga única de asistencias venció.</strong> El plazo de 20 minutos finalizó y ya
          no podés cargarlas por este medio.
        </p>
      )}

      <div className="filter-row">
        <div className="form-group-filter">
          <label>Fecha</label>
          <input
            type="date"
            value={fechaSeleccionada || serverInfo?.fecha || ''}
            onChange={(e) => handleFechaChange(e.target.value)}
          />
        </div>
        <div className="form-group-filter">
          <label>Hora (servidor)</label>
          <input type="text" value={serverInfo?.hora || ''} readOnly disabled />
        </div>
        <div className="form-group-filter">
          <label>Día</label>
          <input type="text" value={serverInfo?.dia_semana || ''} readOnly disabled />
        </div>
      </div>

      {serverInfo?.estado?.mensaje && !ventanaActiva && (
        <p className={`asist-info-banner ${enHorario ? 'asist-ok' : 'asist-bloqueado'} mb-12`}
           style={{ padding: '8px 12px', borderRadius: '4px',
                   backgroundColor: enHorario ? '#d4edda' : '#fff3cd',
                   color: enHorario ? '#155724' : '#856404' }}>
          <i className={`fas ${enHorario ? 'fa-check-circle' : 'fa-info-circle'}`} aria-hidden="true" />
          {' '}{serverInfo.estado.mensaje}
        </p>
      )}

      {!esFechaHoy && (
        <p style={{ padding: '8px 12px', borderRadius: '4px', backgroundColor: '#e2e3e5', color: '#383d41', margin: '8px 0', fontSize: '0.9em' }}>
          <i className="fas fa-info-circle" aria-hidden="true" /> Viendo asistencias del día {fechaSeleccionada}. Para modificar, seleccione la fecha de hoy ({serverInfo?.fecha}).
        </p>
      )}

      {serverInfo?.horarios_hoy?.length > 0 && (
        <div className="mb-12 text-muted" style={{ fontSize: '0.9em' }}>
          <strong>Horarios de hoy:</strong>{' '}
          {serverInfo.horarios_hoy.map((h, i) => (
            <span key={i}>
              {i > 0 && ' — '}
              {h.hora_inicio} a {h.hora_fin}
            </span>
          ))}
        </div>
      )}

      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Estudiante</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {!enHorarioEfectivo && esFechaHoy ? (
              <tr>
                <td colSpan={2} className="empty-state-message">
                  {serverInfo?.estado?.mensaje || 'No hay horario disponible.'}
                </td>
              </tr>
            ) : filas.length === 0 ? (
              <tr>
                <td colSpan={2} className="empty-state-message">
                  {fechaSeleccionada !== serverInfo?.fecha
                    ? 'No hay asistencias registradas para esta fecha.'
                    : 'No hay alumnos en este curso.'}
                </td>
              </tr>
            ) : (
              filas.map((fila) => (
                <tr key={fila.id}>
                  <td className="table-cell-strong">{fila.nombre}</td>
<td>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {estadosAsistencia.map((estObj) => {
                        const est = estObj.nombre_estado;
                        const seleccionado = fila.estado === est;
                        const deshabilitado = fila.estado !== '' && !seleccionado;
                        const bloq = !puedeEditar || !enHorarioEfectivo || !esFechaHoy;
                        const colorMap = {
                          Presente: { border: '#28a745', bg: '#d4edda' },
                          Ausente: { border: '#dc3545', bg: '#f8d7da' },
                          Tarde: { border: '#ffc107', bg: '#fff3cd' },
                        };
                        const colors = colorMap[est] || { border: '#6f42c1', bg: '#e8d5f5' };
                        return (
                          <button
                            key={est}
                            type="button"
                            onClick={() => {
                              if (bloq || deshabilitado) return;
                              handleEstadoChange(fila.id, seleccionado ? '' : est);
                            }}
                            style={{
                              padding: '4px 14px',
                              borderRadius: '16px',
                              border: seleccionado ? '2px solid' : '1px solid #ccc',
                              borderColor: seleccionado ? colors.border : '#ccc',
                              backgroundColor: seleccionado ? colors.bg : '#fff',
                              color: seleccionado ? colors.border : '#333',
                            }}
                            disabled={bloq || deshabilitado}
                          >
                            {est}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PanelAsistencia;
