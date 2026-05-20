const dataDocentes = [
  { dni: "30.123.456", nombre: "Carlos", apellido: "Gómez", materia: "Matemática" },
  { dni: "28.987.654", nombre: "Laura", apellido: "Pérez", materia: "Lengua" },
];

function Docentes() {
  return (
    <div className="card">
      <h3>Docentes</h3>

      <table>
        <thead>
          <tr>
            <th>DNI</th>
            <th>Nombre</th>
            <th>Materia</th>
          </tr>
        </thead>

        <tbody>
          {dataDocentes.map((d, i) => (
            <tr key={i}>
              <td>{d.dni}</td>
              <td>{d.apellido}, {d.nombre}</td>
              <td>{d.materia}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Docentes;