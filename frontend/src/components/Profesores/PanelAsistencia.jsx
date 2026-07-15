import { useState, useEffect, useMemo, useCallback } from 'react';
import { useData } from '../../context/DataContext';
import { getServerTime, createAsistencia } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ESTADOS = ['Presente', 'Ausente', 'Tarde', 'Retiro'];

function PanelAsistencia({ cursoMateriaId, cursoId, cursoNombre }) {
  const { alumnos, estadosAsistencia, refreshData } = useData();
  const { user } = useAuth();
  const [serverInfo, setServerInfo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [filas, setFilas] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');

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
    } catch (err) {
      setMensaje(`Error al obtener hora del servidor: ${err.message}`);
    } finally {
      setCargando(false);
    }
  }, [cursoMateriaId]);

  useEffect(() => {
    cargarServerTime();
  }, [cargarServerTime]);

  useEffect(() => {
    if (alumnosCurso.length > 0) {
      setFilas(
        alumnosCurso.map((a) => ({
          id: a.id,
          nombre: `${a.apellido}, ${a.nombre}`,
          estado: '',
        })),
      );
    }
  }, [alumnosCurso]);

  const enHorario = serverInfo?.estado?.codigo === 'en_horario';

  const handleEstadoChange = (id, nuevoEstado) => {
    setFilas((prev) =>
      prev.map((a) => (a.id === id ? { ...a, estado: nuevoEstado } : a)),
    );
  };

  const handleGuardar = async () => {
    if (!enHorario) return;
    setGuardando(true);
    setMensaje('');
    try {
      const estadoMap = {};
      estadosAsistencia.forEach((e) => {
        estadoMap[e.nombre_estado] = e.id_estado_asistencia;
      });
      const promises = filas.map((a) => {
        let idEstado;
        if (a.estado === 'Retiro') {
          idEstado = 4;
        } else if (a.estado) {
          idEstado = estadoMap[a.estado];
        }
        return createAsistencia({
          id_alumno: a.id,
          id_curso_materia: cursoMateriaId,
          id_estado_asistencia: idEstado || estadosAsistencia[0]?.id_estado_asistencia || 1,
        });
      });
      await Promise.all(promises);
      setMensaje('Asistencia guardada exitosamente.');
      await refreshData();
      await cargarServerTime();
    } catch (err) {
      const detail = err.response?.data;
      const msg = typeof detail === 'object' ? JSON.stringify(detail) : detail || err.message;
      setMensaje(`Error: ${msg}`);
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className="card">
        <h3>Planilla de Asistencia — {cursoNombre}</h3>
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

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Planilla de Asistencia — {cursoNombre}</h3>
        <div className="flex-row">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={cargarServerTime}
            disabled={cargando}
          >
            <i className="fas fa-sync" aria-hidden="true" /> Actualizar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleGuardar}
            disabled={guardando || !enHorario || filas.length === 0}
          >
            <i className="fas fa-save" aria-hidden="true" /> {guardando ? 'Guardando...' : 'Guardar Asistencia'}
          </button>
        </div>
      </div>

      {mensaje && (
        <p style={{ color: mensaje.startsWith('Error') ? 'red' : 'green', margin: '8px 0' }}>
          {mensaje}
        </p>
      )}

      <div className="filter-row">
        <div className="form-group-filter">
          <label>Fecha (servidor)</label>
          <input type="date" value={serverInfo?.fecha || ''} readOnly disabled />
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

      {serverInfo?.estado?.mensaje && (
        <p className={`asist-info-banner ${enHorario ? 'asist-ok' : 'asist-bloqueado'} mb-12`}
           style={{ padding: '8px 12px', borderRadius: '4px',
                   backgroundColor: enHorario ? '#d4edda' : '#fff3cd',
                   color: enHorario ? '#155724' : '#856404' }}>
          <i className={`fas ${enHorario ? 'fa-check-circle' : 'fa-info-circle'}`} aria-hidden="true" />
          {' '}{serverInfo.estado.mensaje}
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
              <th>Alumno</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {!enHorario ? (
              <tr>
                <td colSpan={2} className="empty-state-message">
                  {serverInfo?.estado?.mensaje || 'No hay horario disponible.'}
                </td>
              </tr>
            ) : filas.length === 0 ? (
              <tr>
                <td colSpan={2} className="empty-state-message">
                  No hay alumnos en este curso.
                </td>
              </tr>
            ) : (
              filas.map((fila) => (
                <tr key={fila.id}>
                  <td className="table-cell-strong">{fila.nombre}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {ESTADOS.map((est) => {
                        const seleccionado = fila.estado === est;
                        const deshabilitado = fila.estado !== '' && !seleccionado;
                        return (
                          <button
                            key={est}
                            type="button"
                            onClick={() => {
                              if (deshabilitado) return;
                              handleEstadoChange(fila.id, seleccionado ? '' : est);
                            }}
                            style={{
                              padding: '4px 14px',
                              borderRadius: '16px',
                              border: seleccionado ? '2px solid' : '1px solid #ccc',
                              borderColor: seleccionado
                                ? (est === 'Presente' ? '#28a745' : est === 'Ausente' ? '#dc3545' : est === 'Tarde' ? '#ffc107' : '#6f42c1')
                                : '#ccc',
                              backgroundColor: seleccionado
                                ? (est === 'Presente' ? '#d4edda' : est === 'Ausente' ? '#f8d7da' : est === 'Tarde' ? '#fff3cd' : '#e8d5f5')
                                : (deshabilitado ? '#f5f5f5' : '#fff'),
                              color: seleccionado
                                ? (est === 'Presente' ? '#155724' : est === 'Ausente' ? '#721c24' : est === 'Tarde' ? '#856404' : '#38315a')
                                : (deshabilitado ? '#bbb' : '#333'),
                              cursor: deshabilitado ? 'not-allowed' : 'pointer',
                              fontWeight: seleccionado ? 600 : 400,
                              fontSize: '0.85em',
                              opacity: deshabilitado ? 0.5 : 1,
                              transition: 'all 0.15s ease',
                              outline: 'none',
                            }}
                          >
                            {seleccionado ? '✓ ' : ''}{est}
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
