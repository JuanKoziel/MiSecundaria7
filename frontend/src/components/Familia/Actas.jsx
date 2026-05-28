import { useData } from '../../context/DataContext';

function Actas({ hijo }) {
  const { actasAlumno } = useData();
  const actas = actasAlumno
    .filter((a) => a.alumnoId === hijo.alumnoId)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  const handleVerActa = (acta) => {
    alert(`Abriendo ${acta.archivo} — ${acta.titulo} (modo demostración).`);
  };

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Actas cargadas — {hijo.nombre}</h3>
        <span className="badge role-badge-display">Solo lectura</span>
      </div>

      {actas.length === 0 ? (
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
                  <td>{acta.cargadoPor}</td>
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
