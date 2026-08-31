import { useState, useEffect } from 'react';
import { getEstadisticasPreceptoria } from '../../services/api';
import LoadingScreen from '../Shared/LoadingScreen';

function StatCard({ icon, value, label, color }) {
  return (
    <div className="stat-card">
      <i className={`fas ${icon} stat-card-icon`} style={{ color: color || 'var(--primary-color)' }} aria-hidden="true" />
      <div className="stat-card-value" style={{ color: color || 'inherit' }}>
        {value ?? '—'}
      </div>
      <div className="stat-card-label">{label}</div>
    </div>
  );
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
        setError(err.response?.data?.detail || err.message || 'Error al cargar estadísticas');
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

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Estadísticas de Preceptoría</h3>
      </div>

      <div className="stats-grid">
        <StatCard icon="fa-user-tie" value={stats.total_preceptores} label="Preceptores" />
        <StatCard icon="fa-check-circle" value={stats.cursos_con_preceptor} label="Cursos con preceptor" color="#198754" />
        <StatCard icon="fa-exclamation-circle" value={stats.cursos_sin_preceptor} label="Cursos sin preceptor" color="#dc3545" />
        <StatCard icon="fa-user-graduate" value={stats.total_alumnos} label="Total alumnos" />
        <StatCard icon="fa-users" value={stats.total_tutores} label="Total tutores" />
        <StatCard icon="fa-user-slash" value={stats.docentes_ausentes_hoy} label="Docentes ausentes hoy" color="#ffc107" />
        <StatCard icon="fa-user-minus" value={stats.alumnos_ausentes_hoy} label="Estudiantes ausentes hoy" color="#ffc107" />
        <StatCard icon="fa-file-alt" value={stats.actas_hoy} label="Actas creadas hoy" />
      </div>

      <div className="info-box">
        <i className="fas fa-info-circle info-box-icon" aria-hidden="true" />
        Datos actualizados en tiempo real. Las estadísticas reflejan la situación actual de la institución.
      </div>
    </div>
  );
}

export default EstadisticasPreceptoria;
