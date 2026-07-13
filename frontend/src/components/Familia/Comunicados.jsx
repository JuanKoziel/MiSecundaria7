import { useData } from '../../context/DataContext';
import { parseCurso } from '../../utils/orientacion';

function comunicadoAplicaAcurso(comunicado, hijoCurso) {
  const alcances = Array.isArray(comunicado?.alcances) ? comunicado.alcances : [];
  if (!alcances.length) return true;
  const parts = parseCurso(hijoCurso || '');
  return alcances.some((alcance) => {
    const hasCurso = alcance.curso !== null && alcance.curso !== undefined;
    const hasDivision = alcance.division !== null && alcance.division !== undefined;
    if (!hasCurso && !hasDivision && alcance.id_ciclo === null && alcance.id_ciclo === undefined && alcance.id_materia === null && alcance.id_materia === undefined) {
      return true;
    }
    if (hasCurso && parts.anio !== Number(alcance.curso)) return false;
    if (hasDivision && parts.division !== Number(alcance.division)) return false;
    return true;
  });
}

function Comunicados({ hijo }) {
  const { comunicadosFamilia } = useData();
  const comunicados = comunicadosFamilia
    .filter((c) => comunicadoAplicaAcurso(c, hijo.curso))
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Comunicados del curso {hijo.curso}</h3>
      </div>

      {comunicados.length === 0 ? (
        <p className="empty-state-message empty-state-centered">
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
