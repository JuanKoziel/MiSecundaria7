import { useState } from 'react';
import { useData } from '../../context/DataContext';

const ESTADOS = ['Presente', 'Ausente', 'Tarde'];

function PanelAsistencia() {
  const { asistenciaDocenteInicial } = useData();
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [alumnos, setAlumnos] = useState(asistenciaDocenteInicial);

  const handleEstadoChange = (id, nuevoEstado) => {
    setAlumnos((prev) =>
      prev.map((a) => (a.id === id ? { ...a, estado: nuevoEstado } : a))
    );
  };

  const handleGuardar = () => {
    alert('Asistencia guardada correctamente (modo demostración).');
  };

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Planilla de Asistencia</h3>
        <button type="button" className="btn btn-primary" onClick={handleGuardar}>
          <i className="fas fa-save" aria-hidden="true" /> Guardar Asistencia
        </button>
      </div>

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
