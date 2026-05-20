import { useState } from "react";

const alumnos = [
  { nombre: "Agustín Hoffer" },
  { nombre: "Sofía Martínez" },
];

function Notas() {
  const [notas, setNotas] = useState({});

  const handleChange = (index, value) => {
    setNotas({
      ...notas,
      [index]: value,
    });
  };

  return (
    <div className="card">
      <h3>Notas</h3>

      <table>
        <thead>
          <tr>
            <th>Alumno</th>
            <th>Nota</th>
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
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Notas;