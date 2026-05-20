import { useState } from "react";

const alumnos = [
  { nombre: "Agustín Hoffer" },
  { nombre: "Sofía Martínez" },
];

function Asistencias() {
  const [asistencias, setAsistencias] = useState({});

  const toggleAsistencia = (index) => {
    setAsistencias({
      ...asistencias,
      [index]: !asistencias[index],
    });
  };

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Control de Asistencia Diaria</h3>
      </div>

      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Alumno</th>
              <th>Estado de Asistencia</th>
            </tr>
          </thead>
          <tbody>
            {alumnos.map((a, i) => {
              const isPresente = asistencias[i] || false;
              return (
                <tr key={i}>
                  <td>{a.nombre}</td>
                  <td>
                    {/* Renderizamos un botón estético usando tus clases CSS de badges */}
                    <span 
                      className={`badge ${isPresente ? 'badge-presente' : 'badge-ausente'}`}
                      onClick={() => toggleAsistencia(i)}
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                      {isPresente ? "✓ Presente" : "✕ Ausente"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Asistencias;