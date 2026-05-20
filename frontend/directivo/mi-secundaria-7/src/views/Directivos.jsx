import React, { useState } from 'react';

export default function Directivos() {
  // --- PESTAÑA ACTIVA (Ahora en el panel lateral) ---
  const [activeTab, setActiveTab] = useState('cursos');

  // --- 1. DATOS SIMULADOS ---
  const [cursos] = useState([
    { id: '1-1', año: '1ro', division: '1ra', orientacion: 'Ciclo Básico' },
    { id: '1-2', año: '1ro', division: '2da', orientacion: 'Ciclo Básico' },
    { id: '4-1', año: '4to', division: '1ra', orientacion: 'Informática' },
    { id: '4-2', año: '4to', division: '2da', orientacion: 'Ciencias Naturales' },
    { id: '6-1', año: '6to', division: '1ra', orientacion: 'Informática' },
  ]);

  const [materiasPorCurso] = useState({
    '1-1': ['Biología', 'Matemática', 'Historia'],
    '4-1': ['Programación', 'Sistemas Operativos', 'Física'],
    '6-1': ['Proyecto Informático', 'Redes', 'Literatura'],
  });

  const [alumnos] = useState([
    { dni: '45123456', nombre: 'Gómez, Lautaro', cursoId: '4-1', materia: 'Programación', email: 'lau.gomez@email.com', telefono: '2284-112233' },
    { dni: '45987654', nombre: 'Álvarez, Sofía', cursoId: '4-1', materia: 'Programación', email: 'sofia.alvarez@email.com', telefono: '2284-445566' },
    { dni: '46111222', nombre: 'Rodríguez, Lucas', cursoId: '1-1', materia: 'Biología', email: 'lucas.rod@email.com', telefono: '2284-778899' },
  ]);

  const [docentes] = useState([
    { dni: '28123456', nombre: 'Martín Gómez', materia: 'Matemática', cargos: '20 hs Titular', escuela: 'Secundaria 7', ddjj: 'Auditado', asistencias: '95% Asiduidad' },
    { dni: '30987654', nombre: 'Ana Laura Rossi', materia: 'Sistemas Operativos', cargos: '12 hs Suplente', escuela: 'Secundaria 7 / EET 1', ddjj: 'Pendiente', asistencias: '88% Asiduidad' },
  ]);

  const [directivoInfo] = useState({
    nombre: 'Facundo Nahuel Terenzano',
    cargo: 'Director General',
    dni: '39123456',
    email: 'direccion.ms7@abc.gob.ar',
    resolucion: 'Res. N° 4512/24'
  });

  // --- 2. ESTADOS DE SELECCIÓN Y FILTROS ---
  const [cursoSeleccionado, setCursoSeleccionado] = useState('');
  const [materiaSeleccionada, setMateriaSeleccionada] = useState('');
  const [alumnoDetalle, setAlumnoDetalle] = useState(null);
  
  // Estado para el acordeón de docentes (guarda el DNI del docente desplegado)
  const [docenteDesplegado, setDocenteDesplegado] = useState(null);
  
  // Buscador por Nombre o DNI
  const [busquedaGlobal, setBusquedaGlobal] = useState('');

  // --- 3. LÓGICA DE FILTRADO ---
  const alumnosFiltrados = alumnos.filter(al => {
    // Si hay algo escrito en el buscador, filtra globalmente por Nombre o DNI sin importar el curso
    if (busquedaGlobal) {
      const termino = busquedaGlobal.toLowerCase();
      return al.nombre.toLowerCase().includes(termino) || al.dni.includes(termino);
    }
    // Si no hay búsqueda global, filtra por el selector de cursos
    const coincideCurso = cursoSeleccionado ? al.cursoId === cursoSeleccionado : false;
    const coincideMateria = materiaSeleccionada ? al.materia === materiaSeleccionada : true;
    return coincideCurso && coincideMateria;
  });

  const docentesFiltrados = docentes.filter(doc => {
    const termino = busquedaGlobal.toLowerCase();
    return doc.nombre.toLowerCase().includes(termino) || doc.dni.includes(termino);
  });

  return (
    <div style={styles.layoutContainer}>
      
      {/* ================= PANEL DE NAVEGACIÓN LATERAL ================= */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <i className="fa-solid fa-folder-folder" style={{ color: '#fd7e14', fontSize: '1.4rem' }}></i>
          <span style={styles.sidebarTitle}>Rol Directivo</span>
        </div>
        
        <nav style={styles.sidebarNav}>
          <button style={activeTab === 'cursos' ? styles.sideBtnActive : styles.sideBtn} onClick={() => { setActiveTab('cursos'); setBusquedaGlobal(''); setCursoSeleccionado(''); setMateriaSeleccionada(''); }}>
            <i className="fa-solid fa-graduation-cap" style={{ width: '25px' }}></i> Cursos y Divisiones
          </button>
          <button style={activeTab === 'docentes' ? styles.sideBtnActive : styles.sideBtn} onClick={() => { setActiveTab('docentes'); setBusquedaGlobal(''); }}>
            <i className="fa-solid fa-chalkboard-user" style={{ width: '25px' }}></i> Listado de Docentes
          </button>
          <button style={activeTab === 'perfil' ? styles.sideBtnActive : styles.sideBtn} onClick={() => setActiveTab('perfil')}>
            <i className="fa-solid fa-user-gear" style={{ width: '25px' }}></i> Mi Perfil
          </button>
        </nav>
      </div>

      {/* ================= CONTENIDO PRINCIPAL DE LA PANTALLA ================= */}
      <div style={styles.mainContent}>
        
        {/* BUSCADOR GENERAL (Solo aparece en Cursos y Docentes) */}
        {activeTab !== 'perfil' && (
          <div style={styles.topSearchCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className="fa-solid fa-magnifying-glass" style={{ color: '#888' }}></i>
              <input type="text" placeholder={activeTab === 'cursos' ? "Buscar alumno directamente por Nombre o DNI..." : "Buscar docente por Nombre o DNI..."} value={busquedaGlobal} onChange={(e) => setBusquedaGlobal(e.target.value)} style={styles.inputBare} />
            </div>
          </div>
        )}

        {/* ================= PESTAÑA: CURSOS Y DIVISIONES ================= */}
        {activeTab === 'cursos' && (
          <div>
            {/* Solo mostramos los selectores si el usuario NO está usando el buscador directo */}
            {!busquedaGlobal && (
              <div style={styles.card}>
                <h3><i className="fa-solid fa-filter" style={{ color: '#fd7e14' }}></i> Selección de Trayectoria</h3>
                <div style={styles.flexGrid}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <label style={styles.label}>Año y División</label>
                    <select style={styles.select} value={cursoSeleccionado} onChange={(e) => { setCursoSeleccionado(e.target.value); setMateriaSeleccionada(''); setAlumnoDetalle(null); }}>
                      <option value="">-- Seleccionar Curso --</option>
                      {cursos.map(c => (
                        <option key={c.id} value={c.id}>{c.año} {c.division} - {c.orientacion}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <label style={styles.label}>Materia Asociada</label>
                    <select style={styles.select} value={materiaSeleccionada} onChange={(e) => setMateriaSeleccionada(e.target.value)} disabled={!cursoSeleccionado}>
                      <option value="">-- Puntos / Ver Todas --</option>
                      {cursoSeleccionado && materiasPorCurso[cursoSeleccionado]?.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Renderizado de las tablas si hay curso seleccionado o si se usó el buscador directo */}
            {(cursoSeleccionado || busquedaGlobal) ? (
              <div style={styles.flexGrid}>
                {/* Tabla de Alumnos */}
                <div style={{ ...styles.card, flex: 2, minWidth: '350px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                    <h4>{busquedaGlobal ? 'Resultado de la Búsqueda' : 'Listado de Alumnos'} ({alumnosFiltrados.length})</h4>
                    <div style={styles.linksContainer}>
                      <button className="btn btn-primary" style={styles.btnAction} onClick={() => alert('Abriendo Planificación...')}>
                        <i className="fa-solid fa-file-pdf"></i> Enlace Planificación
                      </button>
                      <button className="btn btn-success" style={styles.btnAction} onClick={() => alert('Abriendo Libro de Temas...')}>
                        <i className="fa-solid fa-book"></i> Libro de Temas
                      </button>
                    </div>
                  </div>

                  <div style={styles.tableResponsive}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Alumno</th>
                          <th style={styles.th}>DNI</th>
                          <th style={styles.th}>Curso</th>
                        </tr>
                      </thead>
                      <tbody>
                        {alumnosFiltrados.map(al => {
                          const cursoDelAlumno = cursos.find(c => c.id === al.cursoId);
                          return (
                            <tr key={al.dni} style={styles.trHover} onClick={() => setAlumnoDetalle(al)}>
                              <td style={styles.td}><strong>{al.nombre}</strong></td>
                              <td style={styles.td}>{al.dni}</td>
                              <td style={styles.td}>
                                <span className="badge badge-presente">
                                  {cursoDelAlumno ? `${cursoDelAlumno.año} ${cursoDelAlumno.division}` : 'Asignado'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                        {alumnosFiltrados.length === 0 && (
                          <tr>
                            <td colSpan="3" style={{ ...styles.td, textAlign: 'center', color: '#999' }}>No se encontraron alumnos con ese criterio.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Ficha Lateral del Alumno */}
                <div style={{ ...styles.card, flex: 1, minWidth: '250px', borderLeft: '4px solid #fd7e14' }}>
                  <h4><i className="fa-solid fa-address-card"></i> Ficha del Alumno</h4>
                  {alumnoDetalle ? (
                    <div style={{ marginTop: '15px' }}>
                      <p style={styles.pDetail}><strong>Nombre:</strong> {alumnoDetalle.nombre}</p>
                      <p style={styles.pDetail}><strong>DNI:</strong> {alumnoDetalle.dni}</p>
                      <p style={styles.pDetail}><strong>Contacto:</strong> {alumnoDetalle.telefono}</p>
                      <p style={styles.pDetail}><strong>Email:</strong> {alumnoDetalle.email}</p>
                    </div>
                  ) : (
                    <p style={{ color: '#999', marginTop: '20px', fontSize: '0.9rem' }}>Tocá un alumno para auditar su DNI e información completa acá.</p>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ ...styles.card, textAlign: 'center', color: '#666', padding: '40px' }}>
                <i className="fa-solid fa-school" style={{ fontSize: '3rem', color: '#ccc', marginBottom: '15px' }}></i>
                <p>Escribí el nombre/DNI de un alumno arriba o seleccioná un curso del panel para listar a los chicos.</p>
              </div>
            )}
          </div>
        )}

        {/* ================= PESTAÑA: LISTADO DE DOCENTES ================= */}
        {activeTab === 'docentes' && (
          <div style={styles.card}>
            <h3>Auditoría de Personal Docente</h3>
            <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '15px' }}>Hacé clic en "Ver Todo" para desplegar las DDJJ y asistencias en la fila correspondiente.</p>

            <div style={styles.tableResponsive}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Docente</th>
                    <th style={styles.th}>DNI</th>
                    <th style={styles.th}>Materia</th>
                    <th style={styles.th}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {docentesFiltrados.map(doc => {
                    const estaDesplegado = docenteDesplegado === doc.dni;
                    return (
                      <React.Fragment key={doc.dni}>
                        {/* Fila Principal */}
                        <tr style={styles.tr}>
                          <td style={styles.td}><strong>{doc.nombre}</strong></td>
                          <td style={styles.td}>{doc.dni}</td>
                          <td style={styles.td}>{doc.materia}</td>
                          <td style={styles.td}>
                            <button className="btn btn-primary" style={styles.btnSmall} onClick={() => setDocenteDesplegado(estaDesplegado ? null : doc.dni)}>
                              <i className={estaDesplegado ? "fa-solid fa-angle-up" : "fa-solid fa-angle-down"}></i> {estaDesplegado ? 'Cerrar' : 'Ver Todo'}
                            </button>
                          </td>
                        </tr>
                        {/* Acordeón Inyectado Justo Abajo de la Fila */}
                        {estaDesplegado && (
                          <tr>
                            <td colSpan="4" style={styles.tdAccordion}>
                              <div style={styles.accordionContent}>
                                <h5><i className="fa-solid fa-folder-open" style={{ color: '#fd7e14' }}></i> Información de Legajo</h5>
                                <div style={styles.accordionGrid}>
                                  <p style={styles.pDetail}><strong>Situación de Revista:</strong> {doc.cargos}</p>
                                  <p style={styles.pDetail}><strong>Establecimientos:</strong> {doc.escuela}</p>
                                  <p style={styles.pDetail}><strong>Declaración Jurada:</strong> <span className={`badge ${doc.ddjj === 'Auditado' ? 'badge-presente' : 'badge-ausente'}`}>{doc.ddjj}</span></p>
                                  <p style={styles.pDetail}><strong>Asistencias:</strong> <strong>{doc.asistencias}</strong></p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= PESTAÑA: MI PERFIL ================= */}
        {activeTab === 'perfil' && (
          <div style={{ ...styles.card, maxWidth: '550px', margin: '20px auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={styles.bigAvatar}>{directivoInfo.nombre.charAt(0)}</div>
              <h3>{directivoInfo.nombre}</h3>
              <span className="badge badge-presente" style={{ fontSize: '0.9rem', padding: '5px 15px', marginTop: '5px' }}>{directivoInfo.cargo}</span>
            </div>
            <hr style={{ border: '0', borderTop: '1px solid #eee', margin: '20px 0' }} />
            <div>
              <p style={styles.pDetail}><strong>DNI Institucional:</strong> {directivoInfo.dni}</p>
              <p style={styles.pDetail}><strong>Email Oficial:</strong> {directivoInfo.email}</p>
              <p style={styles.pDetail}><strong>Acto Resolutivo:</strong> {directivoInfo.resolucion}</p>
              <p style={styles.pDetail}><strong>Permisos del Sistema:</strong> Gestión Directiva Completa</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// --- 4. ESTILOS AISLADOS (Limpios y adaptados al panel lateral) ---
const styles = {
  layoutContainer: { display: 'flex', minHeight: '85vh', fontFamily: 'inherit', backgroundColor: '#f4f6f9', borderRadius: '12px', overflow: 'hidden' },
  
  // Panel Lateral
  sidebar: { width: '260px', backgroundColor: '#0d233a', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' },
  sidebarHeader: { display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)' },
  sidebarTitle: { color: '#ffffff', fontSize: '1.1rem', fontWeight: 'bold', letterSpacing: '0.5px' },
  sidebarNav: { display: 'flex', flexDirection: 'column', gap: '8px' },
  sideBtn: { width: '100%', padding: '12px 15px', textAlign: 'left', background: 'none', border: 'none', color: '#b8c7ce', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500', display: 'flex', alignItems: 'center', transition: '0.2s' },
  sideBtnActive: { width: '100%', padding: '12px 15px', textAlign: 'left', background: '#fd7e14', border: 'none', color: '#ffffff', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', boxShadow: '0 4px 10px rgba(253, 126, 20, 0.2)' },
  
  // Contenido Principal
  mainContent: { flex: 1, padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px' },
  topSearchCard: { background: '#ffffff', padding: '15px 20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
  inputBare: { border: 'none', outline: 'none', width: '100%', fontSize: '0.95rem', color: '#333' },
  
  // Tarjetas y Tablas
  card: { background: '#ffffff', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)' },
  flexGrid: { display: 'flex', gap: '20px', flexWrap: 'wrap' },
  label: { display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#444' },
  select: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: '#fff', fontSize: '0.9rem', outline: 'none' },
  tableResponsive: { width: '100%', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  th: { backgroundColor: '#f8f9fa', color: '#555', padding: '12px 16px', fontWeight: 600, fontSize: '0.85rem', borderBottom: '2px solid #edf2f7' },
  td: { padding: '14px 16px', borderBottom: '1px solid #edf2f7', fontSize: '0.95rem', color: '#333' },
  trHover: { cursor: 'pointer', transition: '0.2s', borderBottom: '1px solid #edf2f7' },
  tr: { borderBottom: '1px solid #edf2f7' },
  
  // Acordeón Inyectado
  tdAccordion: { padding: '0', backgroundColor: '#fafafa', borderBottom: '1px solid #edf2f7' },
  accordionContent: { padding: '15px 25px', borderLeft: '4px solid #fd7e14', animation: 'slideDown 0.2s ease' },
  accordionGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginTop: '10px' },
  
  // Elementos varios
  pDetail: { fontSize: '0.9rem', margin: '6px 0', color: '#444' },
  btnSmall: { padding: '5px 10px', fontSize: '0.8rem', borderRadius: '6px', cursor: 'pointer' },
  btnAction: { padding: '8px 14px', fontSize: '0.85rem', borderRadius: '8px', fontWeight: 600 },
  linksContainer: { display: 'flex', gap: '10px' },
  bigAvatar: { width: '70px', height: '70px', backgroundColor: '#0d233a', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold', margin: '0 auto' }
};