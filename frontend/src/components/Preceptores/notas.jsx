import { useState } from "react";

const alumnos = [
  { nombre: "Agustín Hoffer" },
  { nombre: "Sofía Martínez" },
];

function Notas() {
  const [notas, setNotas] = useState({});

  const handleChange = (index, value) => {
    setNotas({ ...notas, [index]: value });
  };

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Calificaciones del Periodo</h3>
      </div>

      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Alumno</th>
              <th style={{ width: '150px' }}>Nota Final</th>
            </tr>
          </thead>
          <tbody>
            {alumnos.map((a, i) => (
              <tr key={i}>
                <td>{a.nombre}</td>
                <td>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={notas[i] || ""}
                    onChange={(e) => handleChange(i, e.target.value)}
                    style={{
                      width: '80px',
                      padding: '6px 10px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      textAlign: 'center'
                    }}
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

export default Notas;