import { useEffect, useState } from 'react';
import { fetchComunicados } from '../../api/services';

function Comunicados({ hijo }) {
  const [comunicados, setComunicados] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchComunicados(hijo.curso)
      .then(setComunicados)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [hijo.curso]);

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Comunicados del curso {hijo.curso}</h3>
      </div>

      {loading ? (
        <p className="empty-state-message">Cargando comunicados...</p>
      ) : comunicados.length === 0 ? (
        <p className="empty-state-message" style={{ textAlign: 'center', padding: '24px' }}>
          No hay comunicados para este curso en este momento.
        </p>
      ) : (
        <div className="familia-comunicados-list">
          {comunicados.map((c) => (
            <article key={c.id} className="familia-comunicado-item">
              <div className="familia-comunicado-meta">
                <span className="badge role-badge-display">{c.fecha}</span>
                <h4>{c.titulo}</h4>
              </div>
              <p>{c.descripcion}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default Comunicados;
