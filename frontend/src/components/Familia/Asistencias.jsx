import { asistenciasFamilia } from '../../data/mockData';

function badgeClass(estado) {
  if (estado === 'Presente') return 'badge-presente';
  if (estado === 'Ausente') return 'badge-ausente';
  return 'badge-tarde';
}

function Asistencias({ hijo }) {
  const asistencias = asistenciasFamilia
    .filter((a) => a.hijoId === hijo.id)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Historial de Asistencias — {hijo.nombre}</h3>
      </div>

      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {asistencias.map((a) => (
              <tr key={a.id}>
                <td>{a.fecha}</td>
                <td>
                  <span className={`badge ${badgeClass(a.estado)}`}>{a.estado}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Asistencias;
