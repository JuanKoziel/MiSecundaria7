import { useEffect, useState } from 'react';
import Sidebar from './sidebar/sidebar';
import Header from './header/header';
import Resumen from './Resumen';
import Calificaciones from './Calificaciones';
import Asistencias from './Asistencias';
import Actas from './Actas';
import Comunicados from './Comunicados';
import { fetchFamiliaHijos, mapHijo } from '../../api/services';

function FamiliaDashboard({ user, onLogout }) {
  const [view, setView] = useState('resumen');
  const [hijoId, setHijoId] = useState('');
  const [hijos, setHijos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFamiliaHijos()
      .then((data) => setHijos(data.map(mapHijo)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const hijoSeleccionado = hijos.find((h) => String(h.id) === hijoId) ?? null;

  const renderView = () => {
    if (!hijoSeleccionado) return null;

    switch (view) {
      case 'resumen':
        return <Resumen hijo={hijoSeleccionado} />;
      case 'calificaciones':
        return <Calificaciones hijo={hijoSeleccionado} />;
      case 'asistencias':
        return <Asistencias hijo={hijoSeleccionado} />;
      case 'actas':
        return <Actas hijo={hijoSeleccionado} />;
      case 'comunicados':
        return <Comunicados hijo={hijoSeleccionado} />;
      default:
        return <Resumen hijo={hijoSeleccionado} />;
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar view={view} setView={setView} onLogout={onLogout} />

      <main className="main-content">
        <Header user={user} hijoSeleccionado={hijoSeleccionado} />

        <div className="card">
          <div className="filter-row">
            <div className="form-group-filter">
              <label htmlFor="hijo-select">Alumno vinculado</label>
              <select
                id="hijo-select"
                value={hijoId}
                onChange={(e) => setHijoId(e.target.value)}
                disabled={loading}
              >
                <option value="" disabled>
                  Seleccione un alumno...
                </option>
                {hijos.map((hijo) => (
                  <option key={hijo.id} value={hijo.id}>
                    {hijo.nombre} ({hijo.curso})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="card empty-state-card">
            <p className="empty-state-message">Cargando alumnos vinculados...</p>
          </div>
        ) : hijoSeleccionado ? (
          <div className="view-section active">{renderView()}</div>
        ) : (
          <div className="card empty-state-card">
            <p className="empty-state-message">
              Seleccioná un alumno vinculado para ver su información académica.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default FamiliaDashboard;
