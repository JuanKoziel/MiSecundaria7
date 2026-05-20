import { useState } from 'react';

export default function Directivos() {
  // Estado para controlar las planificaciones curriculares (Módulo 2)
  const [planificaciones, setPlanificaciones] = useState([
    { id: 1, docente: 'Martín Gómez', materia: 'Matemática - 5to 1ra', estado: 'Entregado', fecha: '12/05/2026' },
    { id: 2, docente: 'Ana Laura Rossi', materia: 'Sistemas Operativos - 6to 2da', estado: 'Pendiente', fecha: 'Vencido (15/05)' },
    { id: 3, docente: 'Carlos López', materia: 'Programación - 4to 1ra', estado: 'Entregado', fecha: '18/05/2026' },
  ]);

  // Estado para controlar las Declaraciones Juradas (Módulo 2)
  const [ddjj, setDdjj] = useState([
    { id: 1, docente: 'Martín Gómez', cargos: '20 hs Titular', escuela: 'Secundaria 7', estado: 'Auditado' },
    { id: 2, docente: 'Ana Laura Rossi', cargos: '12 hs Suplente / 10 hs EET 1', escuela: 'Secundaria 7 / EET 1', estado: 'Pendiente' },
  ]);

  // Función interactiva para usar setPlanificaciones (Módulo 2: Reclamar/Dar Prórroga)
  const handleReclamarPlanificacion = (id, nombreDocente) => {
    alert(`Notificación interna enviada a ${nombreDocente}. Se le solicitó la carga del PDF.`);
    
    // Simulamos que al reclamar, el sistema le da una prórroga condicional en el estado
    setPlanificaciones(prev => prev.map(item => 
      item.id === id ? { ...item, fecha: 'Prórroga (24hs)', estado: 'Pendiente' } : item
    ));
  };

  // Función interactiva para usar setDdjj (Módulo 2: Marcar como Auditada por Dirección)
  const handleAuditarDdjj = (id) => {
    setDdjj(prev => prev.map(item => 
      item.id === id ? { ...item, estado: 'Auditado' } : item
    ));
    alert('Declaración jurada verificada y archivada correctamente.');
  };

  return (
    <div className="view-section">
      {/* TARJETAS DE ESTADÍSTICAS (Módulo 5) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div className="card" style={{ margin: 0, borderLeft: '5px solid #fd7e14', padding: '20px' }}>
          <small style={{ color: '#666', textTransform: 'uppercase', fontWeight: 600 }}>Alumnos Totales</small>
          <h2 style={{ fontSize: '2rem', marginTop: '5px' }}>~400</h2>
        </div>
        <div className="card" style={{ margin: 0, borderLeft: '5px solid #28a745', padding: '20px' }}>
          <small style={{ color: '#666', textTransform: 'uppercase', fontWeight: 600 }}>Rendimiento General</small>
          <h2 style={{ fontSize: '2rem', marginTop: '5px', color: '#28a745' }}>78% <span style={{ fontSize: '1rem', fontWeight: 400 }}>Aprobados</span></h2>
        </div>
        <div className="card" style={{ margin: 0, borderLeft: '5px solid #dc3545', padding: '20px' }}>
          <small style={{ color: '#666', textTransform: 'uppercase', fontWeight: 600 }}>Planificaciones Alerta</small>
          <h2 style={{ fontSize: '2rem', marginTop: '5px', color: '#dc3545' }}>
            {planificaciones.filter(p => p.estado === 'Pendiente').length} Críticas
          </h2>
        </div>
      </div>

      {/* SECCIÓN 1: SUPERVISIÓN DE PLANIFICACIONES (Módulo 2) */}
      <div className="card">
        <div className="card-header-flex">
          <div>
            <h3><i className="fa-solid fa-folder-open" style={{ color: '#fd7e14', marginRight: '10px' }}></i> Control de Planificaciones Pedagogicas</h3>
            <p style={{ fontSize: '0.85rem', color: '#666' }}>Monitoreo institucional de archivos PDF docentes antes del bloqueo de carga automático[cite: 175, 176].</p>
          </div>
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Docente</th>
                <th>Materia / Curso</th>
                <th>Fecha Límite / Entrega</th>
                <th>Estado</th>
                <th>Acciones de Supervisión</th>
              </tr>
            </thead>
            <tbody>
              {planificaciones.map((plan) => (
                <tr key={plan.id}>
                  <td><strong>{plan.docente}</strong></td>
                  <td>{plan.materia}</td>
                  <td>{plan.fecha}</td>
                  <td>
                    <span className={`badge ${plan.estado === 'Entregado' ? 'badge-presente' : 'badge-ausente'}`}>
                      {plan.estado}
                    </span>
                  </td>
                  <td>
                    {plan.estado === 'Entregado' ? (
                      <button className="btn btn-success" style={{ padding: '5px 10px', fontSize: '0.8rem' }} onClick={() => alert('Abriendo visor de PDF institucional... [cite: 134]')}>
                        <i className="fa-solid fa-eye"></i> Ver Planificación [cite: 114]
                      </button>
                    ) : (
                      <button className="btn btn-danger" style={{ padding: '5px 10px', fontSize: '0.8rem' }} onClick={() => handleReclamarPlanificacion(plan.id, plan.docente)}>
                        <i className="fa-solid fa-bell"></i> Reclamar / Prórroga 
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECCIÓN 2: AUDITORÍA DE DECLARACIONES JURADAS (Módulo 2) */}
      <div className="card">
        <div className="card-header-flex">
          <div>
            <h3><i className="fa-solid fa-id-card" style={{ color: '#fd7e14', marginRight: '10px' }}></i> Declaraciones Juradas de Cargos (DDJJ)</h3>
            <p style={{ fontSize: '0.85rem', color: '#666' }}>Acceso restringido exclusivo para el equipo de conducción (Directivos y Secretarios)[cite: 179].</p>
          </div>
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Docente</th>
                <th>Cargos Declarados</th>
                <th>Establecimientos</th>
                <th>Estado Interno</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {ddjj.map((doc) => (
                <tr key={doc.id}>
                  <td>{doc.docente}</td>
                  <td>{doc.cargos}</td>
                  <td>{doc.escuela}</td>
                  <td>
                    <span className={`badge ${doc.estado === 'Auditado' ? 'badge-presente' : 'badge-tarde'}`}>
                      {doc.estado}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn btn-primary" 
                      style={{ padding: '5px 10px', fontSize: '0.8rem', background: doc.estado === 'Auditado' ? '#666' : '#0d233a' }}
                      onClick={() => handleAuditarDdjj(doc.id)}
                    >
                      <i className="fa-solid fa-file-contract"></i> {doc.estado === 'Auditado' ? 'Re-auditar' : 'Marcar Auditada'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}