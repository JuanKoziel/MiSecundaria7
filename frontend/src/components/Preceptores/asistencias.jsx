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
      <h3>Asistencias</h3>

      <table>
        <thead>
          <tr>
            <th>Alumno</th>
            <th>Presente</th>
          </tr>
        </thead>

        <tbody>
          {alumnos.map((a, i) => (
            <tr key={i}>
              <td>{a.nombre}</td>
              <td>
                <input
                  type="checkbox"
                  checked={asistencias[i] || false}
                  onChange={() => toggleAsistencia(i)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Asistencias;