import { useMemo, useState } from 'react';
import { useData } from '../../context/DataContext';
import { cursoConOrientacion } from '../../utils/orientacion';

function Comunicados() {
  const { comunicadosFamilia, cursos } = useData();
  const [curso, setCurso] = useState('1°1');

  const comunicados = useMemo(
    () =>
      comunicadosFamilia
        .filter((c) => c.curso === curso)
        .sort((a, b) => b.fecha.localeCompare(a.fecha)),
    [curso, comunicadosFamilia]
  );

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Comunicados</h3>
      </div>

      <div className="filter-row">
        <div className="form-group-filter">
          <label htmlFor="curso-comunicados">Curso</label>
          <select
            id="curso-comunicados"
            value={curso}
            onChange={(e) => setCurso(e.target.value)}
          >
            {cursos.map((c) => (
              <option key={c} value={c}>
                {cursoConOrientacion(c)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {comunicados.length === 0 ? (
        <p className="empty-state-message" style={{ textAlign: 'center', padding: '24px' }}>
          No hay comunicados para el curso {curso} en este momento.
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
