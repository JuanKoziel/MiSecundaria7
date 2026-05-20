function Actas() {
  const actas = [
    { curso: "7mo A", fecha: "2025-03-10", descripcion: "Inicio de clases" },
    { curso: "7mo B", fecha: "2025-03-12", descripcion: "Reunión de padres" },
  ];

  return (
    <div className="card">
      <h3>Actas</h3>

      <table>
        <thead>
          <tr>
            <th>Curso</th>
            <th>Fecha</th>
            <th>Descripción</th>
          </tr>
        </thead>

        <tbody>
          {actas.map((a, i) => (
            <tr key={i}>
              <td>{a.curso}</td>
              <td>{a.fecha}</td>
              <td>{a.descripcion}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Actas;