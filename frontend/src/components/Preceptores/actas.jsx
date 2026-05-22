import { useEffect, useState } from 'react';
import { fetchActasCurso } from '../../api/services';

function Actas() {
  const [actas, setActas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActasCurso()
      .then(setActas)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Actas</h3>
      </div>

      {loading ? (
        <p className="empty-state-message">Cargando actas...</p>
      ) : (
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
      )}
    </div>
  );
}

export default Actas;
