import { useState, useEffect } from 'react';

import Sidebar from './sidebar';
import Header from './header';

import PanelJefePreceptor from './PanelJefePreceptor';
import Alumnos from '../Preceptores/alumnos';
import Docentes from '../Preceptores/docentes';
import Tutores from '../Preceptores/tutores';
import Asistencias from '../Preceptores/asistencias';
import Actas from '../Preceptores/actas';
import Notas from '../Preceptores/notas';
import ComunicadosJefe from './ComunicadosJefe';
import CalendarioInstitucional from '../Administracion/CalendarioInstitucional';
import Notificaciones from '../Notificaciones';
import AdministracionPreceptores from './AdministracionPreceptores';
import AsignacionCursos from './AsignacionCursos';
import SupervisionPreceptores from './SupervisionPreceptores';
import EstadisticasPreceptoria from './EstadisticasPreceptoria';
import Historial from '../Administracion/historial';
import AdelantosHoras from '../Shared/AdelantosHoras';
import { useData } from '../../context/DataContext';
import { useMemo } from 'react';
import { viewDesdeDestino } from '../../utils/navDestinos';

function JefePreceptorDashboard({ user, onLogout }) {
  const { preceptores, administradores, navIntent } = useData();

  const userId = user?.id_usuario ?? user?.id ?? null;
  const miPreceptor = useMemo(() => {
    // Primero busca en preceptores (perfil normal de preceptor/jefe)
    let found = preceptores.find((p) => p.id_usuario === userId) || null;
    // Si no hay perfil de preceptor, busca en directivos/administradores
    // por un cargo relacionado con "Preceptor" (ej: "Jefa de Preceptores")
    if (!found && administradores?.length) {
      const admin = administradores.find(
        (a) => a.id_usuario === userId && /preceptor/i.test(a.cargo || '')
      );
      if (admin) {
        // Normalizar campos del directivo para que coincidan con lo que espera PanelJefePreceptor
        found = {
          id_preceptor: null,
          id_usuario: admin.id_usuario,
          usuario: admin.usuario,
          nombre: admin.nombre,
          apellido: admin.apellido,
          dni: admin.dni,
          correo: admin.correo,
          telefono: admin.telefono,
          estado: admin.usuario_estado !== false,
          usuario_fecha_ultimo_acceso: admin.usuario_fecha_ultimo_acceso || null,
          cursos: [],
        };
      }
    }
    return found;
  }, [preceptores, administradores, userId]);

  const nombreCompletoJefe = miPreceptor ? `${miPreceptor.apellido}, ${miPreceptor.nombre}` : null;

  const [view, setView] = useState('perfil');

  // Navegación desde notificaciones: el Jefe de Preceptores navega como
  // preceptor (mismas vistas). Solo cambia de sección si existe una vista
  // válida; si no, no navega (nunca pantalla en blanco).
  useEffect(() => {
    if (navIntent && navIntent.destino) {
      const vista = viewDesdeDestino(navIntent.destino, 'preceptor');
      if (vista) setView(vista);
    }
  }, [navIntent]);

  const [anioLectivo, setAnioLectivo] = useState('');
  const [curso, setCurso] = useState('');

  const handleAnioChange = (nuevoAnio) => {
    setAnioLectivo(nuevoAnio);
    setCurso('');
  };

  const filtrosProps = {
    anioLectivo,
    curso,
    onAnioChange: handleAnioChange,
    onCursoChange: setCurso,
  };

  const renderView = () => {
    switch (view) {
      case 'perfil':
        return (
          <div className="view-section active">
            <PanelJefePreceptor miPreceptor={miPreceptor} />
          </div>
        );

      case 'alumnos':
        return (
          <div className="view-section active">
            <Alumnos {...filtrosProps} readOnly />
          </div>
        );

      case 'docentes':
        return (
          <div className="view-section active">
            <Docentes readOnly />
          </div>
        );

      case 'tutores':
        return (
          <div className="view-section active">
            <Tutores readOnly />
          </div>
        );

      case 'asistencias':
        return (
          <div className="view-section active">
            <Asistencias {...filtrosProps} readOnly />
          </div>
        );

      case 'adelantos-horas':
        return (
          <div className="view-section active">
            <AdelantosHoras />
          </div>
        );

      case 'actas':
        return (
          <div className="view-section active">
            <Actas {...filtrosProps} />
          </div>
        );

      case 'notas':
        return (
          <div className="view-section active">
            <Notas {...filtrosProps} />
          </div>
        );

      case 'comunicados':
        return (
          <div className="view-section active">
            <ComunicadosJefe />
          </div>
        );

      case 'admin-preceptores':
        return (
          <div className="view-section active">
            <AdministracionPreceptores />
          </div>
        );

      case 'asignacion-cursos':
        return (
          <div className="view-section active">
            <AsignacionCursos />
          </div>
        );

      case 'estadisticas':
        return (
          <div className="view-section active">
            <EstadisticasPreceptoria />
          </div>
        );

      case 'supervision-preceptores':
        return (
          <div className="view-section active">
            <SupervisionPreceptores />
          </div>
        );

      case 'historial':
        return (
          <div className="view-section active">
            <Historial ocultarRegistro />
          </div>
        );

      case 'calendario':
        return (
          <div className="view-section active">
            <CalendarioInstitucional readOnly />
          </div>
        );

      case 'notificaciones':
        return (
          <div className="view-section active">
            <Notificaciones userRole="jefe_preceptores" />
          </div>
        );

      default:
        return (
          <div className="view-section active">
            <PanelJefePreceptor miPreceptor={miPreceptor} />
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

        <Header user={user} nombreCompleto={nombreCompletoJefe} {...filtrosProps} />

        <div className="dashboard-content">
          {renderView()}
        </div>

      </main>
    </div>
  );
}

export default JefePreceptorDashboard;
