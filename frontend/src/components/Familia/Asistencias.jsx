import { useEffect, useState } from 'react';
import { fetchAsistenciasDiarias } from '../../api/services';

function badgeClass(estado) {
  if (estado === 'Presente') return 'badge-presente';
  if (estado === 'Ausente') return 'badge-ausente';
  return 'badge-tarde';
}

function Asistencias({ hijo }) {
  const [asistencias, setAsistencias] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchAsistenciasDiarias(null, hijo.alumnoId)
      .then((data) => setAsistencias([...data].sort((a, b) => b.fecha.localeCompare(a.fecha))))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [hijo.alumnoId]);

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Historial de Asistencias — {hijo.nombre}</h3>
      </div>

      {loading ? (
        <p className="empty-state-message">Cargando asistencias...</p>
      ) : (
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
      )}
    </div>
  );
}

export default Asistencias;
