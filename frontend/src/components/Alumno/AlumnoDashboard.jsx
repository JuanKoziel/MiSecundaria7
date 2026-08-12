import { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import Notificaciones from '../Notificaciones';
import ComunicadosView from '../Shared/ComunicadosView';
import DiagnosticosView from '../Shared/DiagnosticosView';
import ActividadesView from '../Shared/ActividadesView';
import { cursoConOrientacion } from '../../utils/orientacion';
import { boletinHTML, exportarBoletinPDF } from '../../utils/boletin';
import VistaHorarios from '../Administracion/VistaHorarios';
import CalendarioInstitucional from '../Administracion/CalendarioInstitucional';
import AsistenciaMateriaDetalle from '../Shared/AsistenciaMateriaDetalle';
import PanelAlumno from './PanelAlumno';
import PanelPreviasAlumno from './PanelPreviasAlumno';
import Sidebar from './Sidebar';

function AlumnoDashboard({ user, onLogout }) {
  const {
    alumnos,
    calificacionesCompletas,
    asistenciasAdmin,
    periodos,
    materiasPorCurso,
    cursoMateria,
    cursosObj,
  } = useData();

  const [view, setView] = useState('perfil');
  const miAlumno = useMemo(
    () => alumnos.find((a) => a.id_usuario === user?.id) || null,
    [alumnos, user],
  );

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

  return (
    <div className="dashboard-layout">
      <Sidebar view={view} setView={setView} onLogout={onLogout} />

      <main className="main-content">
        <header className="main-header">
          <div>
            <h1>{miAlumno ? `${miAlumno.nombre} ${miAlumno.apellido}` : 'Alumno'}</h1>
            <p className="main-header-subtitle">
              {miAlumno ? `Curso: ${cursoConOrientacion(miAlumno.curso)}` : 'Portal del Alumno'}
            </p>
          </div>
          <span className="badge role-badge-display">Alumno</span>
        </header>

        {view === 'perfil' ? (
          <div className="view-section active">
            <PanelAlumno miAlumno={miAlumno} user={user} />
          </div>
        ) : view === 'previas' ? (
          <div className="view-section active">
            <PanelPreviasAlumno miAlumno={miAlumno} />
          </div>
        ) : view === 'notificaciones' ? (
          <div className="view-section active">
            <Notificaciones />
          </div>
        ) : view === 'horarios' ? (
          <div className="view-section active">
            <VistaHorarios cursosOptions={cursosObj} cursoForzado={miAlumno?.id_curso} />
          </div>
        ) : view === 'actividades' ? (
          <div className="view-section active">
            <ActividadesView userRole="alumno" />
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
              No se encontró un alumno vinculado a este usuario.
            </p>
          </div>
        ) : (
          <div className="view-section active">
            {view === 'calificaciones' && (
              <div className="card">
                <div className="card-header-flex">
                  <h3>Mis Calificaciones</h3>
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
                  <div className="table-responsive">
                    <table>
                      <thead>
                        <tr>
                          <th>Materia</th>
                          <th>Prenota 1°</th>
                          <th>Nota 1°</th>
                          <th>Prenota 2°</th>
                          <th>Nota 2°</th>
                          <th>Diagnóstico</th>
                        </tr>
                      </thead>
                      <tbody>
                        {calsPorMateria.map((c, idx) => (
                          <tr key={idx}>
                            <td className="table-cell-strong">{c.materia}</td>
                            <td>
                              {c.prenota1 ? (
                                <span className="badge badge-cualitativa">{c.prenota1}</span>
                              ) : '—'}
                            </td>
                            <td>{c.nota1 !== '' ? c.nota1 : '—'}</td>
                            <td>
                              {c.prenota2 ? (
                                <span className="badge badge-cualitativa">{c.prenota2}</span>
                              ) : '—'}
                            </td>
                            <td>{c.nota2 !== '' ? c.nota2 : '—'}</td>
                            <td>{c.diagnostico || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
              </div>
            )}

            {view === 'asistencias' && (
              <div className="card">
                <div className="card-header-flex">
                  <h3>Mis Asistencias</h3>
                  <span className="badge role-badge-display">Solo lectura</span>
                </div>

                <div className="flex-gap-16--wrap mb-16">
                  <div className="asistencia-badge ausencias">
                    <strong>{resumenAsistencia.ausencias}</strong> Inasistencias
                  </div>
                  <div className="asistencia-badge tardanzas">
                    <strong>{resumenAsistencia.tardanzas}</strong> Tardanzas
                  </div>
                  <div className="asistencia-badge presentes">
                    <strong>{resumenAsistencia.presentes}</strong> Presentes
                  </div>
                </div>

                <div className="card mt-16">
                  <div className="card-header-flex">
                    <h3>Historial</h3>
                  </div>

                  {miAlumno ? (
                    <AsistenciaMateriaDetalle
                      alumnoId={miAlumno.id}
                      cursoMateria={cursoMateria}
                      idCurso={miAlumno.id_curso}
                    />
                  ) : (
                    <p className="empty-state-message">No se pudo identificar al alumno.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default AlumnoDashboard;
