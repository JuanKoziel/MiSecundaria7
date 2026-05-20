import React, { useState } from 'react';

function PanelAlumnos() {
  // Datos iniciales de ejemplo adaptados al nuevo esquema de calificación
  const [alumnos, setAlumnos] = useState([
    { id: 1, nombre: 'Álvarez, Luis', nota1: '', nota2: '', nota3: '', nota4: '', diag: 'Regular positivo' },
    { id: 2, nombre: 'Benítez, Ana', nota1: '', nota2: '', nota3: '', nota4: '', diag: 'Excelente desempeño' }
  ]);

  // Manejador genérico para actualizar el estado cuando cambie una nota o diagnóstico
  const handleInputChange = (id, campo, valor) => {
    setAlumnos(prevAlumnos =>
      prevAlumnos.map(alumno =>
        alumno.id === id ? { ...alumno, [campo]: valor } : alumno
      )
    );
  };

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Planilla de Calificaciones</h3>
        <button className="btn btn-primary" onClick={() => alert('¡Notas guardadas con éxito!')}>
          <i className="fas fa-save"></i> Guardar Notas
        </button>
      </div>

      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Nombre del Estudiante</th>
              <th>Documentación</th>
              <th>Prenota 1</th>
              <th>Nota 1</th>
              <th>Prenota 2</th>
              <th>Nota 2</th>
              <th>Diagnóstico Final</th>
            </tr>
          </thead>
          <tbody>
            {alumnos.map((alumno) => (
              <tr key={alumno.id}>
                <td style={{ fontWeight: '600' }}>{alumno.nombre}</td>
                <td>
                  <button 
                    className="btn btn-success table-download-btn"
                    onClick={() => alert(`Descargando legajo de ${alumno.nombre}`)}
                  >
                    <i className="fas fa-file-pdf"></i> Ver Acta
                  </button>
                </td>
                
                {/* Primera Nota: Desplegable Cualitativo (TEA, TEP, TED) */}
                <td>
                  <select 
                    value={alumno.nota1} 
                    onChange={(e) => handleInputChange(alumno.id, 'nota1', e.target.value)}
                    style={{ width: '90px', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                  >
                    <option value="" disabled hidden>--</option>
                    <option value="TEA">TEA</option>
                    <option value="TEP">TEP</option>
                    <option value="TED">TED</option>
                  </select>
                </td>

                {/* Segunda Nota: Numérica */}
                <td>
                  <input 
                    type="number" 
                    min="1" 
                    max="10" 
                    value={alumno.nota2} 
                    onChange={(e) => handleInputChange(alumno.id, 'nota2', parseInt(e.target.value) || '')}
                    style={{ width: '70px' }} 
                  />
                </td>

                {/* Tercera Nota: Desplegable Cualitativo (TEA, TEP, TED) */}
                <td>
                  <select 
                    value={alumno.nota3} 
                    onChange={(e) => handleInputChange(alumno.id, 'nota3', e.target.value)}
                    style={{ width: '90px', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                  >
                    <option value="" disabled hidden>--</option>
                    <option value="TEA">TEA</option>
                    <option value="TEP">TEP</option>
                    <option value="TED">TED</option>
                  </select>
                </td>

                {/* Cuarta Nota: Numérica */}
                <td>
                  <input 
                    type="number" 
                    min="1" 
                    max="10" 
                    value={alumno.nota4} 
                    onChange={(e) => handleInputChange(alumno.id, 'nota4', parseInt(e.target.value) || '')}
                    style={{ width: '70px' }} 
                  />
                </td>

                {/* Diagnóstico */}
                <td>
                  <input 
                    type="text" 
                    value={alumno.diag} 
                    onChange={(e) => handleInputChange(alumno.id, 'diag', e.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PanelAlumnos;