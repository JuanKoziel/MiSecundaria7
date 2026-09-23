import { useEffect, useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import Notificaciones from '../Notificaciones';
import ComunicadosView from '../Shared/ComunicadosView';
import DiagnosticosView from '../Shared/DiagnosticosView';
import AsistenciasUnificada from '../Shared/AsistenciasUnificada';
import { cursoConOrientacion } from '../../utils/orientacion';
import { viewDesdeDestino } from '../../utils/navDestinos';
import { boletinHTML, exportarBoletinPDF } from '../../utils/boletin';
import { useBoletinAcademico } from '../../hooks/useBoletinAcademico';
import BoletinExtras from '../BoletinExtras';
import BoletinTablaPrincipal from '../BoletinTablaPrincipal';
import VistaHorarios from '../Administracion/VistaHorarios';
import CalendarioInstitucional from '../Administracion/CalendarioInstitucional';
import PanelAlumno from './PanelAlumno';
import PanelMateriasAdeudadasAlumno from './PanelMateriasAdeudadasAlumno';
import Sidebar from './Sidebar';
import SidebarToggle from '../Shared/SidebarToggle';

function AlumnoDashboard({ user, onLogout }) {
  const {
    alumnos,
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
  // Traduce el destino semántico a una vista válida del dashboard de Alumno.
  useEffect(() => {
    if (navIntent && navIntent.destino) {
      const vista = viewDesdeDestino(navIntent.destino, 'alumno');
      if (vista) setView(vista);
    }
  }, [navIntent]);
  const miAlumno = useMemo(
    () => alumnos.find((a) => a.id_usuario === user?.id) || null,
    [alumnos, user],
  );
  const {
    intensificaciones_1c,
    bloqueos_por_materia,
    intensificaciones_posteriores,
    recursadas,
    previas,
    loading,
  } = useBoletinAcademico(miAlumno?.id);

  const misCalificaciones = useMemo(() => {
    if (!miAlumno) return [];
    return calificacionesCompletas.filter((c) => c.id_alumno === miAlumno.id);
  }, [calificacionesCompletas, miAlumno]);

  const calsPorMateria = useMemo(() => {
    if (!miAlumno) return [];
    
    // Obtener todas las materias del curso del alumno
    const cursoNombre = miAlumno.curso;
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
  }, [misCalificaciones, periodos, miAlumno, materiasPorCurso, cursoMateria]);

  const misAsistencias = useMemo(() => {
    if (!miAlumno) return [];
    return asistenciasAdmin
      .filter((a) => a.alumnoId === miAlumno.id)
      .sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
  }, [asistenciasAdmin, miAlumno]);

  const inasistenciasPorMateria = useMemo(() => {
    const porMateria = {};
    asistenciasAdmin
      .filter((a) => miAlumno && a.alumnoId === miAlumno.id && (a.estado === 'Ausente' || a.estado === 'Tarde'))
      .forEach((a) => {
        const mat = a.materia || 'General';
        if (!porMateria[mat]) porMateria[mat] = { ausencias: 0, tardanzas: 0 };
        if (a.estado === 'Ausente') porMateria[mat].ausencias += 1;
        else porMateria[mat].tardanzas += 1;
      });
    return porMateria;
  }, [asistenciasAdmin, miAlumno]);

  const handleDescargarBoletin = () => {
    if (!miAlumno) return;
    const html = boletinHTML({
      alumnoNombre: `${miAlumno.apellido}, ${miAlumno.nombre}`,
      dni: miAlumno.dni,
      cursoNombre: miAlumno.curso,
      anioLectivo: new Date().getFullYear(),
      materias: calsPorMateria,
      inasistenciasPorMateria,
      intensificaciones_1c,
      bloqueos_por_materia,
      intensificaciones_posteriores,
      recursadas,
      previas,
    });
    exportarBoletinPDF(html, `Boletín — ${miAlumno.apellido}, ${miAlumno.nombre}`);
  };

  const resumenAsistencia = useMemo(() => {
    const total = misAsistencias.length;
    const ausencias = misAsistencias.filter((a) => a.estado === 'Ausente').length;
    const tardanzas = misAsistencias.filter((a) => a.estado === 'Tarde').length;
    const presentes = misAsistencias.filter((a) => a.estado === 'Presente').length;
    return { total, ausencias, tardanzas, presentes };
  }, [misAsistencias]);

  const iniciales = useMemo(() => {
    const n = (miAlumno?.nombre || '').trim().charAt(0) || '';
    const a = (miAlumno?.apellido || '').trim().charAt(0) || '';
    return (n + a).toUpperCase() || 'E';
  }, [miAlumno]);

  return (
    <div className="dashboard-layout">
      <Sidebar view={view} setView={setView} onLogout={onLogout} />

      <main className="main-content">
        <header className="main-header main-header--dark">
          <div className="main-header-left">
            <SidebarToggle />
            <div className="main-header-greeting">
              <h2>
                <span className="greeting-saludo">Bienvenido:</span>{' '}
                <span className="greeting-nombre">
                  {miAlumno ? `${miAlumno.nombre} ${miAlumno.apellido}` : 'Estudiante'}
                </span>
              </h2>
              <p className="main-header-subtitle">
                <i className="fas fa-school font-accent" aria-hidden="true" />
                {miAlumno ? `Curso: ${cursoConOrientacion(miAlumno.curso)}` : 'Portal del Estudiante'}
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
            <PanelAlumno miAlumno={miAlumno} user={user} recursadas={recursadas} />
          </div>
        ) : view === 'notificaciones' ? (
          <div className="view-section active">
            <Notificaciones userRole="alumno" />
          </div>
        ) : view === 'horarios' ? (
          <div className="view-section active">
            <div className="card mt-16">
              <VistaHorarios cursosOptions={cursosObj} cursoForzado={miAlumno?.id_curso} mostrarTitulo />
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
        ) : !miAlumno ? (
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
                    onClick={handleDescargarBoletin}
                    disabled={calsPorMateria.length === 0}
                  >
                    <i className="fas fa-file-pdf" aria-hidden="true" /> Descargar boletín PDF
                  </button>
                </div>

                {calsPorMateria.length === 0 ? (
                  <p className="empty-state-message">No tenés calificaciones cargadas todavía.</p>
                ) : (
                  <BoletinTablaPrincipal
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

                <div className="boletin-firma-sello">
                  <span>Firma y sello</span>
                </div>

                <BoletinExtras
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
                  alumnoId={miAlumno.id}
                  cursoMateria={cursoMateria}
                  idCurso={miAlumno.id_curso}
                  userRole="alumno"
                />
              </div>
            )}

            {view === 'materias-adeudadas' && (
              <PanelMateriasAdeudadasAlumno miAlumno={miAlumno} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default AlumnoDashboard;
