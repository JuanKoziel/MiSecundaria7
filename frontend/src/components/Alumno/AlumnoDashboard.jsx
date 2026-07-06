import { useState, useMemo, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import Notificaciones from '../Notificaciones';
import ComunicadosView from '../Shared/ComunicadosView';
import DiagnosticosView from '../Shared/DiagnosticosView';
import ActividadesView from '../Shared/ActividadesView';
import { cursoConOrientacion } from '../../utils/orientacion';
import { boletinHTML, exportarBoletinPDF } from '../../utils/boletin';
import VistaHorarios from '../Administracion/VistaHorarios';
import AsistenciaMateriaDetalle from '../Shared/AsistenciaMateriaDetalle';
import PanelAlumno from './PanelAlumno';

function AlumnoDashboard({ user, onLogout }) {
  const {
    alumnos,
    calificacionesCompletas,
    asistenciasAdmin,
    periodos,
    nombreCompleto,
    materiasPorCurso,
    cursoMateria,
    cursosObj,
  } = useData();

  const [view, setView] = useState('perfil');
  const [asistenciaTipo, setAsistenciaTipo] = useState(() => {
    const saved = sessionStorage.getItem('alumno_asistencia_tipo');
    return saved || 'general';
  });

  useEffect(() => {
    sessionStorage.setItem('alumno_asistencia_tipo', asistenciaTipo);
  }, [asistenciaTipo]);

  const miAlumno = useMemo(
    () => alumnos.find((a) => a.id_usuario === user?.id) || null,
    [alumnos, user],
  );

  const periodo1 = useMemo(() => periodos.find((p) => (p.orden_periodo || 0) <= 1), [periodos]);
  const periodo2 = useMemo(() => periodos.find((p) => (p.orden_periodo || 0) === 2), [periodos]);

  const misCalificaciones = useMemo(() => {
    if (!miAlumno) return [];
    return calificacionesCompletas.filter((c) => c.id_alumno === miAlumno.id);
  }, [calificacionesCompletas, miAlumno]);

  const calsPorMateria = useMemo(() => {
    if (!miAlumno) return [];
    
    // Get all subjects for the student's course
    const cursoNombre = miAlumno.curso;
    const materiasDelCurso = materiasPorCurso[cursoNombre] || [];
    
    // Build a map of existing grades by curso_materia ID
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
    
    // Build the final list from all course subjects
    const result = materiasDelCurso.map((materiaNombre) => {
      // Find if there's a grade for this subject
      const cursoMateriaEntry = cursoMateria.find(
        (cm) => cm.curso_nombre === cursoNombre && cm.materia_nombre === materiaNombre
      );
      
      if (cursoMateriaEntry && gradesMap[cursoMateriaEntry.id]) {
        // Has grades
        return gradesMap[cursoMateriaEntry.id];
      } else {
        // No grades - show "Sin calificaciones"
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

  const asistenciasFiltradas = useMemo(() => {
    if (!miAlumno) return [];
    const filtradas = misAsistencias.filter(a => {
      if (asistenciaTipo === 'general') return a.tipo === 'general';
      return a.tipo === 'materia';
    });
    return filtradas;
  }, [misAsistencias, asistenciaTipo]);

  const historialPorDia = useMemo(() => {
    if (!miAlumno) return [];
    const fechasUnicas = [...new Set(misAsistencias.filter(a => a.tipo === 'general').map(a => a.fecha))];
    return fechasUnicas.map(fecha => {
      const asistenciasFecha = misAsistencias.filter(a => a.fecha === fecha && a.tipo === 'general');
      const presentes = asistenciasFecha.filter(a => a.estado === 'Presente').length;
      const ausentes = asistenciasFecha.filter(a => a.estado === 'Ausente').length;
      const estadoGeneral = presentes > ausentes ? 'Bueno' : presentes < ausentes ? 'Atención' : 'Regular';
      return {
        fecha,
        curso: miAlumno.curso || '—',
        presentes,
        ausentes,
        estadoGeneral
      };
    }).sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [misAsistencias, miAlumno]);

  const historialPorMateria = useMemo(() => {
    if (!miAlumno) return [];
    return misAsistencias
      .filter(a => a.tipo === 'materia')
      .map(a => ({
        fecha: a.fecha,
        curso: miAlumno.curso || '—',
        materia: a.materia || '—',
        modulo: a.numero_modulo ? `Módulo ${a.numero_modulo}` : '—',
        docente: a.docente_nombre || '—',
        estado: a.estado
      }))
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [misAsistencias, miAlumno]);

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
      <aside className="sidebar">
        <div className="sidebar-brand">
          <i className="fas fa-user-graduate" aria-hidden="true" />
          <span>Portal Alumno</span>
        </div>

        <ul className="sidebar-menu">
          <li className={view === 'perfil' ? 'active' : ''}>
            <button type="button" className="sidebar-menu-btn" onClick={() => setView('perfil')}>
              <i className="fas fa-user-graduate" aria-hidden="true" />
              <span>Mi Perfil</span>
            </button>
          </li>
          <li className={view === 'calificaciones' ? 'active' : ''}>
            <button type="button" className="sidebar-menu-btn" onClick={() => setView('calificaciones')}>
              <i className="fas fa-book" aria-hidden="true" />
              <span>Calificaciones</span>
            </button>
          </li>
          <li className={view === 'asistencias' ? 'active' : ''}>
            <button type="button" className="sidebar-menu-btn" onClick={() => setView('asistencias')}>
              <i className="fas fa-clipboard-check" aria-hidden="true" />
              <span>Asistencias</span>
            </button>
          </li>
          <li className={view === 'actividades' ? 'active' : ''}>
            <button type="button" className="sidebar-menu-btn" onClick={() => setView('actividades')}>
              <i className="fas fa-tasks" aria-hidden="true" />
              <span>Actividades</span>
            </button>
          </li>
          <li className={view === 'horarios' ? 'active' : ''}>
            <button type="button" className="sidebar-menu-btn" onClick={() => setView('horarios')}>
              <i className="fas fa-calendar-alt" aria-hidden="true" />
              <span>Horarios</span>
            </button>
          </li>
          <li className={view === 'comunicados' ? 'active' : ''}>
            <button type="button" className="sidebar-menu-btn" onClick={() => setView('comunicados')}>
              <i className="fas fa-bullhorn" aria-hidden="true" />
              <span>Comunicados</span>
            </button>
          </li>
          <li className={view === 'notificaciones' ? 'active' : ''}>
            <button type="button" className="sidebar-menu-btn" onClick={() => setView('notificaciones')}>
              <i className="fas fa-bell" aria-hidden="true" />
              <span>Notificaciones</span>
            </button>
          </li>

          <li className="logout-li">
            <button type="button" className="sidebar-menu-btn sidebar-logout-btn" onClick={onLogout}>
              <i className="fas fa-sign-out-alt" aria-hidden="true" />
              <span>Cerrar Sesión</span>
            </button>
          </li>
        </ul>
      </aside>

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

                <div style={{ marginTop: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <div className="card" style={{ flex: 1, minWidth: '140px', padding: '12px', textAlign: 'center' }}>
                    <strong style={{ fontSize: '24px', color: '#e53935' }}>{resumenAsistencia.ausencias}</strong>
                    <p style={{ margin: '4px 0 0', color: '#666' }}>Inasistencias</p>
                  </div>
                  <div className="card" style={{ flex: 1, minWidth: '140px', padding: '12px', textAlign: 'center' }}>
                    <strong style={{ fontSize: '24px', color: '#ff9800' }}>{resumenAsistencia.tardanzas}</strong>
                    <p style={{ margin: '4px 0 0', color: '#666' }}>Tardanzas</p>
                  </div>
                  <div className="card" style={{ flex: 1, minWidth: '140px', padding: '12px', textAlign: 'center' }}>
                    <strong style={{ fontSize: '24px', color: '#4caf50' }}>{resumenAsistencia.presentes}</strong>
                    <p style={{ margin: '4px 0 0', color: '#666' }}>Presentes</p>
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

                <div className="asist-tipo-selector">
                  <button
                    type="button"
                    className={`btn btn-sm ${asistenciaTipo === 'general' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setAsistenciaTipo('general')}
                  >
                    Asistencia por Día
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${asistenciaTipo === 'materia' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setAsistenciaTipo('materia')}
                  >
                    Asistencia por Materia
                  </button>
                </div>

                <div style={{ marginBottom: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ padding: '8px 16px', borderRadius: '8px', background: '#ffebee' }}>
                    <strong>{resumenAsistencia.ausencias}</strong> Inasistencias
                  </div>
                  <div style={{ padding: '8px 16px', borderRadius: '8px', background: '#fff3e0' }}>
                    <strong>{resumenAsistencia.tardanzas}</strong> Tardanzas
                  </div>
                  <div style={{ padding: '8px 16px', borderRadius: '8px', background: '#e8f5e9' }}>
                    <strong>{resumenAsistencia.presentes}</strong> Presentes
                  </div>
                </div>

                <div className="card" style={{ marginTop: '16px' }}>
                  <div className="card-header-flex">
                    <h3>Historial</h3>
                  </div>

                  {asistenciaTipo === 'general' ? (
                    <div className="table-responsive">
                      <table>
                        <thead>
                          <tr>
                            <th>Fecha</th>
                            <th>Curso</th>
                            <th>Presentes</th>
                            <th>Ausentes</th>
                            <th>Estado General</th>
                          </tr>
                        </thead>
                        <tbody>
                          {historialPorDia.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="empty-state-message">
                                No hay registros de historial por día.
                              </td>
                            </tr>
                          ) : (
                            historialPorDia.map((h, idx) => (
                              <tr key={idx}>
                                <td>{h.fecha}</td>
                                <td>{h.curso}</td>
                                <td>{h.presentes}</td>
                                <td>{h.ausentes}</td>
                                <td>
                                  <span className={`badge ${h.estadoGeneral === 'Bueno' ? 'badge-presente' : h.estadoGeneral === 'Atención' ? 'badge-ausente' : 'badge-tarde'}`}>
                                    {h.estadoGeneral}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  ) : miAlumno ? (
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
