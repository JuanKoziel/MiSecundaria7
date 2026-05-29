import React from 'react';

function PanelDocente() {
  // Datos ficticios del docente (en un entorno real, estos vendrían de una API o estado global)
  const docente = {
    nombre: "Carlos Alberto Rodríguez",
    dni: "34.567.890",
    correo: "carlos.rodriguez@edugestion.edu.ar",
    telefono: "+54 11 4567-8912",
    direccion: "Av. Siempreviva 742, CABA",
    // Listado de materias asignadas vinculadas con su respectivo curso
    materiasAsignadas: [
      { id: 1, curso: '1°1', materia: 'Matemática' },
      { id: 2, curso: '5°2', materia: 'Física' },
      { id: 3, curso: '5°1', materia: 'Química' },
      { id: 4, curso: '6°3', materia: 'Matemática' }
    ]
  };

  return (
    <div className="card">
      {/* Encabezado del Perfil */}
      <div className="card-header-flex" style={{ marginBottom: '20px' }}>
        <h3>Perfil del Docente</h3>
        <span className="badge badge-presente" style={{ fontSize: '0.9rem', padding: '6px 12px' }}>
          <i className="fas fa-check-circle"></i> Activo
        </span>
      </div>

      {/* Bloque de Información Personal estructurado */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '20px', 
        marginBottom: '35px',
        background: '#f8f9fa',
        padding: '20px',
        borderRadius: '8px',
        borderLeft: '4px solid var(--primary-color)' 
      }}>
        <div>
          <label style={{ block: 'span', fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>Nombre Completo</label>
          <p style={{ fontSize: '1.1rem', fontWeight: '600', marginTop: '4px' }}>{docente.nombre}</p>
        </div>
        <div>
          <label style={{ block: 'span', fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>Documento (DNI)</label>
          <p style={{ fontSize: '1.1rem', fontWeight: '600', marginTop: '4px' }}>{docente.dni}</p>
        </div>
        <div>
          <label style={{ block: 'span', fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>Correo Electrónico</label>
          <p style={{ fontSize: '1.1rem', fontWeight: '600', marginTop: '4px', color: 'var(--primary-color)' }}>{docente.correo}</p>
        </div>
        <div>
          <label style={{ block: 'span', fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>Teléfono de Contacto</label>
          <p style={{ fontSize: '1.1rem', fontWeight: '600', marginTop: '4px' }}>{docente.telefono}</p>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ block: 'span', fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>Dirección Particular</label>
          <p style={{ fontSize: '1.1rem', fontWeight: '600', marginTop: '4px' }}>{docente.direccion}</p>
        </div>
      </div>

      {/* Tabla de Materias Asignadas */}
      <div className="card-header-flex">
        <h4>Materias y Cursos Asignados</h4>
      </div>
      
      <div className="table-responsive" style={{ marginTop: '10px' }}>
        <table>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', paddingLeft: '15px' }}>Curso / División</th>
              <th style={{ textAlign: 'left', paddingLeft: '15px' }}>Materia Dictada</th>
              <th>Carga Horaria Semanal</th>
            </tr>
          </thead>
          <tbody>
            {docente.materiasAsignadas.map((item) => (
              <tr key={item.id}>
                <td style={{ textAlign: 'left', paddingLeft: '15px', fontWeight: '600' }}>
                  <i className="fas fa-users" style={{ color: '#888', marginRight: '8px' }}></i>
                  {item.curso}
                </td>
                <td style={{ textAlign: 'left', paddingLeft: '15px' }}>
                  <i className="fas fa-book" style={{ color: 'var(--primary-color)', marginRight: '8px' }}></i>
                  {item.materia}
                </td>
                <td style={{ color: '#555' }}>4 Horas</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PanelDocente;