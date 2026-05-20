import React from 'react';

function ApartadosLista({ seccionActiva, onCambiarSeccion }) {
  const apartados = [
    { id: 'alumnos', label: 'Alumnos' },
    { id: 'info', label: 'Info del Curso' },
    { id: 'planif', label: 'Planificaciones' },
    { id: 'asistencia', label: 'Asistencia' },
  ];

  return (
    <div className="apartados-lista">
      <h4>Apartados</h4>
      {apartados.map((ap) => (
        <button
          key={ap.id}
          className={`seccion-btn ${seccionActiva === ap.id ? 'active-seccion' : ''}`}
          onClick={() => onCambiarSeccion(ap.id)}
        >
          {ap.label}
        </button>
      ))}
    </div>
  );
}

export default ApartadosLista;