import { useEffect, useState } from 'react';
import { fetchActasAlumno } from '../../api/services';
import ApiError from '../common/ApiError';

function Actas({ hijo }) {
  const [actas, setActas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    fetchActasAlumno(hijo.alumnoId)
      .then(setActas)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [hijo.alumnoId]);

  const handleVerActa = (acta) => {
    alert(`Abriendo ${acta.archivo} — ${acta.titulo}`);
  };

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Actas cargadas — {hijo.nombre}</h3>
        <span className="badge role-badge-display">Solo lectura</span>
      </div>

      <ApiError message={error} />

      {loading ? (
        <p className="empty-state-message">Cargando actas...</p>
      ) : actas.length === 0 ? (
        <p className="empty-state-message">
          No hay actas cargadas para este alumno en este momento.
        </p>
      ) : (
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Documento</th>
                <th>Materia</th>
                <th>Fecha de carga</th>
                <th>Cargado por</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {actas.map((acta) => (
                <tr key={acta.id}>
                  <td className="table-cell-strong">{acta.titulo}</td>
                  <td>{acta.materia}</td>
                  <td>{acta.fecha}</td>
                  <td>{acta.cargado_por}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-success table-download-btn"
                      onClick={() => handleVerActa(acta)}
                    >
                      <i className="fas fa-file-pdf" aria-hidden="true" /> Ver Acta
                    </button>
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

export default Actas;
