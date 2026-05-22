import { docentes } from '../../data/mockData';

function Docentes() {
  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Docentes</h3>
      </div>

      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>DNI</th>
              <th>Nombre</th>
              <th>Materia</th>
            </tr>
          </thead>
          <tbody>
            {docentes.map((d) => (
              <tr key={d.id}>
                <td>{d.dni}</td>
                <td>{d.apellido}, {d.nombre}</td>
                <td>{d.materia}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Docentes;
