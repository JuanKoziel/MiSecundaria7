import { useState, useEffect, useMemo, useCallback } from 'react';
import { useData } from '../../context/DataContext';
import { getServerTime, createAsistencia } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ESTADOS = ['Presente', 'Ausente', 'Tarde'];

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
          estado: 'Presente',
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
      const promises = filas.map((a) =>
        createAsistencia({
          id_alumno: a.id,
          id_curso_materia: cursoMateriaId,
          id_estado_asistencia: estadoMap[a.estado] || estadosAsistencia[0]?.id_estado_asistencia || 1,
        }),
      );
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

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Planilla de Asistencia — {cursoNombre}</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
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
        <p className={`asist-info-banner ${enHorario ? 'asist-ok' : 'asist-bloqueado'}`}
           style={{ padding: '8px 12px', borderRadius: '4px', marginBottom: '12px',
                   backgroundColor: enHorario ? '#d4edda' : '#fff3cd',
                   color: enHorario ? '#155724' : '#856404' }}>
          <i className={`fas ${enHorario ? 'fa-check-circle' : 'fa-info-circle'}`} aria-hidden="true" />
          {' '}{serverInfo.estado.mensaje}
        </p>
      )}

      {serverInfo?.horarios_hoy?.length > 0 && (
        <div style={{ marginBottom: '12px', fontSize: '0.9em', color: '#666' }}>
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
                    <select
                      value={fila.estado}
                      onChange={(e) => handleEstadoChange(fila.id, e.target.value)}
                      className="select-table"
                    >
                      {ESTADOS.map((est) => (
                        <option key={est} value={est}>
                          {est}
                        </option>
                      ))}
                    </select>
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
