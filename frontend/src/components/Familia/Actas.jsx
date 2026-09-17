import { useData } from '../../context/DataContext';
import { BASE_URL } from '../../services/api';

const API_BASE = BASE_URL;

function Actas({ hijo }) {
  const { actasAlumno } = useData();
  const actas = actasAlumno
    .filter((a) => a.alumnoId === hijo.alumnoId)
    .sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3><i className="fas fa-file-signature" aria-hidden="true" /> Actas cargadas — {hijo.nombre}</h3>
        <span className="badge role-badge-display">Solo lectura</span>
      </div>

      {actas.length === 0 ? (
        <p className="empty-state-message">
          No hay actas cargadas para este estudiante en este momento.
        </p>
      ) : (
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Documento</th>
                <th>Fecha de carga</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {actas.map((acta) => (
                <tr key={acta.id}>
                  <td className="table-cell-strong">{acta.titulo}</td>
                  <td>{acta.fecha}</td>
                  <td>
                    {acta.ruta_archivo ? (
                      <a
                        href={`${API_BASE}${acta.ruta_archivo}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-success table-download-btn"
                      >
                        <i className="fas fa-file-pdf" aria-hidden="true" /> Ver Acta
                      </a>
                    ) : (
                      <span className="empty-state-message">Sin archivo</span>
                    )}
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
