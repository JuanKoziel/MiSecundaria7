import { useEffect, useMemo, useState } from 'react';

import Sidebar from './sidebar/sidebar';
import Header from './header/header';

import Resumen from './Resumen';
import Calificaciones from './Calificaciones';
import Asistencias from './Asistencias';
import Comunicados from './Comunicados';
import Actas from './Actas';
import Notificaciones from '../Notificaciones';
import ComunicadosView from '../Shared/ComunicadosView';
import DiagnosticosView from '../Shared/DiagnosticosView';
import ActividadesView from '../Shared/ActividadesView';
import VistaHorarios from '../Administracion/VistaHorarios';
import CalendarioInstitucional from '../Administracion/CalendarioInstitucional';
import PanelFamilia from './PanelFamilia';
import { useData } from '../../context/DataContext';
import { viewDesdeDestino } from '../../utils/navDestinos';

function FamiliaDashboard({ user, onLogout }) {
  const { getAlumnoById, getHijoLabel, hijosFamilia, padresTutores, nombreCompleto, cursosObj, navIntent, navegarDesdeNotificacion } = useData();
  const [view, setView] = useState('perfil');
  const [hijoId, setHijoId] = useState(() => hijos.length > 0 ? String(hijos[0].id) : '');

  const miTutor = useMemo(
    () => padresTutores.find((pt) => pt.id_usuario === user?.id) || null,
    [padresTutores, user],
  );
  const nombreCompletoTutor = miTutor ? `${miTutor.apellido}, ${miTutor.nombre}` : null;

  const hijos = useMemo(() => {
    const filtered = miTutor
      ? hijosFamilia.filter((h) => h.id_tutor === miTutor.id_tutor)
      : hijosFamilia;
    return filtered.map((hijo) => {
      const alumno = getAlumnoById(hijo.alumnoId);
      return {
        ...hijo,
        nombre: alumno ? nombreCompleto(alumno) : 'Estudiante',
        dni: alumno?.dni ?? '—',
      };
    });
  }, [hijosFamilia, getAlumnoById, nombreCompleto, miTutor]);

  // Parte 8: manejar navegación desde notificaciones.
  // Traduce el destino semántico a una vista válida del dashboard de familia y,
  // si la notificación refiere a un alumno concreto, selecciona el hijo
  // correspondiente para que la vista muestre la información correcta.
  // Se declara tras `hijos` porque depende de esa constante.
  useEffect(() => {
    if (navIntent && navIntent.destino) {
      const vista = viewDesdeDestino(navIntent.destino, 'familia');
      if (!vista) return;
      setView(vista);
      const alumnoId = navIntent.params?.alumnoId;
      if (alumnoId != null) {
        const hijo = hijos.find((h) => Number(h.alumnoId) === Number(alumnoId));
        if (hijo) setHijoId(String(hijo.id));
      }
    }
  }, [navIntent, hijos]);

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

      case 'horarios':
        return (
          <div className="view-section active">
            <VistaHorarios cursosOptions={cursosObj} cursoForzado={getAlumnoById(hijoSeleccionado.alumnoId)?.id_curso} />
          </div>
        );

      case 'actividades':
        return (
          <div className="view-section active">
            <ActividadesView userRole="familia" selectedChild={hijoSeleccionado} />
          </div>
        );

      case 'comunicados':
        return (
          <div className="view-section active">
            <ComunicadosView userRole="familia" selectedChild={hijoSeleccionado} />
          </div>
        );

      case 'info':
        return (
          <div className="view-section active">
            <DiagnosticosView userRole="familia" selectedChild={hijoSeleccionado} />
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
          nombreCompleto={nombreCompletoTutor}
        />

        {view === 'perfil' ? (

          <div className="dashboard-content">
            <div className="view-section active">
              <PanelFamilia miTutor={miTutor} user={user} hijos={hijos} />
            </div>
          </div>

        ) : view === 'notificaciones' ? (

          <div className="dashboard-content">
            <div className="view-section active">
              <Notificaciones userRole="familia" selectedChild={hijoSeleccionado} />
            </div>
          </div>

        ) : view === 'calendario' ? (

          <div className="dashboard-content">
            <div className="view-section active">
              <CalendarioInstitucional readOnly />
            </div>
          </div>

        ) : hijoSeleccionado ? (

          <div className="dashboard-content">
            {renderView()}
          </div>

        ) : (

          <div className="card empty-state-card">

            <p className="empty-state-message">
              Seleccioná un estudiante vinculado
              para visualizar toda su información académica.
            </p>

          </div>

        )}

      </main>
    </div>
  );
}

export default FamiliaDashboard;