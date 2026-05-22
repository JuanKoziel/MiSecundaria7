import { useEffect, useState } from 'react';
import {
  fetchAsistenciasDiarias,
  fetchCalificaciones,
  fetchNotasPreceptor,
} from '../../api/services';

function Resumen({ hijo }) {
  const [stats, setStats] = useState({ porcentaje: 0, promedio: '—' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchAsistenciasDiarias(null, hijo.alumnoId),
      fetchCalificaciones({ alumno_id: hijo.alumnoId }),
      fetchNotasPreceptor(hijo.alumnoId),
    ])
      .then(([asistencias, calificaciones, notasPreceptor]) => {
        const presentes = asistencias.filter((a) => a.estado === 'Presente').length;
        const porcentaje =
          asistencias.length > 0 ? Math.round((presentes / asistencias.length) * 100) : 0;

        let promedio = '—';
        if (calificaciones.length > 0) {
          const sum = calificaciones.reduce(
            (acc, c) => acc + ((Number(c.nota1) || 0) + (Number(c.nota2) || 0)) / 2,
            0
          );
          promedio = (sum / calificaciones.length).toFixed(1);
        } else if (notasPreceptor[0]?.nota != null) {
          promedio = String(notasPreceptor[0].nota);
        }

        setStats({ porcentaje, promedio });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [hijo.alumnoId]);

  return (
    <div className="familia-resumen-grid">
      <div className="card familia-stat-card">
        <span className="familia-stat-label">Curso</span>
        <strong className="familia-stat-value">{hijo.curso}</strong>
      </div>
      <div className="card familia-stat-card">
        <span className="familia-stat-label">Vínculo</span>
        <strong className="familia-stat-value">{hijo.vinculo}</strong>
      </div>
      <div className="card familia-stat-card">
        <span className="familia-stat-label">Asistencia reciente</span>
        <strong className="familia-stat-value font-accent">
          {loading ? '...' : `${stats.porcentaje}%`}
        </strong>
      </div>
      <div className="card familia-stat-card">
        <span className="familia-stat-label">Promedio general</span>
        <strong className="familia-stat-value font-accent">
          {loading ? '...' : stats.promedio}
        </strong>
      </div>

      <div className="card" style={{ gridColumn: '1 / -1' }}>
        <div className="card-header-flex">
          <h3>Información del alumno</h3>
        </div>
        <div className="table-responsive">
          <table>
            <tbody>
              <tr>
                <td className="table-label">Nombre completo</td>
                <td>{hijo.nombre}</td>
              </tr>
              <tr>
                <td className="table-label">DNI</td>
                <td><strong>{hijo.dni}</strong></td>
              </tr>
              <tr>
                <td className="table-label">Curso</td>
                <td>{hijo.curso}</td>
              </tr>
              <tr>
                <td className="table-label">Preceptoría</td>
                <td>Turno mañana — División {hijo.curso}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Resumen;
