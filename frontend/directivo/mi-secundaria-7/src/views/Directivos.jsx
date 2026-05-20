import React, { useState } from 'react';

export default function Directivos() {
  // --- NOTA PARA EL BACKEND ---
  // Estos arrays son los que luego se van a reemplazar por un useEffect 
  // haciendo un fetch a las APIs de Django (ej: /api/planificaciones/ y /api/ddjj/)
  const [planificaciones, setPlanificaciones] = useState([
    { id: 1, docente: 'Martín Gómez', materia: 'Matemática - 5to 1ra', estado: 'Entregado', fecha: '12/05/2026' },
    { id: 2, docente: 'Ana Laura Rossi', materia: 'Sistemas Operativos - 6to 2da', estado: 'Pendiente', fecha: 'Vencido (15/05)' },
    { id: 3, docente: 'Carlos López', materia: 'Programación - 4to 1ra', estado: 'Entregado', fecha: '18/05/2026' },
    { id: 4, docente: 'Patricia Fernandez', materia: 'Literatura - 6to 1ra', estado: 'Pendiente', fecha: 'Vencido (10/05)' },
  ]);

  const [ddjj, setDdjj] = useState([
    { id: 1, docente: 'Martín Gómez', cargos: '20 hs Titular', escuela: 'Secundaria 7', estado: 'Auditado' },
    { id: 2, docente: 'Ana Laura Rossi', cargos: '12 hs Suplente / 10 hs EET 1', escuela: 'Secundaria 7 / EET 1', estado: 'Pendiente' },
    { id: 3, docente: 'Carlos López', cargos: '15 hs Interino', escuela: 'Secundaria 7', estado: 'Auditado' },
  ]);

  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todos');

  // Funciones de interacción (Modificarán el estado local antes de impactar la BD con un PUT/POST)
  const handleReclamarPlanificacion = (id, nombreDocente) => {
    alert(`Notificación interna enviada a ${nombreDocente}.`);
    setPlanificaciones(prev => prev.map(item => 
      item.id === id ? { ...item, fecha: 'Prórroga (24hs)', estado: 'Pendiente' } : item
    ));
  };

  const handleAuditarDdjj = (id) => {
    setDdjj(prev => prev.map(item => 
      item.id === id ? { ...item, estado: 'Auditado' } : item
    ));
    alert('Declaración jurada verificada.');
  };

  const planificacionesFiltradas = planificaciones.filter(plan => {
    const coincideNombre = plan.docente.toLowerCase().includes(busqueda.toLowerCase()) || 
                          plan.materia.toLowerCase().includes(busqueda.toLowerCase());
    const coincideEstado = filtroEstado === 'Todos' || plan.estado === filtroEstado;
    return coincideNombre && coincideEstado;
  });

  const ddjjFiltradas = ddjj.filter(doc => 
    doc.docente.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div style={styles.viewSection}>
      
      {/* TARJETAS DE ESTADÍSTICAS */}
      <div style={styles.gridStats}>
        <div style={{ ...styles.card, borderLeft: '5px solid #fd7e14' }}>
          <small style={styles.cardLabel}>Docentes Activos</small>
          <h2 style={styles.cardValue}>{ddjj.length} En Sistema</h2>
        </div>
        <div style={{ ...styles.card, borderLeft: '5px solid #28a745' }}>
          <small style={styles.cardLabel}>Planificaciones OK</small>
          <h2 style={{ ...styles.cardValue, color: '#28a745' }}>
            {planificaciones.filter(p => p.estado === 'Entregado').length} Al Día
          </h2>
        </div>
        <div style={{ ...styles.card, borderLeft: '5px solid #dc3545' }}>
          <small style={styles.cardLabel}>Planificaciones Alerta</small>
          <h2 style={{ ...styles.cardValue, color: '#dc3545' }}>
            {planificaciones.filter(p => p.estado === 'Pendiente').length} Críticas
          </h2>
        </div>
      </div>

      {/* BARRA DE FILTROS ENCAPSULADA */}
      <div style={styles.filterBar}>
        <div style={{ flex: '1', minWidth: '250px' }}>
          <label style={styles.inputLabel}>🔍 Buscar Docente o Materia</label>
          <input 
            type="text" 
            placeholder="Escribí para buscar..." 
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={styles.inputControl}
          />
        </div>
        <div style={{ width: '200px' }}>
          <label style={styles.inputLabel}>📌 Filtrar por Estado</label>
          <select 
            value={filtroEstado} 
            onChange={(e) => setFiltroEstado(e.target.value)}
            style={styles.inputControl}
          >
            <option value="Todos">Todos los Estados</option>
            <option value="Entregado">Solo Entregados</option>
            <option value="Pendiente">Solo Pendientes</option>
          </select>
        </div>
      </div>

      {/* SECCIÓN 1: SUPERVISIÓN DE PLANIFICACIONES */}
      <div style={styles.cardTable}>
        <div style={styles.cardHeader}>
          <h3><i className="fa-solid fa-folder-open" style={{ color: '#fd7e14', marginRight: '10px' }}></i> Control de Planificaciones Pedagógicas</h3>
          <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '5px' }}>Mostrando {planificacionesFiltradas.length} resultados del colegio.</p>
        </div>

        <div style={styles.tableResponsive}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Docente</th>
                <th style={styles.th}>Materia / Curso</th>
                <th style={styles.th}>Fecha Límite / Entrega</th>
                <th style={styles.th}>Estado</th>
                <th style={styles.th}>Acciones de Supervisión</th>
              </tr>
            </thead>
            <tbody>
              {planificacionesFiltradas.length > 0 ? (
                planificacionesFiltradas.map((plan) => (
                  <tr key={plan.id} style={styles.tr}>
                    <td style={styles.td}><strong>{plan.docente}</strong></td>
                    <td style={styles.td}>{plan.materia}</td>
                    <td style={styles.td}>{plan.fecha}</td>
                    <td style={styles.td}>
                      <span className={`badge ${plan.estado === 'Entregado' ? 'badge-presente' : 'badge-ausente'}`}>
                        {plan.estado}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {plan.estado === 'Entregado' ? (
                        <button className="btn btn-success" style={styles.btnSmall} onClick={() => alert('Abriendo visor de PDF...')}>
                          <i className="fa-solid fa-eye"></i> Ver PDF
                        </button>
                      ) : (
                        <button className="btn btn-danger" style={styles.btnSmall} onClick={() => handleReclamarPlanificacion(plan.id, plan.docente)}>
                          <i className="fa-solid fa-bell"></i> Reclamar
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: '#999', padding: '30px' }}>
                    No se encontraron planificaciones.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECCIÓN 2: AUDITORÍA DE DECLARACIONES JURADAS */}
      <div style={styles.cardTable}>
        <div style={styles.cardHeader}>
          <h3><i className="fa-solid fa-id-card" style={{ color: '#fd7e14', marginRight: '10px' }}></i> Declaraciones Juradas de Cargos (DDJJ)</h3>
          <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '5px' }}>Mostrando {ddjjFiltradas.length} declaraciones activas.</p>
        </div>

        <div style={styles.tableResponsive}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Docente</th>
                <th style={styles.th}>Cargos Declarados</th>
                <th style={styles.th}>Establecimientos</th>
                <th style={styles.th}>Estado Interno</th>
                <th style={styles.th}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {ddjjFiltradas.length > 0 ? (
                ddjjFiltradas.map((doc) => (
                  <tr key={doc.id} style={styles.tr}>
                    <td style={styles.td}>{doc.docente}</td>
                    <td style={styles.td}>{doc.cargos}</td>
                    <td style={styles.td}>{doc.escuela}</td>
                    <td style={styles.td}>
                      <span className={`badge ${doc.estado === 'Auditado' ? 'badge-presente' : 'badge-tarde'}`}>
                        {doc.estado}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <button 
                        className="btn btn-primary" 
                        style={{ ...styles.btnSmall, background: doc.estado === 'Auditado' ? '#666' : '#0d233a' }}
                        onClick={() => handleAuditarDdjj(doc.id)}
                      >
                        <i className="fa-solid fa-file-contract"></i> {doc.estado === 'Auditado' ? 'Re-auditar' : 'Marcar Auditada'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: '#999', padding: '30px' }}>
                    No se encontraron declaraciones juradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// OBJETO DE ESTILOS ENCAPSULADO (Mantiene el componente aislado del CSS global)
const styles = {
  viewSection: { display: 'block', animation: 'fadeIn 0.4s ease' },
  gridStats: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' },
  card: { background: '#ffffff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)' },
  cardLabel: { color: '#666', textTransform: 'uppercase', fontWeight: 600, fontSize: '0.8rem' },
  cardValue: { fontSize: '1.8rem', marginTop: '5px', color: '#333' },
  filterBar: { background: '#ffffff', padding: '20px', marginBottom: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)', display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' },
  inputLabel: { display: 'block', marginBottom: '5px', fontSize: '0.85rem', fontWeight: 500, color: '#333' },
  inputControl: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none', fontFamily: 'inherit' },
  cardTable: { background: '#ffffff', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)', marginBottom: '30px' },
  cardHeader: { marginBottom: '20px' },
  tableResponsive: { width: '100%', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  th: { backgroundColor: '#f8f9fa', color: '#666', padding: '12px 16px', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', borderBottom: '2px solid #edf2f7' },
  td: { padding: '14px 16px', borderBottom: '1px solid #edf2f7', fontSize: '0.95rem', color: '#333' },
  btnSmall: { padding: '6px 12px', fontSize: '0.8rem', borderRadius: '6px' }
};