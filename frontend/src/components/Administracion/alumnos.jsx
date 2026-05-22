import { alumnos, nombreCompleto } from '../../data/mockData';

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
            {alumnos.map((a) => (
              <tr key={a.id}>
                <td><strong>{a.dni}</strong></td>
                <td>{nombreCompleto(a)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Alumnos;
