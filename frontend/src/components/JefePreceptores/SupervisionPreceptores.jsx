import { useState, useEffect } from 'react';
import { getSupervisionPreceptores } from '../../services/api';
import LoadingScreen from '../Shared/LoadingScreen';
import { mensajeErrorAmigable } from '../../utils/errores';

function formatDateTime(value) {
  if (!value) return 'Nunca';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Nunca';
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short' }).format(date);
}

function fechaHoyLabel() {
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
}

function ProgresoTarea({ icon, color, value, total, label }) {
  const esperadoValido = total > 0;
  const pct = esperadoValido ? Math.min(100, Math.round(((value || 0) / total) * 100)) : 0;
  const ok = esperadoValido ? (value || 0) >= total : null;
  return (
    <li className="stats-panel-cell">
      <div className="stats-panel-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <i className={`fas ${icon}`} style={{ color }} aria-hidden="true" />
        <strong style={{ fontSize: '0.82rem', color: '#334' }}>{label}</strong>
      </div>
      <div className="stats-cobertura-nums" style={{ marginTop: '8px' }}>
        <span style={{ color: '#334' }}>
          {esperadoValido ? `${value || 0} de ${total}` : 'Sin clase hoy'}
        </span>
        {esperadoValido && (
          <span style={{ color: ok ? '#198754' : '#d97706', fontWeight: 600 }}>{pct}%</span>
        )}
      </div>
      <div className="stats-progress-track">
        <div
          className="stats-progress-fill"
          style={{
            width: esperadoValido ? `${pct}%` : 0,
            background: ok ? '#198754' : '#d97706',
            minWidth: pct > 0 ? '10px' : 0,
          }}
        />
      </div>
      {esperadoValido && (
        <div className="stats-panel-foot" style={{ marginTop: '14px', fontSize: '0.72rem', textAlign: 'center' }}>
          {ok ? (
            <span className="badge badge-presente"><i className="fas fa-check" aria-hidden="true" /> Completado</span>
          ) : (
            <span className="badge badge-ausente" style={{ background: '#fde8e8', color: '#b91c1c' }}>
              <i className="fas fa-hourglass-half" aria-hidden="true" /> Faltan {total - (value || 0)}
            </span>
          )}
        </div>
      )}
    </li>
  );
}

function SupervisionPreceptores() {
  const [preceptores, setPreceptores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getSupervisionPreceptores();
        setPreceptores(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(mensajeErrorAmigable(err, 'Error al cargar datos de supervisión'));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <LoadingScreen text="Cargando datos de supervisión" />;
  }

  if (error) {
    return <div className="card"><div className="alert alert-danger">{error}</div></div>;
  }

  const tareas = (p) => p.tareas_diarias || {};

  return (
    <div>
      <div className="card">
        <div className="card-header-flex">
          <h3><i className="fas fa-user-shield" aria-hidden="true" /> Supervisión de Preceptores</h3>
          <span className="badge role-badge-display">Solo lectura</span>
          <span className="badge asistencias-badge-hoy">
            <i className="fas fa-calendar-day" aria-hidden="true" /> {fechaHoyLabel()}
          </span>
        </div>
        <p className="info-box" style={{ marginBottom: 0 }}>
          <i className="fas fa-info-circle info-box-icon" aria-hidden="true" />
          Seguí el estado de las tareas diarias de cada preceptor: tomar asistencia de{' '}
          <strong>docentes</strong> por la mañana y verificar que los docentes <strong>registren
          sus asistencias de estudiantes</strong> durante la jornada.
        </p>
      </div>

      {(preceptores || []).map((p) => {
        const t = tareas(p);
        const esperadosHoy = p.docentes_esperados_hoy ?? t.docentes_esperados_hoy ?? 0;
        const registradosHoy = t.docentes_registrados_hoy ?? 0;
        return (
          <div className="card mt-16" key={p.id_preceptor}>
            <div className="card-header-flex">
              <h4>
                <i className="fas fa-user-tie" aria-hidden="true" /> {p.nombre} {p.apellido}
                <span className="badge role-badge-display" style={{ marginLeft: 10 }}>
                  {p.cursos_asignados?.length || 0} {p.cursos_asignados?.length === 1 ? 'curso' : 'cursos'}
                </span>
              </h4>
              <div className="stat-chip-items">
                <span className="stat-chip stat-chip-blue"><i className="fas fa-user-graduate" aria-hidden="true" /> {p.cantidad_alumnos ?? 0} estudiantes</span>
                <span className="stat-chip stat-chip-green"><i className="fas fa-users" aria-hidden="true" /> {p.cantidad_tutores ?? 0} tutores</span>
              </div>
            </div>

            {(p.cursos_asignados || []).length > 0 && (
              <p className="stats-panel-foot" style={{ marginTop: 0 }}>
                <i className="fas fa-school" aria-hidden="true" /> Curso{ (p.cursos_asignados || []).length > 1 ? 's' : '' }: {p.cursos_asignados.map((c) => c.nombre_curso).join(', ')}
              </p>
            )}

            <div className="stats-grid-custom">
              <ProgresoTarea
                icon="fa-chalkboard-teacher"
                color="#0d6efd"
                value={registradosHoy}
                total={esperadosHoy}
                label="Asistencia de docentes (hoy)"
              />
              <ProgresoTarea
                icon="fa-user-graduate"
                color="#198754"
                value={t.asistencias_alumnos_hoy ?? 0}
                total={p.cantidad_alumnos ?? 0}
                label="Asistencia de estudiantes (hoy)"
              />
              <ProgresoTarea
                icon="fa-calendar-week"
                color="#7c3aed"
                value={t.asistencias_docentes_semana ?? 0}
                total={-1}
                label="Asistencia de docentes (semana)"
              />
            </div>
          </div>
        );
      })}

      {(!preceptores || preceptores.length === 0) && (
        <div className="card">
          <p className="empty-state-message">No hay preceptores registrados.</p>
        </div>
      )}
    </div>
  );
}

export default SupervisionPreceptores;