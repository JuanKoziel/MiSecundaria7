import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { createAsistencia } from '../../services/api';

const ESTADOS = ['Presente', 'Ausente', 'Tarde'];

function PanelAsistencia() {
  const { asistenciaDocenteInicial, cursoMateria, estadosAsistencia, refreshData } = useData();
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [alumnos, setAlumnos] = useState(asistenciaDocenteInicial);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const handleEstadoChange = (id, nuevoEstado) => {
    setAlumnos((prev) =>
      prev.map((a) => (a.id === id ? { ...a, estado: nuevoEstado } : a))
    );
  };

  const handleGuardar = async () => {
    setGuardando(true);
    setMensaje('');
    try {
      const primerCm = cursoMateria[0];
      if (!primerCm) {
        setMensaje('No hay curso-materia disponible.');
        setGuardando(false);
        return;
      }
      const estadoMap = {};
      estadosAsistencia.forEach((e) => { estadoMap[e.nombre_estado] = e.id_estado_asistencia; });
      const promises = alumnos.map((a) =>
        createAsistencia({
          id_alumno: a.id,
          id_curso_materia: primerCm.id,
          fecha,
          id_estado_asistencia: estadoMap[a.estado] || estadosAsistencia[0]?.id_estado_asistencia || 1,
          id_usuario: 1,
        }),
      );
      await Promise.all(promises);
      setMensaje('Asistencia guardada exitosamente.');
      await refreshData();
    } catch (err) {
      setMensaje(`Error: ${err.response?.data?.detail || err.message}`);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Planilla de Asistencia</h3>
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
            {alumnos.map((alumno) => (
              <tr key={alumno.id}>
                <td className="table-cell-strong">{alumno.nombre}</td>
                <td>
                  <select
                    value={alumno.estado}
                    onChange={(e) => handleEstadoChange(alumno.id, e.target.value)}
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PanelAsistencia;
