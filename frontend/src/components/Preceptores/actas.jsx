import { useEffect, useState } from 'react';
import { fetchActasCurso } from '../../api/services';
import ApiError from '../common/ApiError';

function Actas() {
  const [actas, setActas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchActasCurso()
      .then(setActas)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Actas</h3>
      </div>

      <ApiError message={error} />

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
