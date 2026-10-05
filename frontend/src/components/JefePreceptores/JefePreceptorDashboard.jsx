import { useCallback, useState, useEffect, useRef } from 'react';

import Sidebar from './sidebar';
import Header from './header';

import PanelJefePreceptor from './PanelJefePreceptor';
import Estudiantes from '../Preceptores/estudiantes';
import Docentes from '../Preceptores/docentes';
import TutoresFamilias from '../Preceptores/tutoresFamilias';
import Asistencias from '../Preceptores/asistencias';
import Actas from '../Preceptores/actas';
import Notas from '../Preceptores/notas';
import ComunicadosJefe from './ComunicadosJefe';
import CalendarioInstitucional from '../Administracion/CalendarioInstitucional';
import Notificaciones from '../Notificaciones';
import AdministracionPreceptores from './AdministracionPreceptores';
import EstadisticasPreceptoria from './EstadisticasPreceptoria';
import Historial from '../Administracion/historial';
import AdelantosHoras from '../Shared/AdelantosHoras';
import { useData } from '../../context/DataContext';
import { useMemo } from 'react';
import { viewDesdeDestino } from '../../utils/navDestinos';

function JefePreceptorDashboard({ user, onLogout }) {
  const { preceptores, administradores, navIntent, cursosObj, selectedCursoIds, setSeleccionCursos } = useData();

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

  // 5.6 — multiselección de cursos; `curso` sigue siendo el primero de la lista
  // para las vistas que todavía filtran por un curso solo.
  const [anioLectivo, setAnioLectivo] = useState('');
  const [curso, setCurso] = useState('');
  const [cursos, setCursos] = useState([]);

  // Navegación desde notificaciones: el Jefe de Preceptores navega como
  // preceptor (mismas vistas). Solo cambia de sección si existe una vista
  // válida; si no, no navega (nunca pantalla en blanco).
  // 5.1: además deja el año lectivo y el curso ya seleccionados en el header.
  // Se aplica una vez por navegación (guarda por timestamp) para no pisar la
  // elección manual del header cuando `cursosObj` se refresca.
  const navAplicadoRef = useRef(null);
  const [cursoPendienteNav, setCursoPendienteNav] = useState('');

  useEffect(() => {
    if (!navIntent || !navIntent.destino) return;
    if (navAplicadoRef.current === navIntent.timestamp) return;
    navAplicadoRef.current = navIntent.timestamp;

    const vista = viewDesdeDestino(navIntent.destino, 'preceptor');
    if (vista) setView(vista);

    const p = navIntent.params || {};
    const anio = p.anio ?? p.anioLectivo ?? null;
    if (anio) setAnioLectivo(String(anio));

    const porNombre = p.cursoNombre ?? p.curso_nombre
      ?? (typeof p.curso === 'string' && /[°º]/.test(p.curso) ? p.curso : null)
      ?? null;
    const porId = p.cursoId ?? p.curso_id
      ?? (typeof p.curso === 'string' && p.curso && !/[°º]/.test(p.curso) ? p.curso : null)
      ?? null;

    // 5.6 — la notificación trae un curso puntual, así que se deja marcada solo
    // esa división (y no todas las del año).
    if (porNombre) {
      setCursos([String(porNombre)]);
      setCurso(String(porNombre));
      setCursoPendienteNav('');
    } else if (porId) {
      setCursoPendienteNav(String(porId));
    }
  }, [navIntent]);

  useEffect(() => {
    if (!cursoPendienteNav) return;
    const encontrado = (cursosObj || []).find(
      (c) => String(c.id_curso) === String(cursoPendienteNav),
    );
    if (encontrado) {
      setCursos([String(encontrado.nombre_curso)]);
      setCurso(String(encontrado.nombre_curso));
      setCursoPendienteNav('');
    }
  }, [cursoPendienteNav, cursosObj]);

  const handleAnioChange = (nuevoAnio) => {
    setAnioLectivo(nuevoAnio);
    setCurso('');
    setCursos([]);
  };

  const handleCursosChange = useCallback((lista) => {
    const nombres = (Array.isArray(lista) ? lista : []).filter(Boolean);
    setCursos(nombres);
    setCurso(nombres[0] || '');
  }, []);

  // 5.6 — Se publica la selección en el contexto global (igual que hace el panel
  // de Administración) para que las vistas que leen del contexto en vez de por
  // props —Asistencias, Adelantos de Horas— filtren por todas las divisiones
  // marcadas y no queden sin filtro.
  useEffect(() => {
    const nombres = cursos.length > 0 ? cursos : (curso ? [curso] : []);
    const ids = nombres
      .map((n) => (cursosObj || []).find((c) => c.nombre_curso === n)?.id_curso)
      .filter((x) => x !== undefined && x !== null);
    if (ids.join(',') === selectedCursoIds.join(',')) return;
    setSeleccionCursos(nombres, ids);
  }, [cursos, curso, cursosObj, selectedCursoIds, setSeleccionCursos]);

  const filtrosProps = {
    anioLectivo,
    curso,
    cursos,
    onAnioChange: handleAnioChange,
    onCursoChange: setCurso,
    onCursosChange: handleCursosChange,
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
            <Estudiantes {...filtrosProps} readOnly />
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
            <TutoresFamilias readOnly anioLectivo={anioLectivo} cursos={cursos} curso={curso} />
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

      case 'estadisticas':
        return (
          <div className="view-section active">
            <EstadisticasPreceptoria />
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
