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
  const { getAlumnoById, getHijoLabel, hijosFamilia, padresTutores, nombreCompleto, cursosObj, navIntent, navegarDesdeNotificacion, notificaciones = [] } = useData();
  const [view, setView] = useState('perfil');

  const miTutor = useMemo(
    () => padresTutores.find((pt) => pt.id_usuario === user?.id) || null,
    [padresTutores, user],
  );
  const nombreCompletoTutor = miTutor ? `${miTutor.apellido}, ${miTutor.nombre}` : null;

  const hijos = useMemo(() => {
    // `hijosFamilia` ya contiene solo los hijos vinculados a los usuarios de
    // la familia (backend filtra por la relación N:M tutor-alumno).
    return hijosFamilia.map((hijo) => {
      const alumno = getAlumnoById(hijo.alumnoId);
      return {
        ...hijo,
        nombre: alumno ? nombreCompleto(alumno) : 'Estudiante',
        dni: alumno?.dni ?? '—',
        // Contador de notificaciones sin leer por hijo (académicas).
        sinLeer: notificaciones.filter(
          (n) => !n.leida && Number(n.id_alumno) === Number(hijo.alumnoId),
        ).length,
      };
    });
  }, [hijosFamilia, getAlumnoById, nombreCompleto, notificaciones]);

  const [hijoId, setHijoId] = useState(() => hijos.length > 0 ? String(hijos[0].id) : '');

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
            <div className="card mt-16">
              <VistaHorarios
                cursosOptions={cursosObj}
                cursoForzado={getAlumnoById(hijoSeleccionado.alumnoId)?.id_curso}
                mostrarTitulo
              />
            </div>
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
        hijoSeleccionado={hijoSeleccionado}
      />

      <main className="main-content">

        <Header
          user={user}
          hijoSeleccionado={hijoSeleccionado}
          nombreCompleto={nombreCompletoTutor}
          view={view}
          hijos={hijos}
          hijoId={hijoId}
          setHijoId={setHijoId}
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