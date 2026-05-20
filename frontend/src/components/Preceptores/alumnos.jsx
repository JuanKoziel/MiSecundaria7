const dataAlumnos = [
  { dni: "44.123.456", nombre: "Agustín", apellido: "Hoffer" },
  { dni: "45.987.654", nombre: "Sofía", apellido: "Martínez" },
];

function Alumnos() {
  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Listado de Alumnos</h3>
      </div>

      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>DNI</th>
              <th>Nombre Completo</th>
            </tr>
          </thead>
          <tbody>
            {dataAlumnos.map((a, i) => (
              <tr key={i}>
                <td><strong>{a.dni}</strong></td>
                <td>{a.apellido}, {a.nombre}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Alumnos;