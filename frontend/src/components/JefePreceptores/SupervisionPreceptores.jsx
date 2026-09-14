import { useState, useEffect } from 'react';
import { getSupervisionPreceptores } from '../../services/api';
import LoadingScreen from '../Shared/LoadingScreen';

function formatDateTime(value) {
  if (!value) return 'Nunca';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Nunca';
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short' }).format(date);
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
        setError(err.response?.data?.detail || err.message || 'Error al cargar datos de supervisión');
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

  const itemTarea = (icon, label, valor, ok = null) => (
    <li className="supervision-tarea">
      <i className={`fas ${icon} icon-muted`} aria-hidden="true" />
      <span className="supervision-tarea-label">{label}</span>
      <span className="supervision-tarea-valor">
        {ok === true && <i className="fas fa-check supervision-ok" aria-hidden="true" />}
        {ok === false && <i className="fas fa-exclamation-triangle supervision-warn" aria-hidden="true" />}
        {valor}
      </span>
    </li>
  );

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3><i className="fas fa-user-shield" aria-hidden="true" /> Supervisión de Preceptores</h3>
        <span className="badge role-badge-display">Solo lectura</span>
      </div>

      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Preceptor</th>
              <th>Cursos Asignados</th>
              <th>Estudiantes</th>
              <th>Tutores</th>
              <th>Tareas del día</th>
              <th>Último Acceso</th>
            </tr>
          </thead>
          <tbody>
            {preceptores.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-state-message">
                  No hay preceptores registrados.
                </td>
              </tr>
            ) : (
              preceptores.map((p) => {
                const t = tareas(p);
                const docentesOk = t.docentes_esperados_hoy > 0
                  ? (t.docentes_registrados_hoy || 0) >= t.docentes_esperados_hoy
                  : null;
                return (
                  <tr key={p.id_preceptor}>
                    <td className="table-cell-strong">
                      <i className="fas fa-user-tie icon-muted" aria-hidden="true" />
                      {p.apellido}, {p.nombre}
                    </td>
                    <td>
                      {(p.cursos_asignados || []).length > 0
                        ? p.cursos_asignados.map((c) => c.nombre_curso).join(', ')
                        : <span style={{ color: '#999' }}>Sin cursos</span>}
                    </td>
                    <td>{p.cantidad_alumnos}</td>
                    <td>{p.cantidad_tutores}</td>
                    <td>
                      <ul className="supervision-tareas-list">
                        {itemTarea(
                          'fa-chalkboard-teacher',
                          'Asistencia docentes (hoy)',
                          `${t.asistencias_docentes_hoy || 0} registrada/s de ${t.docentes_esperados_hoy || 0} esperado/s`,
                          docentesOk,
                        )}
                        {itemTarea(
                          'fa-chalkboard',
                          'Asistencia docentes (semana)',
                          t.asistencias_docentes_semana || 0,
                        )}
                        {itemTarea(
                          'fa-user-graduate',
                          'Asistencia estudiantes (hoy)',
                          t.asistencias_alumnos_hoy || 0,
                        )}
                        {itemTarea(
                          'fa-users',
                          'Asistencia estudiantes (semana)',
                          t.asistencias_alumnos_semana || 0,
                        )}
                      </ul>
                    </td>
                    <td>{formatDateTime(p.ultimo_acceso)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="info-box">
        <i className="fas fa-info-circle info-box-icon" aria-hidden="true" />
        Resumen de las tareas diarias que cada preceptor debe realizar (tomar asistencia de docentes y de
        estudiantes). Solo lectura.
      </div>
    </div>
  );
}

export default SupervisionPreceptores;
