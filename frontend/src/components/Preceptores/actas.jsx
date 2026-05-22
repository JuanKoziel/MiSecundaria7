import { actas } from '../../data/mockData';

function Actas() {
  return (
    <div className="card">
      <h3>Actas</h3>

      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Curso</th>
              <th>Fecha</th>
              <th>Descripción</th>
            </tr>
          </thead>
          <tbody>
            {actas.map((a) => (
              <tr key={a.id}>
                <td>{a.curso}</td>
                <td>{a.fecha}</td>
                <td>{a.descripcion}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Actas;
