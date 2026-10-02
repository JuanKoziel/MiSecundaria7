import { useMemo, useState, useEffect, useCallback } from 'react';
import { useData } from '../../context/DataContext';
import LoadingSpinner from '../Shared/LoadingSpinner';
import {
  getAsistenciasPreceptorMateria,
  getAsistenciaDiaria,
  getRegistroDiario,
  getServerTime,
  getAsistenciasDocentesHoy,
  getHistorialAsistenciasDocentes,
} from '../../services/api';
import { hayBloqueoEscritura, getSuspensionInfo } from '../../utils/suspension';
import { hoy } from '../../utils/fechas';

function badgeClass(estado) {
  if (estado === 'Presente') return 'badge-presente';
  if (estado === 'Ausente') return 'badge-ausente';
  if (estado === 'Retirado') return 'badge-tarde';
  return 'badge-tarde';
}

function Asistencias() {
  const {
    estudiantes,
    cursosObj,
    cursoMateria,
    nombreCorto,
    eventosInstitucionales,
    selectedCursoId,
    selectedCursos,
    selectedCursoIds,
  } = useData();

  // Punto 1.4: la vista consume la selección global del header de Administración.
  // No se vuelve a mostrar el selector de Año/División dentro de la vista.
  //
  // 5.6: el header puede tener varias divisiones marcadas. `cursoObjSel` /
  // `curso` siguen resolviendo el PRIMERO, porque las pestañas que piden datos al
  // backend (diaria, materia, registro diario) trabajan de a un curso por vez.
  // Lo que sí se multitabuló son las tablas que ya filtraban en memoria:
  // estudiantes y los cursos-materia del selector de materia.
  const cursoObjSel = useMemo(
    () =>
      (cursosObj || []).find((c) => String(c.id_curso) === String(selectedCursoId || '')) || null,
    [cursosObj, selectedCursoId],
  );
  const curso = cursoObjSel?.nombre_curso || '';

  // Nombres e ids de todos los cursos marcados; si el contexto todavía no trae
  // el array (o no hay selección) se cae al curso único para no romper nada.
  const cursosSel = useMemo(() => {
    if (Array.isArray(selectedCursos) && selectedCursos.length > 0) return selectedCursos;
    return curso ? [curso] : [];
  }, [selectedCursos, curso]);
  const cursosSelIds = useMemo(() => {
    if (Array.isArray(selectedCursoIds) && selectedCursoIds.length > 0) {
      return selectedCursoIds.map(String);
    }
    return selectedCursoId ? [String(selectedCursoId)] : [];
  }, [selectedCursoIds, selectedCursoId]);

  const [tab, setTab] = useState('dia');
  const [materiaCmId, setMateriaCmId] = useState('');
  const [fechaMateria, setFechaMateria] = useState('');
  const [estudianteMateria, setEstudianteMateria] = useState('');
  const [dataMateria, setDataMateria] = useState([]);
  const [cargandoMateria, setCargandoMateria] = useState(false);
  const [dataDiaria, setDataDiaria] = useState([]);
  const [cargandoDiaria, setCargandoDiaria] = useState(false);
  const [regFecha, setRegFecha] = useState('');
  const [regEstudiante, setRegEstudiante] = useState('');
  const [dataRegistro, setDataRegistro] = useState([]);
  const [cargandoRegistro, setCargandoRegistro] = useState(false);
  const [serverInfo, setServerInfo] = useState(null);
  const [tabDocentes, setTabDocentes] = useState('hoy');
  const [docHoy, setDocHoy] = useState([]);
  const [cargandoDocHoy, setCargandoDocHoy] = useState(false);
  const [docHistorial, setDocHistorial] = useState([]);
  const [cargandoDocHistorial, setCargandoDocHistorial] = useState(false);
  /* Usa fecha local: toISOString() devuelve el dia siguiente a partir de las 21:00 (UTC-3). */
  const [fechaHistDoc, setFechaHistDoc] = useState(hoy);

  // La materia y el estudiante elegidos dejan de ser válidos al cambiar de curso.
  useEffect(() => {
    setMateriaCmId('');
    setFechaMateria('');
    setEstudianteMateria('');
  }, [selectedCursoId]);

  // 5.6: `===` pasa a `includes` sobre la lista de cursos marcados.
  const cmCurso = useMemo(
    () => (cursosSelIds.length > 0
      ? cursoMateria.filter((cm) => cursosSelIds.includes(String(cm.id_curso)))
      : []),
    [cursoMateria, cursosSelIds],
  );

  const listaEstudiantes = useMemo(
    () => estudiantes
      .filter((a) => cursosSel.includes(a.curso))
      .sort((a, b) => (a.apellido || '').localeCompare(b.apellido || '')),
    [estudiantes, cursosSel],
  );

  // 5.6: la etiqueta del curso se muestra solo cuando hay más de una división
  // marcada; con una sola, el nombre del curso es redundante.
  const etiquetaCurso = (a) => (cursosSel.length > 1 ? ` (${a.curso})` : '');

  const today = hoy();

  const cargarDiaria = useCallback(() => {
    if (!curso) return;
    setCargandoDiaria(true);
    getAsistenciaDiaria(curso, today)
      .then(setDataDiaria)
      .catch(() => setDataDiaria([]))
      .finally(() => setCargandoDiaria(false));
  }, [curso]);

  useEffect(() => {
    if (tab === 'dia' && curso) cargarDiaria();
  }, [tab, curso, cargarDiaria]);

  useEffect(() => {
    if (tab === 'materia' && materiaCmId) {
      setCargandoMateria(true);
      const params = {};
      if (fechaMateria) params.fecha = fechaMateria;
      if (estudianteMateria) params.alumno = estudianteMateria;
      getAsistenciasPreceptorMateria(materiaCmId, params)
        .then(setDataMateria)
        .catch(() => setDataMateria([]))
        .finally(() => setCargandoMateria(false));
    }
  }, [tab, materiaCmId, fechaMateria, estudianteMateria]);

  useEffect(() => {
    if (tab === 'dia' && curso && (regFecha || regEstudiante)) {
      setCargandoRegistro(true);
      const params = {};
      if (regFecha) params.fecha = regFecha;
      if (regEstudiante) params.alumno = regEstudiante;
      getRegistroDiario(curso, params)
        .then(setDataRegistro)
        .catch(() => setDataRegistro([]))
        .finally(() => setCargandoRegistro(false));
    }
  }, [tab, curso, regFecha, regEstudiante]);

  useEffect(() => {
    getServerTime().then(setServerInfo).catch(() => setServerInfo(null));
  }, []);

  useEffect(() => {
    if (tab !== 'docentes' || !curso) return;
    setCargandoDocHoy(true);
    getAsistenciasDocentesHoy(curso)
      .then(setDocHoy)
      .catch(() => setDocHoy([]))
      .finally(() => setCargandoDocHoy(false));
  }, [tab, curso]);

  useEffect(() => {
    if (tab !== 'docentes' || tabDocentes !== 'historial' || !curso) return;
    setCargandoDocHistorial(true);
    getHistorialAsistenciasDocentes(curso, fechaHistDoc)
      .then(setDocHistorial)
      .catch(() => setDocHistorial([]))
      .finally(() => setCargandoDocHistorial(false));
  }, [tab, tabDocentes, curso, fechaHistDoc]);

  const fechaActual = tab === 'dia' ? hoy() : (tab === 'registro' ? regFecha : (tab === 'materia' ? fechaMateria : hoy()));
  const suspensionInfo = fechaActual ? getSuspensionInfo(eventosInstitucionales, fechaActual) : null;
  const bloqueaEscritura = suspensionInfo?.bloqueaEscritura;

  return (
    <div className="card">
      {suspensionInfo && (
        <div className="aviso-suspension" role="status">
          <i className="fas fa-triangle-exclamation" aria-hidden="true" />
          <div>
            <strong>Día suspendido: la información es de solo lectura</strong>
            Ya podés consultar las asistencias registradas ({suspensionInfo.tipo}
            {suspensionInfo.alcance !== 'todo_dia' ? `, ${suspensionInfo.alcance}` : ''}).
            No se pueden registrar ni modificar asistencias hasta que termine el evento.
            {suspensionInfo.descripcion ? ` ${suspensionInfo.descripcion}` : ''}
          </div>
        </div>
      )}

      <div className="card-header-flex">
        <h3><i className="fas fa-user-check" aria-hidden="true" /> Control de Asistencia</h3>
        <span className="badge role-badge-display">Solo lectura</span>
      </div>

      <div className="asist-tipo-selector">
        <button
          type="button"
          className={`btn btn-sm ${tab === 'dia' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTab('dia')}
        >
          Asistencia por día
        </button>
        <button
          type="button"
          className={`btn btn-sm ${tab === 'materia' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTab('materia')}
        >
          Asistencia por materia
        </button>
        <button
          type="button"
          className={`btn btn-sm ${tab === 'docentes' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTab('docentes')}
        >
          Asistencia de docentes
        </button>
      </div>

      {tab === 'dia' && (
        <div>
          <div className="card-header-flex">
            <h3>Asistencias del día</h3>
          </div>

          <p style={{ color: '#888', margin: '0 0 12px' }}>
            Curso: {curso || '—'} — Fecha: {today}
          </p>

          {cargandoDiaria ? (
            <LoadingSpinner text="Cargando asistencias..." size="sm" inline />
          ) : dataDiaria.length === 0 ? (
            <p className="empty-state-message">No hay asistencias registradas para hoy.</p>
          ) : (
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Estudiante</th>
                    <th>Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {dataDiaria.map((r) => (
                    <tr key={r.id_alumno}>
                      <td className="table-cell-strong">{r.alumno_nombre}</td>
                      <td>
                        <span className={`badge ${badgeClass(r.estado)}`}>
                          {r.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="card mt-16">
            <div className="card-header-flex">
              <h3>Registro</h3>
            </div>

            <div className="filter-row">
              <div className="form-group-filter">
                <label htmlFor="reg-fecha-admin">Fecha</label>
                <input
                  id="reg-fecha-admin"
                  type="date"
                  value={regFecha}
                  onChange={(e) => setRegFecha(e.target.value)}
                />
              </div>
              <div className="form-group-filter">
                <label htmlFor="reg-estudiante-admin">Estudiante</label>
                <select
                  id="reg-estudiante-admin"
                  value={regEstudiante}
                  onChange={(e) => setRegEstudiante(e.target.value)}
                >
                  <option value="">Todos...</option>
                  {listaEstudiantes.map((a) => (
                    <option key={a.id} value={a.id}>{nombreCorto(a)}{etiquetaCurso(a)}</option>
                  ))}
                </select>
              </div>
            </div>

            {!regFecha && !regEstudiante ? (
              <p className="empty-state-message">Seleccioná una fecha o un estudiante para ver registros.</p>
            ) : cargandoRegistro ? (
              <LoadingSpinner text="Cargando registros..." size="sm" inline />
            ) : dataRegistro.length === 0 ? (
              <p className="empty-state-message">No hay registros para los filtros seleccionados.</p>
            ) : (
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Estudiante</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataRegistro.map((r) => (
                      <tr key={r.id}>
                        <td>{r.fecha}</td>
                        <td className="table-cell-strong">{r.alumno_nombre}</td>
                        <td>
                          <span className={`badge ${badgeClass(r.estado)}`}>
                            {r.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'materia' && (
        <div>
          <div className="filter-row">
            <div className="form-group-filter">
              <label htmlFor="materia-asistencias">Materia</label>
              <select
                id="materia-asistencias"
                value={materiaCmId}
                onChange={(e) => setMateriaCmId(e.target.value)}
              >
                <option value="">Seleccione materia...</option>
                {/* 5.6: con varias divisiones marcadas pueden repetirse nombres de
                    materia, así que se muestra el curso para distinguirlas. */}
                {cmCurso.map((cm) => (
                  <option key={cm.id} value={cm.id}>
                    {cmCurso.length > 0 && cursosSel.length > 1
                      ? `${cm.materia_nombre} — ${cm.curso_nombre || ''}`.trim()
                      : cm.materia_nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group-filter">
              <label htmlFor="fecha-asistencias">Fecha</label>
              <input
                id="fecha-asistencias"
                type="date"
                value={fechaMateria}
                onChange={(e) => setFechaMateria(e.target.value)}
              />
            </div>
            <div className="form-group-filter">
              <label htmlFor="estudiante-asistencias">Estudiante</label>
              <select
                id="estudiante-asistencias"
                value={estudianteMateria}
                onChange={(e) => setEstudianteMateria(e.target.value)}
              >
                <option value="">Todos...</option>
                {listaEstudiantes.map((a) => (
                  <option key={a.id} value={a.id}>{nombreCorto(a)}{etiquetaCurso(a)}</option>
                ))}
              </select>
            </div>
          </div>

          {!materiaCmId ? (
            <p className="empty-state-message">Seleccione una materia para ver las asistencias.</p>
          ) : cargandoMateria ? (
            <LoadingSpinner text="Cargando asistencias..." size="sm" inline />
          ) : dataMateria.length === 0 ? (
            <p className="empty-state-message">No hay asistencias registradas para esta materia con los filtros seleccionados.</p>
          ) : (
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Estudiante</th>
                    <th>Fecha</th>
                    <th>Horario</th>
                    <th>Docente</th>
                    <th>Estado</th>
                    <th>Hora de carga</th>
                    <th>Justificado</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const ordenadas = [...dataMateria].sort(
                      (a, b) =>
                        String(a.fecha || '').localeCompare(String(b.fecha || '')) ||
                        (a.alumno_nombre || '').localeCompare(b.alumno_nombre || ''),
                    );
                    let ultimaFecha = null;
                    const filas = [];
                    ordenadas.forEach((r, idx) => {
                      if (r.fecha && r.fecha !== ultimaFecha) {
                        ultimaFecha = r.fecha;
                        filas.push(
                          <tr key={`fecha-${idx}`} className="date-group-header">
                            <td colSpan={7}>
                              <i className="far fa-calendar-alt" aria-hidden="true" />{' '}
                              {new Intl.DateTimeFormat('es-AR', { dateStyle: 'long' }).format(new Date(r.fecha))}
                            </td>
                          </tr>,
                        );
                      }
                      const puedeJustificar = r.estado_nombre !== 'Presente' && r.estado_nombre !== 'Sin registro' && r.id;
                      filas.push(
                        <tr key={r.id ?? `sin-reg-${idx}`}>
                          <td className="table-cell-strong">{r.alumno_nombre}</td>
                          <td>{r.fecha || '-'}</td>
                          <td className="nowrap">{r.horario}</td>
                          <td>{r.docente_nombre}</td>
                          <td>
                            <span className={`badge ${
                              r.estado_nombre === 'Presente' ? 'badge-presente' :
                              r.estado_nombre === 'Ausente' ? 'badge-ausente' :
                              r.estado_nombre === 'Tarde' ? 'badge-tarde' :
                              r.estado_nombre === 'Retirado' ? 'badge-tarde' : ''
                            }`}>
                              {r.estado_nombre}
                            </span>
                          </td>
                          <td>{r.hora_carga || '-'}</td>
                          <td>
                            {puedeJustificar ? (
                              r.justificado ? (
                                <span className="badge badge-success">Justificado</span>
                              ) : (
                                <span className="badge badge-warning">No justificado</span>
                              )
                            ) : r.justificado ? (
                              <span className="badge badge-success">Justificado</span>
                            ) : '-'}
                          </td>
                        </tr>,
                      );
                    });
                    return filas;
                  })()}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'docentes' && (
        <div>
          <div className="asist-tipo-selector">
            <button
              type="button"
              className={`btn btn-sm ${tabDocentes === 'hoy' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTabDocentes('hoy')}
            >
              Asistencias de hoy
            </button>
            <button
              type="button"
              className={`btn btn-sm ${tabDocentes === 'historial' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTabDocentes('historial')}
            >
              Historial
            </button>
          </div>

          {tabDocentes === 'hoy' && (
            <div className="mt-16">
              <p style={{ color: '#888', margin: '0 0 12px' }}>
                Asistencias esperadas de hoy para el curso {curso || '—'} con su estado.
              </p>
              {cargandoDocHoy ? (
                <LoadingSpinner text="Cargando asistencias..." size="sm" inline />
              ) : docHoy.length === 0 ? (
                <p className="empty-state-message">No hay clases programadas hoy para este curso.</p>
              ) : (
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Docente</th>
                        <th>Materia</th>
                        <th>Curso</th>
                        <th>Horario</th>
                        <th>Estado</th>
                        <th>Hora de carga</th>
                      </tr>
                    </thead>
                    <tbody>
                      {docHoy.map((doc) => (
                        <tr key={`${doc.docente_id}-${doc.cm_id}-${doc.horario}`}>
                          <td className="table-cell-strong">{doc.docente_nombre}</td>
                          <td>{doc.materia_nombre}</td>
                          <td>{doc.curso_nombre}</td>
                          <td className="nowrap">{doc.horario}</td>
                          <td>
                            <span className={`badge ${
                              doc.estado === 'Presente' ? 'badge-presente' :
                              doc.estado === 'Ausente' ? 'badge-ausente' :
                              doc.estado === 'Tarde' ? 'badge-tarde' :
                              doc.estado === 'Retirado' ? 'badge-tarde' : ''
                            }`}>
                              {doc.estado}
                            </span>
                          </td>
                          <td>{doc.hora_carga || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tabDocentes === 'historial' && (
            <div className="mt-16">
              <div className="filter-row">
                <div className="form-group-filter">
                  <label htmlFor="fecha-hist-doc">Fecha</label>
                  <input
                    id="fecha-hist-doc"
                    type="date"
                    value={fechaHistDoc}
                    onChange={(e) => setFechaHistDoc(e.target.value)}
                  />
                </div>
              </div>
              {cargandoDocHistorial ? (
                <LoadingSpinner text="Cargando historial..." size="sm" inline />
              ) : docHistorial.length === 0 ? (
                <p className="empty-state-message">No hay asistencias de docentes registradas para esa fecha.</p>
              ) : (
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Docente</th>
                        <th>Materia</th>
                        <th>Curso</th>
                        <th>Hora</th>
                        <th>Estado</th>
                        <th>Registrado por</th>
                      </tr>
                    </thead>
                    <tbody>
                      {docHistorial.map((r) => (
                        <tr key={r.id_asistencia_docente}>
                          <td className="table-cell-strong">{r.docente_nombre}</td>
                          <td>{r.materia_nombre}</td>
                          <td>{r.curso_nombre}</td>
                          <td className="nowrap">{r.hora || '-'}</td>
                          <td>
                            <span className={`badge ${
                              r.estado === 'Presente' ? 'badge-presente' :
                              r.estado === 'Ausente' ? 'badge-ausente' :
                              r.estado === 'Tarde' ? 'badge-tarde' :
                              r.estado === 'Retirado' ? 'badge-tarde' : ''
                            }`}>
                              {r.estado}
                            </span>
                          </td>
                          <td>{r.registrado_por || '-'}</td>
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
    </div>
  );
}

export default Asistencias;
