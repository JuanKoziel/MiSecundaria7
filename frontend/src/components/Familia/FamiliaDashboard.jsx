import { useMemo, useState } from 'react';

import Sidebar from './sidebar/sidebar';
import Header from './header/header';

import Resumen from './Resumen';
import Calificaciones from './Calificaciones';
import Asistencias from './Asistencias';
import Comunicados from './Comunicados';
import Actas from './Actas';
import Notificaciones from '../Notificaciones';
import { useData } from '../../context/DataContext';

function FamiliaDashboard({ user, onLogout }) {
  const { getAlumnoById, getHijoLabel, hijosFamilia, padresTutores, nombreCompleto } = useData();
  const [view, setView] = useState('resumen');
  const [hijoId, setHijoId] = useState('');

  const miTutor = useMemo(
    () => padresTutores.find((pt) => pt.id_usuario === user?.id) || null,
    [padresTutores, user],
  );

  const hijos = useMemo(() => {
    const filtered = miTutor
      ? hijosFamilia.filter((h) => h.id_tutor === miTutor.id_tutor)
      : hijosFamilia;
    return filtered.map((hijo) => {
      const alumno = getAlumnoById(hijo.alumnoId);
      return {
        ...hijo,
        nombre: alumno ? nombreCompleto(alumno) : 'Alumno',
        dni: alumno?.dni ?? '—',
      };
    });
  }, [hijosFamilia, getAlumnoById, nombreCompleto, miTutor]);

  const hijoSeleccionado = hijos.find((h) => String(h.id) === hijoId) ?? null;

  const renderView = () => {

    if (!hijoSeleccionado) return null;

    switch (view) {

      case 'resumen':
        return (
          <div className="view-section active">
            <Resumen hijo={hijoSeleccionado} />
          </div>
        );

      case 'calificaciones':
        return (
          <div className="view-section active">
            <Calificaciones hijo={hijoSeleccionado} />
          </div>
        );

      case 'asistencias':
        return (
          <div className="view-section active">
            <Asistencias hijo={hijoSeleccionado} />
          </div>
        );

      case 'actas':
        return (
          <div className="view-section active">
            <Actas hijo={hijoSeleccionado} />
          </div>
        );

      case 'comunicados':
        return (
          <div className="view-section active">
            <Comunicados hijo={hijoSeleccionado} />
          </div>
        );

      default:
        return (
          <div className="view-section active">
            <Resumen hijo={hijoSeleccionado} />
          </div>
        );
    }
  };

  return (
    <div className="dashboard-layout">

      <Sidebar
        view={view}
        setView={setView}
        onLogout={onLogout}
      />

      <main className="main-content">

        <Header
          user={user}
          hijoSeleccionado={hijoSeleccionado}
        />

        {/* ===================================================== */}
        {/* SELECTOR DE ALUMNO                                   */}
        {/* ===================================================== */}

        <div className="card">

          <div className="card-header-flex">
            <h3>Alumno vinculado</h3>
          </div>

          <div className="filter-row">

            <div className="form-group-filter">

              <label htmlFor="hijo-select">
                Seleccionar alumno
              </label>

              <select
                id="hijo-select"
                value={hijoId}
                onChange={(e) => setHijoId(e.target.value)}
              >
                <option value="" disabled hidden>
                  Seleccione un alumno...
                </option>

                {hijos.map((hijo) => (
                  <option
                    key={hijo.id}
                    value={hijo.id}
                  >
                    {getHijoLabel(hijo)}
                  </option>
                ))}

              </select>

            </div>

          </div>

        </div>

        {/* ===================================================== */}
        {/* CONTENIDO PRINCIPAL                                   */}
        {/* ===================================================== */}

        {view === 'notificaciones' ? (

          <div className="dashboard-content">
            <div className="view-section active">
              <Notificaciones />
            </div>
          </div>

        ) : hijoSeleccionado ? (

          <div className="dashboard-content">
            {renderView()}
          </div>

        ) : (

          <div className="card empty-state-card">

            <p className="empty-state-message">
              Seleccioná un alumno vinculado
              para visualizar toda su información académica.
            </p>

          </div>

        )}

      </main>
    </div>
  );
}

export default FamiliaDashboard;