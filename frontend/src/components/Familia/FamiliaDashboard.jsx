import { useMemo, useState } from 'react';
import Sidebar from './sidebar/sidebar';
import Header from './header/header';
import Resumen from './Resumen';
import Calificaciones from './Calificaciones';
import Asistencias from './Asistencias';
import Comunicados from './Comunicados';
import {
  getAlumnoById,
  getHijoLabel,
  hijosFamilia,
  nombreCompleto,
} from '../../data/mockData';

function FamiliaDashboard({ user, onLogout }) {
  const [view, setView] = useState('resumen');
  const [hijoId, setHijoId] = useState('');

  const hijos = useMemo(
    () =>
      hijosFamilia.map((hijo) => {
        const alumno = getAlumnoById(hijo.alumnoId);
        return {
          ...hijo,
          nombre: alumno ? nombreCompleto(alumno) : 'Alumno',
          dni: alumno?.dni ?? '—',
        };
      }),
    []
  );

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
              >
                <option value="" disabled>
                  Seleccione un alumno...
                </option>
                {hijos.map((hijo) => (
                  <option key={hijo.id} value={hijo.id}>
                    {getHijoLabel(hijo)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {hijoSeleccionado ? (
          <div className="view-section active">{renderView()}</div>
        ) : (
          <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
            <p style={{ color: '#666', fontSize: '1rem' }}>
              Seleccioná un alumno vinculado para ver su información académica.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default FamiliaDashboard;
