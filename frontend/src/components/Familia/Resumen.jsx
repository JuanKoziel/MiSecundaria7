import { useData } from '../../context/DataContext';

function Resumen({ hijo }) {
  const { asistenciasFamilia, calificacionesFamilia } = useData();
  const asistencias = asistenciasFamilia.filter((a) => a.hijoId === hijo.id);
  const calificaciones = calificacionesFamilia.filter((c) => c.hijoId === hijo.id);

  const presentes = asistencias.filter((a) => a.estado === 'Presente').length;
  const porcentajeAsistencia =
    asistencias.length > 0 ? Math.round((presentes / asistencias.length) * 100) : 0;

  const promedio =
    calificaciones.length > 0
      ? (
          calificaciones.reduce((acc, c) => acc + (Number(c.nota1) + Number(c.nota2)) / 2, 0) /
          calificaciones.length
        ).toFixed(1)
      : '—';

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
        <strong className="familia-stat-value font-accent">{porcentajeAsistencia}%</strong>
      </div>
      <div className="card familia-stat-card">
        <span className="familia-stat-label">Promedio general</span>
        <strong className="familia-stat-value font-accent">{promedio}</strong>
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
