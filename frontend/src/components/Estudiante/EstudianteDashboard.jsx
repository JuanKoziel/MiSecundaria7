import { useEffect, useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import Notificaciones from '../Notificaciones';
import ComunicadosView from '../Shared/ComunicadosView';
import DiagnosticosView from '../Shared/DiagnosticosView';
import AsistenciasUnificada from '../Shared/AsistenciasUnificada';
import { cursoConOrientacion } from '../../utils/orientacion';
import { viewDesdeDestino } from '../../utils/navDestinos';
import { riteHTML, exportarRitePDF } from '../../utils/rite';
import { useRiteAcademico } from '../../hooks/useRiteAcademico';
import RiteExtras from '../RiteExtras';
import RiteTablaPrincipal from '../RiteTablaPrincipal';
import VistaHorarios from '../Administracion/VistaHorarios';
import CalendarioInstitucional from '../Administracion/CalendarioInstitucional';
import PanelEstudiante from './PanelEstudiante';
import PanelMateriasAdeudadasEstudiante from './PanelMateriasAdeudadasEstudiante';
import ActividadesView from '../Shared/ActividadesView';
import Sidebar from './Sidebar';
import SidebarToggle from '../Shared/SidebarToggle';
import Logo from '../Shared/Logo';

function EstudianteDashboard({ user, onLogout }) {
  const {
    estudiantes,
    calificacionesCompletas,
    asistenciasAdmin,
    periodos,
    materiasPorCurso,
    cursoMateria,
    cursosObj,
    navIntent,
  } = useData();
  const [view, setView] = useState('perfil');

  // Al cambiar de vista (incluido llegar desde una notificación con "Ver"),
  // se sube al inicio de la sección en lugar de quedar en la posición previa.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [view]);

  // Parte 8: manejar navegación desde notificaciones.
  // Traduce el destino semántico a una vista válida del dashboard de Estudiante.
  useEffect(() => {
    if (navIntent && navIntent.destino) {
      const vista = viewDesdeDestino(navIntent.destino, 'alumno');
      if (vista) setView(vista);
    }
  }, [navIntent]);
  const miEstudiante = useMemo(
    () => estudiantes.find((a) => a.id_usuario === user?.id) || null,
    [estudiantes, user],
  );
  const {
    intensificaciones_1c,
    bloqueos_por_materia,
    intensificaciones_posteriores,
    recursadas,
    previas,
    loading,
  } = useRiteAcademico(miEstudiante?.id);

  const misCalificaciones = useMemo(() => {
    if (!miEstudiante) return [];
    return calificacionesCompletas.filter((c) => c.id_alumno === miEstudiante.id);
  }, [calificacionesCompletas, miEstudiante]);

  const calsPorMateria = useMemo(() => {
    if (!miEstudiante) return [];
    
    // Obtener todas las materias del curso del estudiante
    const cursoNombre = miEstudiante.curso;
    const materiasDelCurso = materiasPorCurso[cursoNombre] || [];
    
    // Construir un mapa de calificaciones existentes por ID de curso_materia
    const gradesMap = {};
    misCalificaciones.forEach((c) => {
      const key = c.id_curso_materia;
      if (!gradesMap[key]) {
        gradesMap[key] = {
          materia: c.materia_nombre || 'Sin materia',
          curso: c.curso_nombre || '',
          prenota1: '', nota1: '', prenota2: '', nota2: '', diagnostico: '',
        };
      }
      const orden = periodos.find((p) => p.id_periodo === c.id_periodo)?.orden_periodo || 0;
      if (orden <= 1) {
        gradesMap[key].prenota1 = c.pre_nota || '';
        gradesMap[key].nota1 = c.nota_numerica ?? '';
        gradesMap[key].diagnostico = c.diagnostico || gradesMap[key].diagnostico;
      } else if (orden === 2) {
        gradesMap[key].prenota2 = c.pre_nota || '';
        gradesMap[key].nota2 = c.nota_numerica ?? '';
        if (c.diagnostico) gradesMap[key].diagnostico = c.diagnostico;
      }
    });
    
    // Construir la lista final desde todas las materias del curso
    const result = materiasDelCurso.map((materiaNombre) => {
      // Buscar si hay una calificación para esta materia
      const cursoMateriaEntry = cursoMateria.find(
        (cm) => cm.curso_nombre === cursoNombre && cm.materia_nombre === materiaNombre
      );
      
      if (cursoMateriaEntry && gradesMap[cursoMateriaEntry.id]) {
        // Tiene calificaciones
        return gradesMap[cursoMateriaEntry.id];
      } else {
        // Sin calificaciones - mostrar "Sin calificaciones"
        return {
          materia: materiaNombre,
          curso: cursoNombre,
          prenota1: 'Sin calificaciones',
          nota1: '',
          prenota2: 'Sin calificaciones',
          nota2: '',
          diagnostico: '',
        };
      }
    });
    
    return result;
  }, [misCalificaciones, periodos, miEstudiante, materiasPorCurso, cursoMateria]);

  const misAsistencias = useMemo(() => {
    if (!miEstudiante) return [];
    return asistenciasAdmin
      .filter((a) => a.alumnoId === miEstudiante.id)
      .sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
  }, [asistenciasAdmin, miEstudiante]);

  const inasistenciasPorMateria = useMemo(() => {
    const porMateria = {};
    asistenciasAdmin
      .filter((a) => miEstudiante && a.alumnoId === miEstudiante.id && (a.estado === 'Ausente' || a.estado === 'Tarde'))
      .forEach((a) => {
        const mat = a.materia || 'General';
        if (!porMateria[mat]) porMateria[mat] = { ausencias: 0, tardanzas: 0 };
        if (a.estado === 'Ausente') porMateria[mat].ausencias += 1;
        else porMateria[mat].tardanzas += 1;
      });
    return porMateria;
  }, [asistenciasAdmin, miEstudiante]);

  const handleDescargarRite = () => {
    if (!miEstudiante) return;
    const html = riteHTML({
      estudianteNombre: `${miEstudiante.apellido}, ${miEstudiante.nombre}`,
      dni: miEstudiante.dni,
      cursoNombre: miEstudiante.curso,
      anioLectivo: new Date().getFullYear(),
      materias: calsPorMateria,
      inasistenciasPorMateria,
      intensificaciones_1c,
      bloqueos_por_materia,
      intensificaciones_posteriores,
      recursadas,
      previas,
    });
    exportarRitePDF(html, `RITE — ${miEstudiante.apellido}, ${miEstudiante.nombre}`);
  };

  const resumenAsistencia = useMemo(() => {
    const total = misAsistencias.length;
    const ausencias = misAsistencias.filter((a) => a.estado === 'Ausente').length;
    const tardanzas = misAsistencias.filter((a) => a.estado === 'Tarde').length;
    const presentes = misAsistencias.filter((a) => a.estado === 'Presente').length;
    return { total, ausencias, tardanzas, presentes };
  }, [misAsistencias]);

  const iniciales = useMemo(() => {
    const n = (miEstudiante?.nombre || '').trim().charAt(0) || '';
    const a = (miEstudiante?.apellido || '').trim().charAt(0) || '';
    return (n + a).toUpperCase() || 'E';
  }, [miEstudiante]);

  return (
    <div className="dashboard-layout">
      <Sidebar view={view} setView={setView} onLogout={onLogout} />

      <main className="main-content">
        <header className="main-header main-header--dark">
          <div className="main-header-left">
            <SidebarToggle />
            <div className="main-header-greeting">
              <Logo className="header-logo" />
              <h2>
                <span className="greeting-saludo">Bienvenido:</span>{' '}
                <span className="greeting-nombre">
                  {miEstudiante ? `${miEstudiante.nombre} ${miEstudiante.apellido}` : 'Estudiante'}
                </span>
              </h2>
              <p className="main-header-subtitle">
                <i className="fas fa-school font-accent" aria-hidden="true" />
                {miEstudiante ? `Curso: ${cursoConOrientacion(miEstudiante.curso)}` : 'Portal del Estudiante'}
              </p>
            </div>
          </div>

          <div className="user-profile-info user-profile-card">
            <div className="user-avatar-wrap">
              <div className="user-avatar">{iniciales}</div>
            </div>
            <span className="badge role-badge-display">
              <span className="role-dot" aria-hidden="true" />
              Estudiante
            </span>
          </div>
        </header>

        {view === 'perfil' ? (
          <div className="view-section active">
            <PanelEstudiante miEstudiante={miEstudiante} user={user} recursadas={recursadas} />
          </div>
        ) : view === 'notificaciones' ? (
          <div className="view-section active">
            <Notificaciones userRole="alumno" />
          </div>
        ) : view === 'horarios' ? (
          <div className="view-section active">
            <div className="card mt-16">
              <VistaHorarios cursosOptions={cursosObj} cursoForzado={miEstudiante?.id_curso} mostrarTitulo />
            </div>
          </div>
        ) : view === 'comunicados' ? (
          <div className="view-section active">
            <ComunicadosView userRole="alumno" />
          </div>
        ) : view === 'info' ? (
          <div className="view-section active">
            <DiagnosticosView userRole="alumno" />
          </div>
        ) : view === 'calendario' ? (
          <div className="view-section active">
            <CalendarioInstitucional readOnly />
          </div>
        ) : !miEstudiante ? (
          <div className="card">
            <p className="empty-state-message">
              No se encontró un estudiante vinculado a este usuario.
            </p>
          </div>
        ) : (
          <div className="view-section active">
            {view === 'calificaciones' && (
              <div className="card">
                <div className="card-header-flex">
                  <h3><i className="fas fa-clipboard-list" aria-hidden="true" /> Mis Calificaciones</h3>
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={handleDescargarRite}
                    disabled={calsPorMateria.length === 0}
                  >
                    <i className="fas fa-file-pdf" aria-hidden="true" /> Descargar RITE PDF
                  </button>
                </div>

                {calsPorMateria.length === 0 ? (
                  <p className="empty-state-message">No tenés calificaciones cargadas todavía.</p>
                ) : (
                  <RiteTablaPrincipal
                    materias={calsPorMateria}
                    intensificaciones_1c={intensificaciones_1c}
                    bloqueos_por_materia={bloqueos_por_materia}
                    intensificaciones_posteriores={intensificaciones_posteriores}
                  />
                )}

                <div className="flex-gap-16--wrap mt-16">
                  <div className="card" style={{ flex: 1, minWidth: '140px', padding: '12px', textAlign: 'center' }}>
                    <strong style={{ fontSize: '24px', color: '#e53935' }}>{resumenAsistencia.ausencias}</strong>
                    <p className="text-muted" style={{ margin: '4px 0 0' }}>Inasistencias</p>
                  </div>
                  <div className="card" style={{ flex: 1, minWidth: '140px', padding: '12px', textAlign: 'center' }}>
                    <strong style={{ fontSize: '24px', color: '#ff9800' }}>{resumenAsistencia.tardanzas}</strong>
                    <p className="text-muted" style={{ margin: '4px 0 0' }}>Tardanzas</p>
                  </div>
                  <div className="card" style={{ flex: 1, minWidth: '140px', padding: '12px', textAlign: 'center' }}>
                    <strong style={{ fontSize: '24px', color: '#4caf50' }}>{resumenAsistencia.presentes}</strong>
                    <p className="text-muted" style={{ margin: '4px 0 0' }}>Presentes</p>
                  </div>
                </div>

                <div className="rite-firma-sello">
                  <span>Firma y sello</span>
                </div>

                <RiteExtras
                  recursadas={recursadas}
                  previas={previas}
                  intensificaciones_posteriores={intensificaciones_posteriores}
                  loading={loading}
                />
              </div>
            )}

            {view === 'asistencias' && (
              <div className="card">
                <AsistenciasUnificada
                  alumnoId={miEstudiante.id}
                  cursoMateria={cursoMateria}
                  idCurso={miEstudiante.id_curso}
                  userRole="alumno"
                />
              </div>
            )}

            {view === 'actividades' && (
              <div className="view-section active">
                <ActividadesView userRole="alumno" />
              </div>
            )}

            {view === 'materias-adeudadas' && (
              <PanelMateriasAdeudadasEstudiante miEstudiante={miEstudiante} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default EstudianteDashboard;
