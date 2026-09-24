import { useState, useEffect } from 'react';
import { getEstadisticasPreceptoria } from '../../services/api';
import LoadingScreen from '../Shared/LoadingScreen';
import { mensajeErrorAmigable } from '../../utils/errores';

function StatCell({ icon, value, label, color, big }) {
  return (
    <div className="stats-panel-cell" style={big ? { boxShadow: '0 2px 8px rgba(13,35,58,0.08)' } : undefined}>
      <i className={`fas ${icon} stats-panel-icon`} style={{ color: color || 'var(--primary-color)' }} aria-hidden="true" />
      <div className="stats-panel-value">{value ?? '—'}</div>
      <div className="stats-panel-label">{label}</div>
    </div>
  );
}

function fechaHoyLabel() {
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
}

function EstadisticasPreceptoria() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getEstadisticasPreceptoria();
        setStats(data);
      } catch (err) {
        setError(mensajeErrorAmigable(err, 'Error al cargar estadísticas'));
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <LoadingScreen text="Cargando estadísticas" />;
  }

  if (error) {
    return <div className="card"><div className="alert alert-danger">{error}</div></div>;
  }

  const cursosTotal = (stats.cursos_con_preceptor || 0) + (stats.cursos_sin_preceptor || 0);
  const cobertura = cursosTotal > 0 ? Math.round(((stats.cursos_con_preceptor || 0) / cursosTotal) * 100) : 0;

  return (
    <div>
      <div className="card">
        <div className="card-header-flex">
          <h3><i className="fas fa-chart-bar" aria-hidden="true" /> Estadísticas de Preceptoría</h3>
          <span className="badge role-badge-display">
            <i className="fas fa-calendar-day" aria-hidden="true" /> {fechaHoyLabel()}
          </span>
        </div>
      </div>

      <div className="stats-grid-main">
        <div className="card">
          <div className="stats-panel-header">
            <h4><i className="fas fa-calendar-check" aria-hidden="true" /> Hoy</h4>
          </div>
          <div className="stats-panel-cells">
            <StatCell icon="fa-user-slash" value={stats.docentes_ausentes_hoy} label="Docentes ausentes hoy" color="#ffc107" />
            <StatCell icon="fa-user-minus" value={stats.alumnos_ausentes_hoy} label="Estudiantes ausentes hoy" color="#ffc107" />
            <StatCell icon="fa-file-signature" value={stats.actas_hoy} label="Actas creadas hoy" color="#198754" />
          </div>
          <p className="stats-panel-foot">
            Números del día, calculados sobre la fecha actual del sistema.
          </p>
        </div>

        <div className="card">
          <div className="stats-panel-header">
            <h4><i className="fas fa-user-tie" aria-hidden="true" /> Cobertura de preceptores</h4>
          </div>
          <div className="stats-cobertura">
            <div className="stats-cobertura-nums">
              <span style={{ color: '#198754' }}><i className="fas fa-check-circle" aria-hidden="true" /> {stats.cursos_con_preceptor} con preceptor</span>
              <span style={{ color: '#dc3545' }}><i className="fas fa-exclamation-circle" aria-hidden="true" /> {stats.cursos_sin_preceptor} sin preceptor</span>
            </div>
            <div className="stats-progress-track">
              <div
                className="stats-progress-fill"
                style={{ width: `${cobertura}%`, background: cobertura === 100 ? '#198754' : '#2563eb', minWidth: cobertura > 0 ? '14px' : 0 }}
              />
            </div>
            <div className="stats-cobertura-por">
              <span className="badge badge-success">{cobertura}% cubierto</span>
              <span className="stats-cobertura-total" style={{ fontSize: '0.8rem', color: '#667' }}>{cursosTotal} cursos activos</span>
            </div>
          </div>
          <p className="stats-panel-foot">
            Indica qué porcentaje de los cursos activos tiene un preceptor asignado.
          </p>
        </div>
      </div>

      <div className="card">
        <div className="stats-panel-header">
          <h4><i className="fas fa-users" aria-hidden="true" /> Plantel</h4>
        </div>
        <div className="stats-panel-cells">
          <StatCell icon="fa-user-tie" value={stats.total_preceptores} label="Preceptores" />
          <StatCell icon="fa-user-graduate" value={stats.total_alumnos} label="Total estudiantes" />
          <StatCell icon="fa-users" value={stats.total_tutores} label="Total tutores" />
          <StatCell icon="fa-school" value={cursosTotal} label="Cursos activos" color="#2563eb" />
        </div>
      </div>
    </div>
  );
}

export default EstadisticasPreceptoria;