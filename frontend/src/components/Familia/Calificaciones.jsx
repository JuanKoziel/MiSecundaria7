import { useData } from '../../context/DataContext';

function Calificaciones({ hijo }) {
  const { calificacionesFamilia } = useData();
  const calificaciones = calificacionesFamilia.filter((c) => c.hijoId === hijo.id);

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Calificaciones — {hijo.nombre}</h3>
        <span className="badge role-badge-display">Solo lectura</span>
      </div>

      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Materia</th>
              <th>Prenota 1</th>
              <th>Nota 1</th>
              <th>Prenota 2</th>
              <th>Nota 2</th>
              <th>Diagnóstico</th>
            </tr>
          </thead>
          <tbody>
            {calificaciones.map((c) => (
              <tr key={c.id}>
                <td className="table-cell-strong">{c.materia}</td>
                <td><span className="badge badge-cualitativa">{c.prenota1}</span></td>
                <td>{c.nota1}</td>
                <td><span className="badge badge-cualitativa">{c.prenota2}</span></td>
                <td>{c.nota2}</td>
                <td>{c.diagnostico}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Calificaciones;
