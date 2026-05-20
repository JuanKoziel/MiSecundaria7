const dataAlumnos = [
  { dni: "44.123.456", nombre: "Agustín", apellido: "Hoffer" },
  { dni: "45.987.654", nombre: "Sofía", apellido: "Martínez" },
];

function Alumnos() {
  return (
    <div className="card">
      <h3>Alumnos</h3>

      <table>
        <thead>
          <tr>
            <th>DNI</th>
            <th>Nombre</th>
          </tr>
        </thead>

        <tbody>
          {dataAlumnos.map((a, i) => (
            <tr key={i}>
              <td>{a.dni}</td>
              <td>{a.apellido}, {a.nombre}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Alumnos;