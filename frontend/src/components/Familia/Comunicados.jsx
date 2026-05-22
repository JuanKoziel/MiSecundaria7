import { comunicadosFamilia } from '../../data/mockData';

function Comunicados({ hijo }) {
  const comunicados = comunicadosFamilia
    .filter((c) => c.curso === hijo.curso)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Comunicados del curso {hijo.curso}</h3>
      </div>

      {comunicados.length === 0 ? (
        <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: '24px' }}>
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
