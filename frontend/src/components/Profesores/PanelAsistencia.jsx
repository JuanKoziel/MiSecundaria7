import { useState } from 'react';
import { asistenciaDocenteInicial } from '../../data/mockData';

function PanelAsistencia() {
  const [alumnos, setAlumnos] = useState(asistenciaDocenteInicial);

  const cambiarAsistencia = (id, nuevoEstado) => {
    setAlumnos((prev) => prev.map((al) => (al.id === id ? { ...al, estado: nuevoEstado } : al)));
  };

  const getBadgeClass = (estado) => {
    if (estado === 'Presente') return 'badge-presente';
    if (estado === 'Ausente') return 'badge-ausente';
    return 'badge-tarde';
  };

  const handleConsolidar = () => {
    alert('Asistencia del día consolidada (modo demostración).');
  };

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Registro de Asistencias Diario</h3>
        <button type="button" className="btn btn-primary" onClick={handleConsolidar}>
          <i className="fas fa-check-double" aria-hidden="true" /> Consolidar Día
        </button>
      </div>

      <div className="global-field-box">
        <div className="field-row">
          <div className="field-group">
            <label htmlFor="fecha-dictado">Fecha de Dictado</label>
            <input id="fecha-dictado" type="date" defaultValue="2026-05-18" />
          </div>
          <div className="field-group field-group--grow">
            <label htmlFor="libro-temas">Libro de Temas de la Clase</label>
            <input
              id="libro-temas"
              type="text"
              placeholder="Escriba los contenidos y ejes conceptuales dictados hoy..."
            />
          </div>
        </div>
      </div>

      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Estudiante</th>
              <th>Estado Actual</th>
              <th>Cambiar Estado</th>
            </tr>
          </thead>
          <tbody>
            {alumnos.map((alumno) => (
              <tr key={alumno.id}>
                <td className="table-cell-strong">{alumno.nombre}</td>
                <td>
                  <span className={`badge ${getBadgeClass(alumno.estado)}`}>{alumno.estado}</span>
                </td>
                <td>
                  <div className="cb-container" role="radiogroup" aria-label={`Asistencia de ${alumno.nombre}`}>
                    {['Presente', 'Ausente', 'Tarde'].map((tipo) => (
                      <label key={tipo} className="cb-label">
                        <input
                          type="radio"
                          name={`asistencia-${alumno.id}`}
                          checked={alumno.estado === tipo}
                          onChange={() => cambiarAsistencia(alumno.id, tipo)}
                        />
                        <span>{tipo}</span>
                      </label>
                    ))}
                  </div>
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
