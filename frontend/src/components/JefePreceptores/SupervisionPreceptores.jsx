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

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Supervisión de Preceptores</h3>
        <span className="badge role-badge-display">Solo lectura</span>
      </div>

      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Preceptor</th>
              <th>Cursos Asignados</th>
              <th>Cantidad de Alumnos</th>
              <th>Cantidad de Tutores</th>
              <th>Último Acceso</th>
            </tr>
          </thead>
          <tbody>
            {preceptores.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-state-message">
                  No hay preceptores registrados.
                </td>
              </tr>
            ) : (
              preceptores.map((p) => (
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
                  <td>{formatDateTime(p.ultimo_acceso)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="info-box">
        <i className="fas fa-info-circle info-box-icon" aria-hidden="true" />
        Resumen del trabajo de cada preceptor en la institución. Solo lectura.
      </div>
    </div>
  );
}

export default SupervisionPreceptores;
