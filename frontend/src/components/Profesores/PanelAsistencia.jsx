import { useState, useEffect, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { createAsistencia } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ESTADOS = ['Presente', 'Ausente', 'Tarde'];

function PanelAsistencia({ cursoMateriaId, cursoId, cursoNombre }) {
  const { alumnos, estadosAsistencia, refreshData } = useData();
  const { user } = useAuth();
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [filas, setFilas] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const alumnosCurso = useMemo(
    () => alumnos.filter((a) => a.id_curso === cursoId),
    [alumnos, cursoId],
  );

  useEffect(() => {
    setFilas(
      alumnosCurso.map((a) => ({
        id: a.id,
        nombre: `${a.apellido}, ${a.nombre}`,
        estado: 'Presente',
      })),
    );
  }, [alumnosCurso]);

  const handleEstadoChange = (id, nuevoEstado) => {
    setFilas((prev) =>
      prev.map((a) => (a.id === id ? { ...a, estado: nuevoEstado } : a)),
    );
  };

  const handleGuardar = async () => {
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
          fecha,
          id_estado_asistencia: estadoMap[a.estado] || estadosAsistencia[0]?.id_estado_asistencia || 1,
          id_usuario: user?.id || 1,
        }),
      );
      await Promise.all(promises);
      setMensaje('Asistencia guardada exitosamente.');
      await refreshData();
    } catch (err) {
      const detail = err.response?.data;
      const msg = typeof detail === 'object' ? JSON.stringify(detail) : detail || err.message;
      setMensaje(`Error: ${msg}`);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Planilla de Asistencia — {cursoNombre}</h3>
        <button type="button" className="btn btn-primary" onClick={handleGuardar} disabled={guardando}>
          <i className="fas fa-save" aria-hidden="true" /> {guardando ? 'Guardando...' : 'Guardar Asistencia'}
        </button>
      </div>

      {mensaje && (
        <p style={{ color: mensaje.startsWith('Error') ? 'red' : 'green', margin: '8px 0' }}>
          {mensaje}
        </p>
      )}

      <div className="filter-row">
        <div className="form-group-filter">
          <label htmlFor="fecha-asistencia">Fecha</label>
          <input
            id="fecha-asistencia"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </div>
      </div>

      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Alumno</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {filas.length === 0 ? (
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
