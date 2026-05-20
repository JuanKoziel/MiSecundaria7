import React, { useState } from 'react';

export default function Directivos() {
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

  const [estadoPlanificaciones, setEstadoPlanificaciones] = useState({
    '4-1-Programación': 'Entregado',
    '4-1-Sistemas Operativos': 'Pendiente',
    '4-1-Física': 'Pendiente',
    '1-1-Biología': 'Entregado',
  });

  const [alumnos] = useState([
    { dni: '45123456', nombre: 'Gómez, Lautaro', cursoId: '4-1', materia: 'Programación', email: 'lau.gomez@email.com', telefono: '2284-112233' },
    { dni: '45987654', nombre: 'Álvarez, Sofía', cursoId: '4-1', materia: 'Programación', email: 'sofia.alvarez@email.com', telefono: '2284-445566' },
    { dni: '46111222', nombre: 'Rodríguez, Lucas', cursoId: '1-1', materia: 'Biología', email: 'lucas.rod@email.com', telefono: '2284-778899' },
  ]);

  // Docentes cargados
  const [docentes] = useState([
    { dni: '28123456', nombre: 'Martín Gómez', materiaPrincipal: 'Matemática', cargos: '20 hs Titular', escuela: 'Secundaria 7', ddjj: 'Auditado', asistencias: '95% Asiduidad' },
    { dni: '30987654', nombre: 'Ana Laura Rossi', materiaPrincipal: 'Informática', cargos: '12 hs Suplente', escuela: 'Secundaria 7 / EET 1', ddjj: 'Pendiente', asistencias: '88% Asiduidad' },
  ]);

  // NUEVO: Mapa completo de qué materias da cada docente y en qué cursos (para la nueva pantalla)
  const [materiasAsociadasDocente] = useState({
    '28123456': [ // Martín Gómez
      { curso: '1ro 1ra (Ciclo Básico)', materia: 'Matemática', hs: '4 hs' },
      { curso: '1ro 2da (Ciclo Básico)', materia: 'Matemática', hs: '4 hs' },
      { curso: '4to 1ra (Informática)', materia: 'Física', hs: '3 hs' },
    ],
    '30987654': [ // Ana Laura Rossi
      { curso: '4to 1ra (Informática)', materia: 'Sistemas Operativos', hs: '4 hs' },
      { curso: '4to 1ra (Informática)', materia: 'Programación', hs: '4 hs' },
      { curso: '6to 1ra (Informática)', materia: 'Redes', hs: '4 hs' },
    ]
  });

  const [riteSimulado] = useState({
    '45123456': { inasistencias: '4.5', notas: [{ materia: 'Programación', c1: '7', c2: '8', final: 'TEA' }, { materia: 'Sistemas Operativos', c1: '6', c2: '7', final: 'TEA' }, { materia: 'Física', c1: '4', c2: '5', final: 'TEP' }] },
    '45987654': { inasistencias: '2.0', notas: [{ materia: 'Programación', c1: '9', c2: '10', final: 'TEA' }, { materia: 'Sistemas Operativos', c1: '8', c2: '9', final: 'TEA' }, { materia: 'Física', c1: '7', c2: '8', final: 'TEA' }] },
    '46111222': { inasistencias: '9.0', notas: [{ materia: 'Biología', c1: '3', c2: '4', final: 'TED' }, { materia: 'Matemática', c1: '5', c2: '5', final: 'TEP' }, { materia: 'Historia', c1: '6', c2: '7', final: 'TEA' }] }
  });

  const [directivoInfo] = useState({ nombre: 'Facundo Nahuel Terenzano', cargo: 'Director General', dni: '39123456', email: 'direccion.ms7@abc.gob.ar', resolucion: 'Res. N° 4512/24' });

  // --- 2. ESTADOS DE SELECCIÓN Y FILTROS ---
  const [activeTab, setActiveTab] = useState('docentes'); // Dejo docentes por defecto para que pruebes directo
  const [cursoSeleccionado, setCursoSeleccionado] = useState('');
  const [materiaSeleccionada, setMateriaSeleccionada] = useState('');
  const [alumnoDetalle, setAlumnoDetalle] = useState(null);
  const [docenteDesplegado, setDocenteDesplegado] = useState(null);
  const [busquedaGlobal, setBusquedaGlobal] = useState('');
  const [modalRiteOpen, setModalRiteOpen] = useState(false);

  // NUEVOS ESTADOS: Para controlar la subpantalla de materias asociadas
  const [docenteSeleccionadoMaterias, setDocenteSeleccionadoMaterias] = useState(null);

  // --- 3. ACCIONES ---
  const handleReclamarPlanificacion = (materia, cursoId) => {
    alert(`📢 RECLAMO ENVIADO\nSe notificó al docente de la materia "${materia}" para que suba la planificación.`);
    setEstadoPlanificaciones(prev => ({ ...prev, [`${cursoId}-${materia}`]: 'Reclamado' }));
  };

  const handleReclamarDDJJ = (nombreDocente, dni) => {
    alert(`📧 ALERTA\nSe envió una intimación formal a ${nombreDocente} (DNI: ${dni}) por la Declaración Jurada.`);
  };

  // --- 4. LÓGICA DE FILTRADO ---
  const alumnosFiltrados = alumnos.filter(al => {
    if (busquedaGlobal) {
      const termino = busquedaGlobal.toLowerCase();
      return al.nombre.toLowerCase().includes(termino) || al.dni.includes(termino);
    }
    const coincideCurso = cursoSeleccionado ? al.cursoId === cursoSeleccionado : true;
    const coincideMateria = materiaSeleccionada ? al.materia === materiaSeleccionada : true;
    return coincideCurso && coincideMateria;
  });

  const docentesFiltrados = docentes.filter(doc => {
    const termino = busquedaGlobal.toLowerCase();
    return doc.nombre.toLowerCase().includes(termino) || doc.dni.includes(termino);
  });

  const infoRiteActual = alumnoDetalle ? riteSimulado[alumnoDetalle.dni] : null;
  const clavePlanif = `${cursoSeleccionado}-${materiaSeleccionada}`;
  const estadoPlanifActual = estadoPlanificaciones[clavePlanif] || 'Pendiente';

  return (
    <div style={styles.mainContent}>
      
      {/* BOTONERA SUPERIOR */}
      <div style={styles.miniNav}>
        <button style={activeTab === 'cursos' ? styles.miniBtnActive : styles.miniBtn} onClick={() => { setActiveTab('cursos'); setBusquedaGlobal(''); setCursoSeleccionado(''); setAlumnoDetalle(null); setDocenteSeleccionadoMaterias(null); }}>
          <i className="fa-solid fa-graduation-cap"></i> Cursos
        </button>
        <button style={activeTab === 'docentes' ? styles.miniBtnActive : styles.miniBtn} onClick={() => { setActiveTab('docentes'); setBusquedaGlobal(''); setDocenteSeleccionadoMaterias(null); }}>
          <i className="fa-solid fa-chalkboard-user"></i> Docentes
        </button>
        <button style={activeTab === 'perfil' ? styles.miniBtnActive : styles.miniBtn} onClick={() => { setActiveTab('perfil'); setDocenteSeleccionadoMaterias(null); }}>
          <i className="fa-solid fa-user-gear"></i> Mi Perfil
        </button>
      </div>

      {/* BUSCADOR GLOBAL */}
      {activeTab !== 'perfil' && !docenteSeleccionadoMaterias && (
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
          {/* (Mantiene toda tu lógica previa de filtrado de trayectorias) */}
          {!busquedaGlobal && (
            <div style={styles.card}>
              <h3><i className="fa-solid fa-filter" style={{ color: '#fd7e14' }}></i> Selección de Trayectoria</h3>
              <div style={styles.flexGrid}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={styles.labelClickable}>Año y División</label>
                  <select style={styles.selectPointer} value={cursoSeleccionado} onChange={(e) => { setCursoSeleccionado(e.target.value); setMateriaSeleccionada(''); setAlumnoDetalle(null); }}>
                    <option value="">-- Ver Todos los Alumnos --</option>
                    {cursos.map(c => <option key={c.id} value={c.id}>{c.año} {c.division} - {c.orientacion}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={styles.labelClickable}>Materia Asociada</label>
                  <select style={styles.selectPointer} value={materiaSeleccionada} onChange={(e) => setMateriaSeleccionada(e.target.value)} disabled={!cursoSeleccionado}>
                    <option value="">-- Puntos / Ver Todas --</option>
                    {cursoSeleccionado && materiasPorCurso[cursoSeleccionado]?.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {cursoSeleccionado && materiaSeleccionada && !busquedaGlobal && (
            <div style={{ ...styles.card, borderLeft: '4px solid #4a90e2', padding: '15px 25px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                <div>
                  <h4 style={{ margin: 0 }}><i className="fa-solid fa-file-signature"></i> Control de Planificación Anual</h4>
                  <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', color: '#555' }}>
                    Materia: <strong>{materiaSeleccionada}</strong> — Estado actual: <span style={{ fontWeight: 'bold', color: estadoPlanifActual === 'Entregado' ? '#28a745' : '#dc3545' }}>{estadoPlanifActual}</span>
                  </p>
                </div>
                <div>
                  {estadoPlanifActual === 'Entregado' ? (
                    <button className="btn btn-success" style={styles.btnAction} onClick={() => alert('Abriendo archivo...')}>Ver Planificación</button>
                  ) : (
                    <button style={styles.btnClaim} onClick={() => handleReclamarPlanificacion(materiaSeleccionada, cursoSeleccionado)}>Reclamar Planificación</button>
                  )}
                </div>
              </div>
            </div>
          )}

          <div style={styles.flexGrid}>
            <div style={{ ...styles.card, flex: 2, minWidth: '350px' }}>
              <h4>Listado de Alumnos ({alumnosFiltrados.length})</h4>
              <div style={styles.tableResponsive}>
                <table style={styles.table}>
                  <thead>
                    <tr><th style={styles.th}>Alumno</th><th style={styles.th}>DNI</th><th style={styles.th}>Curso</th></tr>
                  </thead>
                  <tbody>
                    {alumnosFiltrados.map(al => {
                      const cursoDelAlumno = cursos.find(c => c.id === al.cursoId);
                      return (
                        <tr key={al.dni} style={styles.trHover} onClick={() => setAlumnoDetalle(al)}>
                          <td style={styles.td}><strong>{al.nombre}</strong></td>
                          <td style={styles.td}>{al.dni}</td>
                          <td style={styles.td}><span className="badge badge-presente">{cursoDelAlumno ? `${cursoDelAlumno.año} ${cursoDelAlumno.division}` : 'Asignado'}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ ...styles.card, flex: 1, minWidth: '250px', borderLeft: '4px solid #fd7e14', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h4>Ficha del Alumno</h4>
                {alumnoDetalle ? (
                  <div style={{ marginTop: '15px' }}>
                    <p style={styles.pDetail}><strong>Nombre:</strong> {alumnoDetalle.nombre}</p>
                    <p style={styles.pDetail}><strong>DNI:</strong> {alumnoDetalle.dni}</p>
                    <p style={styles.pDetail}><strong>Contacto:</strong> {alumnoDetalle.telefono}</p>
                  </div>
                ) : <p style={{ color: '#999', marginTop: '20px', fontSize: '0.9rem' }}>Tocá un alumno de la lista.</p>}
              </div>
              {alumnoDetalle && (
                <button style={styles.btnRite} onClick={() => setModalRiteOpen(true)}>Auditar RITE Completo</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= PESTAÑA: LISTADO DE DOCENTES ================= */}
      {activeTab === 'docentes' && (
        <div>
          {/* PANTALLA SECUNDARIA: DETALLE DE MATERIAS ASOCIADAS POR DOCENTE */}
          {docenteSeleccionadoMaterias ? (
            <div style={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: '#666', textTransform: 'uppercase', fontWeight: 'bold' }}>Distribución de Carga Horaria</span>
                  <h3 style={{ margin: '5px 0 0 0', color: '#0d233a' }}><i className="fa-solid fa-folder-tree" style={{ color: '#fd7e14' }}></i> {docenteSeleccionadoMaterias.nombre}</h3>
                </div>
                <button style={styles.btnBack} onClick={() => setDocenteSeleccionadoMaterias(null)}>
                  <i className="fa-solid fa-arrow-left"></i> Volver al Listado
                </button>
              </div>

              <h4>Materias Dictadas y Cursos Asociados</h4>
              <div style={styles.tableResponsive}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Espacio Curricular / Materia</th>
                      <th style={styles.th}>Curso y División</th>
                      <th style={styles.th}>Carga Horaria</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materiasAsociadasDocente[docenteSeleccionadoMaterias.dni]?.map((m, index) => (
                      <tr key={index} style={styles.tr}>
                        <td style={styles.td}><strong>{m.materia}</strong></td>
                        <td style={styles.td}><span className="badge badge-presente" style={{ background: '#4a90e2' }}>{m.curso}</span></td>
                        <td style={styles.td}>{m.hs}</td>
                      </tr>
                    )) || (
                      <tr><td colSpan="3" style={styles.td}>No hay materias asociadas cargadas para este docente.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* PANTALLA PRINCIPAL: TABLA DE DOCENTES GENERAL */
            <div style={styles.card}>
              <h3>Auditoría de Personal Docente</h3>
              <div style={styles.tableResponsive}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Docente</th>
                      <th style={styles.th}>DNI</th>
                      <th style={styles.th}>Materia Principal</th>
                      <th style={styles.th}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {docentesFiltrados.map(doc => {
                      const estaDesplegado = docenteDesplegado === doc.dni;
                      return (
                        <React.Fragment key={doc.dni}>
                          <tr style={styles.tr}>
                            <td style={styles.td}><strong>{doc.nombre}</strong></td>
                            <td style={styles.td}>{doc.dni}</td>
                            <td style={styles.td}>{doc.materiaPrincipal}</td>
                            <td style={styles.td}>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                {/* NUEVO BOTÓN: Te manda a la otra pantalla de materias */}
                                <button style={styles.btnViewMaterias} onClick={() => setDocenteSeleccionadoMaterias(doc)}>
                                  <i className="fa-solid fa-book-bookmark"></i> Ver Materias y Cursos
                                </button>
                                <button className="btn btn-primary" style={styles.btnSmall} onClick={() => setDocenteDesplegado(estaDesplegado ? null : doc.dni)}>
                                  <i className={estaDesplegado ? "fa-solid fa-angle-up" : "fa-solid fa-angle-down"}></i> {estaDesplegado ? 'Cerrar' : 'Legajo'}
                                </button>
                              </div>
                            </td>
                          </tr>
                          {estaDesplegado && (
                            <tr>
                              <td colSpan="4" style={styles.tdAccordion}>
                                <div style={styles.accordionContent}>
                                  <h5><i className="fa-solid fa-folder-open" style={{ color: '#fd7e14' }}></i> Información Administrativa</h5>
                                  <div style={styles.accordionGrid}>
                                    <p style={styles.pDetail}><strong>Revista:</strong> {doc.cargos}</p>
                                    <p style={styles.pDetail}><strong>Escuelas:</strong> {doc.escuela}</p>
                                    <p style={styles.pDetail}><strong>Asistencias:</strong> {doc.asistencias}</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                      <p style={{ margin: 0, fontSize: '0.9rem' }}><strong>Declaración Jurada:</strong></p>
                                      {doc.ddjj === 'Auditado' ? (
                                        <span className="badge badge-presente"><i className="fa-solid fa-circle-check"></i> Auditado</span>
                                      ) : (
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                          <span className="badge badge-ausente">Pendiente</span>
                                          <button style={styles.btnInlineClaim} onClick={() => handleReclamarDDJJ(doc.nombre, doc.dni)}>Reclamar</button>
                                        </div>
                                      )}
                                    </div>
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
        </div>
      )}

      {/* ================= PESTAÑA: MI PERFIL ================= */}
      {activeTab === 'perfil' && (
        <div style={{ ...styles.card, maxWidth: '550px', margin: '20px auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={styles.bigAvatar}>{directivoInfo.nombre.charAt(0)}</div>
            <h3>{directivoInfo.nombre}</h3>
            <span className="badge badge-presente">{directivoInfo.cargo}</span>
          </div>
          <hr style={{ border: '0', borderTop: '1px solid #eee', margin: '20px 0' }} />
          <div>
            <p style={styles.pDetail}><strong>DNI Institucional:</strong> {directivoInfo.dni}</p>
            <p style={styles.pDetail}><strong>Email Oficial:</strong> {directivoInfo.email}</p>
          </div>
        </div>
      )}

      {/* MODAL RITE DE SOLO LECTURA */}
      {modalRiteOpen && alumnoDetalle && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2rem' }}>Auditoría RITE: {alumnoDetalle.nombre}</h3>
              </div>
              <button style={styles.btnCloseModal} onClick={() => setModalRiteOpen(false)}>&times;</button>
            </div>
            <div style={{ padding: '20px' }}>
              <table style={styles.table}>
                <thead>
                  <tr><th style={styles.th}>Materia</th><th style={styles.th}>1° C.</th><th style={styles.th}>2° C.</th><th style={styles.th}>Final</th></tr>
                </thead>
                <tbody>
                  {infoRiteActual?.notas.map((n, i) => (
                    <tr key={i} style={styles.tr}>
                      <td style={styles.td}>{n.materia}</td><td>{n.c1}</td><td>{n.c2}</td><td>{n.final}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

const styles = {
  mainContent: { flex: 1, padding: '10px', display: 'flex', flexDirection: 'column', gap: '20px', backgroundColor: '#f4f6f9' },
  miniNav: { display: 'flex', gap: '10px', marginBottom: '5px', borderBottom: '1px solid #ddd', paddingBottom: '10px' },
  miniBtn: { padding: '8px 15px', background: '#e9ecef', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', color: '#495057', fontWeight: 'bold' },
  miniBtnActive: { padding: '8px 15px', background: '#fd7e14', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', color: '#fff', fontWeight: 'bold' },
  topSearchCard: { background: '#ffffff', padding: '15px 20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
  inputBare: { border: 'none', outline: 'none', width: '100%', fontSize: '0.95rem', color: '#333', cursor: 'text' },
  card: { background: '#ffffff', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)' },
  flexGrid: { display: 'flex', gap: '20px', flexWrap: 'wrap' },
  labelClickable: { display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#444', cursor: 'pointer' },
  selectPointer: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: '#fff', fontSize: '0.9rem', outline: 'none', cursor: 'pointer' },
  tableResponsive: { width: '100%', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  th: { backgroundColor: '#f8f9fa', color: '#555', padding: '12px 16px', fontWeight: 600, fontSize: '0.85rem', borderBottom: '2px solid #edf2f7' },
  td: { padding: '14px 16px', borderBottom: '1px solid #edf2f7', fontSize: '0.95rem', color: '#333' },
  trHover: { cursor: 'pointer', transition: '0.2s', borderBottom: '1px solid #edf2f7' },
  tr: { borderBottom: '1px solid #edf2f7' },
  tdAccordion: { padding: '0', backgroundColor: '#fafafa', borderBottom: '1px solid #edf2f7' },
  accordionContent: { padding: '15px 25px', borderLeft: '4px solid #fd7e14' },
  accordionGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginTop: '10px' },
  pDetail: { fontSize: '0.9rem', margin: '6px 0', color: '#444' },
  btnSmall: { padding: '6px 12px', fontSize: '0.8rem', borderRadius: '6px', cursor: 'pointer', backgroundColor: '#0d233a', color: '#fff', border: 'none' },
  btnAction: { padding: '8px 14px', fontSize: '0.85rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' },
  btnRite: { width: '100%', padding: '11px', backgroundColor: '#0d233a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' },
  btnClaim: { padding: '8px 14px', fontSize: '0.85rem', borderRadius: '8px', fontWeight: 'bold', backgroundColor: '#dc3545', color: '#fff', border: 'none', cursor: 'pointer' },
  btnInlineClaim: { padding: '4px 8px', fontSize: '0.75rem', borderRadius: '4px', fontWeight: 'bold', backgroundColor: '#dc3545', color: '#fff', border: 'none', cursor: 'pointer' },
  bigAvatar: { width: '70px', height: '70px', backgroundColor: '#0d233a', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold', margin: '0 auto' },
  
  // NUEVOS ESTILOS DE NAVEGACIÓN DE MATERIAS
  btnViewMaterias: { padding: '6px 12px', fontSize: '0.8rem', borderRadius: '6px', cursor: 'pointer', backgroundColor: '#fd7e14', color: '#fff', border: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' },
  btnBack: { padding: '8px 14px', fontSize: '0.85rem', borderRadius: '6px', cursor: 'pointer', backgroundColor: '#6c757d', color: '#fff', border: 'none', fontWeight: 'bold' },

  // Modales
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 },
  modalCard: { background: '#fff', width: '92%', maxWidth: '650px', borderRadius: '12px', overflow: 'hidden' },
  modalHeader: { backgroundColor: '#0d233a', padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  btnCloseModal: { background: 'none', border: 'none', color: '#fff', fontSize: '1.8rem', cursor: 'pointer' }
};