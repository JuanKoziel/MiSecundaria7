import React, { useState } from 'react';

function PanelAsistencia() {
  const [alumnos, setAlumnos] = useState([
    { id: 1, nombre: 'Álvarez, Luis', estado: 'Presente' },
    { id: 2, nombre: 'Benítez, Ana', estado: 'Ausente' }
  ]);

  const cambiarAsistencia = (id, nuevoEstado) => {
    setAlumnos(prev => prev.map(al => al.id === id ? { ...al, estado: nuevoEstado } : al));
  };

  // Retorna la clase exacta que definiste en tu archivo CSS para cada badge
  const getBadgeClass = (estado) => {
    if (estado === 'Presente') return 'badge-presente';
    if (estado === 'Ausente') return 'badge-ausente';
    return 'badge-tarde';
  };

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Registro de Asistencias Diario</h3>
        <button className="btn btn-primary">
          <i className="fas fa-check-double"></i> Consolidar Día
        </button>
      </div>

      <div className="global-field-box">
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ minWidth: '180px' }}>
            <label style={{ fontWeight: '500', fontSize: '0.9rem', display: 'block', marginBottom: '5px' }}>Fecha de Dictado</label>
            <input type="date" defaultValue="2026-05-18" />
          </div>
          <div style={{ flex: 1, minWidth: '260px' }}>
            <label style={{ fontWeight: '500', fontSize: '0.9rem', display: 'block', marginBottom: '5px' }}>Libro de Temas de la Clase</label>
            <input type="text" placeholder="Escriba los contenidos y ejes conceptuales dictados hoy..." />
          </div>
        </div>
      </div>

      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Estudiante</th>
              <th>Estado Actual</th>
              <th>Cambiar Estado (Selección Única)</th>
            </tr>
          </thead>
          <tbody>
            {alumnos.map((alumno) => (
              <tr key={alumno.id}>
                <td style={{ fontWeight: '600' }}>{alumno.nombre}</td>
                <td>
                  <span className={`badge ${getBadgeClass(alumno.estado)}`}>
                    {alumno.estado}
                  </span>
                </td>
                <td>
                  <div className="cb-container">
                    {['Presente', 'Ausente', 'Tarde'].map((tipo) => (
                      <label key={tipo} className="cb-label">
                        <input 
                          type="checkbox" 
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