import { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import Notificaciones from '../Notificaciones';
import { cursoConOrientacion } from '../../utils/orientacion';

function AlumnoDashboard({ user, onLogout }) {
  const {
    alumnos,
    calificacionesCompletas,
    asistenciasAdmin,
    periodos,
    nombreCompleto,
  } = useData();

  const [view, setView] = useState('calificaciones');

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
    const map = {};
    misCalificaciones.forEach((c) => {
      const key = c.id_curso_materia;
      if (!map[key]) {
        map[key] = {
          materia: c.materia_nombre || 'Sin materia',
          curso: c.curso_nombre || '',
          prenota1: '', nota1: '', prenota2: '', nota2: '', diagnostico: '',
        };
      }
      const orden = periodos.find((p) => p.id_periodo === c.id_periodo)?.orden_periodo || 0;
      if (orden <= 1) {
        map[key].prenota1 = c.pre_nota || '';
        map[key].nota1 = c.nota_numerica ?? '';
        map[key].diagnostico = c.diagnostico || map[key].diagnostico;
      } else if (orden === 2) {
        map[key].prenota2 = c.pre_nota || '';
        map[key].nota2 = c.nota_numerica ?? '';
        if (c.diagnostico) map[key].diagnostico = c.diagnostico;
      }
    });
    return Object.values(map);
  }, [misCalificaciones, periodos]);

  const misAsistencias = useMemo(() => {
    if (!miAlumno) return [];
    return asistenciasAdmin
      .filter((a) => a.alumnoId === miAlumno.id)
      .sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
  }, [asistenciasAdmin, miAlumno]);

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

        {view === 'notificaciones' ? (
          <div className="view-section active">
            <Notificaciones />
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
                  <span className="badge role-badge-display">Solo lectura</span>
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

                {misAsistencias.length === 0 ? (
                  <p className="empty-state-message">No hay registros de asistencia.</p>
                ) : (
                  <div className="table-responsive">
                    <table>
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {misAsistencias.map((a) => (
                          <tr key={a.id}>
                            <td>{a.fecha}</td>
                            <td>
                              <span className={`badge ${
                                a.estado === 'Presente' ? 'badge-presente' :
                                a.estado === 'Ausente' ? 'badge-ausente' : 'badge-tarde'
                              }`}>
                                {a.estado}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default AlumnoDashboard;
